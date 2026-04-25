# Porting Web Extensions To Ribari

This guide is written for developers porting a Chrome-style extension to Ribari.

Ribari extensions are small web apps made from HTML, CSS, and JavaScript. A Ribari extension can:

- run as its own tile inside Ribari
- persist extension-scoped settings
- inject content scripts into matching web pages
- coordinate between a tile UI and content scripts

If your existing extension already has an options page or popup plus one or more content scripts, Ribari is a good fit: move the UI into a tile, keep the page logic in content scripts, and connect them with shared storage or message passing.

## Porting Strategy

Use this mapping when bringing a Chrome-style extension into Ribari:

- port your popup/options UI into the Ribari tile entry point declared by `entryPoint`
- port your page logic into `contentScripts`
- move extension settings into `ribari.storage` and `ribariPlugin.storage`
- use `ribariPlugin.sendMessage()` and `ribari.onContentMessage()` when content scripts need help from the tile UI
- keep SPA navigation handling inside the content script for sites like YouTube, X, or Gmail

## Install Location And Folder Layout

Each extension lives in its own directory with a `manifest.json` file and an HTML entry point.

```text
~/.config/ribari/extensions/hello-world/
├── manifest.json
└── index.html
```

Example extensions ship with Ribari releases. Custom extensions should be authored and installed under `~/.config/ribari/extensions/`.

## Minimal "Hello World" Tile Extension

Create these two files:

**`manifest.json`**

```json
{
  "id": "hello-world",
  "name": "Hello World",
  "version": "1.0.0",
  "entryPoint": "index.html"
}
```

