# GMSD: Pause Work

You are the GMSD session pauser. You create a complete handoff context so work can be resumed later — by you, by another Claude session, or by the user. This captures everything needed to pick up exactly where things left off.

**Usage:** `/gmsd:pause-work`

---

## Instructions

### Step 0: Load State

1. Read `.planning/state.json` for full current state.
2. Read `.planning/config.json` for project settings.
3. Read `.planning/ROADMAP.md` for phase context.
4. Store the current timestamp.

### Step 1: Assess Current State

Determine what is currently happening based on `state.json`:

**Identify the active work:**

- `current_phase`: Which phase is active
- `phase_status`: What stage the phase is in
- `active_team`: Whether a team is currently running

**Categorize the pause point:**

| Phase Status      | Pause Category            | What Needs Saving                      |
|-------------------|---------------------------|----------------------------------------|
| `null`            | Between phases            | Just state — minimal context needed    |
| `researching`     | Mid-research              | Research progress, topics covered       |
| `planning`        | Mid-planning              | Plan draft state, open questions        |
| `discussing`      | Mid-discussion            | Decisions made vs pending               |
| `designed`        | Between design and exec   | Design is complete, nothing in flight   |
| `executing`       | Mid-execution             | Task list progress, active team state   |
| `executed`        | Between exec and verify   | Execution is complete, nothing in flight|
| `fixing-gaps`     | Mid-gap-fixing            | Gap tasks, which are fixed              |
| `verified`        | Between phases            | Phase is done, minimal context needed   |
| `paused`          | Already paused            | Inform user — already paused            |

If `phase_status` is already `"paused"`, inform the user:
```
Work is already paused. A .continue-here.md exists from the previous pause.
To resume: `/gmsd:resume-work`
To re-pause with updated context: confirm and I'll overwrite the existing handoff.
```

### Step 2: Handle Active Team (if applicable)

If `active_team` is not null, a team is currently running. This is the most complex pause scenario.

**Save task list state:**

1. Call `TaskList` to get the current state of all tasks
2. Record for each task:
   - task_id
   - subject
   - status (pending, in_progress, completed, skipped)
   - owner (which executor has it)
   - blockedBy status
3. Count: total, completed, in_progress, pending

**Shut down the team gracefully:**

```
## Shutting Down Active Team: {active_team}

Sending shutdown requests to all teammates...
```

For each active teammate:
```
SendMessage(type="shutdown_request", recipient="{teammate_name}",
  content="Session is being paused. Please finish your current commit if possible, then shut down.")
```

Wait for `shutdown_response` from each teammate. If a teammate rejects (still mid-work):
- Note their current task and progress in the handoff
- Wait briefly for them to finish their commit
- Re-send shutdown request

After all teammates have confirmed shutdown:
```
TeamDelete("{active_team}")
```

Record the team state for the handoff:
```
Team shut down. {completed_count}/{total_count} tasks were completed before pause.
{in_progress_count} task(s) were in progress and will need to be resumed.
```

### Step 2b: WIP Git Commit

After team shutdown (or immediately if no team is active), create a WIP commit to capture all in-flight changes.

**If mode is `guided`:**

Show the user what will happen and ask for confirmation:

> **WIP Commit**
>
> There are uncommitted changes that should be preserved as a WIP commit:
>
> `git add -A && git commit -m "gmsd: WIP — pausing phase {current_phase} ({phase_name})"`
>
> **Proceed with WIP commit?** (yes / skip)

Wait for user response. If "skip", proceed without committing.

**If mode is `balanced` or `yolo`:**
Auto-commit without confirmation:
```bash
git add -A && git commit -m "gmsd: WIP — pausing phase {current_phase} ({phase_name})"
```

If there are no changes to commit (clean working tree), skip this step silently.

If the commit fails for any reason, note it in the handoff but continue — the handoff file itself is more important than the WIP commit.

### Step 3: Create Handoff Files

Write the full handoff content to `.planning/phases/{N}-{name}/.continue-here.md` (the GSD convention, primary location), and write a brief pointer file to `.planning/HANDOFF.md` for backward compatibility.

#### 3a: Write `.planning/phases/{N}-{name}/.continue-here.md`

This is the primary handoff file containing all context needed to resume.

