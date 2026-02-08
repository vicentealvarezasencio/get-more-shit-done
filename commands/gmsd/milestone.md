# GMSD: Milestone

You are the GMSD milestone orchestrator. You archive a completed milestone's artifacts, generate a completion report, and prepare the project for the next version.

**Usage:** `/gmsd:milestone`

---

## Instructions

### Step 0: Load State

1. Read `.planning/state.json` for current state.
2. Read `.planning/config.json` for version, project name, and settings.
3. Read `.planning/ROADMAP.md` for the full phase list and milestone info.
4. Read `.planning/PROJECT.md` for the milestone definitions and version plan.
5. Store the current timestamp.

### Step 1: Validate Completion

Check that all phases in the current milestone are verified.

Read the ROADMAP.md phase list and cross-reference with `state.json.completed_phases`:

```
## Milestone {current_milestone} Completion Check

| Phase | Name                 | Status    | Verified At          |
|-------|----------------------|-----------|----------------------|
| 1     | {name}               | verified  | {timestamp}          |
| 2     | {name}               | verified  | {timestamp}          |
| 3     | {name}               | executed  | --                   |
| 4     | {name}               | pending   | --                   |
...
```

**If ALL phases are verified:** Proceed to Step 2.

**If some phases are NOT verified:**

```
### Incomplete Phases Detected

{count} phase(s) are not yet verified:

| Phase | Name                 | Status    | Issue                          |
|-------|----------------------|-----------|--------------------------------|
| 3     | {name}               | executed  | Needs verification             |
| 4     | {name}               | pending   | Not yet executed               |

**Options:**
1. **Proceed anyway** — archive what is done, mark incomplete phases as carried over
2. **Complete first** — go back and finish the incomplete phases
3. **Drop phases** — remove the incomplete phases from this milestone (they can be added to the next)
```

Wait for user response. Route accordingly:
- If "proceed anyway": continue with a note about incomplete phases
- If "complete first": show What's Next pointing to the first incomplete phase
- If "drop phases": remove them from the milestone scope and continue

### Step 2: Create Archive

Create the archive directory structure:

```
.planning/archive/v{version}/
```

Copy or reference the following artifacts into the archive:

1. **Project context:**
   - `.planning/PROJECT.md` (snapshot at milestone completion)
   - `.planning/ROADMAP.md` (with final status for all phases)
   - `.planning/config.json` (configuration used for this milestone)

2. **Per-phase artifacts:** For each completed phase `{N}-{name}`:
   - `.planning/phases/{N}-{name}/PLAN.md`
   - `.planning/phases/{N}-{name}/CONTEXT.md`
   - `.planning/phases/{N}-{name}/RESEARCH.md`
   - `.planning/phases/{N}-{name}/VERIFICATION.md`

3. **Design artifacts** (if they exist):
   - `.planning/design/UI-CONTEXT.md`
   - `.planning/design/design-tokens.json`
   - `.planning/design/screens/` (all screen specs)
   - `.planning/design/COMPONENTS.md`

For each file, create a copy in the archive directory preserving the relative structure:
```
.planning/archive/v{version}/
  PROJECT.md
  ROADMAP.md
  config.json
  phases/
    1-{name}/
      PLAN.md
      CONTEXT.md
      RESEARCH.md
      VERIFICATION.md
    2-{name}/
      ...
  design/
    UI-CONTEXT.md
    design-tokens.json
    screens/
      SCR-01.md
      ...
    COMPONENTS.md
```

### Step 3: Generate Milestone Summary

Create `.planning/archive/v{version}/MILESTONE-SUMMARY.md`:

```markdown
# Milestone Summary — v{version}

**Project:** {project_name}
**Milestone:** {milestone_number} — {milestone_name}
**Version:** {version}
**Completed:** {current_date}

---

## What Was Built

{Summarize the milestone goal from PROJECT.md and describe what was accomplished.}

### Phases Completed

| Phase | Name                 | Tasks | Commits | Deviations | Duration |
|-------|----------------------|-------|---------|------------|----------|
| 1     | {name}               | {t}   | {c}     | {d}        | {dur}    |
| 2     | {name}               | {t}   | {c}     | {d}        | {dur}    |
...

### Key Metrics

| Metric                     | Value          |
|----------------------------|----------------|
| Total Phases               | {count}        |
| Total Tasks Executed       | {count}        |
| Total Commits              | {count}        |
| Total Deviations           | {count}        |
| Total Verification Gaps    | {count}        |
| Gaps Fixed                 | {count}        |
| Gaps Accepted              | {count}        |

---

## Key Decisions Made

{Extract the most significant decisions from all CONTEXT.md files across phases:}

1. **{decision}** — Phase {N}, Decision #{X}. Rationale: {brief}
2. **{decision}** — Phase {N}, Decision #{X}. Rationale: {brief}
...

---

## Design System (if applicable)

{If design artifacts exist:}
- Token system: {brief description}
- Screens specified: {count}
- Components created: {count}
- Design system files: `.planning/archive/v{version}/design/`

---

## Risks and Issues

### Risks That Materialized
{List any risks from PLAN.md risk assessments that actually became issues:}
- {risk}: {what happened and how it was handled}

### Gaps Accepted (Not Fixed)
{List any verification gaps that were accepted rather than fixed:}
- {gap}: {severity} — {reason for acceptance}

### Lessons Learned
{Synthesize insights for future milestones:}
1. {lesson}
2. {lesson}
3. {lesson}

---

## Files Modified

{Aggregate list of all files created or modified across all phases, grouped by directory.}

---

## Archive Contents

```
.planning/archive/v{version}/
  MILESTONE-SUMMARY.md (this file)
  PROJECT.md
  ROADMAP.md
  config.json
  phases/
    {list of phase directories with their contents}
  design/ (if applicable)
    {list of design files}
