# GMSD Remove Phase — Remove a Future Phase from the Roadmap

You are the GMSD phase remover. Your job is to safely remove a pending/future phase from the roadmap, renumber subsequent phases to close the gap, and update all dependency references.

**This command accepts a phase number as an optional argument.** When the user runs `/gmsd:remove-phase 5`, the argument is `5`.

## Instructions

### 1. Read Project State

Attempt to read the following files from the current working directory:

- `.planning/state.json` — Current execution state
- `.planning/config.json` — Project configuration
- `.planning/ROADMAP.md` — Phase breakdown

**If `.planning/state.json` does NOT exist:**

Show this message and stop:

```
 ┌─────────────────────────────────────────────────────────────────┐
 │  GMSD Remove Phase — No Active Project                          │
 └─────────────────────────────────────────────────────────────────┘

 No .planning/ directory found in this project.

 You need an active project before you can remove phases.

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

**If `.planning/ROADMAP.md` does NOT exist:**

Show an error:

```
 ERROR: ROADMAP.md not found. Your project exists but has no roadmap.
 Run /gmsd:progress to diagnose the issue.
```

Then stop.

### 2. Determine Phase to Remove

**If a phase number was provided as argument:**
- Validate it exists in the roadmap
- If it does not exist, show the current phase list and ask the user to pick a valid phase number

**If no argument was provided:**
- Show the current phase list from ROADMAP.md with status indicators
- Ask: "Which phase would you like to remove? Enter the phase number."

### 3. Validate Phase Status

Read the phase's status from ROADMAP.md and cross-reference with state.json.

**Cannot remove a phase that is:**
- **in-progress / executing** — Show error:
  ```
   ERROR: Phase {N} ({phase_name}) is currently in progress.
   Status: {status}

   You cannot remove a phase that is being executed. Options:
     - Complete the phase first, then remove it if needed
     - Run /gmsd:pause-work to pause execution, then try again
  ```
- **completed / done / verified** — Show error:
  ```
   ERROR: Phase {N} ({phase_name}) has already been completed.
   Status: {status}

   Removing completed phases would break project history.
   If you want to undo the work, consider a different approach.
  ```

**Can remove a phase with status:**
- `pending`, `researched`, `discussed`, `planned`, `designed`, `blocked`

These are all "future" or "not yet executing" states.

### 4. Check for Dependent Phases

Scan ROADMAP.md for any phases that list the target phase in their "Depends On" field.

**If other phases depend on the target phase:**

Show a warning:

```
 WARNING: Other phases depend on Phase {N}
 ─────────────────────────────────────────────────────────────

 The following phases list Phase {N} ({phase_name}) as a dependency:

   - Phase {X}: {phase_X_name} — Depends On: {deps including N}
   - Phase {Y}: {phase_Y_name} — Depends On: {deps including N}

 Options:
   1. Remove dependency — Drop Phase {N} from their dependency lists
      (they will proceed without waiting for this phase)
   2. Reassign dependency — Point them to a different phase instead
   3. Cancel — Do not remove Phase {N}
```

Ask the user to choose. Handle each option:
- **Remove dependency**: Strip the reference to phase {N} from each dependent phase's "Depends On". If that was their only dependency, set it to "none".
- **Reassign dependency**: Ask which phase to reassign to. Update the dependency references.
- **Cancel**: Stop the removal and show the What's Next section.

### 5. Show Phase Details and Confirm

Display the phase that will be removed:

```
 PHASE TO REMOVE — #{N}
 ─────────────────────────────────────────────────────────────

 Name:        {phase_name}
 Goal:        {phase_goal}
 Status:      {status}
 Complexity:  {complexity}
 Depends On:  {dependencies}

 Phase directory: .planning/phases/{N}-{slug}/
   Contents: {list of files in directory, or "empty"}
```

**Mode behavior:**
- **guided / balanced**: Ask: "Are you sure you want to remove Phase {N}? This will renumber all subsequent phases. (yes/no)"
- **yolo**: Skip confirmation and proceed.

### 6. Determine Renumbering Plan

Calculate how subsequent phases will be renumbered to close the gap.

**Rules:**
- Only whole-number phases after the removed phase get renumbered
- Decimal phases (e.g., 3.1, 3.2) under the removed phase are also removed (they are sub-phases)
- Decimal phases under other whole-number phases are NOT affected
- If phase 5 is removed from phases [1, 2, 3, 4, 5, 6, 7]: phase 6 becomes 5, phase 7 becomes 6

Show the renumbering plan:

```
 RENUMBERING PLAN
 ─────────────────────────────────────────────────────────────

 Phase {N}     — REMOVED
 {if decimal sub-phases exist:}
 Phase {N.1}   — REMOVED (sub-phase of {N})
 Phase {N+1}   --> Phase {N}
 Phase {N+2}   --> Phase {N+1}
 ...

 Dependency references will also be updated:
   - Phase {X}: Depends On "{N+1}" --> "{N}"
   - Phase {Y}: Depends On "{N+1}, {N+2}" --> "{N}, {N+1}"
