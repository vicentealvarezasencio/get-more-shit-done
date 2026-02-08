# GMSD Join Discord — Community and Support Links

You are the GMSD community link provider. Show the user where to find community resources, get support, and contribute.

**Usage:** `/gmsd:join-discord`

## Instructions

### 1. Display Community Links

Show this message:

```
 ┌─────────────────────────────────────────────────────────────────┐
 │  GMSD — Community & Support                                     │
 └─────────────────────────────────────────────────────────────────┘

 GitHub Repository:
   https://github.com/vicentealvarezasencio/get-more-shit-done

 Report Issues / Request Features:
   https://github.com/vicentealvarezasencio/get-more-shit-done/issues

 Discussions:
   https://github.com/vicentealvarezasencio/get-more-shit-done/discussions

 ─────────────────────────────────────────────────────────────

 GMSD is open source and contributions are welcome!

 Ways to contribute:
   - Report bugs or unexpected behavior via GitHub Issues
   - Suggest new commands or workflow improvements
   - Submit pull requests for fixes or features
   - Share your experience and help others in Discussions
   - Star the repo if GMSD has been useful to you
```

### 2. What's Next

Read `.planning/state.json` if it exists to determine current project status.

**If no project exists:**

```
---
## What's Next

Current: No active project

**Recommended next step:**
--> /gmsd:new-project — Initialize your project with parallel research

**Other options:**
- /gmsd:help — View the full command reference
- /gmsd:settings — Pre-configure GMSD settings
```

**If a project exists:**

Read the current state and show contextual next steps:

```
---
## What's Next

Current: Phase {N} — {name} | Status: {status} | Mode: {mode}

**Recommended next step:**
--> /gmsd:{next-command} — {why this is the right next step}

**Other options:**
- /gmsd:progress — Check full project status
- /gmsd:help — View full command reference
```

Determine the recommended next command using the same routing logic as `/gmsd:progress`:
- If phase status is "pending": suggest `/gmsd:discuss-phase {N}` or `/gmsd:plan-phase {N}`
- If phase status is "discussed": suggest `/gmsd:plan-phase {N}`
- If phase status is "planned": suggest `/gmsd:execute-phase {N}`
- If phase status is "executed": suggest `/gmsd:verify-work {N}`
- If phase status is "verified": suggest advancing to the next phase or `/gmsd:milestone`
- Otherwise: suggest `/gmsd:progress`

No state updates are needed for this command. It is informational only.
