// Billing math and store-driven subscription sync.
//
// Extracted from routes.ts so the money math can be exercised in isolation
// (see server/billing.test.ts). Stripe is dependency-injected so tests can
// supply a spy and assert the exact amounts that would be charged without
// touching the live Stripe API.
import { db } from "./db";
import { users, stores } from "@shared/schema";
import { eq, asc, and, isNotNull } from "drizzle-orm";

// Product pricing configuration (cents)
export const PRODUCT_PRICES = {
  'loyalty': 1900, // €19 in cents
  'spin': 500,     // €5 in cents
  'menu': 800,     // €8 in cents
  'shift': 1800,   // €18 in cents
};

// Flat surcharge per additional (non-primary) store, in cents.
export const ADDITIONAL_STORE_PRICE = 500; // €5/mo per extra store

// Calculate price based on selected products and extra stores
export function calculateProductPrice(products: string[], additionalStores: number = 0): number {
  const sortedProducts = [...products].sort();

  // All four products - Bundle discount (€36.99 instead of €50)
  let base: number;
  if (sortedProducts.length === 4 && sortedProducts.includes('loyalty') && sortedProducts.includes('spin') && sortedProducts.includes('menu') && sortedProducts.includes('shift')) {
    base = 3699;
  } else {
    base = sortedProducts.reduce((sum, product) => {
      return sum + (PRODUCT_PRICES[product as keyof typeof PRODUCT_PRICES] || 0);
    }, 0);
  }

  return base + Math.max(0, additionalStores) * ADDITIONAL_STORE_PRICE;
}

// Get product description based on selected products
export function getProductDescription(products: string[]): string {
  const sortedProducts = [...products].sort();

  if (sortedProducts.length === 4 && sortedProducts.includes('loyalty') && sortedProducts.includes('spin') && sortedProducts.includes('menu') && sortedProducts.includes('shift')) {
    return "Complete Bundle: Loyalty Cards, Spin Wheel, Menu Builder & Shift Manager";
  } else if (sortedProducts.includes('loyalty')) {
    return "Access to Loyalty Cards feature";
  } else if (sortedProducts.includes('spin')) {
    return "Access to Spin Wheel feature";
  } else if (sortedProducts.includes('menu')) {
    return "Access to Menu Builder feature";
  } else if (sortedProducts.includes('shift')) {
    return "Access to Shift Manager feature";
  }

  return "No products selected";
}

// Minimal Stripe surface needed for repricing. The real Stripe client satisfies
// this shape; tests pass a spy.
export interface BillingStripe {
  subscriptions: {
    retrieve(id: string): Promise<any>;
    update(id: string, params: any): Promise<any>;
  };
}

// Helper: update an existing Stripe subscription to reflect a new price
export async function updateStripeSubscriptionPrice(
  stripe: BillingStripe,
  subscriptionId: string,
  newPriceCents: number,
  description: string,
  prorationBehavior: 'create_prorations' | 'none' = 'create_prorations',
): Promise<void> {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const itemId = sub.items.data[0]?.id;
  if (!itemId) throw new Error('Subscription has no items');
  await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: itemId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        price_data: {
          currency: 'eur',
          product_data: { name: 'uniHub Subscription', description },
          unit_amount: newPriceCents,
          recurring: { interval: 'month' },
        } as any,
      },
    ],
    proration_behavior: prorationBehavior,
  });
}

