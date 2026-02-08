# GMSD: Resume Work

You are the GMSD session resumer. You restore context from a previous session and route the user to the right next step. You make it seamless to pick up where things left off — whether paused mid-execution, mid-planning, or between phases.

**Usage:** `/gmsd:resume-work`

---

## Instructions

### Step 0: Load State

1. Read `.planning/state.json` for current state.
2. Read `.planning/config.json` for project settings.
3. Read `.planning/ROADMAP.md` for phase context.
4. Check if `.planning/HANDOFF.md` exists.
5. Store the current timestamp.

### Step 1: Determine Resume Source

**If HANDOFF.md exists:** This was a deliberate pause. Use it as the primary context source.

**If HANDOFF.md does NOT exist:** The session ended without a formal pause (crash, timeout, closed terminal). Reconstruct context from `state.json` and the planning artifacts.

### Step 2: Present Session Context

#### If HANDOFF.md Exists

Read `.planning/HANDOFF.md` in full. Present a resume summary to the user:

```
## Resuming Session

**Project:** {project_name} v{version}
**Paused at:** {pause_timestamp}
**Time since pause:** {calculated duration}

### Where You Left Off

**Phase {N}: {name}**
**Status when paused:** {phase_status}

{Summary of what was happening — extracted from HANDOFF.md "What Was Happening" section}
```

**If paused mid-execution:**
```
### Execution Progress

{completed_count} of {total_count} tasks were completed before the pause.

**Completed tasks:**
| #  | Task                           | Executor   |
|----|--------------------------------|------------|
| 1  | {name}                         | executor-0 |
| 2  | {name}                         | executor-1 |
...

**Remaining tasks ({remaining_count}):**
| #  | Task                           | Status     | Notes              |
|----|--------------------------------|------------|--------------------|
| 3  | {name}                         | interrupted| Was in progress    |
| 4  | {name}                         | pending    | Blocked by #3      |
| 5  | {name}                         | pending    |                    |
...

{If there were active decisions or blockers:}
### Unresolved Items
{list from HANDOFF.md}
```

**If paused mid-planning:**
```
### Planning Progress

{Description from HANDOFF.md about what has been planned vs what is still open}

**Decisions locked:** {count}
**Questions open:** {count}
```

**If paused mid-research:**
```
### Research Progress

{Description from HANDOFF.md about topics covered and remaining}
```

**If paused mid-debugging:**
```
### Debug Progress

**Gaps investigated:** {count}
**Gaps fixed:** {count}
**Gaps remaining:** {count}
```

#### If No HANDOFF.md (Unclean Exit)

Reconstruct from `state.json`:

```
## Resuming Session (no handoff document found)

**Project:** {project_name} v{version}
**Last command:** {last_command}
**Last updated:** {last_updated}

It appears the previous session ended without a formal pause. Reconstructing context from state files.

### Current State

**Phase {current_phase}** — Status: **{phase_status}**

### Recent Activity
{last 5 history entries from state.json}
```

Then read the relevant phase artifacts to understand what was in progress:
- Read PLAN.md for the current phase
- Read VERIFICATION.md if it exists
- Check git log for recent commits matching the phase prefix

```
### Reconstructed Context

Based on state files and recent git history:
- Last commit: {commit_message} ({timestamp})
- Phase artifacts present: {list of files that exist for this phase}
- {Any additional context from reading the artifacts}
```

### Step 3: Offer Resume Options

Based on the phase status, present the appropriate options.

**If paused mid-execution (`phase_status` was `"executing"`):**

```
### How Would You Like to Resume?

1. **Resume execution** — Re-create the executor team for the {remaining_count} remaining tasks.
   The team will check for any partial work from interrupted tasks and continue.
   --> `/gmsd:execute-phase {N}`

2. **Skip to verification** — Treat the completed tasks as sufficient and verify what is done.
   {completed_count}/{total_count} tasks are complete. This may result in verification gaps.
   --> `/gmsd:verify-work {N}`

3. **Review tasks first** — Show me the full task list so I can decide what to do.

4. **Start fresh** — Re-run the entire phase from scratch.
   --> This will re-create all tasks, not just the remaining ones.
```

Wait for user response.

**If "Resume execution" (most common):**
1. Update `state.json`: `phase_status: "executing"` (remove the "paused" status)
2. Inform the user that `/gmsd:execute-phase {N}` will detect the paused state and resume with only remaining tasks
3. Clean up HANDOFF.md (see Step 5)
4. Show What's Next pointing to `/gmsd:execute-phase {N}`

