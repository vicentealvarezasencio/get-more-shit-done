# Workflow: Debug

**Slash Command:** `/gmsd:debug {N}`
**Role:** Team Lead
**Produces:** Fixed code, updated VERIFICATION.md

---

## Overview

Systematically fix verification gaps through collaborative debugging. Gaps are assessed for severity and count, then either a single debugger or a debug team is spawned. The key innovation is shared root cause discovery -- when one debugger finds a root cause, it broadcasts to all peers so related gaps can be resolved without redundant investigation.

After fixes are applied, a quick re-verification confirms the gaps are closed.

---

## Prerequisites

Before starting, verify these conditions:

```
1. VERIFICATION.md exists with gaps
   path = .planning/phases/{N}-{name}/VERIFICATION.md
   IF NOT exists:
     Ask: "No verification report found. What issue should be debugged?"
     IF user provides specific issue:
       manual_gap = true
       gap_description = user's description
       PROCEED with single debugger
     ELSE:
       STOP. "Run /gmsd:verify-work {N} first."

2. Parse gaps from VERIFICATION.md
   gaps = extract all gaps with: title, severity, description, root_cause_guess, suggested_fix, files
   gap_count = len(gaps)

   IF gap_count == 0 AND NOT manual_gap:
     STOP. "No gaps found in verification report. Nothing to debug.
            Run /gmsd:verify-work {N} to re-check."

3. Read context
   plan = .planning/phases/{N}-{name}/PLAN.md
   config = .planning/config.json
   verification = .planning/phases/{N}-{name}/VERIFICATION.md
```

---

## State Transitions

```
gaps_found --> debugging --> re_verifying --> verified (or more_gaps)
```

---

## Step 1: Assess Gaps

**Actor:** Lead

### 1a. Categorize Gaps

```
critical_gaps = [g for g in gaps if g.severity == "critical"]
major_gaps = [g for g in gaps if g.severity == "major"]
minor_gaps = [g for g in gaps if g.severity == "minor"]

Log:
  "Gap assessment: {gap_count} total -- {len(critical_gaps)} critical, {len(major_gaps)} major, {len(minor_gaps)} minor"
```

### 1b. Determine Debug Strategy

```
// Only fix critical and major gaps. Minor gaps are optional.
actionable_gaps = critical_gaps + major_gaps

IF user wants to fix minor gaps too:
  actionable_gaps += minor_gaps

IF actionable_gaps.count == 0:
  Lead to User: "Only minor gaps found. These do not block progress.
    Minor gaps: {list minor gaps}
    Accept and move on, or fix them?"
  IF accept: GOTO finalize (mark verified)
  IF fix: actionable_gaps = minor_gaps

// Determine single debugger vs team
IF actionable_gaps.count <= 2:
  strategy = "single"
  debugger_count = 1
ELSE:
  strategy = "team"
  debugger_count = min(actionable_gaps.count, config.teams.default_debuggers)
  debugger_count = min(debugger_count, 3)  // cap at 3 debuggers
  debugger_count = max(debugger_count, 2)  // at least 2 for team

Log: "Debug strategy: {strategy} ({debugger_count} debuggers for {actionable_gaps.count} gaps)"
```

### 1c. Check for Shared Files

```
// Identify gaps that affect the same files (potential shared root cause)
file_to_gaps = {}
For each gap in actionable_gaps:
  For each file in gap.files:
    file_to_gaps[file].append(gap)

shared_file_gaps = {file: gaps for file, gaps in file_to_gaps if len(gaps) > 1}

IF shared_file_gaps:
  Log: "Potential shared root causes detected:"
  For each file, gaps in shared_file_gaps:
    Log: "  {file} affects gaps: {[g.title for g in gaps]}"
```

---

## Step 2: Update State

**Actor:** Lead

```
Update state.json:
  phase_status: "debugging"
  active_team: "gmsd-debug-{N}" (if team) or null (if single)
  last_command: "/gmsd:debug"
  last_updated: "{ISO timestamp}"
  history: [..., { "command": "/gmsd:debug {N}", "timestamp": "{ISO}",
                   "result": "Debug started: {actionable_gaps.count} gaps, strategy={strategy}" }]
```

---

## Step 3a: Single Debugger Flow

**Condition:** `strategy == "single"`

### Spawn Single Debugger Subagent

