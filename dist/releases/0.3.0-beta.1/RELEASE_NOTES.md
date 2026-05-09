# Ribari Beta 0.3.0-beta.1

### New
- Session autosave — workspace survives crashes and unexpected quits
- Wireframe placeholder when switching tabs faster than snapshots can render

### Improvements
- Horizontal strip swipe and vertical tile scroll no longer interfere with each other
- Tab switching smoother — live tiles stay attached until snapshots are ready
- Click-to-focus shows visual feedback immediately before deferred loads resume
- Media autoplay suppressed on tab restore
- Terminal output faster at high throughput (120Hz drain, elevated dispatch priority)

### Bug fixes
- t.co and youtu.be links were being blocked by redirect rules in the content blocker
- Downloads with a `Content-Disposition` header were being blocked by scheme rules
- Tile URL state was being updated during redirects and internal navigations
- Snapshot z-order wrong when switching tabs quickly
- Domain-rule column resizes left gaps or jumped the viewport
- Settings layout and menu item validation

## Known issues
-

## Install
- Download `Ribari-Beta-0.3.0-beta.1.zip`
- Unzip and move `Ribari Beta.app` into /Applications
- Copy extension examples from `extensions/` into `~/.config/ribari/extensions/`
- Read `extensions/docs/extensions.md` for install and porting guidance

### Gatekeeper bypass

Ribari is not notarized yet, so macOS Gatekeeper will block it on first launch. To allow it:

1. **Try opening normally** — double-click `Ribari Beta.app`. macOS will show a dialog saying the app "can't be opened because Apple cannot check it for malicious software."
2. **Open System Settings → Privacy & Security** — scroll down to the Security section. You'll see a message like *"Ribari Beta.app was blocked from use because it is not from an identified developer."*
3. **Click "Open Anyway"** and confirm in the follow-up dialog.

Alternatively, remove the quarantine attribute from the terminal before first launch:

```bash
xattr -cr /Applications/Ribari\ Beta.app
```

You only need to do this once — macOS remembers your choice for subsequent launches.
