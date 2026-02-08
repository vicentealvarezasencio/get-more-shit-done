# Workflow: Verification

**Slash Command:** `/gmsd:verify-work {N}`
**Role:** Team Lead
**Produces:** `.planning/phases/{N}-{name}/VERIFICATION.md`

---

## Overview

Goal-backward verification of a completed phase. A single verifier subagent checks whether the phase GOAL was achieved (not just whether tasks were completed). The verifier inspects the codebase, runs tests, checks design conformance, and produces a structured report. If gaps are found, the lead creates gap tasks and routes to debug.

This is a single-agent workflow -- no team needed.

---

## Prerequisites

Before starting, verify these conditions:

```
1. Phase {N} has been executed
   Read state.json
   IF phase_status not in ["executed", "verifying"]:
     WARN: "Phase {N} status is '{phase_status}'. Expected 'executed'."
     IF phase_status == "planned" or "designed":
       STOP. "Phase not yet executed. Run /gmsd:execute-phase {N} first."
     IF phase_status == "verified":
       Ask: "Phase already verified. Re-verify? (yes/no)"
       IF no: STOP.

2. PLAN.md exists with verification spec
   path = .planning/phases/{N}-{name}/PLAN.md
   IF NOT exists: STOP. "No plan found."
   Parse verification spec section
   IF verification spec is empty: WARN. "No verification spec in plan. Verification will be best-effort."

3. Read all context
   plan = .planning/phases/{N}-{name}/PLAN.md
   roadmap = .planning/ROADMAP.md
   project = .planning/PROJECT.md
   config = .planning/config.json

   IF exists: context = .planning/phases/{N}-{name}/CONTEXT.md
   IF exists: research = .planning/phases/{N}-{name}/RESEARCH.md
   IF exists: design_spec = .planning/phases/{N}-{name}/design/UI-SPEC.md
```

---

## State Transitions

```
executed --> verifying --> verified (or gaps_found)
```

---

## Step 1: Prepare Verification Context

**Actor:** Lead

```
Extract from PLAN.md:
  phase_goal = Phase Goal section
  verification_criteria = Verification Spec -> Goal Decomposition
  verification_steps = Verification Spec -> Verification Steps
  automated_checks = Verification Spec -> Automated Checks
  tasks = all tasks with acceptance criteria

Extract from ROADMAP.md:
  phase_scope = Phase {N} scope

Determine what to verify:
  has_design = .planning/phases/{N}-{name}/design/UI-SPEC.md exists
  has_tests = check if test files were created/modified (from task file lists)
  has_api = check if API routes were created (from task file lists)
```

---

## Step 1.5: Automated Test Suite

**Actor:** Lead

Before spawning the verifier, run the project's automated tests using the test runner workflow:

```
// Run the full test suite (see workflows/test-runner.md)
test_result = TestRunner(flag="--full")

// Record results for the verifier
IF test_result.status == "PASS":
  test_context = "All automated tests passing ({test_result.passed} tests passed in {test_result.duration}s)"
  test_section = "## Automated Tests\n\nStatus: PASS\nFramework: {test_result.framework}\nPassed: {test_result.passed} | Failed: 0 | Skipped: {test_result.skipped}\nDuration: {test_result.duration}s"

ELSE IF test_result.status == "FAIL":
  test_context = "AUTOMATED TESTS FAILING: {test_result.failed} tests failed. Failing tests: {test_result.failed_tests}. The verifier should check if these failures are related to phase {N} work."
  test_section = "## Automated Tests\n\nStatus: FAIL\nFramework: {test_result.framework}\nPassed: {test_result.passed} | Failed: {test_result.failed} | Skipped: {test_result.skipped}\nDuration: {test_result.duration}s\n\nFailing tests:\n{for each test in test_result.failed_tests: - {test}\n}"

ELSE IF test_result.status == "SKIP":
  test_context = "No automated tests detected. The verifier should note this as a gap."
  test_section = "## Automated Tests\n\nStatus: SKIP\nReason: {test_result.note}"

Log: "Test suite: {test_result.status} ({test_result.framework}). {test_result.passed} passed, {test_result.failed} failed."
```

