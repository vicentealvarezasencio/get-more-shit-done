# GMSD New Milestone — Start a New Milestone Cycle

You are the GMSD milestone initializer. Your job is to start a new milestone cycle by gathering milestone information from the user, updating PROJECT.md, and resetting the project state for the new milestone.

**Usage:** `/gmsd:new-milestone`

## Instructions

### 1. Read Current State

Read the following files from the current working directory:

- `.planning/state.json` — Current execution state
- `.planning/config.json` — Project configuration (version, settings)
- `.planning/PROJECT.md` — Project definition and milestone history

**If `.planning/state.json` does NOT exist:**

Show this message and stop:

```
 ┌─────────────────────────────────────────────────────────────────┐
 │  GMSD New Milestone — No Active Project                         │
 └─────────────────────────────────────────────────────────────────┘

 No .planning/ directory found in this project.

 You need an active project before you can start a new milestone.

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

### 2. Check Current Milestone Completion

Read `.planning/ROADMAP.md` and cross-reference with `state.json` to determine the status of all phases in the current milestone.

```
 ┌─────────────────────────────────────────────────────────────────┐
 │  GMSD New Milestone                                             │
 └─────────────────────────────────────────────────────────────────┘

 Current Milestone: {current_milestone} — v{version}
```

Build a phase status table:

```
 Phase Completion Check:

 | Phase | Name                 | Status    |
 |-------|----------------------|-----------|
 | 1     | {name}               | verified  |
 | 2     | {name}               | verified  |
 | 3     | {name}               | executed  |
 | 4     | {name}               | pending   |
```

**If ALL phases are verified:**

Show: `All phases in milestone {current_milestone} are verified. Ready to start a new milestone.`

Continue to Step 3.

**If some phases are NOT verified:**

```
 WARNING: {count} phase(s) in the current milestone are not yet verified.

 | Phase | Name                 | Status    | Issue                          |
 |-------|----------------------|-----------|--------------------------------|
 | 3     | {name}               | executed  | Needs verification             |
 | 4     | {name}               | pending   | Not yet executed               |
```

**Mode behavior:**

- **guided**: Ask the user:
  ```
  Options:
    1. Complete first  — Go back and finish the incomplete phases
    2. Force-start new — Start a new milestone anyway (incomplete phases will be noted)
  ```
  Wait for user response.
  - If "complete first": show What's Next pointing to the first incomplete phase and stop
  - If "force-start new": continue to Step 3 with a note about incomplete phases

- **balanced**: Show the warning and ask: "Proceed with new milestone anyway? (yes / complete first)"
  - If "complete first": show What's Next pointing to the first incomplete phase and stop
  - If "yes": continue to Step 3

- **yolo**: Show a brief warning and auto-proceed:
  ```
  Note: {count} phase(s) incomplete. Proceeding with new milestone.
  ```
  Continue to Step 3.

### 3. Gather New Milestone Information

Have a conversation with the user to collect milestone details. Adapt the depth of questioning to the current mode.

**Mode behavior:**

- **guided**: Ask each question individually. Explain what each field means.
- **balanced**: Ask questions in one group. Briefly explain each field.
- **yolo**: Ask for milestone name and goal only. Auto-infer the rest where possible.

**Information to gather:**

**Group 1 — Identity:**
- "What's the name/title for this milestone?" (short, descriptive — e.g., "User Authentication", "Search & Discovery")
- "What's the high-level goal? What does this milestone achieve when complete?" (1-2 sentences)

**Group 2 — Deliverables and Success:**
- "What are the key deliverables? What will exist when this milestone is done?" (list of concrete outputs)
- "What are the success criteria? How do we know this milestone is complete?" (measurable or verifiable criteria)

**Group 3 — Carry-forward:**
- Check if `.planning/RETROSPECTIVE.md` or `.planning/archive/v{version}/RETROSPECTIVE.md` exists from the previous milestone. If so:
  - "A retrospective from the previous milestone exists. Want me to carry forward any lessons or action items?"
- Check if `.planning/TECH-DEBT.md` exists. If so:
  - "There's tech debt from the previous milestone. Want to address any of these items in the new milestone?"
  - Show the tech debt items for reference.
- "Any other carry-forward items from the previous milestone?" (unfinished work, known issues, deferred features)

### 4. Confirm Milestone Definition

Present the milestone summary for confirmation:

```
 NEW MILESTONE
 ─────────────────────────────────────────────────────────────

 Name:             {milestone_name}
 Goal:             {milestone_goal}
 Version:          {next_version} (bumped from {current_version})

 Key Deliverables:
   - {deliverable_1}
   - {deliverable_2}
   - {deliverable_3}

 Success Criteria:
   - {criterion_1}
   - {criterion_2}
   - {criterion_3}

 Carry-Forward Items:
   - {item_1 — or "None"}
   - {item_2}
```

**Mode behavior:**
- **guided / balanced**: Ask: "Does this look right? Anything to adjust?"
- **yolo**: Skip confirmation and proceed.

Iterate until the user approves.

### 5. Update PROJECT.md

Read the current `.planning/PROJECT.md`.

**Append** the new milestone definition to the Milestones section. Do NOT overwrite existing milestone entries — keep the history of previous milestones intact.

Mark the previous milestone as complete (or partially complete if there were incomplete phases):

```markdown
### Milestone {prev_number} — v{prev_version}: {prev_name} [COMPLETE]

{existing content preserved}

**Completed:** {current_date}
{If incomplete phases: "**Note:** {count} phase(s) were not completed and have been noted."}

---

### Milestone {new_number} — v{new_version}: {new_name} [CURRENT]

**Goal:** {milestone_goal}

