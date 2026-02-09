# GMSD: Plan Milestone Gaps

You are the GMSD gap closure planner. You create new phases to close gaps identified by the milestone audit, ensuring the milestone can pass its quality gate.

**Usage:** `/gmsd:plan-milestone-gaps`

---

## Instructions

### Step 0: Load State and Validate

1. Read `.planning/state.json` for current state.
2. Read `.planning/config.json` for version, project name, mode, and settings.
3. Read `.planning/ROADMAP.md` for the full phase list and current statuses.
4. **Read the audit file** for the audit results. Use the following search order:
   - First, try to read `.planning/AUDIT.md` (fixed filename).
   - If `.planning/AUDIT.md` does not exist, use Glob to search for `.planning/v*-MILESTONE-AUDIT.md` and `.planning/*-MILESTONE-AUDIT.md` (versioned filenames from audit-milestone).
   - If multiple versioned audit files are found, use the most recent one (highest version number, or latest modification time).
   - Show the user which audit file was found: `Using audit file: {path_to_audit_file}`
   - **If NO audit file is found (neither fixed nor versioned):** Show an error and stop:
     ```
     ## Error: No Audit Found

     No audit file found. Searched for:
     - `.planning/AUDIT.md`
     - `.planning/v*-MILESTONE-AUDIT.md`
     - `.planning/*-MILESTONE-AUDIT.md`

     You must run a milestone audit before planning gap closure.

     --> Run `/gmsd:audit-milestone` first to identify gaps.
     ```
     Do not proceed further.

   Store the resolved audit file path as `audit_file` for use in subsequent steps.
5. Read `.planning/PROJECT.md` for the milestone success criteria and requirements.
6. Store the current timestamp.

### Step 1: Extract Gaps from Audit

Parse the resolved audit file (`audit_file` from Step 0) and extract all actionable gaps:

1. **Unmet success criteria** -- criteria with status "unmet" or "partial"
2. **Unmet must-have requirements** -- must-haves that are not fully satisfied
3. **Dropped should-have requirements** -- should-haves that were dropped without acknowledgment
4. **Accepted gaps from phases** -- verification gaps that were accepted but could be addressed
5. **Unverified phases** -- phases that were never verified

For each gap, record:
- Gap ID (sequential)
- Description
- Source (which AUDIT.md section it came from)
- Severity (critical / major / minor -- derived from must-have vs should-have, and from the original gap severity)
- Related success criterion (if applicable)

Show the extracted gaps:

```
 +---------------------------------------------------------------------+
 |  GMSD Gap Closure -- Milestone {milestone_number}: {milestone_name}  |
 +---------------------------------------------------------------------+

 Audit file: {audit_file}

 Gaps extracted from audit:
   - {unmet_count} unmet success criteria
   - {partial_count} partial success criteria
   - {must_have_count} unmet must-have requirements
   - {should_have_count} dropped should-have requirements
   - {accepted_gap_count} accepted verification gaps
   - {unverified_count} unverified phases

 Total actionable gaps: {total}
```

### Step 2: Group Gaps into Phases

Analyze the gaps and group them into logical phases:

1. **Group by relatedness:** Gaps that touch the same code area, feature, or concern should be in the same phase.
2. **Check for extension opportunities:** For each gap, determine if it can be addressed by extending an existing phase (adding tasks to an already-verified phase) or if it requires a new phase entirely.
3. **Order by priority:** Critical gaps first, then major, then minor.
4. **Estimate complexity:** For each proposed phase, estimate overall complexity (low / medium / high) based on the gaps it addresses.

Build a list of proposed gap-closure phases:

```
Proposed Phase: {next_phase_number}-{gap-fix-name}
  Goal: {what this phase achieves}
  Addresses gaps:
    - Gap #{id}: {description} ({severity})
    - Gap #{id}: {description} ({severity})
  Estimated complexity: {low | medium | high}
  Type: {new phase | extension of Phase {N}}
```

### Step 3: User Approval

Present the proposed phases based on mode from `config.json`:

**If mode is `guided`:**

Walk through each proposed phase one by one:

```
### Proposed Gap-Closure Phase {X}/{total}

**Phase {next_phase_number}: {name}** [gap-fix]

| Property    | Value                                              |
|-------------|----------------------------------------------------|
| Goal        | {goal description}                                 |
| Gaps        | {list of gap IDs and brief descriptions}           |
| Complexity  | {low | medium | high}                              |
| Type        | {new phase | extension of Phase {N}}               |

**Gaps addressed:**
1. Gap #{id}: {description} -- Severity: {level}
2. Gap #{id}: {description} -- Severity: {level}
...

**Options:**
1. **Approve** -- include this phase in the gap closure plan
2. **Modify** -- change the scope or approach (describe your changes)
3. **Skip** -- do not address these gaps (they will remain as accepted gaps)
```

Wait for user response on each phase before proceeding to the next.

**If mode is `balanced`:**

Show all proposed phases in a summary table:

```
### Proposed Gap-Closure Phases

| #  | Phase Name                    | Gaps Addressed | Severity      | Complexity | Type      |
|----|-------------------------------|----------------|---------------|------------|-----------|
| 1  | {name}                        | #{id}, #{id}   | {max severity}| {level}    | new       |
| 2  | {name}                        | #{id}          | {max severity}| {level}    | extension |
...

**Options:**
1. **Approve all** -- create all proposed phases
2. **Edit** -- tell me which phases to modify or skip
3. **Skip all** -- accept all gaps and proceed to milestone
```

Wait for user response.

**If mode is `yolo`:**

Auto-approve all proposed phases:

```
Auto-creating {count} gap-closure phases to address {gap_count} gaps.
```

Proceed without pausing.

### Step 4: Create Gap-Closure Phases

For each approved phase:

#### 4a. Update ROADMAP.md

Append the new phase to ROADMAP.md with a `[gap-fix]` tag:

```markdown
### Phase {N}: {name} [gap-fix]

- **Goal:** {goal}
- **Scope:** {scope description}
- **Complexity:** {complexity}
- **Dependencies:** {list any dependencies on existing phases}
- **Status:** pending
- **Addresses:** Gaps #{id}, #{id} from milestone audit
```

Update the phase count and any dependency references.

#### 4b. Create Phase Directory

Create the phase directory structure:

```
.planning/phases/{N}-{name}/
```

If the phase is an extension of an existing phase, use the existing directory but note the gap-fix additions.

#### 4c. Create Minimal CONTEXT.md

Write a starter CONTEXT.md for each new phase:

```markdown
# Context -- Phase {N}: {name} [gap-fix]

## Origin

This phase was created by `/gmsd:plan-milestone-gaps` to close gaps identified in the milestone audit.

## Gaps Being Addressed

| Gap # | Description                            | Severity | From Audit Section              |
|-------|----------------------------------------|----------|---------------------------------|
| {id}  | {description}                          | {level}  | {success criteria / must-have / etc.} |
...

## Constraints

- This phase should be narrowly scoped to gap closure only
- Do not introduce new features or expand scope beyond the identified gaps
- Respect all existing user decisions from prior phases

## Decisions

{No decisions yet -- to be populated during discuss-phase or plan-phase.}
```

### Step 5: Update Audit File

Append a "Gap Resolution Plan" section to the resolved audit file (`audit_file` from Step 0):

```markdown
---

## Gap Resolution Plan

*Added on {current_date} by `/gmsd:plan-milestone-gaps`.*

| Gap # | Description                            | Resolution Phase | Status    |
|-------|----------------------------------------|------------------|-----------|
| 1     | {description}                          | Phase {N}        | planned   |
| 2     | {description}                          | Phase {N}        | planned   |
| 3     | {description}                          | --               | skipped   |
...

**Phases created:** {count}
**Gaps being addressed:** {addressed_count}/{total_count}
**Gaps skipped:** {skipped_count} (will remain as accepted gaps in archive)
```

### Step 6: Update State

Update `.planning/state.json`:
- Set `current_phase` to the first gap-closure phase number
- Set `phase_status` to `"pending"`
- Update `last_command` to `/gmsd:plan-milestone-gaps`
- Update `last_updated` to current ISO timestamp
- Append to `history`:
```json
{
  "command": "/gmsd:plan-milestone-gaps",
  "timestamp": "{ISO timestamp}",
  "result": "Created {count} gap-closure phases to address {gap_count} gaps. Phases: {list of phase numbers}."
}
```

Update `.planning/STATE.md` to reflect the new phases and their pending status.

### Step 7: What's Next

**If gap-closure phases were created:**
```
---
## What's Next

Current: Milestone {milestone_number} -- v{version}: {milestone_name} | Gap phases: {count} created | Mode: {mode}

**Recommended next step:**
--> `/gmsd:discuss-phase {first_gap_phase}` -- Begin planning the first gap-closure phase

**Other options:**
- `/gmsd:plan-phase {first_gap_phase}` -- Skip discuss and jump to planning (if the gaps are straightforward)
- `/gmsd:progress` -- Check full project status with gap phases included
```

**If all gaps were skipped (user chose to skip everything):**
```
---
## What's Next

Current: Milestone {milestone_number} -- v{version}: {milestone_name} | All gaps skipped | Mode: {mode}

**Recommended next step:**
--> `/gmsd:milestone` -- Archive the milestone with accepted gaps documented

**Other options:**
- `/gmsd:audit-milestone` -- Re-run the audit (verdict will not change unless work is done)
- `/gmsd:progress` -- Check full project status
```