```
// Check model overrides
Read .planning/config.json
IF config.model_overrides["debugger"] exists:
  debugger_model = config.model_overrides["debugger"]
ELSE:
  debugger_model = default

Task(
  subagent_type="general-purpose",
  prompt="You are a GMSD Debugger. Your job is to investigate verification
  gaps, find root causes, implement fixes, and verify the fixes work.

  PHASE CONTEXT:
  - Project: {project_name}
  - Phase: {N} -- {phase_name}
  - Phase goal: {phase_goal}
  - Mode: {mode}
  - Git commit prefix: {config.git.commit_prefix}

  INPUT FILES:
  - .planning/phases/{N}-{name}/VERIFICATION.md -- gap details
  - .planning/phases/{N}-{name}/PLAN.md -- original plan and verification spec
  {IF design exists:}
  - .planning/phases/{N}-{name}/design/ -- design specs
  {ENDIF}

  GAPS TO FIX:

  {for each gap in actionable_gaps:}
  ## Gap {gap.number}: {gap.title}
  - Severity: {gap.severity}
  - Criterion: {gap.criterion}
  - Description: {gap.description}
  - Verifier's root cause guess: {gap.root_cause_guess}
  - Suggested fix: {gap.suggested_fix}
  - Files affected: {gap.files}

  {endfor}

  DEBUG PROTOCOL:

  For each gap:
  1. INVESTIGATE
     - Read the affected files
     - Understand what was supposed to happen (from PLAN.md)
     - Understand what actually happened (from VERIFICATION.md)
     - Find the root cause (may differ from verifier's guess)

  2. FIX
     - Implement the minimal fix that closes the gap
     - Do not refactor or add features -- fix the specific issue
     - Respect file ownership (check PLAN.md ownership matrix)
     - Follow existing code conventions

  3. VERIFY FIX
     - After fixing, verify the fix works:
       - If automated checks exist, run them
       - If manual, describe what changed and why it fixes the issue
     - Ensure the fix does not break other working functionality

  4. COMMIT
     - Commit each fix separately:
       {config.git.commit_prefix}(fix): {gap title} -- {brief description}
     - Example: gmsd(fix): add token expiration to password reset flow

  5. DOCUMENT
     - After fixing all gaps, update a brief summary of what was fixed and how

  OUTPUT:
  Print a summary of all fixes:
  - Gap {N}: {fixed/not_fixed} -- {root cause} -- {fix description}
  "
)
```

### Wait for Completion

```
WAIT for Task to return

Parse debugger output:
  fixed_gaps = count of gaps marked as fixed
  unfixed_gaps = count of gaps not fixed
  fixes_applied = list of fix descriptions

GOTO Step 4 (Re-verify)
```

---

## Step 3b: Debug Team Flow

**Condition:** `strategy == "team"`

### 3b-i. Create Team

```
TeamCreate("gmsd-debug-{N}")
```

### 3b-ii. Create Debug Tasks

```
For each gap in actionable_gaps:
  TaskCreate({
    subject: "Fix Gap {gap.number}: {gap.title}",
    description: "## Debug Task: Gap {gap.number} -- {gap.title}

      ## Gap Details
      - Severity: {gap.severity}
      - Criterion: {gap.criterion}
      - Description: {gap.description}
      - Verifier's root cause guess: {gap.root_cause_guess}
      - Suggested fix: {gap.suggested_fix}
      - Files affected: {gap.files}

      ## Context
      - Phase: {N} -- {phase_name}
      - Phase goal: {phase_goal}
      - Original plan: .planning/phases/{N}-{name}/PLAN.md
      - Verification: .planning/phases/{N}-{name}/VERIFICATION.md
      {IF design exists:}
      - Design specs: .planning/phases/{N}-{name}/design/
      {ENDIF}

      ## Debug Protocol
      1. INVESTIGATE: Read affected files, understand expected vs actual behavior
      2. ROOT CAUSE: Identify the actual root cause
         - IMPORTANT: Broadcast root cause to all peers!
      3. FIX: Implement minimal fix
      4. VERIFY: Confirm fix works without breaking other functionality
      5. COMMIT: {config.git.commit_prefix}(fix): {gap.title}

      ## Shared Root Cause Protocol
      {IF gap.files in shared_file_gaps:}
      WARNING: This gap shares files with other gaps ({list related gaps}).
      There may be a shared root cause. Before fixing:
      1. Check broadcasts from peers for related root causes
      2. If a peer found a root cause in a shared file, check if it explains your gap too
      3. If you find a root cause, broadcast immediately
      {ENDIF}

      WHEN YOU FIND THE ROOT CAUSE, BROADCAST:
      'ROOT CAUSE of Gap {gap.number}: {cause} in {file}:{line}.
       Related gaps that may share this cause: {list if any}.'",
    activeForm: "Debugging gap {gap.number}: {gap.title}"
  })
  // Store task ID
```

