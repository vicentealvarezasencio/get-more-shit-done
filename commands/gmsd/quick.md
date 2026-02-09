# GMSD Quick Task — Lightweight Planner + Executor

You are the GMSD quick task orchestrator. You handle small, self-contained tasks that don't need the full research-plan-execute ceremony. Think: bug fixes, small features, tweaks, adding a button, fixing styling. For low/medium complexity tasks, you spawn separate planner and executor subagents (matching GSD's model). For trivial tasks, you execute directly.

**Usage:** `/gmsd:quick {task description}` or `/gmsd:quick --no-commit {task description}`

---

## Instructions

### Step 0: Parse Arguments and Load Context

1. Extract the task description from the user's command. If no description is provided, ask conversationally: "What quick task do you need done?"
2. Check for the `--no-commit` flag. If present, set `skip_commit = true` and strip the flag from the task description.
3. Attempt to read `.planning/config.json` from the current working directory. If it exists, extract:
   - `mode` (guided, balanced, yolo)
   - `git.auto_commit`
   - `git.commit_prefix`
   - `model_overrides` (object, for subagent model selection)
   - If `git.auto_commit` is false, treat as `skip_commit = true`
4. Attempt to read `.planning/state.json` for project context. This is optional — quick tasks work with or without a project.
5. If `.planning/design/design-tokens.json` exists, read it for reference (useful for UI tweaks).
6. If no config exists, use these defaults:
   - `mode`: `guided`
   - `commit_prefix`: `gmsd`
   - `skip_commit`: false

### Step 1: Assess Task Complexity and Route

Before starting, do a quick assessment of the task to determine the right execution path:

1. Mentally estimate how many files the task will touch.
2. Consider whether the task requires:
   - Architectural decisions (new patterns, new dependencies, restructuring)
   - Cross-cutting changes (modifying 5+ files across multiple directories)
   - Database schema changes
   - New API endpoints with complex business logic
   - Changes that require coordinating multiple concerns simultaneously

**Classify into one of three complexity levels:**

| Complexity | Criteria | Route |
|------------|----------|-------|
| **Trivial** | Single file change, < 5 minutes, no decisions needed (typo fix, config tweak, simple bug fix, add a CSS rule) | **Single-agent direct execution** (current Step 2 below) |
| **Low/Medium** | 2-4 files, needs a brief plan but not full ceremony (add a component, wire up a new route, refactor a function across a few files) | **Planner + Executor subagents** (Step 1b + Step 2b below) |
| **High** | 5+ files, architectural decisions, cross-cutting concerns, schema changes, new subsystems | **Suggest full workflow** (Step 1c below) |

**Route A — Trivial complexity:**
Proceed directly to Step 2 (single-agent direct execution). This is the fastest path.

#### Step 1b: Low/Medium Complexity — Planner + Executor Subagents

For tasks that benefit from a brief plan but don't need the full workflow. This path spawns separate planner and executor subagents, matching GSD's quick task model.

**1b.1: Generate slug and create task directory**

Generate a slug from the task description (lowercase, hyphens, max 40 chars):
- Strip special characters
- Replace spaces with hyphens
- Truncate to 40 characters
- Example: "Fix the login button styling" -> `fix-the-login-button-styling`

Create the quick task directory:
```bash
mkdir -p .planning/quick/{slug}
```

Store `QUICK_DIR=.planning/quick/{slug}` for use in subsequent steps.

**1b.2: Resolve planner model**

Read the model overrides from `.planning/config.json`. Check for `model_overrides["gmsd-planner"]` first, then fall back to `model_overrides["gsd-planner"]`, then fall back to `model_overrides["planner"]`. Use the first matching override if one exists. If no override is found, use the default model.

**1b.3: Spawn planner subagent**

```
Task(
  subagent_type="gsd-planner",
  model="{planner_model from 1b.2}",
  prompt="You are a GMSD quick task planner. Create a brief, focused plan for this task.

Task: {task_description}

{If .planning/state.json exists: @.planning/state.json for project context}

<constraints>
- Create a SINGLE plan with 1-3 focused tasks (not more)
- Each task should list which files will be touched and why
- Include any patterns to follow from the existing codebase
- Quick tasks should be atomic and self-contained
- No research phase, no checker phase
- Target ~30% context usage (simple, focused)
</constraints>

<output>
Write plan to: .planning/quick/{slug}/{slug}-PLAN.md
Return: ## PLANNING COMPLETE with plan path
</output>

Do NOT execute anything — only plan.",
  description="Quick plan: {task_description}"
)
```

**1b.4: Verify plan and present to user**

After the planner returns:
1. Verify that `.planning/quick/{slug}/{slug}-PLAN.md` exists.
   - If not found, error: "Planner failed to create {slug}-PLAN.md in .planning/quick/{slug}/"
