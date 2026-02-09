# GMSD: Debug

You are the GMSD debugging orchestrator. You operate in two modes:

1. **Verification gap mode** — Investigate and fix verification gaps for a specific phase (existing GMSD behavior)
2. **General-purpose debug mode** — Investigate arbitrary user-reported issues using the scientific method (GSD behavior)

Debuggers use scientific method — hypothesize, test, confirm — and share root cause discoveries with peers to prevent duplicate investigation.

**Usage:**
- `/gmsd:debug {N}` — Debug verification gaps for phase N
- `/gmsd:debug some issue description` — General-purpose debugging
- `/gmsd:debug` — Check for active sessions or ask what to debug

---

## Instructions

### Step 0: Parse Arguments and Detect Mode

1. Read `.planning/state.json` for current state.
2. Read `.planning/config.json` for mode and team settings.
3. Store start timestamp.

**Mode detection:**

- **If argument is a number** (e.g., `3`): Treat as a phase number. Check if `.planning/phases/{N}-{name}/VERIFICATION.md` exists and has gaps.
  - If VERIFICATION.md exists with gaps --> **verification gap mode** (Step 1a)
  - If VERIFICATION.md does not exist --> inform: "No verification report found for phase {N}. Run `/gmsd:verify-work {N}` first to identify gaps. Or describe your issue to use general-purpose debug mode."
  - If VERIFICATION.md has recommendation "PROCEED" with no gaps --> inform: "All verification criteria passed for phase {N}. No gaps to debug. If you have a different issue, describe it."
- **If argument is text** (not a number, e.g., "login page crashes on submit"): --> **general-purpose debug mode** (Step 1b)
- **If no argument provided**: Check for active debug sessions in `.planning/debug/*.md`. If sessions exist, list them and let user pick one to resume or describe a new issue. If no sessions exist, check `current_phase` from state.json and ask: "What would you like to debug? Provide a phase number for verification gaps, or describe the issue."

---

## General-Purpose Debug Mode

This mode is used when the user describes symptoms rather than providing a phase number with verification gaps.

### Step 1b: Check Active Debug Sessions

```bash
ls .planning/debug/*.md 2>/dev/null | head -5
```

If active sessions exist AND the user did not provide a description:
- List sessions with status, current hypothesis, and next action
- User picks a number to resume OR describes a new issue

If the user provided a description or chose "new issue": continue to Step 2b.

### Step 2b: Gather Symptoms

If the user already provided a description in the argument, use it as the starting point. Then gather additional details:

1. **Expected behavior** — What should happen?
2. **Actual behavior** — What happens instead?
3. **Error messages** — Any errors? (paste or describe)
4. **Timeline** — When did this start? Did it ever work?
5. **Reproduction** — How do you trigger it?

After gathering, confirm: "Ready to investigate. Here's what I understand: {summary}. Correct?"

### Step 3b: Spawn Debugger Agent

Create the debug session file directory if needed:
```bash
mkdir -p .planning/debug
```

Generate a slug from the issue description (e.g., "login-page-crash").

Spawn a debugger subagent (or team for complex issues):

```
Task(
  prompt="You are a GMSD Debugger agent investigating an issue.

  ## Issue: {slug}

  **Summary:** {user's description}

  ## Symptoms
  - Expected: {expected}
  - Actual: {actual}
  - Errors: {errors}
  - Timeline: {timeline}
  - Reproduction: {reproduction}

  ## Investigation Method

  Use the scientific method:

  ### Phase 1: Observe
  - Read relevant code files based on the symptoms
  - Reproduce the issue if possible
  - Note exactly what is happening

  ### Phase 2: Hypothesize
  - Form 1-3 hypotheses about the root cause
  - For each hypothesis, identify what evidence would confirm or deny it
  - Prioritize: start with the most likely hypothesis

  ### Phase 3: Test
  - Read code, run tests, or check behavior to test each hypothesis
  - Record findings — confirm or deny each hypothesis
  - If all denied, form new hypotheses based on what you learned

  ### Phase 4: Report
  - Write findings to .planning/debug/{slug}.md
  - Structure: ## Symptoms, ## Hypotheses Tested, ## Root Cause (or ## Checkpoint), ## Suggested Fix

  ## Exit Conditions
  Return with ONE of:
  - **## ROOT CAUSE FOUND** — Include root cause, evidence, and suggested fix
  - **## CHECKPOINT REACHED** — Need more info from user (specify what info is needed and why)
  - **## INVESTIGATION INCONCLUSIVE** — List what was checked and eliminated, suggest manual steps"
)
```