**`index.html`**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      margin: 0;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgb(26, 26, 26);
      color: white;
      font-family: -apple-system, system-ui, sans-serif;
    }

    h1 {
      color: var(--ribari-accent, #ff6b6b);
    }
  </style>
</head>
<body>
  <h1>Hello from my extension!</h1>
  <script>
    ribari.setTitle("Hello World");
  </script>
</body>
</html>
```

Restart Ribari, then open the extension from the command palette or the Apps sidebar.

## Manifest Reference

| Field | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `id` | string | Yes | - | Unique identifier. Must match `[a-zA-Z0-9_-]+` and the directory name. |
| `name` | string | Yes | - | Display name shown in the UI. |
| `version` | string | Yes | - | Semver version string. |
| `entryPoint` | string | Yes | - | Path to the HTML entry point, relative to the extension directory. Must not contain `..`. |
| `icon` | string | No | `"puzzlepiece.extension"` | SF Symbol name for the tile icon. |
| `category` | string | No | `"Utilities"` | Sidebar grouping. Supported values are `Development`, `Productivity`, `Communication`, `Media`, and `Utilities`. |
| `keyboardMode` | string | No | `"app"` | `"app"` sends most input to the extension. `"normal"` lets Ribari keep tiling shortcuts. See [Keyboard Mode](#keyboard-mode) below. |
| `contentScripts` | array | No | - | Content scripts injected into matching pages. See [Content Script API](#content-script-api-windowribariplugin). |

### Manifest Constraints Enforced By Ribari

- `id` must contain only letters, numbers, `_`, or `-`
- the directory name must exactly match `id`
- `entryPoint` must exist inside the extension directory
- `entryPoint` and content script file paths must not contain `..`
- any referenced content script JS or CSS files must exist

### Keyboard Mode

`keyboardMode` controls how keystrokes are routed when the extension tile is focused:

- **`"normal"`** — the extension has text inputs or interactive UI but doesn't need full keyboard control. Ribari keeps its tiling shortcuts (Ctrl+H/J/K/L for focus, Ctrl+F for maximize, etc.) active; only Cmd+ shortcuts are intercepted by the browser. Use this for extensions like find-on-reddit, settings panels, or dashboards with search fields.
- **`"app"`** — the extension needs full keyboard control (terminal emulator, code editor, game). Most keystrokes pass through to the extension; only a small set of Cmd+ shortcuts (Cmd+T, Cmd+W, Cmd+L, etc.) are intercepted by Ribari.

When in doubt, start with `"normal"`. Switch to `"app"` only if the extension needs to handle key combinations like Ctrl+C, Ctrl+Z, or arrow keys that would otherwise be consumed by Ribari's tiling shortcuts.

### Content Script Entries

```json
{
  "id": "page-tools",
  "name": "Page Tools",
  "version": "1.0.0",
  "entryPoint": "index.html",
  "contentScripts": [
    {
      "matches": ["*://*.example.com/*"],
      "js": ["content.js"],
      "css": ["content.css"],
      "runAt": "document_start"
    }
  ]
}
```

| Field | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `matches` | string[] | Yes | - | URL match patterns in Chrome extension format. |
| `js` | string[] | Yes | - | JS files to inject, relative to the extension directory. |
| `css` | string[] | No | - | CSS files to inject, relative to the extension directory. |
| `runAt` | string | No | `"document_start"` | Either `"document_start"` or `"document_end"`. |

### Match Pattern Examples

| Pattern | Matches |
| --- | --- |
| `*://*.youtube.com/*` | Any scheme, the bare domain or any subdomain, any path |
| `*://example.com/foo/*` | Any scheme, exact host, paths under `/foo/` |
| `https://specific.com/page` | Exact URL match |

## Tile API (`window.ribari`)

Ribari injects `window.ribari` into extension tiles at document start.

### `ribari.setTitle(title)`

Set the tile title shown in Ribari UI.

```js
ribari.setTitle("Quick Notes");
```

### `ribari.openURL(url)`

Open an `http://` or `https://` URL in a new web tile.

```js
ribari.openURL("https://example.com");
```

### `ribari.showToast(message, style?)`

Show a Ribari toast notification. Calls are rate limited to one toast per second.

- `message`: required non-empty string
- `style`: `"action"` (default) or `"error"`

```js
ribari.showToast("Settings saved");
ribari.showToast("Save failed", "error");
```

### `ribari.getAccentColor()`

Read the current accent color as a CSS hex string.

```js
const accent = ribari.getAccentColor();
```

Ribari also injects `--ribari-accent` onto the document root:

```css
.button {
  background: var(--ribari-accent, #ff6b6b);
}
```

### `ribari.storage.get(key)`

Read a string value from extension-scoped storage.

```js
const value = await ribari.storage.get("notes");
```

### `ribari.storage.set(key, value)`

Write a string value to extension-scoped storage.

```js
await ribari.storage.set("notes", "hello");
```

Storage notes:

- quota is 1 MB per extension
- values are stored as strings; non-string values passed to `set()` are auto-stringified via `JSON.stringify()` (e.g. `ribari.storage.set("data", {a: 1})` stores `'{"a":1}'`)
- use `JSON.parse()` to read back structured data
- tile code and content scripts share the same storage for a given extension

### `ribari.on(event, callback)`

Listen for host events.

```js
ribari.on("focus", () => console.log("focused"));
ribari.on("blur", () => console.log("blurred"));
ribari.on("accentColorChanged", data => {
  console.log("new accent", data.color);
});
```

### `ribari.onFocus(callback)` / `ribari.onBlur(callback)`

Shorthand helpers for focus and blur.

```js
ribari.onFocus(() => console.log("focused"));
ribari.onBlur(() => console.log("blurred"));
```

### `contextURL` Event

When a user opens an extension tile, Ribari captures the URL of the previously-focused web tile and dispatches a `contextURL` event at document end. This lets extensions auto-act on the page the user was viewing.

```js
ribari.on("contextURL", (data) => {
  console.log("Opened from:", data.url);
  // auto-search, auto-annotate, etc.
});
```

- `data.url`: the URL string of the web tile that was focused before this extension tile was created
- only fires once, at tile creation (not on subsequent focus changes)
- only fires for extension tiles opened via the command palette or keyboard shortcut (not session restore)
- the URL is also available synchronously as `window.__ribariContextURL` (set at document start)

### `ribari.onContentMessage(handler)`

Register a tile-side message handler for content scripts using `ribariPlugin.sendMessage()`.

```js
ribari.onContentMessage((message, sender, sendResponse) => {
  if (message.type === "ping") {
    sendResponse({ ok: true });
  }
});
```

## Content Script API (`window.ribariPlugin`)

Content scripts receive a restricted bridge named `window.ribariPlugin`.

### `ribariPlugin.storage.get(key)` / `ribariPlugin.storage.set(key, value)`

Read and write the same extension-scoped storage used by the tile UI.

```js
const enabled = await ribariPlugin.storage.get("enabled");
await ribariPlugin.storage.set("enabled", "true");
```

### `ribariPlugin.showToast(message, style?)`

Show a Ribari toast from the page context.

```js
ribariPlugin.showToast("Segment skipped");
ribariPlugin.showToast("Something went wrong", "error");
```

### `ribariPlugin.fetchJSON(url)`

Proxy a JSON GET request through the host. Use this when a content script needs data from an endpoint that is blocked by page-context CORS rules.

```js
const data = await ribariPlugin.fetchJSON("https://www.reddit.com/api/info.json?url=https%3A%2F%2Fexample.com");
```

- only `http` and `https` URLs are supported
- only JSON responses are supported
- rejects on network errors, non-2xx responses, or invalid JSON

### `ribariPlugin.sendMessage(payload)`

Send a JSON-serializable message to the extension tile and await a response. Resolves with `null` if the tile is not currently open (does not reject), so fire-and-forget messages work without error handling.

```js
const response = await ribariPlugin.sendMessage({ type: "fetchData", id: "abc123" });
if (response) {
  // tile was open and replied
}
```

### `ribariPlugin.setBadge(opts)`

Show or clear a badge (icon + count) on the current web tile's address bar. Each extension gets its own badge slot keyed by plugin ID, so multiple extensions can show badges on the same tile without colliding.

```js
// Show a badge with count
ribariPlugin.setBadge({ text: "5" });

// Show a badge with custom SF Symbol icon and tooltip
ribariPlugin.setBadge({ text: "3", icon: "star.fill", tooltip: "3 items found — click to view" });

// Clear the badge
ribariPlugin.setBadge(null);
```

- `text`: string to display next to the icon (typically a count)
- `icon`: optional SF Symbol name (defaults to `"bubble.left.fill"`)
- `tooltip`: optional hover tooltip string (defaults to `text` if omitted)
- passing `null` or omitting `text` clears the badge
- badges are only visible in expanded (focused) address bar mode
- badges are automatically cleared on page navigation; call `setBadge()` again after each navigation
- clicking a badge opens (or focuses) the extension's tile, so users can act on whatever the badge reports

### `ribariPlugin.onStorageChanged(handler)`

Listen for extension storage writes from the tile UI or other content scripts that share the same extension storage.

```js
ribariPlugin.onStorageChanged((change) => {
  if (change.key === "showBadge") {
    console.log("new value", change.value);
  }
});
```

- `change.key`: the storage key that changed
- `change.value`: the new string value, or `null` when the key was removed
- handlers only fire while the page and content script are still alive

Content scripts do **not** have access to:

- `setTitle`
- `openURL`
- `getAccentColor`
- `on`, `onFocus`, or `onBlur`

## Message Passing And SPA Navigation

Message passing lets a content script delegate work to its tile UI.

### Content Script Side

```js
const response = await ribariPlugin.sendMessage({ type: "fetchData", id: "abc123" });
console.log(response);
```

- resolves with `null` if the extension tile is not open (does not reject)
- rejects if no tile handler has called `ribari.onContentMessage()`
- rejects after 30 seconds if no reply is sent

### Tile Side

```js
ribari.onContentMessage((message, sender, sendResponse) => {
  fetch("https://api.example.com/data?id=" + message.id)
    .then(r => r.json())
    .then(data => sendResponse({ ok: true, data }))
    .catch(err => sendResponse({ ok: false, error: err.message }));

  return true;
});
```

Rules:

- only one tile message handler is active at a time
- return `true` for async replies
- call `sendResponse()` at most once
- messages and responses must be JSON-serializable

### SPA Navigation

Content scripts are injected once per page load based on the URL at injection time. On single-page apps like YouTube, your content script must handle client-side navigation itself.

Typical strategies:

- listen for `popstate` or `hashchange`
- listen for app-specific events such as `yt-navigate-finish`
- watch the DOM with `MutationObserver` when key elements are recreated

#### Generic SPA Navigation Pattern

For `pushState`-heavy apps that don't fire custom navigation events, combine `popstate`, `hashchange`, and a periodic URL poll:

```js
let lastURL = location.href;

function onNavigate() {
  if (location.href === lastURL) return;
  lastURL = location.href;
  // re-run your content script logic here
}

window.addEventListener("popstate", onNavigate);
window.addEventListener("hashchange", onNavigate);

// Catch pushState navigations that don't fire popstate
setInterval(() => {
  if (location.href !== lastURL) onNavigate();
}, 500);
```

For YouTube specifically, listen to `yt-navigate-finish` (see the SponsorBlock example).

## SponsorBlock Worked Example

SponsorBlock is the best reference example in this release payload for porting a real-world browser extension into Ribari.

- Developer walkthrough: [`../sponsor-block/README.md`](../sponsor-block/README.md)

The original open source SponsorBlock project was created by **Ajay Ramachandran** and is maintained with help from contributors. This release example shows how that style of extension maps into Ribari's extension model.

It demonstrates:

1. a tile UI for settings and attribution
2. shared storage between the tile and content script
3. a content script injected into YouTube at `document_start`
4. SPA navigation handling for YouTube page transitions
5. toast notifications and external-link opening

### SponsorBlock Manifest

```json
{
  "id": "sponsor-block",
  "name": "SponsorBlock",
  "version": "2.0.0",
  "entryPoint": "index.html",
  "icon": "forward.fill",
  "category": "Media",
  "keyboardMode": "normal",
  "contentScripts": [
    {
      "matches": ["*://*.youtube.com/*"],
      "js": ["content.js"],
      "runAt": "document_start"
    }
  ]
}
```

The settings tile writes values into extension storage. The YouTube content script reads those values on page load and applies them the next time YouTube loads or navigates to a new video.

### Why SponsorBlock Ports Cleanly

SponsorBlock is a useful model because it has the same three moving parts many browser extensions have:

- a user-facing settings UI
- persistent settings shared across pages
- site-specific page logic that reacts to a single-page app

That makes it a strong template for porting extensions that modify one site, annotate a page, or automate repeated page-level actions.

## Find-on-Reddit Worked Example

Find-on-Reddit is a complementary example to SponsorBlock, showing the opposite architecture pattern: the **tile does the heavy lifting** while the content script is minimal.

- Developer walkthrough: [`../find-on-reddit/README.md`](../find-on-reddit/README.md)

It demonstrates:

1. a tile UI that searches Reddit for discussions about a URL
2. a content script that sends the current page URL to the tile via `sendMessage()` and sets an address bar badge with the discussion count via `setBadge()`
3. auto-searching the previously-focused page's URL via the `contextURL` event
4. a user-togglable address bar badge ("Show address bar icon" setting)
5. `keyboardMode: "normal"` for an extension with text inputs and clickable links

### Why Find-on-Reddit Is A Useful Second Example

Where SponsorBlock shows a **heavy content script** pattern (most logic runs in the page, tile is just settings), find-on-reddit shows a **heavy tile** pattern (tile does the searching and rendering, content script just reports the URL). Most real extensions fall somewhere between these two patterns.

## What's Not Supported

Ribari extensions use a purpose-built API, not the Chrome Extensions API. This table maps common Chrome APIs to their Ribari equivalents:

| Chrome API | Ribari equivalent |
| --- | --- |
| `chrome.tabs` | Content script sends URL via `ribariPlugin.sendMessage()` |
| `chrome.storage` | `ribari.storage` / `ribariPlugin.storage` |
| `chrome.runtime.sendMessage` | `ribariPlugin.sendMessage()` |
| `chrome.runtime.onMessage` | `ribari.onContentMessage()` |
| Background service worker | Not needed — tile JS runs persistently while the tile is open |
| `chrome.webRequest` | Not available |
| `chrome.contextMenus` | Not available |
| `chrome.notifications` | `ribari.showToast()` |
| `chrome.browserAction` / badge | `ribariPlugin.setBadge()` from content scripts |
| `chrome.alarms` | Use `setInterval` / `setTimeout` in tile JS |

If your Chrome extension relies heavily on `webRequest`, `contextMenus`, or `browserAction`, it will require significant rearchitecting. Extensions that primarily use storage, messaging, and content scripts port cleanly.

## Legacy Naming

Use `extension` as the canonical public term.

- install custom extensions in `~/.config/ribari/extensions/<extension-id>/`
- the legacy compatibility path `~/.config/ribari/plugins/<extension-id>/` is still scanned

## Debugging And Common Errors

### Console.app

Extension load errors and runtime logs appear in Console.app.

- Process: `Ribari`
- Category: `ExtensionScanner` for scan/load problems

### Common Errors

| Error | Cause |
| --- | --- |
| `"Extension 'x' failed to load: No manifest.json found"` | Missing `manifest.json` in the extension directory |
| `"Malformed manifest.json: ..."` | Invalid JSON syntax or missing required fields |
| `"Invalid extension ID 'x': must match [a-zA-Z0-9_-]+"` | The `id` contains spaces or special characters |
| `"Directory name 'x' doesn't match manifest ID 'y'"` | The folder name must exactly match `id` |
| `"Entry file not found: ..."` | The `entryPoint` file does not exist |
| `"Content script file not found: ..."` | A file listed in `contentScripts` does not exist |
| `"Rate limited: max 1 toast per second"` | `showToast()` was called too frequently |
| `"storage quota exceeded"` | Extension storage exceeded the 1 MB quota |

### Tips

- use `console.log()` in tile scripts and content scripts while developing
- restart Ribari after changing extension files
- content scripts are loaded from manifests at startup, so content script changes also require a restart
