---
name: Google Wallet class patch review-status gotcha
description: Why patching an existing Google loyalty class must resend reviewStatus UNDER_REVIEW.
---

# Google Wallet class patch review-status gotcha

Any write (`loyaltyclass.patch`/`update`) to a Google Wallet loyalty class that is already `reviewStatus: "APPROVED"` fails with:

> Invalid review status "APPROVED". Use "UNDER_REVIEW" instead.

**Rule:** every class patch body must explicitly include `reviewStatus: 'UNDER_REVIEW'` (the same value the create path uses). `"APPROVED"` is a server-assigned state you cannot write back.

**Why:** branding propagation (color/logo/program name) patches the shared class so all saved passes update. Without resetting review status the patch throws, is swallowed by the fire-and-forget catch, and merchants see wallet cards that never update — silent failure only visible in server logs.

**How to apply:** when adding or editing any Google loyalty *class* write, include `reviewStatus: 'UNDER_REVIEW'`. Loyalty *objects* (`loyaltyobject.patch`) have no reviewStatus and are unaffected.
