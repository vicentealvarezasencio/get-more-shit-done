# Workflow: Phase Planning

**Slash Command:** `/gmsd:plan-phase {N}`
**Role:** Team Lead
**Produces:** `.planning/phases/{N}-{name}/PLAN.md`

---

## Overview

Create an executable plan for a specific phase. This workflow is sequential, not team-based: research (if needed), then plan creation, then plan checking, with a revision loop. Each step spawns a single subagent. The output is a PLAN.md with tasks, dependencies, file ownership, acceptance criteria, and a verification spec.

---

## Prerequisites

Before starting, verify these conditions:

```
1. .planning/ROADMAP.md exists
   - If NOT: STOP. "No roadmap found. Run /gmsd:new-project first."

2. Phase {N} exists in ROADMAP.md
   - If NOT: STOP. "Phase {N} not found in ROADMAP.md."

3. Phase {N} dependencies are satisfied
   - Read ROADMAP.md phase {N} "Depends On" field
   - Check if those phases are in state.json completed_phases
   - If unsatisfied dependencies: WARN user, ask if they want to proceed anyway

4. Phase is not already planned (no existing PLAN.md or user confirms re-plan)
   - If PLAN.md exists and user did NOT confirm re-plan: STOP. Ask user.
   - If PLAN.md exists and user confirmed: backup old PLAN.md, proceed.
```

---

## State Transitions

```
null --> researching --> planning --> checking --> planned
                                        |
                              (if check fails)
                                        |
                                  revision_1 --> checking --> planned
                                                    |
                                          (if check fails again)
                                                    |
                                              revision_2 --> checking --> planned (force-accept)
```

---

## Step 1: Read Phase Context

**Actor:** Lead

```
Read and collect:
  - .planning/config.json                          --> project settings
  - .planning/PROJECT.md                            --> project vision, requirements
  - .planning/ROADMAP.md                            --> phase {N} goal, scope, dependencies
  - .planning/phases/{N}-{name}/CONTEXT.md          --> user decisions (if exists)
  - .planning/phases/{N}-{name}/RESEARCH.md         --> existing research (if exists)
  - .planning/RESEARCH.md                           --> project-level research (if exists)

Extract:
  phase_name = ROADMAP.md phase {N} name
  phase_goal = ROADMAP.md phase {N} goal
  phase_scope = ROADMAP.md phase {N} scope
  phase_deps = ROADMAP.md phase {N} dependencies
  has_context = CONTEXT.md exists
  has_research = phase-level RESEARCH.md exists
  decisions = CONTEXT.md decisions (if exists)
```

---

## Step 2: Research (If Needed)

**Actor:** Lead spawns single researcher subagent
**Condition:** Skip if `.planning/phases/{N}-{name}/RESEARCH.md` already exists

```
IF has_research == true:
  Lead: "Research already exists for Phase {N}. Skipping to planning."
  GOTO Step 3

IF has_research == false:
  Lead: "No research found for Phase {N}. Running phase research first."
```

### 2a. Check Model Overrides

```
Read .planning/config.json
IF config.model_overrides["researcher"] exists:
  researcher_model = config.model_overrides["researcher"]
ELSE:
  researcher_model = default
```

### 2b. Create Research Directory

```
mkdir -p .planning/phases/{N}-{name}/research/
```

### 2c. Spawn Researcher Subagent

This uses the Task tool (single subagent), NOT a team.

```
Task(
  subagent_type="general-purpose",
  prompt="{contents of agents/gmsd-researcher.md}

  PROJECT CONTEXT:
  - Project: {project_name}
  - Phase: {N} -- {phase_name}
  - Phase goal: {phase_goal}
  - Phase scope: {phase_scope}
  - Platform: {platform}
  - Framework: {framework}

  RESEARCH MISSION:
  Research what is needed to implement Phase {N}: '{phase_name}'.

  Focus on:
  1. Technical approaches for: {phase_scope}
  2. Libraries or APIs needed for this specific phase
  3. Patterns and best practices for the implementation
  4. Risks and pitfalls specific to this phase
  5. Existing codebase patterns to follow (explore the repo)

  Write a single unified research output to:
  .planning/phases/{N}-{name}/RESEARCH.md

  Use the RESEARCH.md template structure. Include:
  - Findings organized by topic
  - Technical decisions with rationale
  - Risks discovered
  - Recommendations for the planner
  - References with URLs and file paths"
)
```

### 2d. Update State

```
Update state.json:
  phase_status: "researching"
  current_phase: {N}
```

### 2e. Wait for Research Completion

```
WAIT for Task tool to return

IF research output written successfully:
  Read .planning/phases/{N}-{name}/RESEARCH.md
  Verify it has substantive content (not empty/stub)
  PROCEED to Step 3

IF research failed or output is empty:
  WARN user: "Research produced insufficient output."
  Ask: "Proceed to planning without research, or retry?"
  IF retry: re-run Step 2c
  IF proceed: continue with note that research was limited
```

---

## Step 3: Create Plan

**Actor:** Lead spawns single planner subagent

