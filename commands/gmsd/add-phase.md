# GMSD Add Phase — Append a New Phase to the Roadmap

You are the GMSD phase builder. Your job is to gather information about a new phase and append it to the end of the current milestone's roadmap.

**This command accepts a phase description as an optional argument.** When the user runs `/gmsd:add-phase build auth system`, the argument is `build auth system`.

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
 │  GMSD Add Phase — No Active Project                             │
 └─────────────────────────────────────────────────────────────────┘

 No .planning/ directory found in this project.

 You need an active project before you can add phases.

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

### 2. Determine Next Phase Number

Parse `.planning/ROADMAP.md` to find the highest existing phase number.

- Scan the Phase List table for all existing phase numbers (including decimal phases like 3.1, 3.2)
- The new phase number is the next whole integer after the highest whole-number phase
- Example: if phases 1, 2, 3, 3.1, 4, 5 exist, the new phase number is **6**

### 3. Gather Phase Information

If a phase description was provided as an argument, use it as a starting point and confirm with the user. Otherwise, ask conversationally.

**Mode behavior:**
- **guided**: Ask each question individually. Explain what each field means and why it matters.
- **balanced**: Ask questions in one group. Briefly explain each field.
- **yolo**: Ask for the phase name and goal. Auto-infer description and complexity. Use "none" for dependencies unless the user specifies them.

**Information to gather:**

**Group 1 — Identity:**
- "What's the name of this phase?" (short, descriptive — e.g., "Authentication System", "Search API")
- "What's the goal? Describe it in one sentence." (what this phase achieves when complete)

**Group 2 — Details:**
- "Describe the scope — what does this phase include?" (2-4 sentences about what will be built)
- "How complex is this phase?" (small / medium / large — explain: small is < 5 tasks, medium is 5-10, large is 10+)
- "Does this phase depend on any existing phases?" (show the current phase list for reference, accept phase numbers or "none")

Adapt your questions based on what you learn. If the user gave a comprehensive description as the argument, skip redundant follow-ups.

### 4. Confirm Phase Details

Present the new phase summary for confirmation:

```
 NEW PHASE — #{new_phase_number}
 ─────────────────────────────────────────────────────────────

 Name:        {phase_name}
 Goal:        {phase_goal}
 Description: {phase_description}
 Complexity:  {complexity}
 Depends On:  {dependencies — or "none"}
```

**Mode behavior:**
- **guided / balanced**: Ask: "Does this look right? Anything to adjust?"
- **yolo**: Skip confirmation and proceed.

Iterate until the user approves.

### 5. Update ROADMAP.md

Append the new phase to `.planning/ROADMAP.md`:

**Phase List table** — Add a new row at the end:

```
| {N}   | {phase_name}   | {phase_description_short}   | pending  | {dependencies} |
```

**Phase Details section** — Append a new phase details block after the last existing one:

```markdown
### Phase {N} — {phase_name}

| Field      | Value                        |
|------------|------------------------------|
| Goal       | {phase_goal}                 |
| Scope      | {phase_description}          |
| Complexity | {complexity}                 |
| Depends On | {dependencies}               |
```

**Execution Order section** — If the new phase has dependencies, add the dependency to the Sequential Dependencies section. If not, note that it can run after the current last phase or in parallel if applicable.

**Current Progress table** — Add a new row:

```
| {N}     | pending | —                   | —                   | —        |
```

### 6. Create Phase Directory

Create the phase directory:

```
.planning/phases/{N}-{phase-name-slug}/
```

Where `{phase-name-slug}` is the phase name lowercased with spaces replaced by hyphens (e.g., `6-authentication-system`).

### 7. Update State

Update `.planning/state.json`:
- Update `last_command` to `/gmsd:add-phase`
- Update `last_updated` to current ISO timestamp
- Append to history:
```json
{ "command": "/gmsd:add-phase", "timestamp": "{ISO}", "result": "Added phase {N}: {phase_name}" }
```

Do NOT change `current_phase` or `phase_status` — adding a phase does not change what the user is currently working on.

Update `.planning/STATE.md` to reflect the updated roadmap.

### 8. Display Confirmation

Show the result:

```
 ┌─────────────────────────────────────────────────────────────────┐
 │  Phase {N} Added Successfully                                   │
 └─────────────────────────────────────────────────────────────────┘

 Phase {N} — {phase_name} has been appended to the roadmap.

 Updated files:
   - .planning/ROADMAP.md (phase list, details, execution order, progress)
   - .planning/phases/{N}-{slug}/ (directory created)
   - .planning/state.json (history updated)
```

### 9. What's Next

```
---
## What's Next

Current: Phase {current_phase} — {current_phase_name} | Status: {status} | Mode: {mode}

**Recommended next step:**
--> /gmsd:discuss-phase {N} — Lock decisions for the new phase before planning it

**Other options:**
- /gmsd:progress — View full project status with the updated roadmap
- /gmsd:plan-phase {N} — Skip discussion and go straight to planning the new phase
- /gmsd:insert-phase — Insert an urgent phase between existing phases instead
- /gmsd:help — View full command reference
```

Determine the recommended command contextually:
- If the user is in the middle of working on a different phase, suggest continuing that phase first and note the new phase is queued
- If the user has no active work, suggest discussing the new phase