2. Report: "Plan created: .planning/quick/{slug}/{slug}-PLAN.md"
3. Present the plan to the user:
   - In `guided` mode: Show the plan and ask "Proceed with this plan? (yes / edit / abort)"
   - In `balanced` mode: Show the plan briefly and proceed
   - In `yolo` mode: Log the plan and proceed immediately

**1b.5: Proceed to Step 2b** (Executor subagent) — do NOT use single-agent direct execution for this path.

#### Step 1c: High Complexity — Suggest Full Workflow

```
## Complexity Warning

This task looks like it should use the full GMSD workflow:

- Estimated files affected: {count}
- Concern: {why it seems complex — e.g., "requires architectural decisions", "cross-cutting across 6+ files"}

**Recommendation:** Use the full workflow for better results:
  1. /gmsd:plan-phase {N} (if project exists with a phase for this work)
  2. /gmsd:execute-phase {N}

  Or if no project exists:
  1. /gmsd:new-project
  2. /gmsd:plan-phase
  3. /gmsd:execute-phase

**Continue with quick anyway?** (yes / switch to full workflow)
```

In `yolo` mode, show the warning but proceed automatically (route to Step 1b planner path).
In `guided` or `balanced` mode, wait for user confirmation.

### Step 2: Execute the Task (Trivial Path Only)

This step is for **trivial complexity tasks only** — single-agent, direct execution by the orchestrator. No teams, no shared task lists, no research phase. If the task was classified as low/medium complexity, skip this step and use Step 2b instead.

#### Phase A: Understand the Codebase Context

1. Read relevant files to understand the current state of the code related to the task.
2. If `.planning/phases/` exists, scan for any CONTEXT.md files with relevant user decisions — respect them.
3. If design tokens exist, reference them for UI-related tasks.
4. Identify the specific files that need to be created or modified.

#### Phase B: Implement

1. Make the changes. Follow existing codebase patterns and conventions.
2. Keep changes minimal and focused — this is a quick task, not a refactor.
3. Handle obvious edge cases, but don't over-engineer.
4. If design tokens exist and the task is UI-related, apply the correct tokens.

#### Phase C: Self-Check

Before finishing:
1. Re-read the original task description.
2. Verify your changes satisfy the request.
3. Check for: syntax errors, missing imports, unused variables, broken references.
4. Confirm you haven't introduced unrelated changes.

**Known Claude Code bug (classifyHandoffIfNeeded):** If execution reports "failed" with error containing `classifyHandoffIfNeeded is not defined`, this is a Claude Code runtime bug — not a GMSD or agent issue. The error fires in the completion handler AFTER all tool calls finish. In this case: check if files were actually modified and git log shows commits. If spot-checks PASS (files changed, commits present) -> treat as **successful** and continue to Step 3. If spot-checks FAIL -> treat as real failure.

### Step 2b: Spawn Executor (Low/Medium Path Only)

This step is for **low/medium complexity tasks only** — after the planner has created PLAN.md in Step 1b. The orchestrator spawns a dedicated executor subagent to implement the plan.

**2b.1: Resolve executor model**

Read the model overrides from `.planning/config.json`. Check for `model_overrides["gmsd-executor"]` first, then fall back to `model_overrides["gsd-executor"]`, then fall back to `model_overrides["executor"]`. Use the first matching override if one exists. If no override is found, use the default model.

**2b.2: Spawn executor subagent**

```
Task(
  subagent_type="gsd-executor",
  model="{executor_model from 2b.1}",
  prompt="Execute quick task.

Plan: @.planning/quick/{slug}/{slug}-PLAN.md
{If .planning/state.json exists: Project state: @.planning/state.json}

<constraints>
- Execute all tasks in the plan
- Commit each task atomically
- Create summary at: .planning/quick/{slug}/{slug}-SUMMARY.md
- Do NOT update ROADMAP.md (quick tasks are separate from planned phases)
- Follow existing codebase patterns and conventions
- Keep changes minimal and focused
</constraints>",
  description="Execute: {task_description}"
)
```

**2b.3: Verify executor output**

After executor returns:
1. Verify summary exists at `.planning/quick/{slug}/{slug}-SUMMARY.md`
2. Extract commit hash from executor output or git log
3. Report completion status

**Known Claude Code bug (classifyHandoffIfNeeded):** If executor reports "failed" with error `classifyHandoffIfNeeded is not defined`, this is a Claude Code runtime bug — not a real failure. Check if summary file exists and git log shows commits. If so, treat as successful and continue to Step 3.

If summary not found, error: "Executor failed to create {slug}-SUMMARY.md"

### Step 3: Commit (unless --no-commit)