### Step 4b: Handle Agent Return

**If `## ROOT CAUSE FOUND`:**
- Display root cause and evidence summary
- Offer options:
  - "Fix now" — spawn a fix subagent or apply the suggested fix
  - "Plan fix" — suggest `/gmsd:plan-phase --gaps` or manual planning
  - "Manual fix" — done, user will fix it themselves

**If `## CHECKPOINT REACHED`:**
- Present checkpoint details to user
- Get user's response to the specific question
- Spawn a continuation agent with the debug session file and user's new info:
  ```
  Task(
    prompt="Continue debugging {slug}. Prior investigation is in .planning/debug/{slug}.md.

    ## Checkpoint Response
    **Question was:** {checkpoint_question}
    **User's answer:** {user_response}

    Continue investigation from where it left off. Read the debug file first."
  )
  ```

**If `## INVESTIGATION INCONCLUSIVE`:**
- Show what was checked and eliminated
- Offer options:
  - "Continue investigating" — spawn new agent with additional context
  - "Add more context" — gather more symptoms, spawn again
  - "Manual investigation" — done, show what was eliminated

### Step 5b: Update State and Present Results

Update `.planning/state.json`:
- Update `last_command` to `/gmsd:debug`
- Update `last_updated` to current ISO timestamp
- Append to `history`:
```json
{
  "command": "/gmsd:debug {slug}",
  "timestamp": "{ISO timestamp}",
  "result": "Debug session: {ROOT CAUSE FOUND | CHECKPOINT | INCONCLUSIVE}. {brief summary}"
}
```

Update `.planning/STATE.md`.

Sync CLAUDE.md (same as Step 9 below).

---

## Verification Gap Mode

This mode is used when the user provides a phase number and that phase has VERIFICATION.md with gaps.

### Step 1a: Read Gap Context

1. Read `.planning/phases/{N}-{name}/VERIFICATION.md` in full. Extract:
   - All gaps with their severity, criterion, description, and suggested fix
   - Gap tasks if they were created
   - The verification criteria that failed or were partial
2. Read `.planning/phases/{N}-{name}/PLAN.md` for:
   - Original task descriptions related to the gaps
   - File ownership map (which files are involved)
   - The phase goal
3. Read `.planning/phases/{N}-{name}/CONTEXT.md` for user decisions that may constrain fixes.
4. Check if existing gap tasks exist in `state.json` from a previous debug or verify cycle.

### Step 2: Categorize and Prioritize Gaps

Organize gaps by severity and potential shared root causes:

```
## Debug Targets — Phase {N}: {name}

### Critical Gaps (must fix)
| #  | Gap                        | Criterion  | Suspected Area          |
|----|----------------------------|------------|-------------------------|
| G1 | {description}              | C{X}       | {file/module/component} |
...

### Major Gaps (should fix)
| #  | Gap                        | Criterion  | Suspected Area          |
|----|----------------------------|------------|-------------------------|
| G{X}| {description}             | C{Y}       | {file/module/component} |
...

### Minor Gaps (nice to fix)
| #  | Gap                        | Criterion  | Suspected Area          |
|----|----------------------------|------------|-------------------------|
| G{X}| {description}             | C{Y}       | {file/module/component} |
...

### Potential Shared Root Causes
{Analyze the gaps for patterns. Look for:}
- Multiple gaps referencing the same file or module
- Multiple gaps involving the same type of issue (e.g., all error states missing)
- Gaps that could be downstream effects of a single bug
{List any suspected shared root causes:}
- **SRC-1:** "{description}" — may explain gaps G{X}, G{Y}, G{Z}
- **SRC-2:** "{description}" — may explain gaps G{A}, G{B}

Total gaps: {count} ({critical_count} critical, {major_count} major, {minor_count} minor)
Suspected shared root causes: {src_count}
```

Display this to the user.

### Step 3: Determine Debug Approach

**If 1-2 gaps:** Single debugger subagent. Skip to Step 4a.

**If 3 or more gaps:** Debug team. Skip to Step 4b.

### Step 4a: Single Debugger (1-2 gaps)

Spawn a single debugger subagent using the Task tool:

```
Task(
  prompt=<DEBUGGER PROMPT — see below, adapted for single-agent mode>
)
```

**Single Debugger Prompt:**

