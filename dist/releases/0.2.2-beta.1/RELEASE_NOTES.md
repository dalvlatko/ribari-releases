# Ribari Beta 0.2.2-beta.1

### Bug fixes
- Fix tabbed column showing partial-height tile on tab switch
- Adjust hidden tab preview strip spacing

---

# Ribari Beta 0.2.1-beta.1

### New features
- Add web notifications with eager permission, site icon, and origin
- Add Cmd+Q hold-to-quit confirmation
- Add per-tile gesture lock with delayed activation
- Show active playback count in sidebar Now Playing button

### Improvements
- Improve terminal rendering speed for resize and large output
- Check for updates on app activation, not just launch
- Reorganize content blocker address bar menu
- Improve tab-heavy workspace responsiveness
- Skip reveal animation for sidebar and palette tab picks

### Bug fixes
- Fix workspace indicator disappearing when sidebar is toggled
- Fix keyboard shortcuts eaten by terminal when address bar is focused
- Fix tabbed column click always selecting the first tab
- Fix extension badges not showing on first Cmd+L
- Fix stale tab bars after instant tab selection
- Fix silent audio in HTML5 web media playback
- Fix popup auth flows and expected redirects
- Fix sidebar transparency fallback
- Handle download handoffs without error pages

## Install

Download the [latest release](https://github.com/dalvlatko/ribari-releases/releases/tag/v0.2.2-beta.1), unzip, and move `Ribari Beta.app` to `/Applications`.

Copy extension examples from `extensions/` into `~/.config/ribari/extensions/`. Read `extensions/docs/extensions.md` for install and porting guidance.

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
