---
name: Store-scoped cache invalidation on switch
description: Why active-store switching must invalidate React Query cache centrally, not per call site.
---

Store-scoped React Query data (loyalty settings/cards, customers, menu, shifts, etc.) uses store-AGNOSTIC cache keys (e.g. `["/api","loyalty-settings"]`) with `staleTime: Infinity`. The active store is sent via the `X-Store-Id` header read from `localStorage.activeStoreId` (see `getActiveStoreHeader` in `client/src/lib/queryClient.ts`).

**Rule:** Every active-store change must invalidate the query cache, and this belongs in ONE place — `setActiveStoreId` in `client/src/contexts/StoreContext.tsx` (it early-returns on no-op, then calls `queryClient.invalidateQueries()`). Do NOT rely on individual call sites to clear the cache.

**Why:** Before centralizing, only the two dedicated store switchers called `queryClient.clear()`; the create-store and delete-store paths in `StoresPage` switched stores WITHOUT clearing, so the previous store's cached data (e.g. loyalty settings) kept showing under the newly-active store. This looked like "settings don't save / revert" for multi-store accounts even though the backend persisted correctly per store.

**How to apply:** Use `invalidateQueries()` (not `clear()`) — with `staleTime: Infinity` it marks queries stale/refetchable while preserving cache structure and avoids a destructive global wipe + empty-state flash. Never write `localStorage.activeStoreId` directly from feature code; always go through `setActiveStoreId`. The single-store flow was never broken — this class of bug only reproduces with 2+ stores.
