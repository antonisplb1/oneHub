---
name: Merchant pricing display precedence
description: The single order every merchant-facing price/billing-copy display must follow so shown amounts never diverge from what Stripe charges.
---

# Merchant pricing display precedence

Every merchant-facing surface that shows a monthly amount OR makes a billing
claim ("+€5/month", "-€5", bundle "save €13", "€36.99") MUST resolve price with
the SAME precedence the backend uses:

1. `chargeFree` → show "No charge" / no euro amount; suppress bundle banners and
   any ±€ store-count claims.
2. `customPrice != null` (cents, admin-only override) → show `customPrice/100`,
   labeled "Price adjusted manually by admin", and suppress product/store-derived
   copy (bundle banners, "+€5/store", "products set your price") because the
   override REPLACES product/store pricing account-wide.
3. else → the calculated product/store price.

**Why:** backend truth is `expectedPriceForUser = customPrice ?? calculateProductPrice`
and `chargeFree` clears the Stripe sub entirely. Displays historically computed
price locally from products/stores and ignored both flags, so an admin price
change was invisible and shown amounts (esp. hardcoded bundle €36.99/€50 banners)
could contradict the actual Stripe charge. The stated objective: uniHub is the
single source of truth — what the merchant sees must equal what Stripe charges.

**How to apply:** it is not enough to fix the headline total — audit EVERY euro
figure and billing sentence on the surface (bundle discount banners, per-store
±€ notes, delete/add-store confirmations, onboarding SelectProducts and
SubscriptionRequired totals/CTAs). A single stale hardcoded amount reintroduces
the divergence. Merchants have no in-app status toggle (they use the Stripe
billing portal, inherently synced); only admin endpoints set `customPrice` /
`chargeFree` / status.
