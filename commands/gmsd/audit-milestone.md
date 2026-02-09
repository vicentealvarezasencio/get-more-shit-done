# GMSD: Audit Milestone

You are the GMSD milestone auditor. You perform a goal-backward audit of the current milestone against its original intent and success criteria before archiving. This is a quality gate before `/gmsd:milestone`.

**Usage:** `/gmsd:audit-milestone`

---

## Instructions

### Step 0: Load State

1. Read `.planning/state.json` for current state.
2. Read `.planning/config.json` for version, project name, mode, and settings.
3. Read `.planning/ROADMAP.md` for the full phase list, milestone info, and phase statuses.
4. Read `.planning/PROJECT.md` for the milestone definitions, success criteria, and version plan.
5. Store the current timestamp.

### Step 1: Gather Milestone Evidence

Read all phase artifacts for the current milestone:

1. **For each phase listed in ROADMAP.md:**
   - Read `.planning/phases/{N}-{name}/PLAN.md` — original goals, tasks, verification spec
   - Read `.planning/phases/{N}-{name}/VERIFICATION.md` — verification results, gaps found, gaps accepted
   - Read `.planning/phases/{N}-{name}/CONTEXT.md` — user decisions (if exists)
   - Note the phase status from ROADMAP.md and `state.json.completed_phases`

2. **Extract from PROJECT.md:**
   - Milestone success criteria (must-have and should-have requirements)
   - Original milestone scope and goals
   - Any constraints or non-functional requirements

Show what was loaded:

```
 +---------------------------------------------------------------------+
 |  GMSD Audit -- Milestone {milestone_number}: {milestone_name}        |
 +---------------------------------------------------------------------+

 Evidence gathered:
   [x] PROJECT.md     -- {count} success criteria found
   [x] ROADMAP.md     -- {count} phases in milestone
   [{x or space}] Phase {N} PLAN.md         -- {found/missing}
   [{x or space}] Phase {N} VERIFICATION.md -- {found/missing}
   ...
```

### Step 2: Goal-Backward Audit

Perform a structured audit working backward from the milestone's intended outcome.

#### 2a. Success Criteria Audit

For each milestone success criterion defined in PROJECT.md:

1. Identify which phase(s) were responsible for achieving this criterion
2. Check the VERIFICATION.md of those phase(s) for evidence of completion
3. Determine status:
   - **met** -- criterion is fully achieved with evidence from verification
   - **partial** -- criterion is partially achieved; some aspects verified, others missing
   - **unmet** -- criterion is not achieved; no evidence of completion
4. Record the evidence (file paths, verification results, specific findings)

#### 2b. Phase Completion Audit

For each phase in the milestone:

1. **Was it verified?** Check if VERIFICATION.md exists and what the recommendation was (PROCEED/FIX_GAPS/REPLAN)
2. **Were there accepted gaps?** List any gaps from VERIFICATION.md that were accepted rather than fixed
3. **Was it skipped?** If phase status is not "verified", note it as skipped or incomplete
4. **Did it deviate from plan?** Compare PLAN.md goals against VERIFICATION.md results for unexpected outcomes

#### 2c. Requirements Coverage Audit

Cross-reference PROJECT.md requirements:

1. **Must-have requirements:** For each must-have, confirm it maps to at least one success criterion that is "met". Flag any unmet must-haves as critical gaps.
2. **Should-have requirements:** For each should-have, check if it was addressed. Flag any dropped should-haves that were not explicitly acknowledged by the user.
3. **Research risks:** Read `.planning/RESEARCH.md` (if exists) and check if any identified risks materialized but were not addressed.

### Step 2d: Integration Check (Subagent)

After completing the main audit analysis, spawn an integration checker subagent to verify cross-phase wiring and end-to-end flows. This catches issues that only appear when phases interact.

1. **Prepare phase context:** For each phase in the milestone, collect:
   - Phase number, name, goal
   - Key outputs (files created, APIs added, components built) from PLAN.md and VERIFICATION.md
   - Exports and interfaces that other phases depend on

2. **Spawn integration checker:**

```
Task(
  prompt="You are a GMSD integration checker. Verify cross-phase wiring and E2E flows for the current milestone.

MILESTONE: {milestone_name} (v{version})

PHASES:
{For each phase: number, name, goal, key outputs, and status}

CHECK:
1. Cross-phase data flow — do outputs from phase N feed correctly into phase N+1? Look for mismatched interfaces, missing handoffs, or broken data pipelines between phases.
2. API contracts — are interfaces between phases consistent? Check that consumers use the same signatures and types that producers export.
3. E2E user flows — can a user complete key workflows end-to-end across multiple phases? Trace the main user journeys through all relevant phases.
4. Shared resources — are shared files, configs, environment variables, and database schemas consistent across phases that use them?

READ these files for evidence:
- .planning/ROADMAP.md
- .planning/phases/*/PLAN.md
- .planning/phases/*/{phase}-VERIFICATION.md (where available)
- .planning/phases/*/{phase}-SUMMARY.md (where available)
- Relevant source files mentioned in phase outputs

OUTPUT: Return a structured report with:
- List of integration gaps found, each with severity (critical/major/minor) and a suggested fix
- List of verified cross-phase connections that are working correctly
- List of E2E flows checked and their status (complete/broken/partial)
- Overall integration score: X/Y checks passed",
  description="Integration check for milestone {milestone_name}"
)
```