---

## Step 2: Spawn Verifier Subagent

**Actor:** Lead

### 2a. Check Model Overrides

```
Read .planning/config.json
IF config.model_overrides["verifier"] exists:
  verifier_model = config.model_overrides["verifier"]
ELSE:
  verifier_model = default
```

### 2b. Update State

```
Update state.json:
  phase_status: "verifying"
  last_command: "/gmsd:verify-work"
  last_updated: "{ISO timestamp}"
```

### 2c. Spawn Verifier

```
Task(
  subagent_type="general-purpose",
  prompt="You are a GMSD Verifier. Your job is to verify whether the phase
  GOAL was achieved -- not just whether tasks were completed. You use
  goal-backward analysis: start from the desired outcome and check if
  reality matches.

  PHASE TO VERIFY:
  - Phase: {N} -- {phase_name}
  - Phase goal: {phase_goal}
  - Phase scope: {phase_scope}

  INPUT FILES (read these first):
  - .planning/phases/{N}-{name}/PLAN.md -- task list, verification spec
  - .planning/ROADMAP.md -- phase goals
  - .planning/PROJECT.md -- project requirements
  {IF has_design:}
  - .planning/phases/{N}-{name}/design/UI-SPEC.md -- design system hub
  - .planning/phases/{N}-{name}/design/design-tokens.json -- design tokens
  - All screen specs in .planning/phases/{N}-{name}/design/screens/
  {ENDIF}
  {IF context exists:}
  - .planning/phases/{N}-{name}/CONTEXT.md -- user decisions
  {ENDIF}

  AUTOMATED TEST RESULTS (from Step 1.5):
  {test_context}
  Include these results in VERIFICATION.md under an 'Automated Tests' section.
  If tests failed, check whether the failures are related to phase {N} work
  or pre-existing issues.

  VERIFICATION PROTOCOL:

  ==============================================================
  A. GOAL ACHIEVEMENT (Primary -- from PLAN.md verification spec)
  ==============================================================

  For each criterion in the verification spec:

  {for each criterion in verification_criteria:}
  Criterion {num}: {criterion}
  - Locate the relevant code
  - Check if it meets the stated criterion
  - Rate: PASS / FAIL / PARTIAL
  - Provide evidence: file path, line numbers, test output, or observation
  {endfor}

  Verification steps to execute:
  {for each step in verification_steps:}
  - {step}
  {endfor}

  Automated checks to run:
  ```
  {automated_checks}
  ```
  Run these commands and capture output. Report results.

  ==============================================================
  B. CODE QUALITY
  ==============================================================

  Scan all files modified/created during this phase:
  - No obvious security vulnerabilities (SQL injection, XSS, exposed secrets)
  - Follows existing code conventions (naming, structure, imports)
  - No hardcoded values that should be configurable
  - Error handling present for external calls and user input
  - No TODO/FIXME/HACK comments without task references
  - Imports are correct and used (no unused imports)
  - No duplicate code that should be shared

  {IF has_design:}
  ==============================================================
  C. UI CONFORMANCE (Only if design specs exist)
  ==============================================================

  For each screen spec in .planning/phases/{N}-{name}/design/screens/:
  - Does the implemented screen match the wireframe layout?
  - Are design tokens used (not hardcoded colors, fonts, spacing)?
  - Are all states implemented (default, loading, error, empty, success)?
  - Is responsive behavior implemented per spec?
  - Accessibility basics:
    - Interactive elements have labels?
    - Focus order is logical?
    - Color contrast meets WCAG AA?
    - Screen reader landmarks present?
    - Keyboard navigation works?
  - Component usage matches COMPONENTS.md?
  {ENDIF}

  ==============================================================
  D. INTEGRATION
  ==============================================================

  - New code integrates with existing codebase (no broken imports)
  - Data flows correctly between components/modules
  - API contracts match between frontend and backend (if both exist)
  - Environment variables documented (if new ones added)
  - Dependencies added to package.json/requirements.txt/etc.

  ==============================================================
  E. TASK-LEVEL CHECK (Secondary)
  ==============================================================

  For each task in PLAN.md:
  - Were all acceptance criteria met?
  - Were all listed files created/modified?
  - Is there a commit for this task?

  ==============================================================
  OUTPUT
  ==============================================================

  Write VERIFICATION.md to .planning/phases/{N}-{name}/VERIFICATION.md

  Use this structure:

  # Verification Report -- Phase {N}: {phase_name}

  **Verifier:** {your ID}
  **Date:** {date}
  **Phase Goal:** {phase_goal}

  ## Verification Method
  {describe how you verified -- code review, test execution, etc.}

  ## Results

  | # | Criterion | Status | Evidence |
  |---|-----------|--------|----------|
  | 1 | {criterion} | PASS/FAIL/PARTIAL | {file:line or observation} |
  ...

  ### Summary
  | Total | Passed | Failed | Partial |
  |-------|--------|--------|---------|
  | {N}   | {N}    | {N}    | {N}     |

  ## Code Quality Assessment
  {findings from section B}

  {IF has_design:}
  ## UI Conformance
  {findings from section C}
  {ENDIF}

  ## Integration Assessment
  {findings from section D}

  ## Task Completion
  | Task | Status | Notes |
  |------|--------|-------|
  | T-01 | Done/Partial/Missing | {notes} |
  ...

  ## Gaps Found

  ### Gap 1 -- {title}
  | Field | Value |
  |-------|-------|
  | Severity | critical/major/minor |
  | Criterion | {which criterion failed} |
  | Description | {detailed description of what is wrong} |
  | Root Cause | {your assessment of why it happened} |
  | Suggested Fix | {how to fix it} |
  | Files Affected | {list files} |

  {Repeat for each gap. If no gaps: 'No gaps found. All criteria passed.'}

  ## Gap Tasks (for critical and major gaps only)

  | Task # | Gap # | Description | Complexity | Files |
  |--------|-------|-------------|------------|-------|
  | G-01   | 1     | {desc}      | {complexity} | {files} |

  ## Recommendation

  **Recommendation:** PROCEED / FIX_GAPS / REPLAN

  **Rationale:** {why this recommendation}

  DECISION RULES:
  - PROCEED: All criteria PASS. No critical or major gaps.
  - FIX_GAPS: Some criteria FAIL or PARTIAL. Gaps are fixable.
  - REPLAN: Fundamental issues. Phase goal cannot be met with fixes alone.
  "
)
```