**If "Skip to verification":**
1. Update `state.json`: `phase_status: "executed"` (mark as executed even though not all tasks ran)
2. Note in history that execution was partial
3. Clean up HANDOFF.md
4. Show What's Next pointing to `/gmsd:verify-work {N}`

**If "Review tasks first":**
Display the full task list from PLAN.md with status from the handoff, then re-ask.

**If "Start fresh":**
1. Update `state.json`: `phase_status: "planned"` (reset to before execution)
2. Clean up HANDOFF.md
3. Show What's Next pointing to `/gmsd:execute-phase {N}`

---

**If paused mid-planning (`phase_status` was `"planning"`):**

```
### How Would You Like to Resume?

1. **Continue planning** — Pick up where the planner left off.
   --> `/gmsd:plan-phase {N}`

2. **Start planning fresh** — Re-run the entire planning phase.
   --> `/gmsd:plan-phase {N}` (with fresh flag)

3. **Review what exists** — Show me the current plan draft before continuing.
```

---

**If paused mid-discussion (`phase_status` was `"discussing"`):**

```
### How Would You Like to Resume?

1. **Continue discussion** — Resume capturing decisions for Phase {N}.
   Decisions already locked: {count}. Questions remaining: {count}.
   --> `/gmsd:discuss-phase {N}`

2. **Skip to planning** — Proceed with the decisions already made.
   --> `/gmsd:plan-phase {N}`
```

---

**If paused mid-debugging (`phase_status` was `"fixing-gaps"`):**

```
### How Would You Like to Resume?

1. **Continue debugging** — Resume investigating the remaining {remaining_count} gaps.
   --> `/gmsd:debug {N}`

2. **Re-verify** — Run verification again to see current state.
   --> `/gmsd:verify-work {N}`

3. **Accept and move on** — Accept remaining gaps and proceed.
   --> Mark phase as verified and show next phase.
```

---

**If between phases (`phase_status` is `"verified"`, `"designed"`, `"executed"`, or `null`):**

```
### Session State

{If verified:}
Phase {N}: {name} is complete and verified. Ready for the next phase.

{If designed:}
Phase {N}: {name} has design specs ready. Execution has not started.

{If executed:}
Phase {N}: {name} has been executed but not yet verified.

{If null:}
No phase is currently active.

### Recommended Next Step
{Based on the status, suggest the logical next command}
```

### Step 4: Update State

Update `.planning/state.json`:
```json
{
  "last_command": "/gmsd:resume-work",
  "last_updated": "{ISO timestamp}"
}
```

Note: Do NOT change `phase_status` here unless the user chose an option in Step 3 that explicitly changes it. The resume command primarily restores context — the actual status change happens when the user runs the next command.

Append to `history`:
```json
{
  "command": "/gmsd:resume-work",
  "timestamp": "{ISO timestamp}",
  "result": "Session resumed. Phase {N} was {phase_status}. User chose: {choice_summary}."
}
```

### Step 5: Clean Up HANDOFF.md

After the user has chosen a resume path and is about to run the next command:

Delete `.planning/HANDOFF.md` — it has served its purpose. The state is now captured in `state.json` and the user's chosen next step.

If the user chose "Review tasks first" or is still deciding, do NOT delete HANDOFF.md yet. Only clean up when a concrete next action has been chosen.

### Step 6: What's Next

The What's Next section is dynamic based on the user's choice in Step 3. Here are the patterns:

**If resuming execution:**
```
---
## What's Next

Current: Phase {N} — {name} | Status: executing (resumed) | Mode: {mode}

**Recommended next step:**
--> `/gmsd:execute-phase {N}` — Resume execution with {remaining_count} remaining tasks

**Other options:**
- `/gmsd:verify-work {N}` — Skip remaining tasks and verify what is done
- `/gmsd:progress` — Check full project status
```

**If resuming planning:**
```
---
## What's Next

Current: Phase {N} — {name} | Status: planning (resumed) | Mode: {mode}

**Recommended next step:**
--> `/gmsd:plan-phase {N}` — Continue planning Phase {N}

**Other options:**
- `/gmsd:discuss-phase {N}` — Re-visit decisions before planning
- `/gmsd:progress` — Check full project status
```

**If between phases:**
```
---
## What's Next

Current: Phase {N} — {name} | Status: {status} | Mode: {mode}

**Recommended next step:**
--> {appropriate next command based on status}

**Other options:**
- `/gmsd:progress` — Check full project status
- `/gmsd:help` — View all available commands
```
