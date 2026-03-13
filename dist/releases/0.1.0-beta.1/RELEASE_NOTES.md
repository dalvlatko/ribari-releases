# Ribari Beta 0.1.0-beta.1

## Highlights
- Scrolling tiling layout — tabs are tiles in an infinite horizontal strip (niri paradigm)
- Columns & splits — vertical and horizontal splits, configurable column widths (1/3, 1/2, 2/3, full)
- Multiple workspaces — separate browsing contexts, switch with gestures or shortcuts
- Incognito workspaces — isolated private browsing per workspace
- Keyboard-first — Ctrl as tiling modifier (niri-style), Cmd for browser actions
- Command palette — fuzzy search across tabs, history, URLs, and workspaces (Cmd+K)
- Integrated terminal — GPU-accelerated ghostty terminal tiles, side by side with web tiles
- Code editors — VS Code, Cursor, and T3 Code tile alongside browser and terminal tabs
- Content blocking — built-in ad and tracker filtering (light / balanced / strict)
- Extensions — JS-based extension system for customization
- Workspace templates — save and load workspace layouts

## Known issues
- A lot!

## Install
- Download `Ribari-Beta-0.1.0-beta.1.zip`
- Unzip and move `Ribari Beta.app` into /Applications
- Copy extension examples from `extensions/` into `~/.config/ribari/extensions/`
- Read `extensions/docs/extensions.md` for install and porting guidance

## Unsigned app notice
This beta is not code-signed or notarized. macOS Gatekeeper will block it on first launch.

To open it:
1. Right-click (or Ctrl-click) `Ribari Beta.app` in Finder
2. Select **Open** from the context menu
3. Click **Open** in the dialog that appears

You only need to do this once — macOS remembers the override for subsequent launches.