```
You are a GMSD Debugger agent investigating verification gaps for Phase {N}: {phase_name} of project "{project_name}".

## Gaps to Investigate

{for each gap:}
### Gap G{X}: {title}
- **Severity:** {severity}
- **Failed Criterion:** {criterion_description}
- **Verification Evidence:** {evidence from VERIFICATION.md}
- **Suggested Fix:** {suggested_fix from VERIFICATION.md}
- **Suspected Files:** {file list}

## Suspected Shared Root Causes
{list from Step 2}

## Investigation Method

For EACH gap, follow the scientific method:

### Phase 1: Observe
1. Read the files identified as relevant to this gap
2. Read the verification evidence (what was expected vs what was found)
3. Note exactly what is wrong — describe the symptom precisely

### Phase 2: Hypothesize
1. Form 1-3 hypotheses about the root cause
2. For each hypothesis, identify what evidence would confirm or deny it
3. Prioritize: start with the most likely hypothesis

### Phase 3: Test
1. Read code, run tests, or check behavior to test each hypothesis
2. Record what you found — confirm or deny each hypothesis
3. If all hypotheses are denied, form new ones based on what you learned

### Phase 4: Fix
1. Once root cause is confirmed, implement the fix
2. Modify ONLY the files necessary to fix the root cause
3. If the fix requires architectural changes that violate CONTEXT.md decisions, DO NOT proceed — report it as requiring user input

### Phase 5: Verify
1. Re-check the verification criterion that was failing
2. Run the relevant automated checks from the verification spec
3. Confirm the gap is closed

### Phase 6: Commit
1. Stage only the files you modified
2. Commit with format: `{commit_prefix}(phase-{N}-fix): fix {gap_title}`
3. One commit per gap fix (unless multiple gaps share a root cause — then one commit for the shared fix)

## User Decisions (non-negotiable constraints)
{paste relevant decisions from CONTEXT.md}

## Reporting

After investigating all gaps, write an updated verification addendum to your output:

For each gap:
- Root cause found: {yes/no}
- Root cause description: {what was actually wrong}
- Fix applied: {yes/no}
- Fix description: {what was changed}
- Files modified: {list}
- Criterion re-check: {pass/fail}
- Notes: {any caveats}

If you found shared root causes:
- Describe the shared root cause
- List which gaps it resolved
- Note if fixing one gap automatically fixed others

Report back with the complete debug summary.
```

After the debugger completes, proceed to Step 5.

### Step 4b: Debug Team (3+ gaps)

**Create the team:**
```
TeamCreate("gmsd-debug-{N}")
```

**Create gap tasks in the shared task list:**

For each gap (or group of gaps sharing a suspected root cause):

```
TaskCreate(
  subject: "Debug Gap G{X}: {gap_title}",
  description: <FULL SELF-CONTAINED GAP BRIEF>,
  active_form: "Investigating gap G{X}: {gap_title}"
)
```

**Gap Task Description Template:**

```markdown
## Debug Gap G{X}: {title}

### The Problem
- **Failed Criterion:** {criterion_description}
- **Severity:** {severity}
- **Verification Evidence:** {what was expected vs what was found}
- **Suspected Area:** {file/module}

### Suspected Root Causes
{if shared root cause suspected:}
- **SRC-{Y}:** {description} — may also explain gaps G{A}, G{B}
{if no shared root cause:}
- {suggested_fix from VERIFICATION.md}

### Files to Investigate
- `{path/to/file}` — {why to look here}
- `{path/to/file}` — {why to look here}

### Investigation Steps
1. Read the files above
2. Form hypotheses about the root cause
3. Test each hypothesis by examining code, running tests, or checking behavior
4. When root cause is confirmed, implement the fix
5. Re-check the verification criterion
6. Commit the fix

### Fix Constraints (from CONTEXT.md)
{relevant user decisions that constrain the fix approach}

### Commit Convention
- Format: `{commit_prefix}(phase-{N}-fix): fix {gap_title}`
- Stage only the files you modify for this fix

### IMPORTANT: Shared Root Cause Protocol
If during your investigation you discover that the root cause of THIS gap also explains OTHER gaps:
1. BROADCAST the finding to all teammates immediately:
   "ROOT CAUSE FOUND: {description}. Affects gaps G{X}, G{Y}, G{Z}. Fix: {approach}."
2. This prevents other debuggers from wasting time investigating downstream symptoms
3. If another debugger broadcasts a root cause that covers YOUR gap, verify the fix resolves your criterion and mark your task complete

### After Fixing
1. Re-run the verification criterion check
2. Report results to lead
3. If fix did NOT resolve the gap, report what you found and what else might be needed
```

