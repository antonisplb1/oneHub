---
name: Manifest install-event race
description: Why page-specific PWA installs must verify the manifest tied to a captured browser install prompt.
---

Pair each captured `beforeinstallprompt` event with the manifest href active when the event fired. If client navigation changes the manifest, hard-reload the current page and require a fresh explicit Install click rather than using the stale event.

**Why:** Browsers evaluate installability asynchronously and do not reliably re-fire `beforeinstallprompt` after a dynamically swapped manifest. Using a stale event can install the identity and start URL from the previous page.

**How to apply:** Keep hard-load manifest selection ahead of React, compare the stored and current manifest href before prompting, and use a one-time session flag to reopen the install UI after reload without automatically calling `prompt()`.