```
```

### Step 4: Present Milestone Report

Display the milestone summary to the user:

```
## Milestone Complete — v{version}: {milestone_name}

### What Was Built
{brief summary — 2-3 sentences}

### Metrics
| Metric          | Value   |
|-----------------|---------|
| Phases          | {count} |
| Tasks           | {count} |
| Commits         | {count} |
| Deviations      | {count} |
| Gaps Found      | {count} |
| Gaps Fixed      | {count} |

### Key Decisions
{top 3-5 decisions that shaped the milestone}

### Archive Location
`.planning/archive/v{version}/`

Full summary: `.planning/archive/v{version}/MILESTONE-SUMMARY.md`
```

### Step 5: Prepare Next Version

**Ask the user about the next milestone:**

```
## Next Milestone

The current milestone (v{version}: {milestone_name}) is complete.

Looking at PROJECT.md, the next planned milestone is:
**Milestone {next_number} — v{next_version}: {next_milestone_name}**

Planned scope:
{scope from PROJECT.md}

**Options:**
1. **Start next milestone** — set up v{next_version} and begin planning
2. **Adjust scope** — modify the next milestone's scope before starting
3. **Add new milestone** — the planned milestones need updating
4. **Done for now** — archive is complete, no more work needed
```

Wait for user response.

**If "Start next milestone":**

1. Increment version in `.planning/config.json`:
```json
{
  "version": "{next_version}"
}
```

2. Update `.planning/PROJECT.md` — mark the completed milestone as done and update current milestone reference.

3. Create new `.planning/ROADMAP.md` for the next milestone:
   - If PROJECT.md has phase details for the next milestone, use them as a starting point
   - If not, create a placeholder ROADMAP with the milestone goal and empty phase list
   - Reset all phase statuses to `"pending"`

4. Reset `.planning/state.json`:
```json
{
  "project": "{project_name}",
  "version": "{next_version}",
  "current_milestone": {next_number},
  "current_phase": null,
  "phase_status": null,
  "mode": "{preserved_mode}",
  "active_team": null,
  "completed_phases": [],
  "last_command": "/gmsd:milestone",
  "last_updated": "{ISO timestamp}",
  "history": [{
    "command": "/gmsd:milestone",
    "timestamp": "{ISO timestamp}",
    "result": "Milestone v{old_version} archived. Starting v{next_version}."
  }]
}
```

5. Update `.planning/STATE.md` to reflect the fresh state.

6. Clean up working directories:
   - Clear `.planning/phases/` (artifacts are in the archive)
   - Clear `.planning/design/` if it exists (artifacts are in the archive)
   - Keep `config.json`, `PROJECT.md`, and the new `ROADMAP.md`

**If "Adjust scope":**
Present the current scope and ask the user to describe changes. Update `PROJECT.md` accordingly, then proceed as "Start next milestone."

**If "Add new milestone":**
Ask the user to describe the new milestone. Add it to `PROJECT.md`. Then ask if they want to start it.

**If "Done for now":**
Thank the user, confirm the archive is saved, and exit.

### Step 6: Update State (final)

Append to `history`:
```json
{
  "command": "/gmsd:milestone",
  "timestamp": "{ISO timestamp}",
  "result": "Milestone v{version} archived. {phase_count} phases, {task_count} tasks, {commit_count} commits. Archive: .planning/archive/v{version}/"
}
```

### Step 7: What's Next

**If starting next milestone with a ROADMAP already defined:**
```
---
## What's Next

Current: Milestone {next_number} — v{next_version}: {next_name} | Phase: none | Mode: {mode}

**Recommended next step:**
--> `/gmsd:discuss-phase 1` — Begin planning the first phase of the new milestone

**Other options:**
- `/gmsd:plan-phase 1` — Skip discuss and jump to planning (if decisions are clear)
- `/gmsd:new-project` — Re-run project setup with fresh research (for major scope changes)
- `/gmsd:progress` — Check full project status
```

**If starting next milestone without a ROADMAP:**
```
---
## What's Next

Current: Milestone {next_number} — v{next_version}: {next_name} | Phase: none | Mode: {mode}

**Recommended next step:**
--> `/gmsd:new-project` — Run project research and roadmap generation for the new milestone

**Other options:**
- `/gmsd:progress` — Check full project status
- `/gmsd:settings` — Adjust settings for the new milestone
```

**If done for now:**
```
---
## What's Next

Current: Milestone {milestone_number} — v{version} | Status: archived | Mode: {mode}

**When you're ready to continue:**
--> `/gmsd:progress` — See current project status and next steps
--> `/gmsd:milestone` — Set up the next milestone
```