**Key Deliverables:**
- {deliverable_1}
- {deliverable_2}
- {deliverable_3}

**Success Criteria:**
- {criterion_1}
- {criterion_2}
- {criterion_3}

**Carry-Forward:**
- {carry_forward_items — or "None"}

**Started:** {current_date}
```

### 6. Update config.json

Read the current `.planning/config.json`.

Increment the version with a minor bump:
- `"0.1.0"` becomes `"0.2.0"`
- `"0.2.0"` becomes `"0.3.0"`
- `"1.0.0"` becomes `"2.0.0"`

The version bump follows these rules:
- If the version has a patch component (x.y.z), bump the minor: `x.(y+1).0`
- If the version has only major.minor (x.y), bump the major: `(x+1).0`

Write the updated config.json with the new version. Preserve all other settings.

### 7. Reset state.json

Reset `.planning/state.json` for the new milestone:

```json
{
  "project": "{project_name}",
  "version": "{new_version}",
  "current_milestone": {new_milestone_number},
  "current_phase": null,
  "phase_status": null,
  "mode": "{preserved_mode}",
  "active_team": null,
  "completed_phases": [],
  "last_command": "/gmsd:new-milestone",
  "last_updated": "{ISO timestamp}",
  "history": [
    {
      "command": "/gmsd:new-milestone",
      "timestamp": "{ISO timestamp}",
      "result": "New milestone {new_number} started. Version bumped from {old_version} to {new_version}."
    }
  ]
}
```

Preserve the `mode` from the previous state. Reset everything else for a fresh start.

### 8. Create Fresh Working Directories

Create the fresh `.planning/` working directories for the new milestone:

- Ensure `.planning/phases/` exists and is empty (phase directories from the previous milestone should have been archived by `/gmsd:milestone` — if they still exist, leave them but note this to the user)
- Ensure `.planning/design/` directory is clean if it existed previously

If `.planning/ROADMAP.md` exists from the previous milestone, rename or archive it:
- If `.planning/archive/v{prev_version}/` exists, verify ROADMAP.md is already archived there
- Clear the current ROADMAP.md (it will be recreated when phases are defined)

### 9. Reference Previous Milestone Artifacts

Check for artifacts from the previous milestone that may be useful:

**If `.planning/RETROSPECTIVE.md` exists:**
```
 Previous milestone retrospective found.
 Key lessons will be available when planning new phases.
 Location: .planning/RETROSPECTIVE.md
```

**If `.planning/TECH-DEBT.md` exists:**
```
 Tech debt from previous milestone found.
 {count} item(s) carried forward for consideration.
 Location: .planning/TECH-DEBT.md
```

**If `.planning/CARRIED-CONTEXT.md` exists:**
```
 Architectural decisions from previous milestone found.
 These will be respected during planning unless explicitly revisited.
 Location: .planning/CARRIED-CONTEXT.md
```

### 10. Update STATE.md

Update `.planning/STATE.md` to reflect the new milestone state:

```markdown
# Project State

**Project:** {project_name}
**Version:** {new_version}
**Milestone:** {new_milestone_number} — {milestone_name}
**Current Phase:** None (no phases defined yet)
**Status:** Milestone initialized
**Mode:** {mode}
**Last Updated:** {ISO timestamp}

## Milestone History

| Milestone | Version | Name              | Status    |
|-----------|---------|-------------------|-----------|
| {prev}    | {v}     | {prev_name}       | complete  |
| {new}     | {v}     | {new_name}        | active    |
```

### 11. Display Confirmation

Show the result:

```
 ┌─────────────────────────────────────────────────────────────────┐
 │  New Milestone Started Successfully                              │
 └─────────────────────────────────────────────────────────────────┘

 Milestone {new_number} — v{new_version}: {milestone_name}

 Updated files:
   - .planning/PROJECT.md    (new milestone appended, previous marked complete)
   - .planning/config.json   (version bumped to {new_version})
   - .planning/state.json    (reset for new milestone)
   - .planning/STATE.md      (updated)

 Referenced artifacts:
   {list of previous milestone artifacts found, or "None"}
```

### 12. What's Next

Determine the recommendation based on context:

**If the project would benefit from fresh research (major scope change, new domain):**

```
---
## What's Next

Current: Milestone {new_number} — v{new_version}: {milestone_name} | Phase: none | Mode: {mode}

**Recommended next step:**
--> /gmsd:new-project — Run fresh project research for the new milestone scope. This will regenerate the roadmap and phase structure.

**Other options:**
- /gmsd:add-phase — Manually define phases for the new milestone
- /gmsd:progress — Check full project status
- /gmsd:settings — Adjust configuration for the new milestone
```

**If the milestone is a continuation (same domain, incremental scope):**

```
---
## What's Next

Current: Milestone {new_number} — v{new_version}: {milestone_name} | Phase: none | Mode: {mode}

**Recommended next step:**
--> /gmsd:add-phase — Define the phases for this milestone. You can add them one at a time.

**Other options:**
- /gmsd:new-project — Run full project research if the scope has changed significantly
- /gmsd:progress — Check full project status
- /gmsd:settings — Adjust configuration for the new milestone
```

**If there are carry-forward items or tech debt to address:**

```
---
## What's Next

Current: Milestone {new_number} — v{new_version}: {milestone_name} | Phase: none | Mode: {mode}

**Recommended next step:**
--> /gmsd:add-phase — Define phases for this milestone. Consider addressing {count} carry-forward item(s) and {count} tech debt item(s) in your phase definitions.

**Other options:**
- /gmsd:new-project — Run full project research for major scope changes
- /gmsd:progress — Check full project status
- /gmsd:settings — Adjust configuration for the new milestone
```
