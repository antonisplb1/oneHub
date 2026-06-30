---
name: Billing reconciliation safety net
description: Why a scheduled job re-checks Stripe prices against store-derived expected prices, and the gating it must mirror.
---

# Billing reconciliation safety net

`syncBillingFromStores` updates the DB then syncs Stripe **best-effort**: a failed
Stripe call is only logged ("DB kept, will reconcile") and left stale, silently
over/under-charging the merchant forever. `reconcileBilling` (in `server/billing.ts`)
is the safety net — it re-reads each account's live Stripe price and corrects drift.

**Rule:** any code path that changes what a merchant should pay must be covered by
reconciliation. Reconciliation gating MUST stay identical to `syncBillingFromStores`'s
own gate — both use `isBillableAccount` (not charge-free, not in trial, has active
sub). If you change one gate, change the other or drift detection diverges from what
actually gets charged.

**Why:** the only other scheduled task was unverified-account cleanup; there was no
reconciliation at all, so a single transient Stripe outage was permanent.

**How to apply:**
- Scheduled daily at 3 AM via `startReconciliationService(stripe)` (`server/reconcile.ts`),
  started from `registerRoutes`. Cleanup runs at 2 AM — keep them non-overlapping.
- Admin can trigger on demand: `POST /api/admin/billing/reconcile` with `{ dryRun }`.
  `dryRun: true` reports drift without touching Stripe; default corrects it.
- Expected price basis = `expectedPriceForUser` (customPrice override else
  `calculateProductPrice`), the SAME basis the admin merchants endpoint already used.

**Testing gotcha:** `reconcileBilling` scans EVERY billable account in the shared dev
DB, so test spies must be keyed by subscription id and assertions scoped to the test
user's own sub — global update counts are polluted by other real accounts that drift.
`reconcileBilling` never writes the DB (only Stripe), so it's safe to run against the
shared DB in tests.
