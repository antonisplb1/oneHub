---
name: Wallet stamp-strip rendering
description: Constraints for the server-rendered stamp strip shown on Apple/Google loyalty passes.
---

- Apple: when a `strip` image is attached, `primaryFields` render ON TOP of the strip — so the stamp count must move to `headerFields` and primaryFields must be omitted. Strip render failure must fail open to the old primaryFields layout so passes never break.
- Google: Google's servers cache `heroImage` URLs aggressively; the strip URL must be cache-busted with a per-stamp-count query param (`?v={stamps}`) or the image never visually updates after a stamp.
- The strip endpoint is intentionally public (Google fetches it server-side, like the logo endpoint); it exposes only a rendered image, keyed by unguessable customer UUID.
- Renderer contrast rules: 35% black scrim only over real banner photos (never over the brand gradient fallback); checkmark switches to near-black when brand luminance > 0.5.
- **Why:** discovered during Round 10 — without the headerFields move the text collided with the strip, and without cache-busting Google showed stale strips indefinitely.
- **How to apply:** any future change to strip layout, pass fields, or the strip URL must preserve fail-open behavior and the cache-bust param.