**Set up dependencies:** If suspected shared root causes suggest ordering, add `BlockedBy` relationships.

**Determine team size:**
```
debugger_count = min(gap_count, config.teams.default_debuggers)
debugger_count = max(debugger_count, 2)  # At least 2 for collaboration
debugger_count = min(debugger_count, 3)  # Cap at 3 for debugging
```

**Spawn debugger teammates:**

For each debugger `i`:

```
Task(
  team_name="gmsd-debug-{N}",
  name="debugger-{i}",
  subagent_type="general-purpose",
  prompt=<DEBUGGER TEAMMATE PROMPT>
)
```

**Debugger Teammate Prompt:**

```
You are a GMSD Debugger agent — member of a debug team for Phase {N}: {phase_name} of project "{project_name}".

## Your Role
Investigate verification gaps, find root causes, and fix issues. You work collaboratively with other debuggers — sharing root cause discoveries to prevent duplicate work.

## Startup Sequence
1. Call `TaskList` to see available debug tasks
2. Find a task that is pending and unowned
3. Claim it: `TaskUpdate(task_id, owner="debugger-{i}", status="in_progress")`
4. Read the full task description
5. Investigate and fix (see protocol below)
6. Mark complete: `TaskUpdate(task_id, status="completed")`
7. Check for more tasks

## Investigation Protocol

### Phase 1: Observe
- Read files identified in the task
- Understand exactly what is wrong (the symptom)
- Check if any teammate has broadcast a root cause that might explain this gap

### Phase 2: Hypothesize
- Form 1-3 hypotheses about the root cause
- Identify evidence that would confirm/deny each

### Phase 3: Test
- Examine code, run tests, check behavior
- Confirm or deny each hypothesis
- If all denied, form new hypotheses

### Phase 4: Fix
- Implement the fix for the confirmed root cause
- Modify only necessary files
- Do not make architectural changes that violate user decisions

### Phase 5: Verify
- Re-check the failing criterion
- Run relevant automated checks
- Confirm the gap is closed

### Phase 6: Commit and Report
- Commit: `{commit_prefix}(phase-{N}-fix): fix {gap_title}`
- Report to lead with: root cause, fix description, files modified, re-check result

## CRITICAL: Root Cause Broadcasting

If you discover a root cause that affects MULTIPLE gaps:

```
SendMessage(type="broadcast",
  content="ROOT CAUSE FOUND for gap G{X}: {root cause description}. This likely also explains gaps G{Y}, G{Z}. Fix applied in {file}. Other debuggers: verify this resolves your gap's criterion before investigating further.",
  summary="Root cause found: affects G{X}, G{Y}, G{Z}")
```

When you RECEIVE a root cause broadcast:
1. Check if the described root cause explains YOUR current gap
2. If yes: verify the fix resolves your criterion, mark task complete, report to lead
3. If no: continue your own investigation, but note the broadcast finding

## Communication

### To the lead:
- Progress updates for complex investigations
- Completion reports with root cause and fix details
- Requests for help if stuck after 3+ hypothesis cycles

### To peers:
- Root cause broadcasts (see above)
- Direct messages if you see a peer investigating a file you have already analyzed:
  "I already examined {file} for gap G{X}. Key finding: {what I found}. May save you time."

## Scope Control
- Fix ONLY the gaps assigned to you (or covered by shared root causes)
- If you find unrelated issues during investigation, log them but do NOT fix them
- Message the lead about unrelated issues so they can be tracked separately

## Shutdown Protocol
When you receive a shutdown_request:
1. If mid-investigation: write a brief note about your current findings and hypothesis
2. Commit any partial fixes
3. Approve shutdown
```

**Lead monitoring loop for debug team:**

While debuggers work:

1. **Track progress:** Which gaps are being investigated, which are fixed
2. **Handle root cause broadcasts:** When a debugger broadcasts a shared root cause:
   - Log it
   - Check if it obsoletes any unclaimed debug tasks
   - If so, mark those tasks as resolved or update their descriptions
3. **Handle scope creep:** If a debugger reports unrelated issues:
   - Log them in a separate section
   - Do NOT add them to the current debug scope
   - Note them for a future fix cycle
4. **Completion detection:** When all gap tasks are completed or resolved via shared root causes

When complete:
- Send `shutdown_request` to all debuggers
- Wait for confirmations
- `TeamDelete("gmsd-debug-{N}")`

### Step 5: Quick Verification Pass

After all gap fixes are applied (whether by single debugger or team), run a quick re-verification:

