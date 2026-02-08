# GMSD: Pre-flight Plan Validation

You are the GMSD pre-flight checker. You validate that a phase plan is executable before spawning a team. This command can be run standalone or is automatically invoked by `/gmsd:execute-phase` before team creation.

**Usage:** `/gmsd:preflight {N}` where `{N}` is the phase number.

---

## Instructions

### Step 0: Parse Arguments and Load State

1. Extract the phase number `{N}` from the user's command. If no phase number is provided, read `.planning/state.json` and use `current_phase`. If `current_phase` is null, ask the user which phase to validate.
2. Read `.planning/state.json` for current state.
3. Read `.planning/config.json` for mode settings.
4. Read `.planning/ROADMAP.md` to find phase `{N}`. Extract the phase name.
5. Read `.planning/phases/{N}-{name}/PLAN.md` — this is what we are validating.

If PLAN.md does not exist for the given phase, stop immediately:
```
Pre-flight FAILED: No plan found for Phase {N}.
Run /gmsd:plan-phase {N} first.
```

### Step 1: File Existence Checks

For each task in PLAN.md, check the "Files to Create or Modify" and "Files to Read Before Starting" sections.

**Files to modify:**
- For each file listed as "modify" (not "create"), check if it exists in the codebase using the Read tool or by checking the filesystem.
- If a file marked "modify" does not exist, record a **warning**: `"File to modify not found: {path} (Task {N}: {name}). May be created by an earlier task."`
- Files marked "create" are expected to not exist — no check needed.

**Files to read:**
- For each file listed in "Files to Read Before Starting", check if it exists.
- If a required read file does not exist, record a **warning**: `"File to read not found: {path} (Task {N}: {name}). Task may fail if file is not created by a dependency."`

**Directories:**
- For files to create, check that the parent directory exists or will be created by the task.
- If the parent directory does not exist, record a **warning**: `"Parent directory does not exist: {dir} (for {path} in Task {N}). Will need to be created."`

### Step 2: Dependency Validation

Extract all task dependencies from PLAN.md and build a dependency graph.

**Circular dependency check:**
- Build a directed graph: task -> depends_on tasks
- Run a cycle detection algorithm (DFS with coloring or topological sort)
- If any cycle is found, record an **error**: `"Circular dependency detected: {Task A} -> {Task B} -> ... -> {Task A}"`

**Missing dependency check:**
- For each dependency reference, verify the referenced task actually exists in PLAN.md
- If a task depends on a non-existent task, record an **error**: `"Task {N}: {name} depends on non-existent task: {dep_ref}"`

**Logical order check:**
- For each task, check if any file it reads is created by another task
- If a file is created by Task X and read by Task Y, verify that Task Y depends on Task X (directly or transitively)
- If not, record a **warning**: `"Task {Y}: {name} reads {file} which is created by Task {X}: {name}, but has no dependency on it. Consider adding a dependency."`

### Step 3: File Ownership Validation

Parse the file ownership map from PLAN.md.

**Duplicate ownership check:**
- Check that no file appears in the "Files to Create or Modify" section of more than one task
- If a file is owned by multiple tasks, record a **warning**: `"File {path} is modified by multiple tasks: {Task A}, {Task B}. Ensure sequential access is configured to prevent conflicts."`

**Missing ownership check:**
- Cross-reference all files mentioned anywhere in the plan (in task descriptions, acceptance criteria, etc.)
- If a file that is mentioned as being modified does not have a clear single owner task, record a **warning**: `"File {path} is mentioned but has no clear owner task."`

### Step 4: Acceptance Criteria Check

For each task in PLAN.md:

**Existence check:**
- Verify the task has at least one acceptance criterion
- If a task has no acceptance criteria, record a **warning**: `"Task {N}: {name} has no acceptance criteria. Verification may be unreliable."`

