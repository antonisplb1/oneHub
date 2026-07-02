---
name: past_due grace access
description: past_due is an access-granting Stripe status; every access gate (server + client) must go through the shared helper.
---

The access-granting Stripe subscription statuses are `active`, `trialing`, and
`past_due` (see `LIVE_STRIPE_STATUSES` / `hasAccessGrantingSubscription` in
`server/billing.ts`, mirrored in `client/src/lib/subscription.ts`).

**Rule:** anywhere subscription state gates access or drives subscribe-vs-manage
UX, resolve it through `hasAccessGrantingSubscription(status)` — never a raw
`subscriptionStatus === "active"` check.

**Why:** while Stripe retries a temporarily-failed card it reports `past_due`.
Treating that as "not subscribed" locks a paying merchant out mid-billing-cycle
and (worse) pushes them toward a brand-new checkout instead of updating their
card. It also caused the reconciler to needlessly re-promote past_due accounts.

**How to apply:** the checks live in many places that are easy to miss — server
`requireSubscription`, reconciler demotion/promotion candidate queries (use
`inArray`/`notInArray LIVE_STRIPE_STATUSES`), `useAuth` login redirect,
`DashboardLayout` access + banners, `SettingsPage` subscribe/manage branch,
`SelectProducts`, `SubscriptionRequired`. When the reconciler heals a
missed-webhook payment it must persist the ACTUAL live status, not hardcode
`active`. The post-checkout confirmation poll in `PaymentProcessing.tsx` is the
one intentional exception — a fresh checkout success is genuinely `active`.