```markdown
# GMSD Session Handoff

**Paused At:** {ISO timestamp}
**Paused By:** /gmsd:pause-work
**Project:** {project_name}
**Version:** {version}
**Mode:** {mode}

---

## Where We Left Off

**Milestone:** {current_milestone}
**Phase:** {current_phase} — {phase_name}
**Phase Status at Pause:** {phase_status}

### What Was Happening

{Describe what was in progress based on the phase status:}

{If executing:}
Phase {N} was being executed by a team of {team_size} executors.
- {completed_count} of {total_count} tasks were completed
- {in_progress_count} task(s) were in progress when paused (will need to be re-run)
- {pending_count} task(s) were still pending (blocked or unclaimed)

{If researching:}
Research was in progress for Phase {N}.
- Topics covered: {list}
- Topics remaining: {list}

{If planning:}
Planning was in progress for Phase {N}.
- Plan draft status: {complete/partial}
- Open questions: {list}

{If discussing:}
Discussion was in progress for Phase {N}.
- Decisions made: {count}
- Decisions pending: {count}

{If fixing-gaps:}
Gap fixing was in progress for Phase {N}.
- Gaps found: {count}
- Gaps fixed: {count}
- Gaps remaining: {count}

---

## Task List Snapshot (if applicable)

{If a team was active, include the full task list state:}

| #  | Task                           | Status      | Owner       | Notes           |
|----|--------------------------------|-------------|-------------|-----------------|
| 1  | {name}                         | completed   | executor-0  |                 |
| 2  | {name}                         | completed   | executor-1  |                 |
| 3  | {name}                         | in_progress | executor-0  | NEEDS RESUME    |
| 4  | {name}                         | pending     | --          | blocked by #3   |
| 5  | {name}                         | pending     | --          |                 |

**Note:** Tasks marked "in_progress" when paused may have partial work. The executor was shut down mid-task. On resume, these tasks should be reset to "pending" and re-claimed by a fresh executor who should check for and build upon any partial work.

---

## Active Decisions and Blockers

{List any unresolved decisions or blockers that were being worked on:}

- {decision/blocker 1}
- {decision/blocker 2}

{Or: "No active decisions or blockers."}

---

## What Needs to Happen Next

{Based on the phase status, describe the exact next steps:}

{If executing (most common):}
1. Re-create the execution team for Phase {N}
2. Create tasks for the {remaining_count} uncompleted tasks only
3. Have executors check for partial work from the interrupted tasks
4. Continue execution until all tasks are complete
5. Then verify: `/gmsd:verify-work {N}`

{If researching:}
1. Resume research for Phase {N}
2. Topics still needing coverage: {list}
3. After research: `/gmsd:plan-phase {N}`

{If other statuses:}
{Appropriate next steps}

---

## Exact Commands to Resume

```
/gmsd:resume-work
```

This will read this handoff document and route you to the right place.

**Alternative (manual):**
{Based on status, the direct command:}
- `/gmsd:execute-phase {N}` — to resume execution
- `/gmsd:plan-phase {N}` — to resume planning
- `/gmsd:verify-work {N}` — to run verification
- `/gmsd:debug {N}` — to resume debugging

---

## Recent History

{Last 5 entries from state.json history:}

| Timestamp | Command | Result |
|-----------|---------|--------|
| {ts}      | {cmd}   | {res}  |
...

---

## State Files Reference

- State: `.planning/state.json`
- Config: `.planning/config.json`
- Roadmap: `.planning/ROADMAP.md`
- Phase Plan: `.planning/phases/{N}-{name}/PLAN.md`
- Phase Context: `.planning/phases/{N}-{name}/CONTEXT.md`
- Verification: `.planning/phases/{N}-{name}/VERIFICATION.md` (if exists)
```

#### 3b: Write `.planning/HANDOFF.md` (pointer file)

Write a brief pointer file to `.planning/HANDOFF.md` for backward compatibility with `/gmsd:resume-work`:

```markdown
# Session Paused

See: .planning/phases/{N}-{name}/.continue-here.md
```

This pointer file allows `resume-work` to discover the phase-specific handoff even if it does not know which phase was active.

### Step 4: Update State

Update `.planning/state.json`:
```json
{
  "phase_status": "paused",
  "active_team": null,
  "last_command": "/gmsd:pause-work",
  "last_updated": "{ISO timestamp}"
}
```

Append to `history`:
```json
{
  "command": "/gmsd:pause-work",
  "timestamp": "{ISO timestamp}",
  "result": "Session paused. Phase {N} was {phase_status}. {team_context_if_applicable}. Handoff saved to .planning/phases/{N}-{name}/.continue-here.md."
}
```

Update `.planning/STATE.md` to show paused status.

### Step 5: Confirm to User

```
## Session Paused

**Phase {N}: {name}** has been paused at status: **{original_phase_status}**.

{If team was active:}
Team `{team_name}` has been shut down.
- {completed_count}/{total_count} tasks completed
- {remaining_count} tasks will resume on next session

Handoff saved to:
- **Primary:** `.planning/phases/{N}-{name}/.continue-here.md`
- **Pointer:** `.planning/HANDOFF.md`

**To resume:** `/gmsd:resume-work`

---
## What's Next

Current: Phase {N} — {name} | Status: paused | Mode: {mode}

**Recommended next step:**
--> `/gmsd:resume-work` — Pick up where you left off

**Other options:**
- `/gmsd:progress` — Check full project status
- `/gmsd:help` — View all available commands
```
