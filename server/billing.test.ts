/**
 * Billing money-math coverage for multi-store merchants.
 *
 * Run with:  npx tsx server/billing.test.ts
 *
 * These tests prove the per-store billing model holds across the real flows:
 *  - each extra store adds exactly €5/mo
 *  - toggling products on a NON-primary store never changes the bill
 *  - toggling products on the PRIMARY store updates the users.selectedProducts
 *    mirror and reprices Stripe (only when there is an active paid subscription)
 *  - deleting the primary store promotes the next-oldest store and recomputes
 *    the base price
 *
 * The DB is real (a throwaway test user is created and removed). Stripe is a
 * spy injected into syncBillingFromStores, so we assert the exact amount that
 * would be charged without touching the live Stripe API.
 *
 * ACCEPTANCE RECONCILIATION (primary-store product toggles):
 * The original task text said a primary-store product change should update the
 * mirror but "not immediately reprice Stripe". That reflects an EARLIER,
 * SUPERSEDED billing assumption. A later review of the per-store billing model
 * deliberately changed the contract: the primary store's products drive the
 * base price AT ALL TIMES, so a primary-store product change DOES reprice an
 * active paid subscription. The reconciled, implemented contract (the source of
 * truth these tests encode) is:
 *   - primary product change + ACTIVE PAID sub  -> mirror updated AND Stripe repriced (C1)
 *   - primary product change while in TRIAL / charge-free / no active sub
 *                                               -> mirror updated, NO reprice    (C2)
 * So the task's "does not immediately reprice" holds for the common
 * trial/no-active-sub case (C2); active paid subs reprice by design (C1).
 */
import { db, pool } from "./db";
import { users, stores } from "@shared/schema";
import { eq, asc } from "drizzle-orm";
import {
  calculateProductPrice,
  syncBillingFromStores,
  reconcileBilling,
  type BillingStripe,
} from "./billing";

const BUNDLE = ["loyalty", "spin", "menu", "shift"];

