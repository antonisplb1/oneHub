---
name: Admin vs merchant session collision
description: Why admin actions break after a merchant login in the same browser, and the fix
---

# Admin session wiped by merchant login

Admin auth is stored in `req.session.adminId` (custom, set by `/api/admin/login`, checked by `requireAdminAuth`). Merchant auth uses Passport via `req.login()` at `/api/auth/login` (and the post-email-verification auto-login).

**Symptom:** all admin merchant-management actions return 401 "Admin authentication required" — but only *after* a merchant logs into the same browser. Read-only/earlier admin actions appear to work, later ones fail, so it looks like "only DELETE works" purely because of timing.

**Why:** Passport 0.6+ regenerates the session on `req.login()` by default and drops prior session fields, so `adminId` is destroyed. The two auth schemes share one session cookie.

**Fix:** pass `{ keepSessionInfo: true }` to `req.login(user, { keepSessionInfo: true }, cb)`. This still regenerates the session ID (session-fixation protection intact) but preserves existing session data like `adminId`, letting admin + merchant sessions coexist.

**How to apply:** any time a custom `req.session.*` auth value must survive a Passport login in the same browser, use `keepSessionInfo: true`. Don't remove it expecting admin auth to persist.