### 3b-iii. Spawn Debugger Teammates

```
For i in range(debugger_count):
  debugger_name = "debugger-{i+1}"

  Task(
    team_name="gmsd-debug-{N}",
    name=debugger_name,
    subagent_type="general-purpose",
    prompt="You are a GMSD Debugger working in a debug team. You investigate
    verification gaps, find root causes, and implement fixes.

    PROJECT CONTEXT:
    - Project: {project_name}
    - Phase: {N} -- {phase_name}
    - Phase goal: {phase_goal}
    - Mode: {mode}
    - Git commit prefix: {config.git.commit_prefix}

    KEY FILES:
    - .planning/phases/{N}-{name}/VERIFICATION.md
    - .planning/phases/{N}-{name}/PLAN.md
    {IF design:}
    - .planning/phases/{N}-{name}/design/
    {ENDIF}

    CRITICAL PROTOCOL -- SHARED ROOT CAUSE DISCOVERY:

    When you find a root cause for ANY gap:
    1. IMMEDIATELY broadcast to all peers:
       SendMessage(type='broadcast',
       content='ROOT CAUSE of Gap {N}: {description} in {file}:{line}.
       The issue is {explanation}. Fix approach: {approach}.
       Related gaps that may share this cause: {list}.',
       summary='Root cause: Gap {N}')

    2. Check if any peer's gap might be caused by the same root cause
    3. If you receive a root cause broadcast from a peer:
       - Check if YOUR current gap is related
       - If related: skip redundant investigation, build on peer's finding
       - If not related: continue your investigation

    This cross-pollination is the MOST IMPORTANT aspect of team debugging.
    It prevents duplicate work and accelerates resolution.

    START WORKING:
    1. Call TaskList to find available debug tasks
    2. Claim one gap task (prefer gaps with higher severity)
    3. Read task description for gap details
    4. Investigate, find root cause, BROADCAST root cause
    5. Implement fix, verify, commit
    6. Mark task complete
    7. Claim next gap task
    8. Repeat until no gaps remain
    9. Message lead when standing by"
  )
```

### 3b-iv. Monitor Debug Team

```
WHILE debug tasks remain:

  ON broadcast from debugger:
    IF contains "ROOT CAUSE":
      root_cause = extract root cause details
      affected_gaps = extract related gaps
      Log: "[{timestamp}] ROOT CAUSE found by {debugger}: {root_cause}"

      // Check if this root cause consolidates multiple gap tasks
      IF affected_gaps.count > 1:
        Log: "Shared root cause affects {affected_gaps.count} gaps."
        // The debugger's broadcast already informs peers
        // Peers will check if their gap is related

  ON message from debugger:
    IF contains "complete" or "fixed":
      fixed_count += 1
      Log: "[{timestamp}] {debugger}: Gap {gap_id} fixed. {fixed_count}/{total_gaps}"

    IF contains "CANNOT FIX" or "stuck":
      Log: "[{timestamp}] {debugger} stuck on gap {gap_id}."

      // Suggest alternative approach
      SendMessage(type="message", recipient=debugger,
      content="Stuck on gap {gap_id}? Try: {alternative_approach}.
      Or check if a peer's root cause broadcast is relevant.",
      summary="Debug suggestion for gap {gap_id}")

    IF contains "standing by":
      // Check if more gap tasks exist
      remaining = TaskList -> filter status=pending
      IF remaining.count == 0:
        Log: "{debugger} standing by -- no more gaps."

  IF all gap tasks complete or failed:
    EXIT loop
```

### 3b-v. Shutdown Debug Team

```
For each active teammate in "gmsd-debug-{N}":
  SendMessage(type="shutdown_request", recipient="{teammate-name}",
  content="Debug phase complete. Shutting down.")

WAIT for all shutdown_response(approve=true)
```

---

## Step 4: Re-Verification

**Actor:** Lead spawns verifier subagent (quick verification)

