---
name: Wallet logo fetch asymmetry (Google vs Apple)
description: Why Apple pass logo loading must stay https-only and self-defensive against SSRF, unlike the Google path.
---

# Wallet logo fetch asymmetry

Google Wallet and Apple Wallet resolve the merchant `stores.logo` differently, and the difference matters for security.

- **Google path** (`resolveGoogleLogoUrl` in `server/googleWallet.ts`): returns a URL string that *Google's* servers fetch. A `data:` logo is turned into our own `/api/logo/store/:id` endpoint; an `https://` logo is passed through; otherwise a default. Our backend never makes the request.
- **Apple path** (`loadLogoBuffer` in `server/appleWallet.ts`): our *backend* fetches the bytes itself (sharp needs the raw image). This makes merchant-controlled logo URLs a server-side SSRF vector.

**Rule:** the Apple logo loader accepts only `data:` URIs and `https://` URLs (never plain `http://`) — matching the Google path, which also only honors `https://`. Any non-image / unreachable / corrupt fetch must fall back to the solid-color placeholder and never throw.

**Why:** merchants set `logo` via profile/store updates, so an attacker could point it at internal/metadata endpoints. Response bytes only feed sharp (blind SSRF), but https-only + placeholder fallback keeps the surface small.

**How to apply:** if extending logo handling, do not re-add `http://` or arbitrary schemes to the Apple loader; if stronger isolation is needed, block private/loopback/link-local IP ranges rather than widening the scheme list.