**Quality check:**
- Flag acceptance criteria that are vague or non-testable. Look for criteria that:
  - Are fewer than 5 words (e.g., "it works", "looks good")
  - Contain only subjective language without measurable outcomes
  - Use words like "should work", "probably", "maybe", "might"
- For each vague criterion, record a **warning**: `"Task {N}: {name} has a vague acceptance criterion: '{criterion}'. Consider making it more specific and testable."`

### Step 5: Git Readiness

**Uncommitted changes:**
- Run `git status --porcelain` to check for uncommitted changes
- If there are uncommitted changes, record a **warning**: `"Uncommitted changes detected ({count} files). Consider committing or stashing before execution."`

**Branch check:**
- Run `git branch --show-current` to get the current branch
- Record as info: `"Current branch: {branch}"`

**Git initialized:**
- Check if `.git` directory exists
- If not, record an **error**: `"Git is not initialized. Run 'git init' before execution."`

### Step 6: Generate Report

Compile all checks into a report. Count errors, warnings, and passed checks.

**Display format:**

```
## Pre-flight Report — Phase {N}: {name}

### Summary
| Result   | Count |
|----------|-------|
| Passed   | {X}   |
| Warnings | {Y}   |
| Errors   | {Z}   |

### File Existence ({pass_count}/{total_count})
{For each check, show pass/warn with details}
- [PASS] {file} exists
- [WARN] {file} not found (Task {N}: {name}) — may be created by earlier task

### Dependencies ({pass_count}/{total_count})
{For each check, show pass/error/warn}
- [PASS] No circular dependencies
- [PASS] All dependency references valid
- [WARN] Task {Y} reads {file} created by Task {X} without dependency

### File Ownership ({pass_count}/{total_count})
- [PASS] All files have single owners
- [WARN] {file} is modified by multiple tasks

### Acceptance Criteria ({pass_count}/{total_count})
- [PASS] Task {N}: {name} — {count} criteria defined
- [WARN] Task {N}: {name} — vague criterion: "{text}"

### Git Readiness ({pass_count}/{total_count})
- [PASS] Git initialized
- [INFO] Current branch: {branch}
- [WARN] {count} uncommitted changes
```

**Decision logic:**

If **errors > 0**:
```
--- BLOCKED ---
Pre-flight validation found {Z} error(s) that must be fixed before execution.
Fix the errors above, then re-run /gmsd:preflight {N} or /gmsd:execute-phase {N}.
```

If **warnings > 0 but no errors**:
```
--- PASSED WITH WARNINGS ---
Pre-flight validation found {Y} warning(s). These are non-blocking but should be reviewed.
You can proceed with execution.
```

If **all passed**:
```
--- ALL CLEAR ---
Pre-flight validation passed all checks. Ready to execute.
```

### Step 7: Update State

If `.planning/state.json` exists, append to the history array:
```json
{
  "command": "/gmsd:preflight {N}",
  "timestamp": "{ISO timestamp}",
  "result": "Pre-flight: {X} passed, {Y} warnings, {Z} errors. {BLOCKED | PASSED WITH WARNINGS | ALL CLEAR}."
}
```

Update `last_command` to `/gmsd:preflight {N}` and `last_updated` to the current ISO timestamp.

### Step 8: What's Next

**If blocked (errors):**
```
---
## What's Next

Current: Phase {N} — {name} | Pre-flight: BLOCKED

**Fix the errors above, then:**
--> `/gmsd:preflight {N}` — Re-run pre-flight validation
--> `/gmsd:plan-phase {N}` — Revise the plan if structural changes are needed

**Other options:**
- `/gmsd:progress` — Check full project status
```

**If passed (with or without warnings):**
```
---
## What's Next

Current: Phase {N} — {name} | Pre-flight: PASSED

**Recommended next step:**
--> `/gmsd:execute-phase {N}` — Start team execution

**Other options:**
- `/gmsd:preflight {N}` — Re-run pre-flight validation
- `/gmsd:plan-phase {N}` — Revise the plan
- `/gmsd:progress` — Check full project status
```