// Recompute an account's billing basis from its stores and keep it in sync.
//
// Billing rule: the PRIMARY (oldest) store's products set the base price, and
// each ADDITIONAL store adds a flat €5/mo regardless of its products. We mirror
// the primary store's products onto `users.selectedProducts` and set
// `users.additionalStores = storeCount - 1` so all existing billing/checkout
// code (which reads the user fields) keeps working unchanged.
//
// Stripe is synced best-effort: the DB is the source of truth, so a Stripe
// failure is logged and left for the next renewal/reconciliation. Pass
// `syncStripe: false` to skip Stripe (e.g. product-only changes that should not
// reprice immediately, matching existing behavior).
export async function syncBillingFromStores(
  stripe: BillingStripe,
  userId: string,
  opts: { syncStripe?: boolean; prorationBehavior?: 'create_prorations' | 'none' } = {},
): Promise<typeof users.$inferSelect> {
  const { syncStripe = true, prorationBehavior = 'create_prorations' } = opts;

  const userStores = await db
    .select({ id: stores.id, selectedProducts: stores.selectedProducts })
    .from(stores)
    .where(eq(stores.userId, userId))
    .orderBy(asc(stores.createdAt));

  const baseProducts = userStores[0]?.selectedProducts ?? [];
  const additionalStores = Math.max(0, userStores.length - 1);

  const [updatedUser] = await db
    .update(users)
    .set({ selectedProducts: baseProducts, additionalStores })
    .where(eq(users.id, userId))
    .returning();

  if (syncStripe) {
    const isChargeFree = updatedUser.chargeFree === true;
    const inTrial = updatedUser.trialEndsAt && new Date(updatedUser.trialEndsAt) > new Date();
    const hasActiveSub = updatedUser.subscriptionStatus === 'active' && updatedUser.stripeSubscriptionId;
    if (!isChargeFree && !inTrial && hasActiveSub) {
      try {
        const newPrice = updatedUser.customPrice ?? calculateProductPrice(baseProducts, additionalStores);
        await updateStripeSubscriptionPrice(
          stripe,
          updatedUser.stripeSubscriptionId!,
          newPrice,
          getProductDescription(baseProducts),
          prorationBehavior,
        );
      } catch (stripeErr) {
        console.error('[Billing] Stripe price sync failed (DB kept, will reconcile):', stripeErr);
      }
    }
  }

  return updatedUser;
}

// Result of applying an owner's store edit: either the store was not found (so
// the route returns 404) or the updated store row.
export interface StoreUpdateResult {
  notFound?: boolean;
  store?: typeof stores.$inferSelect;
}

// Apply a merchant's edit to one of their stores and route the billing
// consequence. This is the core of the owner PATCH /api/stores/:storeId handler,
// extracted so the routing decision can be unit tested with a Stripe spy:
//
//   - PRIMARY (oldest) store + a products change -> recompute the billing mirror
//     and reprice the active Stripe subscription (the primary store's products
//     drive the base price).
//   - NON-primary store edit, or any edit that doesn't touch selectedProducts ->
//     update only that store row; the bill (mirror, additionalStores, Stripe
//     price) is left untouched.
//
// `update` is the already-validated patch (see updateStoreSchema). Validation
// stays in the route; this function owns only the billing routing decision.
export async function applyStoreUpdate(
  stripe: BillingStripe,
  userId: string,
  storeId: string,
  update: Partial<typeof stores.$inferInsert>,
): Promise<StoreUpdateResult> {
  // Identify the PRIMARY (oldest) store up-front: its products drive the account
  // base price, so a primary-store product change must recompute the billing
  // mirror. Non-primary product changes never affect the bill.
  const storeRows = await db
    .select({ id: stores.id })
    .from(stores)
    .where(eq(stores.userId, userId))
    .orderBy(asc(stores.createdAt));
  if (!storeRows.some((s) => s.id === storeId)) {
    return { notFound: true };
  }
  const isPrimary = storeRows[0]?.id === storeId;

  const [updatedStore] = await db
    .update(stores)
    .set(update)
    .where(and(eq(stores.id, storeId), eq(stores.userId, userId)))
    .returning();
  if (!updatedStore) return { notFound: true };

  // Only a PRIMARY product change moves the bill. Everything else (non-primary
  // edits, or primary edits that don't touch products) leaves billing alone.
  if (isPrimary && update.selectedProducts !== undefined) {
    await syncBillingFromStores(stripe, userId);
  }

  return { store: updatedStore };
}

// The expected (correct) monthly price for an account, in cents, using the same
// basis as syncBillingFromStores and the admin merchants endpoint: an explicit
// customPrice override wins, otherwise it's derived from the mirrored products
// and additional store count.
export function expectedPriceForUser(user: typeof users.$inferSelect): number {
  return user.customPrice ?? calculateProductPrice(user.selectedProducts ?? [], user.additionalStores ?? 0);
}

