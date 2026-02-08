# GMSD Update — Self-Update Command

You are the GMSD update manager. Check for and install the latest version of Get More Shit Done.

**Usage:** `/gmsd:update`

---

## Instructions

### Step 1: Detect Current Installation

1. Check for a **local** install first: read `./.claude/get-more-shit-done/VERSION` in the current working directory.
2. If no local install, check for a **global** install: read `~/.claude/get-more-shit-done/VERSION`.
3. Record the install type (`local` or `global`) and the current version string.

**If neither file exists:**
```
## GMSD Not Found

Could not detect a GMSD installation.

- Expected local install at: ./.claude/get-more-shit-done/VERSION
- Expected global install at: ~/.claude/get-more-shit-done/VERSION

**To install GMSD:**
  npx get-more-shit-done-cc@latest          (global)
  npx get-more-shit-done-cc@latest --local  (local to this project)
```
Stop here. Do not proceed further.

### Step 2: Check Latest Version

1. Run `npm view get-more-shit-done-cc version` to get the latest published version.
2. Compare the current installed version with the latest version.

**If already on the latest version:**
```
## GMSD is Up to Date

Installed version: {current_version} ({install_type} install)
Latest version:    {latest_version}

You're already running the latest version. No update needed.
```
Skip to Step 6 (What's Next).

**If an update is available:**
Proceed to Step 3.

### Step 3: Show Update Details

1. Fetch changelog information. Try these in order:
   - Run `npm view get-more-shit-done-cc --json` to get package metadata (look for `description`, `dist-tags`, and recent version info).
   - If a `repository` URL is listed in the package metadata, note it for reference.

2. Display the update summary:

```
## Update Available

Installed version: {current_version} ({install_type} install)
Latest version:    {latest_version}

### What's New in {latest_version}
{Changelog summary if available, or "Changelog not available. Visit the repository for details."}

### Update Command
{The command that will be run — see Step 4 for which command to use.}
```

### Step 4: Confirm and Run Update

**Read mode from config:**
Attempt to read `.planning/config.json` for the `mode` setting. If no config exists, default to `guided`.

**If mode is `guided` or `balanced`:**
Ask for confirmation:
```
**Proceed with update?** (yes / no)
```
Wait for user response. If "no", stop here and skip to Step 6 (What's Next).

**If mode is `yolo`:**
Proceed immediately without confirmation.

**Run the update:**

For a **global** install:
```bash
npx get-more-shit-done-cc@latest
```

For a **local** install:
```bash
npx get-more-shit-done-cc@latest --local
```

Capture the output of the update command.

### Step 5: Verify and Report

1. After the update command completes, re-read the VERSION file to confirm the update was applied:
   - Local: `./.claude/get-more-shit-done/VERSION`
   - Global: `~/.claude/get-more-shit-done/VERSION`

2. If the version file now shows the latest version, the update was successful:

```
## Update Complete

Previous version: {old_version}
Current version:  {new_version}
Install type:     {install_type}

### What Changed
{Summary of new commands, updated agents, configuration changes, or
"Run /gmsd:help to see the latest command reference."}
```

3. If the version did not change or the command failed, report the error:

```
## Update Failed

The update command ran but the version did not change.

Installed version: {still the old version}
Expected version:  {latest_version}

**Troubleshooting:**
- Check your network connection
- Try running the update command manually:
    {the update command}
- Check for permission issues (try with sudo for global installs)
- File an issue: https://github.com/vicentealvarezasencio/get-more-shit-done/issues
```

### Step 6: Update State (if project exists)

If `.planning/state.json` exists, append to the `history` array:
```json
{
  "command": "/gmsd:update",
  "timestamp": "{ISO timestamp}",
  "result": "Update check: {old_version} -> {new_version}"
}
```

If no update was performed (already latest or user declined):
```json
{
  "command": "/gmsd:update",
  "timestamp": "{ISO timestamp}",
  "result": "Update check: already on latest ({current_version})"
}
```

Update `last_command` to `/gmsd:update` and `last_updated` to the current ISO timestamp.

### Step 7: What's Next

**If a project exists**, read `state.json` for context:

```
---
## What's Next

Current: Phase {N} — {name} | Status: {status} | Mode: {mode}

**Recommended next step:**
--> /gmsd:{next-command} — {why this is the right next step}

**Other options:**
- /gmsd:help — View full command reference (check for new commands after update)
- /gmsd:progress — Check full project status
- /gmsd:settings — Review settings (new options may be available after update)
```

Determine the recommended next command using the same routing logic as `/gmsd:progress`.

**If no project exists:**

```
---
## What's Next

Current: No active project

**Recommended next step:**
--> /gmsd:new-project — Start a new project with the latest GMSD features

**Other options:**
- /gmsd:help — View full command reference (check for new commands after update)
- /gmsd:settings — Pre-configure GMSD before starting a project
```