3. **Collect integration results:** Parse the subagent's return for:
   - Integration gaps (with severity and suggested fixes)
   - Verified connections
   - E2E flow statuses
   - Overall integration score

4. **Merge into audit:** Incorporate the integration checker's findings into the audit report. Integration gaps at `critical` severity should influence the verdict toward GAPS or FAIL.

### Step 3: Generate AUDIT.md

Write `.planning/AUDIT.md` with the complete audit report:

```markdown
# Milestone Audit -- v{version}: {milestone_name}

**Project:** {project_name}
**Milestone:** {milestone_number} -- {milestone_name}
**Version:** {version}
**Audited:** {current_date}

---

## Verdict: {PASS | GAPS | FAIL}

{One-sentence summary of the audit outcome.}

---

## Success Criteria Checklist

| #  | Criterion                              | Status  | Evidence                                | Phase(s)   |
|----|----------------------------------------|---------|-----------------------------------------|------------|
| 1  | {criterion from PROJECT.md}            | met     | {brief evidence from VERIFICATION.md}   | Phase {N}  |
| 2  | {criterion}                            | partial | {what is done vs what is missing}       | Phase {N}  |
| 3  | {criterion}                            | unmet   | {no evidence found / phase not verified}| Phase {N}  |
...

**Summary:** {met_count}/{total_count} criteria met, {partial_count} partial, {unmet_count} unmet.

---

## Phase Completion Summary

| Phase | Name                 | Status    | Verified | Accepted Gaps | Skipped | Deviations |
|-------|----------------------|-----------|----------|---------------|---------|------------|
| 1     | {name}               | verified  | Yes      | {count}       | No      | {count}    |
| 2     | {name}               | verified  | Yes      | 0             | No      | 0          |
| 3     | {name}               | executed  | No       | --            | No      | --         |
| 4     | {name}               | pending   | --       | --            | Yes     | --         |
...

---

## Accepted Gaps (Aggregated)

{If no accepted gaps across any phase:}
> No accepted gaps found across any phase.

{If gaps exist:}
| #  | Gap Description                        | Severity | Origin Phase | Reason Accepted                    |
|----|----------------------------------------|----------|--------------|------------------------------------|
| 1  | {gap from VERIFICATION.md}             | {level}  | Phase {N}    | {reason}                           |
| 2  | {gap}                                  | {level}  | Phase {N}    | {reason}                           |
...

---

## Cross-Phase Integration

{Results from the integration checker subagent (Step 2d):}

**Integration Score:** {passed_checks}/{total_checks} checks passed

### Integration Gaps

{If no integration gaps found:}
> No cross-phase integration gaps identified.

{If gaps exist:}
| #  | Gap Description                        | Severity | Phases Affected      | Suggested Fix                      |
|----|----------------------------------------|----------|----------------------|------------------------------------|
| 1  | {gap from integration checker}         | {level}  | Phase {N} -> {M}     | {suggested fix}                    |
| 2  | {gap}                                  | {level}  | Phase {N} -> {M}     | {suggested fix}                    |
...

### E2E Flow Status

| #  | Flow Name                              | Status   | Notes                                   |
|----|----------------------------------------|----------|-----------------------------------------|
| 1  | {user flow name}                       | complete | {flows end-to-end successfully}         |
| 2  | {user flow name}                       | partial  | {breaks at step X}                      |
...

---

## Unaddressed Risks

{If no RESEARCH.md or no unaddressed risks:}
> No unaddressed risks identified.

{If risks exist:}
| #  | Risk (from Research)                   | Status              | Notes                              |
|----|----------------------------------------|---------------------|------------------------------------|
| 1  | {risk from RESEARCH.md}                | materialized/dormant| {what happened or why it is a concern} |
...

---

## Unmet Must-Have Requirements

{If all must-haves are met:}
> All must-have requirements are satisfied.

{If unmet must-haves exist:}
| #  | Requirement                            | Linked Criterion | Gap                                |
|----|----------------------------------------|------------------|------------------------------------|
| 1  | {must-have from PROJECT.md}            | Criterion {X}    | {what is missing}                  |
...

---

## Dropped Should-Have Requirements

{If all should-haves are addressed or explicitly dropped:}
> All should-have requirements were addressed or explicitly acknowledged.

{If unacknowledged drops exist:}
| #  | Requirement                            | Status           | Notes                              |
|----|----------------------------------------|------------------|------------------------------------|
| 1  | {should-have from PROJECT.md}          | dropped          | {not addressed, no user acknowledgment} |
...

---

## Audit Notes

{Any additional observations, patterns noticed, or recommendations not captured above.}

---

*Audited on {current_date} by `/gmsd:audit-milestone`.*
```

### Step 4: Determine Verdict

Apply the following verdict logic, incorporating both the success criteria audit AND the integration checker results:

- **PASS** -- All must-have success criteria are "met". No unmet must-haves. All phases are verified (or explicitly skipped by user). Only minor accepted gaps remain. No critical integration gaps. All E2E flows are complete.
- **GAPS** -- Some success criteria are "partial" or a small number are "unmet", but the issues are fixable with targeted work. Must-haves may have partial coverage. Some phases may be unverified. OR: critical integration gaps exist between phases, or E2E flows are partially broken.
- **FAIL** -- Multiple must-have success criteria are "unmet". Core milestone intent is not achieved. Major architectural or functional gaps exist. OR: multiple critical integration gaps make the system non-functional across phases.

Write the verdict into the AUDIT.md header.

### Step 5: Present Findings to User

Adapt the presentation based on mode from `config.json`:

**If mode is `guided`:**

Show the full audit summary with all tables and walk through each finding:

```
## Milestone Audit -- v{version}: {milestone_name}

### Verdict: {PASS | GAPS | FAIL}

{detailed explanation}

### Success Criteria
{full table}

### Phase Summary
{full table}

### Key Findings
1. {finding with context}
2. {finding with context}
...

### Accepted Gaps Across Phases
{full table or "none"}

### Unaddressed Risks
{full table or "none"}
```

**If mode is `balanced`:**

Show a condensed summary:

```
## Milestone Audit -- v{version}: {milestone_name}

### Verdict: {PASS | GAPS | FAIL}

{one-paragraph summary}

| Metric               | Value                    |
|----------------------|--------------------------|
| Success Criteria     | {met}/{total} met        |
| Phases Verified      | {verified}/{total}       |
| Accepted Gaps        | {count}                  |
| Unmet Must-Haves     | {count}                  |

{If GAPS or FAIL: list the top issues}
```

**If mode is `yolo`:**

Show a one-line summary:

```
## Milestone Audit: {PASS | GAPS | FAIL} -- {met}/{total} criteria met, {gap_count} gaps, {unmet_must_haves} unmet must-haves.
```

### Step 6: Route Based on Verdict

**If PASS:**
```
### Recommendation

The milestone passes audit. All success criteria are met and phases are verified.

--> Ready for `/gmsd:milestone` to archive and advance.
```

**If GAPS:**
```
### Recommendation

The milestone has fixable gaps that should be addressed before archiving.

**Gaps to resolve:**
1. {gap description} -- {suggested action}
2. {gap description} -- {suggested action}
...

--> Run `/gmsd:plan-milestone-gaps` to create targeted phases for gap closure.
--> Or run `/gmsd:milestone` to archive as-is (gaps will be noted in the archive).
```

**If FAIL:**
```
### Recommendation

The milestone has major gaps. Core intent is not achieved.

**Critical issues:**
1. {issue description}
2. {issue description}
...

Options:
1. **Plan gap closure** -- `/gmsd:plan-milestone-gaps` to create phases addressing the gaps
2. **Re-scope milestone** -- Adjust PROJECT.md success criteria to match what was actually built
3. **Continue execution** -- Go back to incomplete phases and finish them
```

### Step 7: Update State

Update `.planning/state.json`:
- Set `last_command` to `/gmsd:audit-milestone`
- Update `last_updated` to current ISO timestamp
- Append to `history`:
```json
{
  "command": "/gmsd:audit-milestone",
  "timestamp": "{ISO timestamp}",
  "result": "Audit verdict: {PASS|GAPS|FAIL}. {met}/{total} criteria met. {gap_count} accepted gaps. {unmet_must_haves} unmet must-haves."
}
```

Update `.planning/STATE.md` to reflect the audit status.

### Step 8: What's Next

**If PASS:**
```
---
## What's Next

Current: Milestone {milestone_number} -- v{version}: {milestone_name} | Audit: PASS | Mode: {mode}

**Recommended next step:**
--> `/gmsd:milestone` -- Archive this milestone and prepare the next version

**Other options:**
- `/gmsd:retrospective` -- Run a retrospective before archiving (recommended)
- `/gmsd:progress` -- Check full project status
```

**If GAPS:**
```
---
## What's Next

Current: Milestone {milestone_number} -- v{version}: {milestone_name} | Audit: GAPS | Mode: {mode}

**Recommended next step:**
--> `/gmsd:plan-milestone-gaps` -- Create targeted phases to close the {gap_count} identified gaps

**Other options:**
- `/gmsd:milestone` -- Archive as-is (gaps will be documented but not fixed)
- `/gmsd:verify-work {N}` -- Re-verify a specific phase
- `/gmsd:progress` -- Check full project status
```

**If FAIL:**
```
---
## What's Next

Current: Milestone {milestone_number} -- v{version}: {milestone_name} | Audit: FAIL | Mode: {mode}

**Recommended next step:**
--> `/gmsd:plan-milestone-gaps` -- Create phases to address the {unmet_count} unmet criteria

**Other options:**
- `/gmsd:execute-phase {N}` -- Go back to an incomplete phase
- `/gmsd:discuss-phase {N}` -- Re-discuss a phase that needs rework
- `/gmsd:progress` -- Check full project status
```