```
// Quick re-verify -- only check the gaps that were addressed
Task(
  subagent_type="general-purpose",
  prompt="You are a GMSD Verifier running a QUICK RE-VERIFICATION.
  This is NOT a full verification -- only check whether the previously
  identified gaps have been resolved.

  PHASE: {N} -- {phase_name}
  PHASE GOAL: {phase_goal}

  PREVIOUS VERIFICATION: .planning/phases/{N}-{name}/VERIFICATION.md

  GAPS TO RE-CHECK:
  {for each gap that was addressed:}
  Gap {gap.number}: {gap.title}
  - Original issue: {gap.description}
  - Fix applied: {fix_description from debugger}
  - Files changed: {files}
  Re-verify that this gap is now closed.
  {endfor}

  ALSO CHECK:
  - Fixes did not introduce NEW issues (regression check)
  - Previously passing criteria still pass

  OUTPUT:
  Update .planning/phases/{N}-{name}/VERIFICATION.md:
  - Add a 'Re-Verification' section at the bottom
  - For each re-checked gap: RESOLVED / STILL_OPEN / NEW_ISSUE
  - Update the Recommendation: PROCEED / FIX_GAPS
  - Update the Results table if any status changed

  DECISION RULES:
  - PROCEED: All previously-failed criteria now pass. No new regressions.
  - FIX_GAPS: Some gaps still open or new issues introduced.
  "
)

WAIT for re-verification to complete

Read updated VERIFICATION.md
Parse re-verification results
```

---

## Step 5: Finalize

**Actor:** Lead

### Handle Re-Verification Result

```
CASE re_verification == "PROCEED":

  Update state.json:
    phase_status: "verified"
    active_team: null
    last_updated: "{ISO timestamp}"
    history: [..., { "command": "/gmsd:debug {N}", "timestamp": "{ISO}",
                     "result": "Debug complete: {fixed_count}/{gap_count} gaps fixed. Verified." }]

  Lead to User: "Debug complete! Phase {N} ({phase_name}) is now VERIFIED.

    Gaps fixed: {fixed_count}/{gap_count}
    {IF minor_gaps_skipped:}
    Minor gaps skipped: {minor_gaps_skipped_count} (accepted as-is)
    {ENDIF}

    Re-verification: All criteria now pass.

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
  - /gmsd:verify-work {N} -- Full re-verification
  - /gmsd:progress -- View full project status"


CASE re_verification == "FIX_GAPS" (still has gaps):

  remaining_gaps = parse remaining open gaps from VERIFICATION.md
  debug_cycle_count += 1

  IF debug_cycle_count >= 3:
    Lead to User: "Debug has run {debug_cycle_count} cycles but gaps persist.

      Remaining gaps:
      {list remaining gaps}

      Options:
      1. Accept current state and move on (minor issues)
      2. Manually fix the remaining gaps
      3. Re-plan the phase with a different approach

    ---
    ## What's Next

    Current: Phase {N} -- {phase_name} | Status: gaps_found | Mode: {mode}

    **Options:**
    --> /gmsd:plan-phase {N} -- Re-plan with different approach
    --> /gmsd:verify-work {N} -- Accept and re-verify
    --> /gmsd:progress -- View full project status"

  ELSE:
    Update state.json:
      phase_status: "gaps_found"

    Lead to User: "Some gaps remain after debug cycle {debug_cycle_count}:

      Fixed: {fixed_count}
      Remaining: {remaining_count}
      {list remaining gaps}

      Running another debug cycle.

    ---
    ## What's Next

    Current: Phase {N} -- {phase_name} | Status: gaps_found | Mode: {mode}

    **Recommended next step:**
    --> /gmsd:debug {N} -- Run another debug cycle

    **Other options:**
    - /gmsd:verify-work {N} -- Full re-verification
    - /gmsd:plan-phase {N} -- Re-plan if fundamentally broken
    - /gmsd:progress -- View full project status"
```

---

## Error Handling

```
IF debugger crashes (single mode):
  - Check if any fixes were committed
  - Re-spawn debugger for remaining unfixed gaps
  - Provide list of already-fixed vs. still-open gaps

IF debugger crashes (team mode):
  - Other debuggers continue
  - Crashed debugger's unclaimed gap tasks revert to unowned
  - Remaining debuggers can pick them up

IF debugger's fix breaks existing functionality:
  - Detected during re-verification
  - Re-verification marks it as a NEW_ISSUE
  - Another debug cycle addresses the regression

IF root cause affects code outside the phase's scope:
  - Debugger should message lead about cross-phase impact
  - Lead assesses whether to fix in this phase or defer
  - If deferred: note in VERIFICATION.md as known issue

IF all debuggers stuck on same gap:
  - Escalate to user with full investigation context
  - Provide the root cause analysis so far
  - Ask user for guidance or alternative approach

IF manual_gap (user-reported issue, no VERIFICATION.md):
  - Skip gap assessment, go directly to single debugger
  - Debugger investigates user's description
  - After fix, run full verification (/gmsd:verify-work)
```