---

## Step 3: Process Verification Results

**Actor:** Lead

### 3a. Read Verification Report

```
WAIT for verifier Task to complete

Read .planning/phases/{N}-{name}/VERIFICATION.md

Parse:
  recommendation = PROCEED / FIX_GAPS / REPLAN
  total_criteria = count
  passed = count
  failed = count
  partial = count
  gaps = list of gaps with severity
  gap_tasks = list of proposed gap tasks
```

### 3b. Handle Recommendation

```
CASE recommendation == "PROCEED":

  Update state.json:
    phase_status: "verified"
    history: [..., { "command": "/gmsd:verify-work {N}", "timestamp": "{ISO}",
                     "result": "Verified: {passed}/{total_criteria} criteria passed. PROCEED." }]

  Lead to User: "Phase {N} ({phase_name}) VERIFIED!

    All verification criteria passed.
    {passed}/{total_criteria} criteria met.

    Verification report: .planning/phases/{N}-{name}/VERIFICATION.md

  ---
  ## What's Next

  Current: Phase {N} -- {phase_name} | Status: verified | Mode: {mode}

  **Recommended next step:**
  {IF next_phase exists:}
  --> /gmsd:discuss-phase {next_phase} -- Start the next phase
  {ELSE:}
  --> /gmsd:milestone -- All phases complete! Archive and ship.
  {ENDIF}

  **Other options:**
  - /gmsd:verify-work {N} -- Re-verify
  - /gmsd:progress -- View full project status"


CASE recommendation == "FIX_GAPS":

  critical_gaps = filter gaps where severity == "critical"
  major_gaps = filter gaps where severity == "major"
  minor_gaps = filter gaps where severity == "minor"

  Update state.json:
    phase_status: "gaps_found"

  Lead to User: "Phase {N} ({phase_name}) verification found gaps:

    {passed}/{total_criteria} criteria passed
    {failed} failed, {partial} partial

    Gaps found:
    {for each gap:}
    - [{gap.severity}] {gap.title}: {gap.description}
    {endfor}

    Proposed gap tasks: {gap_tasks.count}

    {IF minor_gaps only:}
    All gaps are minor. You can choose to fix them or accept as-is.
    {ENDIF}
    {IF critical or major gaps:}
    Critical/major gaps need to be addressed before proceeding.
    {ENDIF}

  ---
  ## What's Next

  Current: Phase {N} -- {phase_name} | Status: gaps_found | Mode: {mode}

  **Recommended next step:**
  --> /gmsd:debug {N} -- Fix the {gap_count} verification gaps

  **Other options:**
  - /gmsd:verify-work {N} -- Re-verify (if you fixed gaps manually)
  - /gmsd:execute-phase {N} -- Re-execute the entire phase
  - /gmsd:progress -- View full project status"


CASE recommendation == "REPLAN":

  Update state.json:
    phase_status: "gaps_found"

  Lead to User: "Phase {N} ({phase_name}) has FUNDAMENTAL ISSUES.

    The verifier recommends re-planning this phase.
    Rationale: {recommendation_rationale}

    This means the current plan cannot achieve the phase goal
    even with gap fixes. A different approach is needed.

  ---
  ## What's Next

  Current: Phase {N} -- {phase_name} | Status: gaps_found | Mode: {mode}

  **Recommended next step:**
  --> /gmsd:plan-phase {N} -- Re-plan with revised approach

  **Other options:**
  - /gmsd:debug {N} -- Attempt gap fixes anyway
  - /gmsd:discuss-phase {N} -- Revisit decisions before re-planning
  - /gmsd:progress -- View full project status"
```

