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

// Minimal Stripe surface for canceling a subscription. The real Stripe client
// satisfies this; tests pass a spy.
export interface CancelableStripe {
  subscriptions: { cancel(id: string): Promise<any> };
}

// Cancel a Stripe subscription, treating an already-gone subscription as success.
// Stripe returns `resource_missing` when the subscription was already
// canceled/deleted — that's the desired end state, so we swallow only that and
// re-throw everything else so callers can surface a real failure.
export async function cancelStripeSubscription(
  stripe: CancelableStripe,
  subscriptionId: string,
): Promise<void> {
  try {
    await stripe.subscriptions.cancel(subscriptionId);
  } catch (err: any) {
    if (err?.code === 'resource_missing') return;
    throw err;
  }
}

// Set (or clear) a merchant's custom price and immediately reflect it on their
// live Stripe subscription for billable accounts.
//
// The new price is the same basis reconciliation uses (expectedPriceForUser):
// the customPrice override wins, otherwise the store/product-derived price. The
// Stripe call is best-effort — the DB is the source of truth, so a Stripe
// failure is logged and left for the daily/on-demand reconcile to correct,
// exactly like syncBillingFromStores. Trial / charge-free / no-active-sub
// accounts are a guaranteed no-op (isBillableAccount gates the Stripe call).
export async function applyCustomPrice(
  stripe: BillingStripe,
  userId: string,
  customPrice: number | null,
): Promise<typeof users.$inferSelect> {
  const [updated] = await db
    .update(users)
    .set({ customPrice })
    .where(eq(users.id, userId))
    .returning();

  if (isBillableAccount(updated)) {
    try {
      await updateStripeSubscriptionPrice(
        stripe,
        updated.stripeSubscriptionId!,
        expectedPriceForUser(updated),
        getProductDescription(updated.selectedProducts ?? []),
      );
    } catch (stripeErr) {
      console.error('[Billing] Custom-price Stripe sync failed (DB kept, will reconcile):', stripeErr);
    }
  }

  return updated;
}

// Result of an admin subscription-status override.
export interface StatusChangeResult {
  notFound?: boolean;
  // A status that cannot be made true in Stripe (e.g. "active" with no sub).
  badRequest?: string;
  // Stripe refused to cancel a live subscription — DB is left untouched so we
  // never report a non-billing status while Stripe keeps charging.
  stripeError?: string;
  user?: typeof users.$inferSelect;
}

// Apply an admin's direct subscription-status override while keeping Stripe
// consistent, so a manual status change can never leave a merchant billed at a
// status that says they shouldn't be:
//
//   - "active"  -> refused unless a live Stripe subscription already exists. We
//                  cannot create a real subscription (needs checkout + payment
//                  method) from an admin toggle; marking "active" without one
//                  would silently desync (app thinks they pay, Stripe bills
//                  nothing).
//   - "inactive"/"trialing" -> these must stop active billing. If a live Stripe
//                  subscription exists we cancel it FIRST (confirming success)
//                  and clear stripeSubscriptionId, so Stripe never keeps charging
//                  a merchant we report as not actively billed. Because the sub
//                  is cleared, reconcile correctly ignores the account.
// Stripe subscription statuses that represent a genuinely live subscription we
// can honestly mark our account "active" against.
const LIVE_STRIPE_STATUSES = ['active', 'trialing', 'past_due'];

export async function applyStatusChange(
  stripe: BillingStripe & CancelableStripe,
  userId: string,
  status: 'active' | 'inactive' | 'trialing',
): Promise<StatusChangeResult> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return { notFound: true };

  if (status === 'active') {
    if (!user.stripeSubscriptionId) {
      return {
        badRequest:
          'Cannot set status to "active": this merchant has no Stripe subscription. They must complete checkout (or be made charge-free) to gain paid access.',
      };
    }
    // A subscription id in the DB is not proof of a live subscription — it can be
    // stale (canceled in the Stripe dashboard, expired, etc.). Verify the live
    // Stripe status before marking the account active, otherwise we'd grant paid
    // access while Stripe bills nothing (a silent desync).
    let stripeStatus: string | undefined;
    try {
      const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      stripeStatus = sub?.status;
    } catch (err: any) {
      if (err?.code === 'resource_missing') {
        return {
          badRequest:
            'Cannot set status to "active": the merchant\'s Stripe subscription no longer exists. They must complete checkout again.',
        };
      }
      return { stripeError: err?.message || String(err) };
    }
    if (!stripeStatus || !LIVE_STRIPE_STATUSES.includes(stripeStatus)) {
      return {
        badRequest: `Cannot set status to "active": the merchant's Stripe subscription is "${stripeStatus ?? 'unknown'}", not a live subscription. They must complete checkout again.`,
      };
    }
    const [updated] = await db
      .update(users)
      .set({ subscriptionStatus: 'active' })
      .where(eq(users.id, userId))
      .returning();
    return { user: updated };
  }

  // inactive | trialing — must not keep billing the merchant.
  if (user.stripeSubscriptionId) {
    try {
      await cancelStripeSubscription(stripe, user.stripeSubscriptionId);
    } catch (err: any) {
      return { stripeError: err?.message || String(err) };
    }
  }
  const [updated] = await db
    .update(users)
    .set({ subscriptionStatus: status, stripeSubscriptionId: null })
    .where(eq(users.id, userId))
    .returning();
  return { user: updated };
}

