---
name: Per-store products & billing model
description: How uniHub stores relate to billing — primary store drives base price, additional stores flat €5/mo, user.selectedProducts is a mirror.
---

# Per-store products & billing model

Each store (`stores` table) has its own `selectedProducts` and `shiftAccessPin`. A
merchant account (`users`) can own multiple stores.

## Billing rule
- The PRIMARY store = the oldest store (`ORDER BY createdAt ASC`, index 0).
- Base price = price of the PRIMARY store's products.
- Each ADDITIONAL store adds a flat €5/mo regardless of what products it has.
- `users.additionalStores` = storeCount - 1, recomputed authoritatively from store rows.
- `users.selectedProducts` is a MIRROR of the primary store's products.

**Why:** All pre-existing checkout/Stripe/access-gating code reads
`users.selectedProducts` and `users.additionalStores`. Keeping them as a derived
mirror means that legacy code keeps working unchanged while the source of truth
moves to per-store rows.

**How to apply:** Never set `users.selectedProducts`/`additionalStores` directly
from ad-hoc code. Call `syncBillingFromStores(userId, opts)` in `server/routes.ts`
after any store add/remove or primary-product change — it recomputes the mirror,
recomputes additionalStores, and does a best-effort Stripe sync.

Product-edit entry points that MUST call syncBillingFromStores on a primary
change: merchant `/select-products`, store add/remove, the admin per-store route,
AND the merchant-facing owner store PATCH (`PATCH /api/stores/:storeId`). The
owner PATCH now accepts `selectedProducts` (min 1) and runs the sync only when the
edited store is the primary; non-primary product edits skip the sync entirely.

**Testability decision:** billing math + recompute are isolated in
`server/billing.ts` with Stripe dependency-injected specifically so the money
math can be exercised with a Stripe spy (`server/billing.test.ts`) — do not
re-inline this into `routes.ts` or the coverage loses its seam.

## Stripe repricing policy
- Changing the PRIMARY store's products DOES reprice the active Stripe
  subscription (base price follows primary products). Both merchant
  select-products and admin primary-store product edits call
  syncBillingFromStores with Stripe sync ON.
- Non-primary product changes do NOT change the bill (mirror reflects primary
  only; additionalStores unchanged → computed price identical).
- Repricing is a no-op for trial/charge-free accounts and accounts without an
  active subscription. The one-time startup migration backfill does NOT reprice
  (it only mirrors existing products, so the computed price is unchanged).

**Why:** Spec requires the primary store's products to drive the base price at all
times; migration must preserve each existing account's effective price. An earlier
"never reprice on product change" assumption was WRONG and rejected in review.

## Non-primary stores
Changing a non-primary store's products must NOT change the account's bill (only
the flat €5/store applies). Only primary-store product changes flow to the mirror.

## Product access enforcement (gating)
Per-store product entitlement is enforced server-side in `requirePermission()`
(`server/permissions.ts`), NOT just by hiding nav. The four PRODUCT permissions
(loyalty/spin/menu/shift) are gated against the ACTIVE store's `selectedProducts`
(via `req.storeId`, set by `resolveActiveStore`) for owners AND subusers; a missing
product returns 403. Non-product permissions (customers/analytics/dashboard) are
not store-product gated.

**Why:** Owners previously bypassed all permission checks, so hidden nav alone let
direct URL/API access reach disabled features. Gating must be on the active store,
not `users.selectedProducts`, so switching stores changes entitlement.

**How to apply:** New product features must use `requirePermission('<product>')`
and (frontend) wrap the route's `DashboardLayout` with `requiredProduct="<product>"`.

## Per-store shift PIN
Shift PINs are per-store (`stores.shiftAccessPin`), NOT account-level. The public
shift auth (`POST /api/shifts/public/:username`), GET/POST `/api/shift-pin` read
and write ONLY the active store's PIN — no fallback to `users.shiftAccessPin`.

**Why:** Falling back to the account-level PIN let one store's PIN authenticate
another store's public schedule (cross-store leak); rejected in review.

**How to apply:** Never read/write `users.shiftAccessPin` for shift auth. The
startup migration (storeMigration step 2c) backfills each store's PIN from the
owner's legacy `users.shift_access_pin` once; that legacy column is otherwise dead.
