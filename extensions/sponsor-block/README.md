# SponsorBlock Extension Example

This directory contains Ribari's SponsorBlock release example. It is a complete reference for developers porting a Chrome-style extension into Ribari with both a tile UI and a content script.

The original open source SponsorBlock project was created by **Ajay Ramachandran** and is maintained by contributors. This example adapts that style of extension architecture into Ribari's extension model.

## Files

```text
sponsor-block/
├── manifest.json
├── index.html
├── style.css
├── app.js
├── content.js
└── README.md
```

- `manifest.json`: declares the extension, its tile entry point, and the YouTube content script
- `index.html`: settings tile markup shown inside Ribari
- `style.css`: tile styling for the settings UI
- `app.js`: tile-side logic for loading and saving settings, opening links, and showing toasts
- `content.js`: page-side logic injected into YouTube to fetch, render, and skip segments

## How The Pieces Fit Together

The easiest way to read this example is as a porting guide:

- `manifest.json` replaces the Chrome extension manifest pieces that matter here
- `app.js` is the settings UI logic you might otherwise put in a popup or options page
- `content.js` is the page-level logic that actually changes YouTube behavior

### Tile UI + shared storage

The tile UI uses `ribari.storage.get()` and `ribari.storage.set()` to persist settings like:

- whether SponsorBlock is enabled
- which segment categories are active
- whether segments should be auto-skipped
- whether skip toasts should be shown

The content script reads the same keys through `ribariPlugin.storage`, which keeps the tile and page behavior in sync without a separate settings service.

### Why `document_start` is used

The content script is injected with `runAt: "document_start"` so it can:

- initialize early on YouTube pages
- attach navigation and DOM observers before the player is fully rebuilt
- be ready to load settings and react as soon as video elements appear

This is especially helpful on YouTube, where the player and progress bar can be recreated during app-style navigation.

### SPA navigation on YouTube

YouTube navigates between videos without a full page reload, so `content.js` handles SPA transitions explicitly:

- listens for `yt-navigate-finish`
- uses `popstate` as a fallback
- watches the page with `MutationObserver` for recreated video elements
- re-detects the current video ID and reloads segment data when navigation changes

That pattern is the main thing to copy if you are targeting other single-page web apps.

## Porting Lessons From SponsorBlock

If you are bringing an existing browser extension to Ribari, SponsorBlock shows a practical pattern:

- move the extension's settings screen into the Ribari tile
- keep site-specific DOM and media logic in the content script
- share settings through storage instead of duplicating state
- treat client-side navigation as part of the content script, not as a one-time page load event

## What To Copy For Your Own Extension

Copy directly:

- the manifest structure for a tile + content script extension
- the storage pattern shared between tile code and page code
- the early-setup pattern in `content.js`
- the separation between tile UI responsibilities and content script responsibilities

Customize immediately:

- `id`, `name`, icon, and category in `manifest.json`
- the tile UI and saved settings in `index.html`, `style.css`, and `app.js`
- the `matches` rules and site-specific DOM logic in `content.js`
- any remote API calls, selectors, and page event hooks

## Suggested Reading Order

1. `manifest.json`
2. `index.html`
3. `app.js`
4. `content.js`

For the broader API surface and install instructions, see [`../docs/extensions.md`](../docs/extensions.md).
