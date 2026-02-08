# GMSD Sync — Manually Regenerate .claude/CLAUDE.md

You are the GMSD sync executor. Your job is to regenerate the project's `.claude/CLAUDE.md` file so that Claude Code has full project context even without running GMSD commands.

## Instructions

### 1. Read Project State

Attempt to read `.planning/state.json` from the current working directory.

**If `.planning/state.json` does NOT exist:**

Show this message and stop:

```
 ┌─────────────────────────────────────────────────────────────────┐
 │  GMSD Sync — No Active Project                                  │
 └─────────────────────────────────────────────────────────────────┘

 No .planning/ directory found in this project.

 The sync command generates .claude/CLAUDE.md from your project's
 .planning/ artifacts. There is nothing to sync yet.

 To get started, run:

   /gmsd:new-project

---
## What's Next

Current: No active project

**Recommended next step:**
--> /gmsd:new-project — Initialize your project first

**Other options:**
- /gmsd:help — View the full command reference
```

Then stop. Do not continue.

### 2. Run the Sync Engine

Execute the CLAUDE.md sync workflow from `workflows/claude-md-sync.md`:

1. Read all project artifacts (.planning/state.json, config.json, PROJECT.md, ROADMAP.md, current phase CONTEXT.md, PLAN.md, design tokens, todos, tech debt, carried context)
2. Generate a concise, actionable CLAUDE.md summary following the template in workflows/claude-md-sync.md
3. Write to `.claude/CLAUDE.md` (create `.claude/` directory if needed)

### 3. Display Sync Report

Show the user what was synced:

```
 ┌─────────────────────────────────────────────────────────────────┐
 │  GMSD Sync — CLAUDE.md Regenerated                              │
 └─────────────────────────────────────────────────────────────────┘

 Sections included:
   [x] Project Overview
   [{x or space}] Current State
   [{x or space}] Active Decisions
   [{x or space}] File Ownership
   [{x or space}] Design System
   [{x or space}] Phase Roadmap
   [{x or space}] Open Todos
   [{x or space}] Technical Debt
   [{x or space}] Carried Context
   [{x or space}] Key Constraints
   [x] Git Convention
   [x] GMSD Commands

 Source files read:
   [x] .planning/state.json
   [{x or space}] .planning/config.json
   [{x or space}] .planning/PROJECT.md
   [{x or space}] .planning/ROADMAP.md
   [{x or space}] .planning/phases/{current}/CONTEXT.md
   [{x or space}] .planning/phases/{current}/PLAN.md
   [{x or space}] .planning/design/design-tokens.json
   [{x or space}] .planning/design/COMPONENTS.md
   [{x or space}] .planning/todos.json
   [{x or space}] .planning/TECH-DEBT.md
   [{x or space}] .planning/CARRIED-CONTEXT.md

 Output: .claude/CLAUDE.md ({line_count} lines)
```

### 4. Update State

If `.planning/state.json` exists, append to the history array:
```json
{ "command": "/gmsd:sync", "timestamp": "{ISO timestamp}", "result": "CLAUDE.md synced. {sections_included} sections written." }
```

Update `last_command` to `/gmsd:sync` and `last_updated` to the current ISO timestamp.

### 5. What's Next

Read `state.json` for context and determine the recommended next command using the same routing logic as `/gmsd:progress`.

```
---
## What's Next

Current: Phase {N} — {name} | Status: {status} | Mode: {mode}

**Recommended next step:**
--> /gmsd:{next-command} — {why this is the right next step}

**Other options:**
- /gmsd:progress — Check full project status
- /gmsd:sync — Re-sync CLAUDE.md (after making manual changes to .planning/ files)
- /gmsd:settings — Adjust configuration
```
