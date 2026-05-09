# Ribari Beta 0.2.0-beta.1

## Highlights

### Sidebar panel system
- Pluggable sidebar panel architecture with slide animations for open/close
- Now Playing panel: media session display with click-to-navigate, played-only filter, and mute button
- Sidebar hover overlay with pinned focus reveal
- Workspace custom names shown in sidebar tab panel headers

### Spring-animated layout transitions
- Spring physics animations for all layout operations (column add/remove, resize, workspace switch)

### Terminal improvements
- Reworked Ghostty terminal integration for upstream parity
- Fixed terminal rendering delay when scrolling back into viewport
- Fixed terminal performance regression and double-draw on creation
- Serialized Ghostty surface creation for stable batch terminal launches (template load)
- Fixed terminal top gap with hidden address bars
- macOS 26 titlebar clipping fix for terminal and sidebar
- Aligned Ghostty lifecycle with native visibility

### Tile shortcuts
- Workspace and tile shortcut number keyboard shortcuts (Option+N to jump)
- Allow duplicate tile shortcut numbers

### Address bar improvements
- Equal-width chips with active highlight for tabbed column address bars
- Show single expanded bar for tabbed columns in temporary address bar mode
- Clean `ribari-extension://` URLs for extension tiles
- Fixed address bar focus for tabbed tiles with hidden address bars
- Fixed tab overflow detection and expanded bar sizing
- Overflow chip arrows styled with accent color and gradient

## Changes since 0.1.1-beta.1

### New features
- Add pluggable sidebar panel system with Now Playing panel and mute button
- Add slide animation for hover overlay sidebar open/close and keyboard toggle
- Add spring animations for layout transitions across all operations
- Add workspace and tile shortcut number keyboard shortcuts (Option+N)
- Add focus badge overlay on tile focus change when address bars hidden
- Show tab preview on hidden-bar focus changes
- Show workspace custom name in toast messages and sidebar tab panel headers
- Allow duplicate tile shortcut numbers

### Improvements
- Show equal-width chips with active highlight for tabbed column address bars
- Show single expanded bar for tabbed columns in temporary address bar mode
- Show clean ribari-extension:// URLs for extension tiles in address bar
- Style overflow scroll arrows with accent-colored triangles and darker gradient
- Extract address bar display mode helper and replace magic numbers with DesignTokens
- Rework Ghostty terminal integration for upstream parity
- Align Ghostty lifecycle with native visibility
- Serialize Ghostty surface creation
- Add cell-boundary dedup for terminal resize
- Block safe area propagation into terminal view chain

### Bug fixes
- Fix terminal rendering delay when scrolling back into viewport
- Fix terminal performance regression from titlebar overlay commits
- Fix terminal double-draw on creation
- Fix terminal top gap with hidden address bars
- Fix terminal cmd launch and template restore
- Fix terminal restore and Ghostty callback lifecycle
- Fix crash when batch-creating terminal surfaces (template load)
- Fix Cmd-Q in terminal tiles
- Fix Cmd shortcut interception in terminal tiles
- Fix launch crash when registerPlugins runs before setupContent
- Fix tab overflow not triggering and expanded bar too small
- Fix overflow chips: fill width, position expanded bar inline
- Fix tabbed address bar focus and chip click routing
- Fix Cmd+L autoselect for tabbed tiles with hidden address bars
- Fix animated tile focus responder handoff
- Fix sidebar hover overlay and pinned focus reveal
- Fix media tile focus on sidebar return
- Fix now playing sidebar row stability and session navigation
- Fix tile shortcut toasts and keyboard routing in plugin tiles
- Fix macOS 26 titlebar clipping in terminal and sidebar
- Fix sendText newline handling for ghostty text input API
- Remove duplicate selected-text search menu item

## Known issues
-

## Install

Download the [latest release](https://github.com/dalvlatko/ribari-releases/releases/tag/v0.2.0-beta.1), unzip, and move `Ribari Beta.app` to `/Applications`.

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