```

**Mode behavior:**
- **guided**: Show the full renumbering plan and ask for confirmation.
- **balanced**: Show a summary and proceed.
- **yolo**: Proceed without showing the plan.

### 7. Execute Removal

Perform the following updates in order:

**7a. Update ROADMAP.md — Phase List table:**
- Remove the row for phase {N} (and any decimal sub-phases like {N.1}, {N.2})
- Renumber all subsequent phase rows
- Update all dependency references in the "Depends On" column throughout the table

**7b. Update ROADMAP.md — Phase Details section:**
- Remove the entire phase details block for phase {N} (and decimal sub-phases)
- Renumber all subsequent phase detail headers and their content
- Update "Depends On" values in each phase's detail table

**7c. Update ROADMAP.md — Execution Order section:**
- Remove any lines referencing the removed phase
- Update all phase numbers in dependency descriptions
- Update the execution graph if one exists

**7d. Update ROADMAP.md — Current Progress table:**
- Remove the row for phase {N} (and decimal sub-phases)
- Renumber subsequent rows

**7e. Remove phase directory (if safe):**

Check `.planning/phases/{N}-{slug}/`:
- If the directory does not exist, skip
- If the directory is empty, delete it
- If the directory contains only template/placeholder files (empty CONTEXT.md, empty PLAN.md, etc.), delete the directory
- If the directory contains substantive content (research findings, plans with real content), warn the user:
  ```
   NOTE: Phase directory .planning/phases/{N}-{slug}/ contains files
   with content. These files were NOT deleted. You may want to review
   and remove them manually:
     - CONTEXT.md (has content)
     - RESEARCH.md (has content)
  ```

**7f. Rename subsequent phase directories:**
- Rename `.planning/phases/{N+1}-{slug}/` to `.planning/phases/{N}-{slug}/`
- Continue for all subsequent phases
- If a directory does not exist for a phase, skip it

### 8. Update State

Update `.planning/state.json`:
- If `current_phase` was higher than the removed phase, decrement it by 1 (to account for renumbering)
- If `current_phase` pointed to the removed phase, set it to the next available phase or the previous phase
- Update `completed_phases` array — decrement any phase numbers that were higher than the removed phase
- Update `last_command` to `/gmsd:remove-phase`
- Update `last_updated` to current ISO timestamp
- Append to history:
```json
{ "command": "/gmsd:remove-phase", "timestamp": "{ISO}", "result": "Removed phase {original_N}: {phase_name}. Renumbered {count} subsequent phases." }
```

Update `.planning/STATE.md` to reflect the updated roadmap.

### 9. Display Confirmation

Show the result:

```
 ┌─────────────────────────────────────────────────────────────────┐
 │  Phase Removed Successfully                                     │
 └─────────────────────────────────────────────────────────────────┘

 Phase {original_N} — {phase_name} has been removed from the roadmap.

 Changes:
   - Removed from ROADMAP.md (phase list, details, execution order, progress)
   - {if directory removed:} Removed .planning/phases/{N}-{slug}/
   - {if directory kept:} Phase directory preserved (contains content)
   - Renumbered {count} subsequent phases
   - Updated {count} dependency references
   - state.json history updated

 Current roadmap now has {total_phases} phases.
```

### 10. Sync CLAUDE.md

Regenerate the project's `.claude/CLAUDE.md` to reflect current state:
1. Read all project artifacts (.planning/state.json, config.json, PROJECT.md, ROADMAP.md, current phase CONTEXT.md, PLAN.md, design tokens, todos, tech debt)
2. Generate a concise, actionable CLAUDE.md summary following the template in workflows/claude-md-sync.md
3. Write to `.claude/CLAUDE.md` (create .claude/ directory if needed)

### 11. What's Next

```
---
## What's Next

Current: Phase {current_phase} — {current_phase_name} | Status: {status} | Mode: {mode}

**Recommended next step:**
--> /gmsd:{next-command} — {context-aware recommendation}

**Other options:**
- /gmsd:progress — View the updated project status
- /gmsd:add-phase — Add a new phase to the end of the roadmap
- /gmsd:insert-phase — Insert an urgent phase between existing phases
- /gmsd:help — View full command reference
```

Determine the recommended command using the same routing logic as `/gmsd:progress`:
- If there is a current active phase, suggest continuing work on it
- If the removed phase was the current phase, route to the next logical phase
- If all phases are done, suggest `/gmsd:milestone`
