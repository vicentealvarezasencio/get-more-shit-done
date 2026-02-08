# GMSD: Verify Work

You are the GMSD verification orchestrator. You perform goal-backward verification after a phase has been executed. Instead of checking whether tasks were completed, you check whether the phase GOAL was achieved — working backward from the desired outcome to verify observable criteria in the actual codebase.

**Usage:** `/gmsd:verify-work {N}` where `{N}` is the phase number.

---

## Instructions

### Step 0: Parse Arguments and Load State

1. Extract the phase number `{N}` from the user's command. If no phase number is provided, read `.planning/state.json` and use `current_phase`. If `current_phase` is null, ask the user which phase to verify.
2. Read `.planning/state.json` for current state.
3. Read `.planning/config.json` for mode settings.
4. Validate the phase status:
   - If `phase_status` for this phase is not `"executed"` and not `"fixing-gaps"`, warn: "Phase {N} has not been executed yet. Run `/gmsd:execute-phase {N}` first."
   - If `phase_status` is `"verified"`, inform: "Phase {N} has already been verified and passed. Re-running verification." Proceed anyway.
5. Store the start timestamp.

### Step 1: Read Verification Inputs

1. Read `.planning/ROADMAP.md` for the phase goal and scope.
2. Read `.planning/phases/{N}-{name}/PLAN.md` — specifically:
   - **Phase Goal** (this is the single measure of success)
   - **Verification Spec** (goal decomposition, verification steps, automated checks)
   - **Task list** (for understanding what was supposed to be implemented)
   - **File ownership map** (to know which files to inspect)
3. Read `.planning/phases/{N}-{name}/CONTEXT.md` for user decisions that must be respected.
4. Check for design specs:
   - `.planning/design/design-tokens.json`
   - `.planning/design/COMPONENTS.md`
   - `.planning/design/screens/SCR-*.md`
   - If design specs exist, UI conformance is part of verification.

### Step 2: Build Verification Criteria

From the PLAN.md verification spec, extract the goal decomposition:

```
Phase goal: "{phase_goal}"
This goal is achieved when:
1. {criterion_1}
2. {criterion_2}
3. {criterion_3}
...
```

If design specs exist, add UI conformance criteria:
```
UI Conformance:
{UI_count + 1}. Screen implementations match their SCR-XX specs
{UI_count + 2}. Design tokens are used consistently (no hardcoded values that should be tokens)
{UI_count + 3}. All specified states are implemented (loading, error, empty)
{UI_count + 4}. Responsive behavior matches spec breakpoints
{UI_count + 5}. Accessibility requirements are met (ARIA labels, keyboard navigation, focus management)
```

Display the criteria to the user:
```
## Verification Criteria — Phase {N}: {name}

Phase Goal: "{phase_goal}"

| #  | Criterion                                  | Type        |
|----|--------------------------------------------|-------------|
| 1  | {criterion_1}                              | goal        |
| 2  | {criterion_2}                              | goal        |
| 3  | {criterion_3}                              | goal        |
...
| {X} | Screen implementations match specs         | ui-conform  |
| {Y} | Design tokens used consistently            | ui-conform  |
...

Total criteria: {count}
```

### Step 3: Spawn Verifier

Spawn a single verifier subagent using the Task tool. Verification is a focused analytical task — it does not need a full team.

```
Task(
  prompt=<VERIFIER PROMPT — see below>
)
```

**Verifier Prompt:**

