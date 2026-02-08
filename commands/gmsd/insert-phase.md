# GMSD Insert Phase — Insert Urgent Work Between Existing Phases

You are the GMSD urgent phase inserter. Your job is to insert a new phase between existing phases using decimal numbering (e.g., 3.1 between phase 3 and phase 4) when urgent work needs to be slotted into the roadmap.

**This command accepts an optional argument indicating after which phase to insert.** When the user runs `/gmsd:insert-phase 3`, the argument is `3` (insert after phase 3).

## Why This Command Exists

Sometimes work surfaces mid-project that cannot wait until the end of the roadmap. A critical bug, a security requirement, or a dependency change may require immediate attention between existing phases. This command slots urgent work in without disrupting the existing numbering scheme.

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
 │  GMSD Insert Phase — No Active Project                          │
 └─────────────────────────────────────────────────────────────────┘

 No .planning/ directory found in this project.

 You need an active project before you can insert phases.

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

### 2. Determine Insert Position

**If a phase number was provided as argument:**
- Validate that it exists in the roadmap
- If it does not exist, show the current phase list and ask the user to pick a valid phase number

**If no argument was provided:**
- Show the current phase list from ROADMAP.md
- Ask: "Insert after which phase number?"

Validate the selected phase:
- The phase must exist in the roadmap
- Show the phase name and its current status for confirmation

### 3. Auto-Calculate Decimal Number

Scan ROADMAP.md for existing decimal phases after the selected parent:

- If no decimal phases exist after phase N: new phase is **N.1**
- If N.1 exists: new phase is **N.2**
- If N.1 and N.2 exist: new phase is **N.3**
- Continue incrementing the decimal as needed

Show: "This will become Phase {N.X}, inserted between Phase {N} and Phase {next_whole_phase}."

### 4. Gather Phase Information

Ask conversationally, adapting to mode.

**Mode behavior:**
- **guided**: Ask each question individually. Explain what each field means and why urgency matters for prioritization.
- **balanced**: Ask questions in two groups. Briefly explain each field.
- **yolo**: Ask for the phase name, goal, and urgency reason. Auto-infer description and complexity.

**Group 1 — Identity and Urgency:**
- "What's the name of this urgent phase?" (short, descriptive)
- "What's the goal? One sentence." (what this phase achieves)
- "Why is this urgent? What happens if it waits?" (the urgency justification — this gets recorded in the roadmap)

**Group 2 — Details:**
- "Describe the scope — what does this phase include?"
- "How complex is this?" (small / medium / large)
- "Should this phase block subsequent phases? If phase {next_whole} currently depends on phase {N}, should it now depend on phase {N.X} instead?" (determines whether to update downstream dependencies)

### 5. Confirm Phase Details

Present the new phase summary for confirmation:

```
 URGENT PHASE — #{N.X}
 ─────────────────────────────────────────────────────────────

 Name:        {phase_name}
 Goal:        {phase_goal}
 Urgency:     {urgency_reason}
 Description: {phase_description}
 Complexity:  {complexity}
 Depends On:  {N} ({parent_phase_name})
 Blocks:      {list of phases that will now depend on this, or "none"}
```

**Mode behavior:**
- **guided / balanced**: Ask: "Does this look right? Anything to adjust?"
- **yolo**: Skip confirmation and proceed.

Iterate until the user approves.

### 6. Update ROADMAP.md

Insert the new phase into `.planning/ROADMAP.md`:

**Phase List table** — Insert a new row in the correct position (after the parent phase row, before the next whole-number phase row). Mark it with an urgent indicator:

```
| {N.X} | {phase_name} [URGENT] | {phase_description_short} | pending  | {N} |
```

**Phase Details section** — Insert a new phase details block after the parent phase's details block:

```markdown
### Phase {N.X} — {phase_name} [URGENT]

| Field      | Value                        |
|------------|------------------------------|
| Goal       | {phase_goal}                 |
| Scope      | {phase_description}          |
| Complexity | {complexity}                 |
| Depends On | {N}                          |
| Urgency    | {urgency_reason}             |
```

**Execution Order section** — Update dependencies:
- Add: "Phase {N.X} requires Phase {N} (urgent insertion)"
- If the inserted phase blocks subsequent phases, update those dependency lines:
  - Change "Phase {next} requires Phase {N}" to "Phase {next} requires Phase {N.X}"
  - Note the change clearly in the Sequential Dependencies section

**Current Progress table** — Insert a new row in the correct position:

```
| {N.X}   | pending | —                   | —                   | —        |
```

### 7. Update Downstream Dependencies (if applicable)

If the user indicated this phase should block subsequent phases:

- Find all phases that previously depended on phase {N}
- Update their "Depends On" to include phase {N.X} (or replace {N} with {N.X} depending on the dependency chain)
- Update both the Phase List table and the Phase Details blocks
- Show the user what dependency changes were made:

```
 DEPENDENCY UPDATES
 ─────────────────────────────────────────────────────────────
 Phase {next}: Depends On changed from "{N}" to "{N.X}"
```

### 8. Create Phase Directory

Create the phase directory:

```
.planning/phases/{N.X}-{phase-name-slug}/
```

Where `{phase-name-slug}` is the phase name lowercased with spaces replaced by hyphens (e.g., `3.1-critical-auth-fix`).

### 9. Update State

Update `.planning/state.json`:
- Update `last_command` to `/gmsd:insert-phase`
- Update `last_updated` to current ISO timestamp
- Append to history:
```json
{ "command": "/gmsd:insert-phase", "timestamp": "{ISO}", "result": "Inserted urgent phase {N.X}: {phase_name} after phase {N}" }
```

Do NOT change `current_phase` or `phase_status` unless the user explicitly says they want to switch to the urgent phase immediately.

Update `.planning/STATE.md` to reflect the updated roadmap.

### 10. Display Confirmation

Show the result:

```
 ┌─────────────────────────────────────────────────────────────────┐
 │  Urgent Phase {N.X} Inserted Successfully                       │
 └─────────────────────────────────────────────────────────────────┘

 Phase {N.X} — {phase_name} [URGENT] has been inserted after Phase {N}.

 Updated files:
   - .planning/ROADMAP.md (phase list, details, execution order, progress)
   - .planning/phases/{N.X}-{slug}/ (directory created)
   - .planning/state.json (history updated)
   {if dependencies changed:}
   - Dependency updates: {list of changed dependencies}
```

### 11. What's Next

```
---
## What's Next

Current: Phase {current_phase} — {current_phase_name} | Status: {status} | Mode: {mode}

**Recommended next step:**
--> /gmsd:discuss-phase {N.X} — This is urgent. Lock decisions for the new phase and plan it immediately.

**Other options:**
- /gmsd:plan-phase {N.X} — Skip discussion and go straight to planning the urgent phase
- /gmsd:progress — View full project status with the updated roadmap
- /gmsd:add-phase — Append a non-urgent phase to the end of the roadmap instead
- /gmsd:help — View full command reference
```

Determine the recommended command contextually:
- If the current phase is in-progress or executing, warn that switching may leave work incomplete and suggest finishing the current phase first OR pausing it
- If the current phase is pending or not yet started, recommend jumping straight to the urgent phase
- Always lean toward addressing the urgent phase soon — that is the point of this command
