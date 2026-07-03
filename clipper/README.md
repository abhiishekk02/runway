# RUNWAY Clip

A brand-new, ground-up rebuild. **Editorial NOIR** design — hairline structure,
one acid-lime accent, oversized kinetic type, a ⌘K command palette, and flat
(zero-blur) motion so it's smooth by default.

Clips jobs from **LinkedIn / Indeed / Glassdoor** (and any page) into your
RUNWAY pipeline via the app's built-in `postMessage` bridge.

## Install

1. `chrome://extensions` → **Developer mode** on.
2. **Load unpacked** → select this `runway-clip/` folder.
3. If your RUNWAY app is a **local file**, open the extension's **Details** and
   enable **Allow access to file URLs** (needed for Sync to reach it).
4. Popup ⌘ → **Settings**: set your RUNWAY URL + skills for fit scoring.

## Use

- **On a job posting** → click the floating **Clip** pill (or `Alt+Shift+J`).
- **Any page** → toolbar popup → **Clip page** (works everywhere).
- **Right-click** → clip the job, or clip selected text as a note.
- **⌘K** in the popup → command palette: clip, sync, export, theme, settings,
  or type to jump to a clip. Arrow keys + Enter.
- **Sync →** finds your RUNWAY tab, pushes clips (confetti on success),
  or auto-syncs whenever a RUNWAY tab is open.

## Design

- **Type:** Unbounded (display + numbers), Space Grotesk (UI), JetBrains Mono
  (labels), Fraunces italic (empty state).
- **Two themes:** Noir (dark) / Bone (light) — toggle instantly with ◐.
- **Motion:** transform/opacity only, no `backdrop-filter`, no animated blur →
  60fps. Kinetic wordmark, sliding accent ticks, spring rows, confetti.

## Features

Fit scoring · sort by Fit / New / A–Z · inline edit (stage, priority, tags,
notes) · command palette · manual add · export JSON/CSV · copy queue · import ·
company blocklist · already-in-RUNWAY dedupe · badge count · two keyboard
shortcuts · auto-sync.

## Architecture (why it's reliable)

The popup is **self-contained** — it clips and syncs via `chrome.scripting`
directly, so it works even if the service worker is asleep. Shared logic lives
in one `engine.js`. Files:

| File | Role |
| --- | --- |
| `manifest.json` | MV3 config |
| `engine.js` | storage, settings, fit, sync — shared everywhere |
| `scrape.js` | single + list scrapers (`globalThis.__rwScrape*`) |
| `content.js` | on-page Clip / Clip-all pills |
| `bridge.js` | runs on the RUNWAY app, postMessage sync + ACK |
| `worker.js` | badge, context menu, shortcuts, auto-sync |
| `popup.html/js` | NOIR popup + palette |
| `options.html/js` | NOIR settings |

Everything is local (`chrome.storage`). Nothing is uploaded.
