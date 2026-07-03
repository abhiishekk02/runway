# RUNWAY

A single-file, local-first **job-search command center** — plus a companion
Chrome extension (**RUNWAY Clip**) that clips jobs from any site straight into
your pipeline.

Editorial **NOIR / Bone** design language: near-black (or warm bone) canvas,
hairline structure, a single acid-lime accent, Unbounded display type, and flat
60fps motion. Everything runs in the browser — your data never leaves your
device (`localStorage`).

## `index.html` — the app

Open `index.html` in any browser. Everything (HTML + CSS + JS) is inline; no
build step, no server, no account.

Features: pipeline kanban, live job feed, JD Match Lab, Resume Studio + AI
Tailor, interview prep (STAR bank, spaced-repetition drills, mock interview),
network/outreach tracking, offers comparison, focus timer, watchlist, and an
application "assembly line". AI features use Claude via your own API key
(stored locally; add it under the ⚙ Settings icon).

- **Themes:** Noir (dark) / Bone (light) — toggle with the sun-moon icon.
- **Responsive:** desktop rail collapses to a swipeable top nav on mobile.
- **Private:** all state in `localStorage`; Export/Import for backups.

## `clipper/` — RUNWAY Clip (Chrome extension, MV3)

Clips jobs from LinkedIn / Indeed / Glassdoor (or any page) into the app via a
`postMessage` bridge (the app is detected by its `<meta name="runway-app">`
tag). Fit scoring, bulk clip, tags/notes, a ⌘K command palette, and matching
NOIR/Bone theming.

### Install (unpacked)
1. `chrome://extensions` → enable **Developer mode**
2. **Load unpacked** → select the `clipper/` folder
3. If you open the app as a local `file://`, enable **Allow access to file URLs**
   on the extension's details page (needed for Sync)
4. Set your app URL + skills in the extension's Settings

## Privacy

100% local. No servers, no telemetry. AI calls go directly from your browser to
Anthropic using your own key.

---
🤖 Built with [Claude Code](https://claude.com/claude-code)