---

## Step 4: Create Gap Tasks (If FIX_GAPS)

**Actor:** Lead
**Condition:** Only if recommendation is FIX_GAPS and user chooses to debug

```
IF user chooses to proceed with gap fixes:

  For each gap_task proposed in VERIFICATION.md:
    // These tasks are NOT created in the shared task list yet
    // They are documented in VERIFICATION.md for the debug workflow to use
    // The debug workflow (/gmsd:debug) will create them as actual tasks

  Log: "{gap_task_count} gap tasks documented in VERIFICATION.md for debug workflow."
```

---

## Error Handling

```
IF verifier subagent crashes:
  - Check if partial VERIFICATION.md was written
  - If partial: present what exists to user, offer to re-run or accept partial
  - If nothing: re-spawn verifier

IF automated checks fail to run (e.g., test command not found):
  - Verifier should note the failure in the report
  - Continue with manual/code-review-based verification
  - Flag missing automated verification as a gap

IF VERIFICATION.md is written but malformed:
  - Lead attempts to parse what is there
  - If unparseable: ask user to review the raw file manually
  - Still update state to reflect verification was attempted

IF verifier produces ambiguous results (many "PARTIAL"):
  - Present to user for interpretation
  - Ask: "Some criteria are partially met. Do you want to:
    1. Accept and move on
    2. Run debug to close the partial gaps
    3. Re-execute the phase"
```