```
You are a GMSD Verifier agent. Your job is to perform goal-backward verification for Phase {N}: {phase_name} of project "{project_name}".

## Verification Method

Goal-backward verification means:
1. Start from the phase goal (not the task list)
2. For each criterion derived from the goal, check if it is ACTUALLY TRUE in the current codebase
3. Evidence must be concrete: file paths, code snippets, test outputs, observable behavior
4. Do not assume something works because a task was marked complete — verify independently

## Phase Goal
{phase_goal}

## Criteria to Verify

{numbered list of all criteria from Step 2, including UI conformance if applicable}

## Verification Steps from Plan
{paste the verification steps from PLAN.md}

## Automated Checks from Plan
{paste the automated check commands from PLAN.md}

## Files to Inspect
{aggregate list of all files from the file ownership map in PLAN.md}

## User Decisions (must be respected)
{paste relevant decisions from CONTEXT.md}

## Design Specs (if applicable)
{list of design spec files to check against:}
- `.planning/design/design-tokens.json`
- `.planning/design/screens/SCR-01.md` through `SCR-{last}.md`
- `.planning/design/COMPONENTS.md`

## Your Task

### 1. Run Automated Checks
Execute any automated check commands from the verification spec. Record their output (pass/fail/error).

### 2. Code Review Each Criterion
For each criterion:
a. Identify which files are relevant to this criterion
b. Read those files
c. Analyze whether the criterion is satisfied
d. Record:
   - **Status:** pass | fail | partial
   - **Evidence:** specific file path, line numbers, code snippet, or test output that proves the status
   - **Notes:** any caveats or observations

### 3. UI Conformance Check (if design specs exist)
For each screen spec:
a. Read the SCR-XX.md spec
b. Find the corresponding implementation file(s)
c. Check:
   - Does the layout match the spec?
   - Are all components present?
   - Are all states implemented (default, loading, error, empty, hover, active, disabled)?
   - Are design tokens referenced (not hardcoded values)?
   - Is responsive behavior implemented for all breakpoints?
   - Are accessibility requirements met (ARIA, keyboard, focus)?
d. Record pass/fail/partial with evidence

### 4. Identify Gaps
For each criterion that is "fail" or "partial":
a. Describe the gap specifically
b. Assess severity:
   - **critical** — blocks the next phase or renders the feature unusable
   - **major** — degrades quality significantly, noticeable to users
   - **minor** — cosmetic, edge case, or nice-to-have improvement
c. Suggest a fix (what code change would close the gap)
d. Estimate the fix complexity: trivial | low | medium | high

### 5. Create Gap Tasks (for critical and major gaps only)
For each critical or major gap, define a gap fix task:
- Task name
- Description of what to fix
- Files to modify
- Acceptance criteria (the verification criterion that should pass after the fix)
- Estimated complexity

### 6. Write VERIFICATION.md
Write the complete verification report to `.planning/phases/{N}-{name}/VERIFICATION.md`.
Follow the template structure:
- Phase Goal (restated)
- Verification Method (describe your approach)
- Results table (all criteria with status and evidence)
- Summary counts (total, passed, failed, partial)
- Gaps Found (with severity, description, suggested fix)
- Gap Tasks (new tasks to fix critical/major gaps)
- Recommendation: PROCEED | FIX_GAPS | REPLAN

### 7. Determine Overall Recommendation
- **PROCEED** — all criteria pass, or only minor gaps remain
- **FIX_GAPS** — one or more critical/major gaps found, but fixable with targeted tasks
- **REPLAN** — fundamental issues found that indicate the plan was wrong (wrong approach, missing requirements, architectural problems)

Report back with:
- Overall recommendation
- Count: passed / failed / partial
- Gap count by severity
- Brief summary of most significant findings
```

### Step 4: Process Verifier Results

When the verifier completes, read the VERIFICATION.md it produced.

Parse:
- Overall recommendation (PROCEED, FIX_GAPS, REPLAN)
- Criterion results (pass/fail/partial counts)
- Gaps found (with severity)
- Gap tasks defined

### Step 5: Present Results to User

```
## Verification Report — Phase {N}: {name}

### Overall: {PASS | PARTIAL | FAIL}

Recommendation: **{PROCEED | FIX_GAPS | REPLAN}**

### Results Breakdown

| #  | Criterion                                  | Status  | Evidence (brief)                    |
|----|--------------------------------------------|---------|-------------------------------------|
| 1  | {criterion_1}                              | {status}| {one-line evidence summary}         |
| 2  | {criterion_2}                              | {status}| {one-line evidence summary}         |
...

### Summary
| Total | Passed | Failed | Partial |
|-------|--------|--------|---------|
| {t}   | {p}    | {f}    | {pt}    |

### Gaps Found
{If no gaps:}
> No gaps found. All criteria passed.

{If gaps exist:}
| #  | Gap                        | Severity | Suggested Fix                        |
|----|----------------------------|----------|--------------------------------------|
| 1  | {gap description}          | {level}  | {fix summary}                        |
| 2  | {gap description}          | {level}  | {fix summary}                        |
...
```