### 3a. Check Model Overrides

```
Read .planning/config.json
IF config.model_overrides["planner"] exists:
  planner_model = config.model_overrides["planner"]
ELSE:
  planner_model = default
```

### 3b. Update State

```
Update state.json:
  phase_status: "planning"
```

### 3c. Spawn Planner Subagent

```
Task(
  subagent_type="general-purpose",
  prompt="{contents of agents/gmsd-planner.md}

  PROJECT CONTEXT:
  - Project: {project_name}
  - Phase: {N} -- {phase_name}
  - Phase goal: {phase_goal}
  - Phase scope: {phase_scope}
  - Mode: {mode}
  - Git commit prefix: {git.commit_prefix}

  CONTEXT ASSEMBLY (two-step):

  Step 1 — Quick scan (read these first for project awareness):
  - .planning/config.json — project settings
  - .planning/HISTORY-DIGEST.json — compiled history of completed phases (if exists)
  - .planning/ROADMAP.md — phase goals, dependencies, current status

  Step 2 — Deep load (read these for phase-specific planning):
  - .planning/PROJECT.md — project vision and requirements
  - .planning/phases/{N}-{name}/RESEARCH.md — research findings for this phase
  {IF has_context:}
  - .planning/phases/{N}-{name}/CONTEXT.md — user-locked decisions
  {ENDIF}
  {IF phase has dependencies in ROADMAP:}
  - .planning/phases/{dep}-{name}/SUMMARY.md — what dependency phases built (only direct deps)
  {ENDIF}

  NOTE: Do NOT read full SUMMARY.md or VERIFICATION.md for non-dependency phases.
  The HISTORY-DIGEST.json gives you sufficient context about those phases.

  CODEBASE EXPLORATION:
  Before writing the plan, explore the existing codebase to understand:
  - Current project structure and file organization
  - Existing patterns and conventions
  - Dependencies already installed
  - Interfaces that this phase must respect

  OUTPUT:
  Write PLAN.md to .planning/phases/{N}-{name}/PLAN.md

  REQUIREMENTS:
  - Every task must be self-contained (executor has no shared context)
  - Include file ownership matrix (no conflicts between parallel tasks)
  - Include dependency graph with ASCII visualization
  - Include verification spec for the phase goal
  - Task descriptions must include: files to read, files to create/modify,
    acceptance criteria, implementation details, pattern references
  - Minimize dependencies to maximize parallelism
  - Each task completable in one executor session (~30-60 min coding)

  {IF revision_notes:}
  REVISION NOTES FROM PLAN CHECKER:
  {revision_notes}

  Address each point. Fix valid issues. For any you disagree with,
  add a comment in the plan explaining your reasoning.
  {ENDIF}"
)
```

### 3d. Wait for Plan Completion

```
WAIT for Task tool to return

Read .planning/phases/{N}-{name}/PLAN.md
Verify:
  - File exists and has content
  - Has Tasks section with at least 1 task
  - Has File Ownership Matrix
  - Has Verification Spec
  - Has Dependency Graph

IF verification fails:
  WARN: "Plan is incomplete. Missing: {sections}."
  Re-run planner with specific guidance about missing sections.
```

---

## Step 4: Check Plan

**Actor:** Lead spawns single plan-checker subagent

### 4a. Check Model Overrides

```
Read .planning/config.json
IF config.model_overrides["plan-checker"] exists:
  checker_model = config.model_overrides["plan-checker"]
ELSE:
  checker_model = default
```

### 4b. Update State

```
Update state.json:
  phase_status: "checking"
```

### 4c. Spawn Plan Checker Subagent