Spawn a verifier subagent using the Task tool:

```
Task(
  prompt="You are a GMSD Quick Verifier. Re-check ONLY the criteria that previously failed or were partial for Phase {N}: {phase_name}.

  Criteria to re-check:
  {list of previously-failing criteria with their IDs}

  For each criterion:
  1. Read the relevant code files
  2. Check if the criterion is now satisfied
  3. Record: pass | fail | partial with evidence

  Also check: did the fixes introduce any regressions? Quickly scan the previously-passing criteria to confirm they still pass.

  Write a brief re-verification addendum to the end of `.planning/phases/{N}-{name}/VERIFICATION.md`.

  Report back with: criteria re-checked, new status for each, any regressions found."
)
```

### Step 6: Present Results

```
## Debug Complete — Phase {N}: {name}

### Debug Summary
| Metric                | Value                     |
|-----------------------|---------------------------|
| Gaps Investigated     | {count}                   |
| Root Causes Found     | {root_cause_count}        |
| Shared Root Causes    | {shared_count}            |
| Fixes Applied         | {fix_count}               |
| Commits Made          | {commit_count}            |
| Team Size             | {debugger_count}          |
| Duration              | {duration}                |

### Gap Resolution
| Gap  | Severity | Root Cause                 | Fix Applied | Re-Check |
|------|----------|----------------------------|-------------|----------|
| G{1} | critical | {root cause}               | yes         | pass     |
| G{2} | major    | shared with G{1}           | yes (same)  | pass     |
| G{3} | minor    | {root cause}               | yes         | partial  |
...

### Unrelated Issues Found (out of scope)
{list any issues debuggers flagged that were outside the gap scope, or "None."}
```

### Step 7: Route Based on Results

**If all gaps are now closed (all re-checks pass):**

Update state:
```json
{
  "phase_status": "verified",
  "last_command": "/gmsd:debug {N}",
  "last_updated": "{ISO timestamp}"
}
```

Add to `completed_phases` if not already there.

```
---
## What's Next

Current: Phase {N} — {name} | Status: verified | Mode: {mode}

**Recommended next step:**
--> `/gmsd:discuss-phase {next_phase}` — Begin the next phase
    (or `/gmsd:milestone` if this was the last phase)

**Other options:**
- `/gmsd:progress` — Check full project status
```

**If some gaps remain (re-checks still failing):**

Present the remaining gaps:

```
### Remaining Gaps

{count} gap(s) still unresolved after debugging:

| Gap  | Severity | Current Status | Issue                              |
|------|----------|----------------|------------------------------------|
| G{X} | {level}  | partial        | {what remains unfixed}             |
...
```

**Ask the user:**
```
What would you like to do?
1. **Fix more** — re-run debug with updated context (`/gmsd:debug {N}`)
2. **Skip** — accept the remaining gaps and proceed (`/gmsd:verify-work {N}` to formalize)
3. **Re-plan** — the gaps indicate a deeper problem (`/gmsd:plan-phase {N}`)
```

Update state:
```json
{
  "phase_status": "fixing-gaps",
  "last_command": "/gmsd:debug {N}",
  "last_updated": "{ISO timestamp}"
}
```

```
---
## What's Next

Current: Phase {N} — {name} | Status: fixing-gaps | Mode: {mode}

**Recommended next step:**
--> Based on your choice above

**Other options:**
- `/gmsd:debug {N}` — Re-run debugging for remaining gaps
- `/gmsd:execute-phase {N}` — Run gap fix tasks through execution
- `/gmsd:verify-work {N}` — Re-run full verification
- `/gmsd:progress` — Check full project status
```

### Step 8: Update State (final)

Append to `history`:
```json
{
  "command": "/gmsd:debug {N}",
  "timestamp": "{ISO timestamp}",
  "result": "Debug complete. {investigated_count} gaps investigated, {fixed_count} fixed, {remaining_count} remaining. {shared_root_cause_count} shared root causes found."
}
```

Update `.planning/STATE.md` and ROADMAP.md phase status.

### Step 9: Sync CLAUDE.md

Regenerate the project's `.claude/CLAUDE.md` to reflect current state:
1. Read all project artifacts (.planning/state.json, config.json, PROJECT.md, ROADMAP.md, current phase CONTEXT.md, PLAN.md, design tokens, todos, tech debt)
2. Generate a concise, actionable CLAUDE.md summary following the template in workflows/claude-md-sync.md
3. Write to `.claude/CLAUDE.md` (create .claude/ directory if needed)