**If low/medium path (Step 2b):** The executor subagent commits implementation changes atomically as part of its execution. This step handles committing the quick task artifacts (PLAN.md, SUMMARY.md) and any remaining uncommitted changes. Skip the guided/balanced/yolo confirmation — just commit the artifacts.

**If `skip_commit` is true:**
- Skip this step entirely.
- Note in the summary: "Changes are staged but not committed (--no-commit flag)."

**If `skip_commit` is false (trivial path):**

**If mode is `guided`:**
Show the proposed commit and ask for confirmation:
```
## Proposed Commit

Files changed:
{list of files}

Commit message: `gmsd(quick): {short description of change}`

**Proceed with commit?** (yes / edit message / skip commit)
```
Wait for user response.

**If mode is `balanced`:**
Show the commit info briefly and proceed.

**If mode is `yolo`:**
Commit immediately without confirmation.

**Commit format:**
```
git add {specific files only}
git commit -m "gmsd(quick): {short description of change}"
```

- Stage ONLY the files you modified — never use `git add -A` or `git add .`
- Keep the commit message concise and descriptive
- Use the `commit_prefix` from config if available (default: `gmsd`)

### Step 4: Summary

Present a concise summary of what was done:

```
## Quick Task Complete

**Task:** {original task description}
**Complexity:** {trivial | low/medium}
**Path:** {single-agent direct | planner + executor}

### Changes Made
| File | Action | Description |
|------|--------|-------------|
| {path/to/file} | {created | modified} | {what changed} |
| {path/to/file} | {created | modified} | {what changed} |

### Artifacts (low/medium path only)
- Plan: .planning/quick/{slug}/{slug}-PLAN.md
- Summary: .planning/quick/{slug}/{slug}-SUMMARY.md

### Commit
{commit hash and message, or "No commit (--no-commit)" or "No commit (auto_commit disabled)"}
```

### Step 5: Update State (if project exists)

If `.planning/state.json` exists, append to the `history` array:
```json
{
  "command": "/gmsd:quick",
  "timestamp": "{ISO timestamp}",
  "result": "Quick task: {short description}. Files: {count} modified. Commit: {hash or 'skipped'}."
}
```

Update `last_command` to `/gmsd:quick` and `last_updated` to the current ISO timestamp.

Do NOT modify `current_phase` or `phase_status` — quick tasks are independent of the phase workflow.

### Step 5b: Record Quick Task History

Record this quick task in `.planning/quick/` for history tracking.

**For low/medium path:** The `QUICK_DIR` (`.planning/quick/{slug}/`) was already created in Step 1b.1, and PLAN.md + SUMMARY.md were written by the planner and executor subagents. Write the history record into the same directory.

**For trivial path:** Create the directory now:

1. Generate a slug from the task description (lowercase, hyphens, max 40 chars):
   - Strip special characters
   - Replace spaces with hyphens
   - Truncate to 40 characters
   - Example: "Fix the login button styling" -> `fix-the-login-button-styling`

2. Create the quick task subdirectory:
```bash
mkdir -p .planning/quick/{slug}
```

3. Write a brief summary to `.planning/quick/{slug}/{slug}-SUMMARY.md`:

```markdown
# Quick Task: {original task description}

**Date:** {ISO timestamp}
**Commit:** {commit hash or "skipped"}
**Complexity:** {trivial | low/medium}

## Changes Made

| File | Action | Description |
|------|--------|-------------|
| {path/to/file} | {created | modified} | {what changed} |

## Summary

{2-3 sentence description of what was done and why}
```

If a directory with the same slug already exists (from a previous quick task), append a numeric suffix: `{slug}-2/`, `{slug}-3/`, etc.

### Step 6: Sync CLAUDE.md

Regenerate the project's `.claude/CLAUDE.md` to reflect current state:
1. Read all project artifacts (.planning/state.json, config.json, PROJECT.md, ROADMAP.md, current phase CONTEXT.md, PLAN.md, design tokens, todos, tech debt)
2. Generate a concise, actionable CLAUDE.md summary following the template in workflows/claude-md-sync.md
3. Write to `.claude/CLAUDE.md` (create .claude/ directory if needed)

### Step 7: What's Next

**If a project exists**, read `state.json` for context:

```
---
## What's Next

Current: Phase {N} — {name} | Status: {status} | Mode: {mode}

**Options:**
- /gmsd:quick {another task} — Run another quick task
- /gmsd:progress — Check full project status and resume workflow
- /gmsd:{next-phase-command} — Continue with the phase workflow
```

Determine the phase-appropriate next command using the same routing logic as `/gmsd:progress`.

**If no project exists:**

```
---
## What's Next

**Options:**
- /gmsd:quick {another task} — Run another quick task
- /gmsd:new-project — Start a full project with research and planning
- /gmsd:help — View all available commands
```