export interface ReconciliationDrift {
  userId: string;
  email: string;
  expectedCents: number;
  actualCents: number | null;
  fixed: boolean;
  error?: string;
}

// An account marked "active" in our DB whose Stripe subscription is NOT actually
// live (canceled, expired, unpaid, or gone). Stripe is charging nothing, so the
// account is corrected back to "inactive" and its stale subscription id cleared.
export interface ReconciliationDeactivation {
  userId: string;
  email: string;
  // The live Stripe subscription status we found ("canceled", "unpaid",
  // "missing", "unknown", ...).
  stripeStatus: string;
  fixed: boolean;
  error?: string;
}

export interface ReconciliationResult {
  checked: number;
  inSync: number;
  drift: ReconciliationDrift[];
  // Accounts that were "active" here but dead in Stripe, and were corrected.
  deactivated: ReconciliationDeactivation[];
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
  const result: ReconciliationResult = { checked: 0, inSync: 0, drift: [], deactivated: [] };

  // Only pull candidates that could possibly be billable. The full per-account
  // gating still runs below; this just keeps us from scanning every row.
  const candidates = await db
    .select()
    .from(users)
    .where(and(eq(users.subscriptionStatus, 'active'), isNotNull(users.stripeSubscriptionId)));

  // Correct an account that is "active" here but whose Stripe subscription is not
  // actually live: mark it inactive and clear the stale id so we stop granting
  // paid access for a subscription Stripe is not charging. (dryRun only reports.)
  const deactivateDeadAccount = async (
    user: typeof users.$inferSelect,
    stripeStatus: string,
  ) => {
    const entry: ReconciliationDeactivation = {
      userId: user.id,
      email: user.email,
      stripeStatus,
      fixed: false,
    };
    if (!dryRun) {
      try {
        await db
          .update(users)
          .set({ subscriptionStatus: 'inactive', stripeSubscriptionId: null })
          .where(eq(users.id, user.id));
        entry.fixed = true;
        console.warn(
          `[Reconcile] Deactivated ${user.email}: Stripe subscription is "${stripeStatus}", not live (cleared stale id)`,
        );
      } catch (err) {
        entry.error = err instanceof Error ? err.message : String(err);
        console.error(`[Reconcile] Failed to deactivate ${user.email}: ${entry.error}`);
      }
    } else {
      console.warn(
        `[Reconcile] Would deactivate ${user.email}: Stripe subscription is "${stripeStatus}", not live`,
      );
    }
    result.deactivated.push(entry);
  };

  for (const user of candidates) {
    if (!isBillableAccount(user)) continue;
    result.checked++;

    const expectedCents = expectedPriceForUser(user);

    let sub: any;
    try {
      sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId!);
    } catch (err: any) {
      // The subscription no longer exists in Stripe — the account is not being
      // billed at all. Heal the desync rather than reporting a phantom price.
      if (err?.code === 'resource_missing') {
        await deactivateDeadAccount(user, 'missing');
        continue;
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Reconcile] Failed to read Stripe subscription for ${user.email}: ${msg}`);
      result.drift.push({ userId: user.id, email: user.email, expectedCents, actualCents: null, fixed: false, error: msg });
      continue;
    }

    // The subscription must be genuinely live. A canceled/expired/unpaid sub means
    // Stripe is charging this "active" merchant nothing — correct the account.
    const stripeStatus: string | undefined = sub?.status;
    if (!stripeStatus || !LIVE_STRIPE_STATUSES.includes(stripeStatus)) {
      await deactivateDeadAccount(user, stripeStatus ?? 'unknown');
      continue;
    }

    const amount = sub?.items?.data?.[0]?.price?.unit_amount;
    const actualCents: number | null = typeof amount === 'number' ? amount : null;

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

  if (result.drift.length > 0 || result.deactivated.length > 0) {
    const fixedDrift = result.drift.filter((d) => d.fixed).length;
    const fixedDead = result.deactivated.filter((d) => d.fixed).length;
    console.warn(
      `[Reconcile] Finished: ${result.checked} checked, ${result.inSync} in sync, ` +
        `${result.drift.length} price-drifted${dryRun ? '' : ` (${fixedDrift} corrected)`}, ` +
        `${result.deactivated.length} dead subscription(s)${dryRun ? '' : ` (${fixedDead} deactivated)`}` +
        `${dryRun ? ' (dry run, none changed)' : ''}`,
    );
  } else {
    console.log(`[Reconcile] Finished: ${result.checked} checked, all in sync`);
  }

  return result;
}
