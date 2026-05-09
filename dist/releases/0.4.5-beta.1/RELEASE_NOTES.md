# Ribari Beta 0.4.5-beta.1

Major update — media playback rewrite, sticky tiles, link routes, and a wave of stability work around offloaded tiles and workspace switching.

## Highlights
- **Media player rewrite** — replaced bundled mpv with WebKit file playback. Improved fullscreen, picker hit testing, controls, and PiP handoff.
- **Auto Picture-in-Picture** — tiles drop into PiP automatically when scrolled offscreen (10% visibility threshold), only after media starts playing. Configurable.
- **Sticky tiles** — pin tiles to follow you across workspace switches, with overview boundary indicators and toast feedback.
- **Persistent link routes** — link targets are now inherited across columns and survive origin closes. Added context-menu actions and overview labels for routes.
- **Performance telemetry tile** — workspace-aware perf overlay with per-tile metrics, colorized status values, and gesture-aware suspension.
- **Workspace switcher polish** — hover-switcher setting, button hit testing across gaps, expanded labels, hits passing through outside the panel.
- **Native integration consent** — inline consent panels (with modal fallback) for media, screen recording, notifications, and bookmark imports.
- **ServeWeb hardening** — apps constrained to loopback only.
- **Numeric shortcut rebinding** — number-row shortcut ranges are now configurable.
- **File URL support** — file:// URLs allowed in restored tiles and bookmarks, with sandboxed Finder paths restricted to Application Support.

## Stability
- Hard media offload with snapshot preservation and wake controls
- Recovery for stalled restored tab loads, unusable media tiles, and offloaded tile wake
- Snapshot warmup prioritization for media-heavy tiles on launch
- Layout reconciliation after tile close, workspace switch, and gesture transitions
- Many fixes around detached tile rendering, link routing on target-opened tabs, devtools inspector fullscreen, and white-page snapshots

## Refactors
- BrowserContainerView and MainWindowController split into focused helpers (no behavior change)
- Tile rendering and tabbed presentation reorganized

## Known issues
- This build is **unsigned**. macOS Gatekeeper will block first launch — see Install instructions below.
- ScreenCaptureKit migration pending (still using deprecated CGWindowListCreateImage for tile screenshots).

## Install
- Download `Ribari-Beta-0.4.5-beta.1.zip`
- Unzip and move `Ribari Beta.app` into /Applications
- **First launch:** because this build is unsigned, run once from terminal to clear the quarantine attribute:
  ```
  xattr -cr /Applications/Ribari\ Beta.app
  ```
  Or right-click the app and choose Open → Open in the Gatekeeper dialog.
- Copy extension examples from `extensions/` into `~/.config/ribari/extensions/`
- Read `extensions/docs/extensions.md` for install and porting guidance