```
Task(
  subagent_type="general-purpose",
  prompt="You are a GMSD Plan Checker. Your job is to review a PLAN.md
  for quality, completeness, and executability.

  PLAN TO REVIEW:
  .planning/phases/{N}-{name}/PLAN.md

  REFERENCE DOCUMENTS:
  - .planning/PROJECT.md -- project requirements
  - .planning/ROADMAP.md -- phase goal and scope
  - .planning/phases/{N}-{name}/RESEARCH.md -- research findings
  {IF has_context:}
  - .planning/phases/{N}-{name}/CONTEXT.md -- user decisions
  {ENDIF}

  REVIEW CHECKLIST:

  1. GOAL ALIGNMENT
     - Does the plan achieve the phase goal from ROADMAP.md?
     - Are all scope items from ROADMAP.md covered by at least one task?
     - Does the plan respect user decisions from CONTEXT.md?

  2. TASK QUALITY
     - Is each task self-contained? (Could an executor with zero context complete it?)
     - Are acceptance criteria specific and testable?
     - Are file paths explicit (files to read, create, modify)?
     - Is each task appropriately sized? (Not too large, not too trivial)
     - Do task descriptions reference existing patterns/conventions?

  3. DEPENDENCY CORRECTNESS
     - Are dependencies justified? (Does B genuinely need A to finish first?)
     - Are there unnecessary dependencies reducing parallelism?
     - No circular dependencies?
     - Dependency graph is acyclic?

  4. FILE OWNERSHIP
     - Every created/modified file is owned by exactly one task?
     - No two independent tasks modify the same file?
     - Shared files have dependency chains?

  5. VERIFICATION SPEC
     - Does verification spec check the phase GOAL (not just task completion)?
     - Are verification criteria specific and testable?
     - Does it include both automated checks and manual review items?

  6. RESEARCH ALIGNMENT
     - Does the plan use recommended approaches from RESEARCH.md?
     - Are risks from RESEARCH.md addressed in the plan's risk section?
     - If plan deviates from research recommendations, is it justified?

  CODEBASE CHECK:
  Explore the existing codebase to verify:
  - Referenced files actually exist (or their parent directories do)
  - Pattern references in task descriptions match actual codebase patterns
  - No tasks create files that already exist (unless intentionally modifying them)

  OUTPUT FORMAT:

  Write your review as a structured report:

  ## Plan Check: Phase {N} -- {phase_name}

  ### Verdict: PASS | REVISE | FAIL

  ### Issues Found

  #### Critical (must fix before execution)
  - {issue}: {description} -- Suggested fix: {fix}

  #### Important (should fix for better execution)
  - {issue}: {description} -- Suggested fix: {fix}

  #### Minor (nice to have)
  - {issue}: {description}

  ### Strengths
  - {what the plan does well}

  ### Parallelism Assessment
  - Max parallel tasks: {N}
  - Bottleneck tasks: {list}
  - Suggested reordering: {if any}

  DECISION RULES:
  - PASS: 0 critical issues, 0-2 important issues
  - REVISE: 1+ critical issues OR 3+ important issues
  - FAIL: Fundamental structural problem requiring complete rewrite

  Print the full review to stdout. This is your only output."
)
```

### 4d. Process Check Result

```
Read checker output

IF verdict == "PASS":
  Lead: "Plan check passed. PLAN.md approved for execution."
  GOTO Step 5 (Finalize)

IF verdict == "REVISE":
  revision_count += 1
  IF revision_count > 2:
    Lead: "Plan has been revised twice. Force-accepting with known issues."
    Log remaining issues to .planning/phases/{N}-{name}/PLAN-REVIEW.md
    GOTO Step 5 (Finalize)
  ELSE:
    Lead: "Plan needs revision. {critical_count} critical, {important_count} important issues."
    revision_notes = checker's critical + important issues with suggested fixes
    GOTO Step 3c (re-run planner with revision_notes)

IF verdict == "FAIL":
  Lead: "Plan fundamentally flawed. Checker recommends full rewrite."
  Present checker's reasoning to user
  Ask: "Rewrite the plan, or override and proceed with current plan?"
  IF rewrite: GOTO Step 3c with full rewrite instructions
  IF override: GOTO Step 5 (Finalize) with warning logged
```

---

## Step 5: Finalize Plan

**Actor:** Lead

### 5a. Update State

```
Update state.json:
  current_phase: {N}
  phase_status: "planned"
  last_command: "/gmsd:plan-phase"
  last_updated: "{ISO timestamp}"
  history: [..., { "command": "/gmsd:plan-phase {N}", "timestamp": "{ISO}",
                   "result": "Phase {N} planned: {task_count} tasks, {max_parallel} parallelizable" }]
```

### 5b. Update STATE.md

```
Regenerate STATE.md with current values from state.json.
```

### 5c. Present Summary

```
Lead: "Phase {N} ({phase_name}) is planned!

  Plan: .planning/phases/{N}-{name}/PLAN.md
  Tasks: {task_count}
  Max parallel: {max_parallel_count}
  Dependencies: {dependency_description}
  Check result: {PASS/REVISE with N revisions}

  Task overview:
  {T-01}: {name} -- {complexity} -- depends: {deps}
  {T-02}: {name} -- {complexity} -- depends: {deps}
  ...

---
## What's Next

Current: Phase {N} -- {phase_name} | Status: planned | Mode: {mode}

**Recommended next step:**
{IF phase has UI components detected:}
--> /gmsd:design-phase {N} -- Create UI specifications before execution
{ELSE:}
--> /gmsd:execute-phase {N} -- Execute the plan with a team of agents
{ENDIF}

**Other options:**
- /gmsd:discuss-phase {N} -- Revisit decisions before executing
- /gmsd:plan-phase {N} -- Re-plan (overwrites current plan)
- /gmsd:progress -- View full project status"
```

---

## Error Handling

```
IF researcher subagent crashes (Step 2):
  - Attempt re-spawn once
  - If second failure: ask user whether to proceed without research
  - Log gap in state history

IF planner subagent crashes (Step 3):
  - Check if partial PLAN.md was written
  - If partial: present to user, offer to complete manually or re-run
  - If nothing written: re-spawn planner

IF plan-checker subagent crashes (Step 4):
  - Skip check, warn user
  - Mark plan as "unchecked" in state
  - Proceed to finalize with caveat

IF PLAN.md fails structural validation (Step 3d):
  - Re-run planner with explicit instructions about missing sections
  - Max 2 re-runs before asking user to intervene
```
