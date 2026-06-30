// Billing math and store-driven subscription sync.
//
// Extracted from routes.ts so the money math can be exercised in isolation
// (see server/billing.test.ts). Stripe is dependency-injected so tests can
// supply a spy and assert the exact amounts that would be charged without
// touching the live Stripe API.
import { db } from "./db";
import { users, stores } from "@shared/schema";
import { eq, asc } from "drizzle-orm";

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