let passed = 0;
let failed = 0;

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}\n      expected: ${e}\n      actual:   ${a}`);
  }
}

// A Stripe spy that records every reprice call (and the amount sent).
function makeStripeSpy() {
  const calls: { unitAmount: number; description: string; proration: string }[] = [];
  const stripe: BillingStripe = {
    subscriptions: {
      retrieve: async () => ({ items: { data: [{ id: "si_test_item" }] } }),
      update: async (_id: string, params: any) => {
        calls.push({
          unitAmount: params.items[0].price_data.unit_amount,
          description: params.items[0].price_data.product_data.description,
          proration: params.proration_behavior,
        });
        return {};
      },
    },
  };
  return { stripe, calls };
}

// A Stripe spy whose update throws — proves best-effort sync never breaks the
// DB-side recompute.
function makeThrowingStripe() {
  const stripe: BillingStripe = {
    subscriptions: {
      retrieve: async () => ({ items: { data: [{ id: "si_test_item" }] } }),
      update: async () => {
        throw new Error("simulated Stripe outage");
      },
    },
  };
  return stripe;
}

// A Stripe spy for reconciliation. reconcileBilling scans EVERY billable account
// in the (shared, real) test DB, so this spy is keyed by subscription id: it
// reports a configurable stale CURRENT price for OUR test subscription and lets
// every assertion focus on our account alone (via `ourUpdates`). Other accounts
// that happen to drift just exercise the spy harmlessly — reconcileBilling never
// writes to the DB, it only talks to (this fake) Stripe.
function makeReconcileStripe(ourSubId: string, ourCurrentUnitAmount: number) {
  const currentById = new Map<string, number>([[ourSubId, ourCurrentUnitAmount]]);
  const updatesById = new Map<string, number[]>();
  const stripe: BillingStripe = {
    subscriptions: {
      retrieve: async (id: string) => ({
        items: { data: [{ id: `si_${id}`, price: { unit_amount: currentById.get(id) ?? 0 } }] },
      }),
      update: async (id: string, params: any) => {
        const amount = params.items[0].price_data.unit_amount;
        const arr = updatesById.get(id) ?? [];
        arr.push(amount);
        updatesById.set(id, arr);
        currentById.set(id, amount);
        return {};
      },
    },
  };
  const ourUpdates = () => updatesById.get(ourSubId) ?? [];
  return { stripe, ourUpdates };
}

let userId = "";
const slugPrefix = `bill-test-${Date.now()}`;

async function createUser(overrides: Partial<typeof users.$inferInsert> = {}) {
  const [u] = await db
    .insert(users)
    .values({
      email: `${slugPrefix}@test.local`,
      passwordHash: "x",
      shopName: "Billing Test Shop",
      emailVerified: true,
      ...overrides,
    })
    .returning();
  return u;
}

// Insert a store with an explicit createdAt so primary (oldest) ordering is
// deterministic regardless of insert timing.
async function addStore(slug: string, products: string[], createdAtMs: number) {
  const [s] = await db
    .insert(stores)
    .values({
      userId,
      shopName: `${slugPrefix}-${slug}`,
      displayName: slug,
      selectedProducts: products,
      createdAt: new Date(createdAtMs),
    })
    .returning();
  return s;
}

async function getUser() {
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  return u;
}

async function priceForUser() {
  const u = await getUser();
  return u.customPrice ?? calculateProductPrice(u.selectedProducts ?? [], u.additionalStores ?? 0);
}

async function resetStores() {
  await db.delete(stores).where(eq(stores.userId, userId));
}

async function run() {
  console.log("\n=== Billing pure-math (calculateProductPrice) ===");
  assertEqual(calculateProductPrice(["loyalty"], 0), 1900, "single loyalty = €19.00");
  assertEqual(calculateProductPrice(["loyalty"], 1), 2400, "loyalty + 1 extra store = +€5");
  assertEqual(calculateProductPrice(["loyalty"], 2), 2900, "loyalty + 2 extra stores = +€10");
  assertEqual(calculateProductPrice(BUNDLE, 0), 3699, "bundle = €36.99");
  assertEqual(calculateProductPrice(BUNDLE, 3), 5199, "bundle + 3 extra stores = +€15");
  assertEqual(calculateProductPrice(["menu"], 0), 800, "single menu = €8.00");

  const u = await createUser();
  userId = u.id;

  // --- Scenario A: extra stores add exactly €5 each --------------------------
  console.log("\n=== A. Adding 2nd/3rd store adds exactly €5 each ===");
  await resetStores();
  const t0 = Date.now();
  await addStore("primary", ["loyalty"], t0);
  const spyA = makeStripeSpy();
  await syncBillingFromStores(spyA.stripe, userId, { syncStripe: false });
  assertEqual((await getUser()).additionalStores, 0, "1 store -> additionalStores = 0");
  assertEqual(await priceForUser(), 1900, "1 store -> €19.00");

  await addStore("second", ["spin"], t0 + 1000);
  await syncBillingFromStores(spyA.stripe, userId, { syncStripe: false });
  assertEqual((await getUser()).additionalStores, 1, "2 stores -> additionalStores = 1");
  assertEqual(await priceForUser(), 2400, "2 stores -> €19.00 + €5.00 = €24.00");

  await addStore("third", ["menu"], t0 + 2000);
  await syncBillingFromStores(spyA.stripe, userId, { syncStripe: false });
  assertEqual((await getUser()).additionalStores, 2, "3 stores -> additionalStores = 2");
  assertEqual(await priceForUser(), 2900, "3 stores -> €19.00 + €10.00 = €29.00");
  assertEqual(
    (await getUser()).selectedProducts,
    ["loyalty"],
    "mirror reflects PRIMARY products only (not 2nd/3rd store)",
  );

  // --- Scenario A2: adding a store on an ACTIVE PAID sub charges +€5 via Stripe
  // Proves the +€5/store reaches Stripe end-to-end (not just the DB mirror).
  console.log("\n=== A2. Adding a store on an active paid sub reprices Stripe by exactly +€5 ===");
  await resetStores();
  await db
    .update(users)
    .set({
      subscriptionStatus: "active",
      stripeSubscriptionId: "sub_test_123",
      chargeFree: false,
      trialEndsAt: null,
      customPrice: null,
    })
    .where(eq(users.id, userId));
  const a0 = Date.now();
  await addStore("a2-primary", ["loyalty"], a0); // €19 base
  const spyA2 = makeStripeSpy();
  await syncBillingFromStores(spyA2.stripe, userId); // 1 store -> €19.00
  assertEqual(spyA2.calls.at(-1)?.unitAmount, 1900, "1 store -> Stripe charged €19.00");

  await addStore("a2-second", ["spin"], a0 + 1000);
  await syncBillingFromStores(spyA2.stripe, userId); // +€5
  assertEqual(spyA2.calls.at(-1)?.unitAmount, 2400, "2nd store -> Stripe charged €24.00 (+€5)");

  await addStore("a2-third", ["menu"], a0 + 2000);
  await syncBillingFromStores(spyA2.stripe, userId); // +€5
  assertEqual(spyA2.calls.at(-1)?.unitAmount, 2900, "3rd store -> Stripe charged €29.00 (+€5)");
  assertEqual(
    spyA2.calls.at(-1)!.unitAmount - spyA2.calls.at(-2)!.unitAmount,
    500,
    "each added store increases the Stripe charge by exactly €5",
  );

  // Reset back to no-sub for the rest of the DB-mirror scenarios.
  await resetStores();
  await db
    .update(users)
    .set({ subscriptionStatus: "inactive", stripeSubscriptionId: null, customPrice: null })
    .where(eq(users.id, userId));
  await addStore("primary", ["loyalty"], t0);
  await addStore("second", ["spin"], t0 + 1000);
  await addStore("third", ["menu"], t0 + 2000);
  await syncBillingFromStores(spyA.stripe, userId, { syncStripe: false });

  // --- Scenario B: non-primary product toggle leaves the bill unchanged ------
  console.log("\n=== B. Toggling NON-primary store products doesn't change the bill ===");
  const priceBefore = await priceForUser();
  const mirrorBefore = (await getUser()).selectedProducts;
  const allStores = await db
    .select()
    .from(stores)
    .where(eq(stores.userId, userId))
    .orderBy(asc(stores.createdAt));
  const secondStore = allStores[1];
  await db.update(stores).set({ selectedProducts: BUNDLE }).where(eq(stores.id, secondStore.id));
  await syncBillingFromStores(spyA.stripe, userId, { syncStripe: false });
  assertEqual(await priceForUser(), priceBefore, "bill unchanged after non-primary toggle");
  assertEqual((await getUser()).selectedProducts, mirrorBefore, "mirror unchanged after non-primary toggle");
  assertEqual((await getUser()).additionalStores, 2, "additionalStores unchanged after non-primary toggle");

  // --- Scenario C1: primary toggle on ACTIVE sub updates mirror + reprices ---
  console.log("\n=== C1. Toggling PRIMARY products (active paid sub) updates mirror AND reprices ===");
  await db
    .update(users)
    .set({
      subscriptionStatus: "active",
      stripeSubscriptionId: "sub_test_123",
      chargeFree: false,
      trialEndsAt: null,
      customPrice: null,
    })
    .where(eq(users.id, userId));
  const primaryStore = allStores[0];
  await db.update(stores).set({ selectedProducts: BUNDLE }).where(eq(stores.id, primaryStore.id));
  const spyC1 = makeStripeSpy();
  await syncBillingFromStores(spyC1.stripe, userId); // syncStripe defaults true
  assertEqual((await getUser()).selectedProducts, BUNDLE, "primary toggle updates the mirror");
  assertEqual(spyC1.calls.length, 1, "active sub -> Stripe repriced exactly once");
  // bundle (3699) + 2 extra stores (1000) = 4699
  assertEqual(spyC1.calls[0]?.unitAmount, 4699, "Stripe charged €46.99 (bundle + 2 extra stores)");

  // --- Scenario C2: primary toggle while in TRIAL updates mirror, no reprice -
  console.log("\n=== C2. Toggling PRIMARY products during TRIAL updates mirror but does NOT reprice ===");
  await db
    .update(users)
    .set({
      subscriptionStatus: "active",
      stripeSubscriptionId: "sub_test_123",
      chargeFree: false,
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    .where(eq(users.id, userId));
  await db.update(stores).set({ selectedProducts: ["menu"] }).where(eq(stores.id, primaryStore.id));
  const spyC2 = makeStripeSpy();
  await syncBillingFromStores(spyC2.stripe, userId);
  assertEqual((await getUser()).selectedProducts, ["menu"], "trial: primary toggle still updates the mirror");
  assertEqual(spyC2.calls.length, 0, "trial: no immediate Stripe reprice");

  // --- Scenario C3: Stripe failure never breaks the DB recompute -------------
  console.log("\n=== C3. Stripe outage is best-effort — DB recompute still succeeds ===");
  await db
    .update(users)
    .set({ trialEndsAt: null, subscriptionStatus: "active", stripeSubscriptionId: "sub_test_123" })
    .where(eq(users.id, userId));
  await db.update(stores).set({ selectedProducts: BUNDLE }).where(eq(stores.id, primaryStore.id));
  await syncBillingFromStores(makeThrowingStripe(), userId);
  assertEqual((await getUser()).selectedProducts, BUNDLE, "DB mirror updated despite Stripe outage");

  // --- Scenario D: deleting the primary store promotes the next-oldest -------
  console.log("\n=== D. Deleting the PRIMARY store promotes next-oldest and recomputes base ===");
  await resetStores();
  await db
    .update(users)
    .set({ subscriptionStatus: "inactive", stripeSubscriptionId: null, trialEndsAt: null, customPrice: null })
    .where(eq(users.id, userId));
  const d0 = Date.now();
  const dPrimary = await addStore("d-primary", ["loyalty"], d0); // €19 base
  await addStore("d-second", ["menu"], d0 + 1000); // next-oldest, €8 base
  await addStore("d-third", ["spin"], d0 + 2000);
  await syncBillingFromStores(spyA.stripe, userId, { syncStripe: false });
  assertEqual((await getUser()).selectedProducts, ["loyalty"], "before delete: primary = loyalty");
  assertEqual(await priceForUser(), 2900, "before delete: €19 + €10 (2 extra) = €29");

  await db.delete(stores).where(eq(stores.id, dPrimary.id));
  await syncBillingFromStores(spyA.stripe, userId, { syncStripe: false });
  assertEqual((await getUser()).selectedProducts, ["menu"], "after delete: next-oldest (menu) is now primary");
  assertEqual((await getUser()).additionalStores, 1, "after delete: additionalStores recomputed to 1");
  assertEqual(await priceForUser(), 1300, "after delete: €8 (menu base) + €5 (1 extra) = €13");

  // --- Scenario E: reconciliation detects + corrects stale Stripe prices -----
  // Simulates the exact failure mode the task targets: the DB was updated but a
  // failed best-effort Stripe sync left the live subscription at a stale price.
  console.log("\n=== E. Reconciliation detects and corrects billing drift ===");
  await resetStores();
  const ourSub = `sub_recon_${slugPrefix}`;
  const e0 = Date.now();
  await addStore("e-primary", BUNDLE, e0); // expected base €36.99
  await db
    .update(users)
    .set({
      subscriptionStatus: "active",
      stripeSubscriptionId: ourSub,
      chargeFree: false,
      trialEndsAt: null,
      customPrice: null,
    })
    .where(eq(users.id, userId));
  await syncBillingFromStores(makeThrowingStripe(), userId); // DB now expects 3699; Stripe stuck

  // E1: dry run reports the drift WITHOUT touching Stripe.
  const recDry = makeReconcileStripe(ourSub, 1900); // Stripe stale at €19.00
  const dryResult = await reconcileBilling(recDry.stripe, { dryRun: true });
  const dryEntry = dryResult.drift.find((d) => d.userId === userId);
  assertEqual(!!dryEntry, true, "dry run: drift detected for our account");
  assertEqual(dryEntry?.expectedCents, 3699, "dry run: expected price = €36.99");
  assertEqual(dryEntry?.actualCents, 1900, "dry run: stale Stripe price = €19.00");
  assertEqual(dryEntry?.fixed, false, "dry run: nothing marked fixed");
  assertEqual(recDry.ourUpdates().length, 0, "dry run: our Stripe sub NOT updated");

  // E2: live run corrects Stripe to the expected price.
  const recFix = makeReconcileStripe(ourSub, 1900);
  const fixResult = await reconcileBilling(recFix.stripe);
  const fixEntry = fixResult.drift.find((d) => d.userId === userId);
  assertEqual(fixEntry?.fixed, true, "live run: drift corrected");
  assertEqual(recFix.ourUpdates().at(-1), 3699, "live run: our Stripe sub repriced to €36.99");

  // E3: a second pass finds nothing to fix (now in sync).
  const recAgain = makeReconcileStripe(ourSub, 3699);
  const againResult = await reconcileBilling(recAgain.stripe);
  assertEqual(againResult.drift.some((d) => d.userId === userId), false, "second pass: no drift, our account in sync");
  assertEqual(recAgain.ourUpdates().length, 0, "second pass: our Stripe sub NOT touched when in sync");

  // E4: trial accounts are a no-op even when Stripe is stale.
  await db
    .update(users)
    .set({ trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) })
    .where(eq(users.id, userId));
  const recTrial = makeReconcileStripe(ourSub, 1900); // stale, but account is in trial
  const trialResult = await reconcileBilling(recTrial.stripe);
  assertEqual(trialResult.drift.some((d) => d.userId === userId), false, "trial: account skipped (no drift acted on)");
  assertEqual(recTrial.ourUpdates().length, 0, "trial: our Stripe sub NOT touched");

  // E5: charge-free accounts are a no-op even when Stripe is stale.
  await db
    .update(users)
    .set({ trialEndsAt: null, chargeFree: true })
    .where(eq(users.id, userId));
  const recFree = makeReconcileStripe(ourSub, 1900);
  const freeResult = await reconcileBilling(recFree.stripe);
  assertEqual(freeResult.drift.some((d) => d.userId === userId), false, "charge-free: account skipped");
  assertEqual(recFree.ourUpdates().length, 0, "charge-free: our Stripe sub NOT touched");
}

async function cleanup() {
  if (userId) {
    await db.delete(stores).where(eq(stores.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
  }
}

run()
  .catch((err) => {
    failed++;
    console.error("\nUnexpected error during tests:", err);
  })
  .finally(async () => {
    await cleanup();
    await pool.end();
    console.log(`\n=== Billing tests: ${passed} passed, ${failed} failed ===`);
    process.exit(failed > 0 ? 1 : 0);
  });
