---
name: Admin vs merchant session collision
description: Why admin actions break after a merchant login in the same browser, and the fix
---

# Admin session wiped by merchant login OR logout

Admin auth is stored in `req.session.adminId` (custom, set by `/api/admin/login`, checked by `requireAdminAuth`). Merchant auth uses Passport via `req.login()`/`req.logout()`. Both auth schemes share ONE session cookie, so any Passport session mutation can clobber `adminId`.

**Symptom:** all admin merchant-management actions return 401 "Admin authentication required" — but only *after* a merchant login OR logout happens in the same browser. Earlier admin actions work, later ones fail, so it looks intermittent/timing-based. Note the demo merchant and the admin can even share the same email, making this easy to hit.

**Why:** Passport 0.6+ regenerates the session on BOTH `req.login()` and `req.logout()` by default and drops prior session fields, so `adminId` is destroyed.

**Fix:** pass `{ keepSessionInfo: true }` to BOTH `req.login(user, { keepSessionInfo: true }, cb)` and `req.logout({ keepSessionInfo: true }, cb)`. This preserves existing session data like `adminId` so admin + merchant sessions coexist. On logout, then explicitly null only the merchant/subuser fields (isSubuser, subuserId, permissions, subuserStoreIds) and `req.session.save()`.

**How to apply:** any time a custom `req.session.*` auth value must survive a Passport login/logout in the same browser, use `keepSessionInfo: true`. Verify with a curl cookie-jar repro: admin login -> merchant login -> merchant logout -> admin action must still be 200.
