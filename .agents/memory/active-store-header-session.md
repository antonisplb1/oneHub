---
name: Active-store header leaks across logout
description: Why logout/login must clear localStorage.activeStoreId, and how the X-Store-Id header interacts with server store resolution.
---

# Active-store header leaks across logout

The client persists the selected store id in `localStorage.activeStoreId` and
`queryClient.ts` `getActiveStoreHeader()` attaches it as the `X-Store-Id` header
on EVERY `/api` request. Server-side, a global middleware
(`app.use('/api', ...)` in `server/routes.ts`) runs `resolveActiveStore` on all
authenticated requests except `/stores`; when `X-Store-Id` is present it looks
the store up scoped to `req.user.id` and returns `403 "Store not found or access
denied"` if it isn't owned by the current user.

**Rule:** any auth transition (login AND logout) MUST clear
`localStorage.activeStoreId`. Clearing the react-query cache alone is not enough.

**Why:** on logout the app cleared the query cache but left `activeStoreId`
behind. Logging into a different account in the same browser then sent the
previous user's store id, which the server rejected with 403 — surfaced as a
"Login failed: Store not found or access denied" toast. Closing the browser
(which wipes localStorage) was the only workaround, confirming stale local state,
not a server/session problem.

**How to apply:** clear it in `logout()` (after the request) and in `login()`
(before the request) in `client/src/lib/api.ts`. With no header, the server
falls back to the current user's first accessible store and `StoreContext`
repopulates a valid id from `/api/stores`. If per-user store persistence is ever
wanted, namespace the key by user id instead of a single global key.