// True when an account is one we actually charge: not charge-free, not in trial,
// and holding an active Stripe subscription. This is the SAME gating that
// syncBillingFromStores applies before it ever touches Stripe, so reconciliation
// only ever acts on accounts that should have a live, correctly-priced sub.
export function isBillableAccount(user: typeof users.$inferSelect): boolean {
  const isChargeFree = user.chargeFree === true;
  const inTrial = !!user.trialEndsAt && new Date(user.trialEndsAt) > new Date();
  const hasActiveSub = user.subscriptionStatus === 'active' && !!user.stripeSubscriptionId;
  return !isChargeFree && !inTrial && hasActiveSub;
}

export interface ReconciliationDrift {
  userId: string;
  email: string;
  expectedCents: number;
  actualCents: number | null;
  fixed: boolean;
  error?: string;
}

export interface ReconciliationResult {
  checked: number;
  inSync: number;
  drift: ReconciliationDrift[];
}

// Detect (and optionally correct) accounts whose live Stripe subscription price
// has drifted away from the price their stores say they should be paying.
//
// This is the safety net for syncBillingFromStores' best-effort Stripe sync: if
// that call ever fails (outage, transient error) the DB is updated but Stripe is
// left stale, silently over- or under-charging the merchant forever. Running this
// on a schedule (and on demand from admin) closes that gap.
//
// Gating mirrors syncBillingFromStores exactly via isBillableAccount, so trial /
// charge-free / no-active-subscription accounts are a guaranteed no-op.
//
// Pass `dryRun: true` to report drift without changing anything in Stripe — used
// by the admin UI to surface drift for review before correcting.
export async function reconcileBilling(
  stripe: BillingStripe,
  opts: { dryRun?: boolean } = {},
): Promise<ReconciliationResult> {
  const { dryRun = false } = opts;
  const result: ReconciliationResult = { checked: 0, inSync: 0, drift: [] };

  // Only pull candidates that could possibly be billable. The full per-account
  // gating still runs below; this just keeps us from scanning every row.
  const candidates = await db
    .select()
    .from(users)
    .where(and(eq(users.subscriptionStatus, 'active'), isNotNull(users.stripeSubscriptionId)));

  for (const user of candidates) {
    if (!isBillableAccount(user)) continue;
    result.checked++;

    const expectedCents = expectedPriceForUser(user);

    let actualCents: number | null = null;
    try {
      const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId!);
      const amount = sub?.items?.data?.[0]?.price?.unit_amount;
      actualCents = typeof amount === 'number' ? amount : null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Reconcile] Failed to read Stripe subscription for ${user.email}: ${msg}`);
      result.drift.push({ userId: user.id, email: user.email, expectedCents, actualCents: null, fixed: false, error: msg });
      continue;
    }

    if (actualCents === expectedCents) {
      result.inSync++;
      continue;
    }

    // Drift detected — Stripe is charging an amount the stores no longer justify.
    console.warn(
      `[Reconcile] DRIFT for ${user.email}: Stripe=${actualCents === null ? 'unknown' : '€' + (actualCents / 100).toFixed(2)} expected=€${(expectedCents / 100).toFixed(2)}`,
    );
    const entry: ReconciliationDrift = { userId: user.id, email: user.email, expectedCents, actualCents, fixed: false };

    if (!dryRun) {
      try {
        await updateStripeSubscriptionPrice(
          stripe,
          user.stripeSubscriptionId!,
          expectedCents,
          getProductDescription(user.selectedProducts ?? []),
          'create_prorations',
        );
        entry.fixed = true;
        console.log(`[Reconcile] Corrected ${user.email} to €${(expectedCents / 100).toFixed(2)}`);
      } catch (err) {
        entry.error = err instanceof Error ? err.message : String(err);
        console.error(`[Reconcile] Failed to correct ${user.email}: ${entry.error}`);
      }
    }

    result.drift.push(entry);
  }

  if (result.drift.length > 0) {
    const fixedCount = result.drift.filter((d) => d.fixed).length;
    console.warn(
      `[Reconcile] Finished: ${result.checked} checked, ${result.inSync} in sync, ${result.drift.length} drifted${dryRun ? ' (dry run, none changed)' : `, ${fixedCount} corrected`}`,
    );
  } else {
    console.log(`[Reconcile] Finished: ${result.checked} checked, all in sync`);
  }

  return result;
}
