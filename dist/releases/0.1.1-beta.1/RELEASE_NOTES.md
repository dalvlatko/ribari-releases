# Ribari Beta 0.1.1-beta.1

## Install

Download the [latest release](https://github.com/dalvlatko/ribari-releases/releases/tag/v0.1.1-beta.1), unzip, and move `Ribari Beta.app` to `/Applications`.

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