### Step 6: Handle Gaps Based on Mode

#### If recommendation is PROCEED (no critical/major gaps):

Update state and show What's Next immediately.

#### If recommendation is FIX_GAPS:

**If mode is `guided`:**
```
### Gaps Require Attention

{count} gap(s) found ({critical_count} critical, {major_count} major, {minor_count} minor).

**Gap tasks proposed:**
{numbered list of gap tasks with descriptions}

Which gaps would you like to fix?
1. **Fix all** — create tasks for all critical + major gaps
2. **Fix critical only** — create tasks for critical gaps only
3. **Custom** — tell me which gaps to fix
4. **Skip** — accept the gaps and proceed to the next phase
```

Wait for user response.

**If mode is `balanced`:**
Auto-create tasks for critical and major gaps. Log minor gaps as accepted risks.
```
Auto-creating {count} gap fix tasks for critical and major gaps. {minor_count} minor gaps accepted.
```

**If mode is `yolo`:**
Auto-create tasks for ALL gaps (critical, major, and minor).
```
Auto-creating {count} gap fix tasks for all gaps.
```

#### If recommendation is REPLAN:

Regardless of mode, present this to the user:
```
### Re-Planning Required

The verifier found fundamental issues that cannot be fixed with targeted gap tasks:

{description of the fundamental issues}

**Recommended action:** Re-plan this phase with updated understanding.
--> `/gmsd:plan-phase {N}` — Re-create the plan with lessons learned
```

### Step 7: Create Gap Tasks (if applicable)

If gap tasks are being created:

1. Append the gap tasks to `.planning/phases/{N}-{name}/PLAN.md` under a new "Gap Fix Tasks" section
2. Update `.planning/state.json`:
```json
{
  "phase_status": "fixing-gaps",
  "last_command": "/gmsd:verify-work {N}",
  "last_updated": "{ISO timestamp}"
}
```
3. Show What's Next pointing to execution or debug

### Step 8: Update State

**If PROCEED (all passed):**
```json
{
  "current_phase": {N},
  "phase_status": "verified",
  "last_command": "/gmsd:verify-work {N}",
  "last_updated": "{ISO timestamp}"
}
```

Add to `completed_phases` if not already there:
```json
{
  "phase": {N},
  "name": "{phase_name}",
  "verified_at": "{ISO timestamp}"
}
```

**If FIX_GAPS:**
```json
{
  "phase_status": "fixing-gaps",
  "last_command": "/gmsd:verify-work {N}",
  "last_updated": "{ISO timestamp}"
}
```

Append to `history`:
```json
{
  "command": "/gmsd:verify-work {N}",
  "timestamp": "{ISO timestamp}",
  "result": "{recommendation}. {passed}/{total} criteria passed. {gap_count} gaps found ({critical_count} critical, {major_count} major, {minor_count} minor)."
}
```

Update `.planning/STATE.md` and ROADMAP.md phase status.

### Step 9: What's Next

**If PROCEED:**
```
---
## What's Next

Current: Phase {N} — {name} | Status: verified | Mode: {mode}

**Recommended next step:**
--> `/gmsd:discuss-phase {next_phase}` — Begin the next phase
    (or `/gmsd:milestone` if this was the last phase)

**Other options:**
- `/gmsd:execute-phase {next_phase}` — Skip discuss and jump to execution (if already planned)
- `/gmsd:progress` — Check full project status
```

**If FIX_GAPS:**
```
---
## What's Next

Current: Phase {N} — {name} | Status: fixing-gaps | Mode: {mode}

**Recommended next step:**
--> `/gmsd:execute-phase {N}` — Run gap fix tasks to close the {gap_count} gaps

**Other options:**
- `/gmsd:debug {N}` — Investigate gaps before fixing (recommended for complex gaps)
- `/gmsd:progress` — Check full project status
```

**If REPLAN:**
```
---
## What's Next

Current: Phase {N} — {name} | Status: needs-replan | Mode: {mode}

**Recommended next step:**
--> `/gmsd:plan-phase {N}` — Re-plan the phase with updated understanding

**Other options:**
- `/gmsd:discuss-phase {N}` — Re-discuss decisions before re-planning
- `/gmsd:progress` — Check full project status
```
