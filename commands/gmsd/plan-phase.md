# GMSD Plan Phase — Research + Plan with Verification Spec

You are the GMSD planning orchestrator. Your job is to produce a high-quality execution plan for a specific phase, complete with tasks, dependencies, file ownership, and a verification spec.

**This command accepts a phase number as argument.** When the user runs `/gmsd:plan-phase 3`, the argument is `3`.

## Instructions

### 1. Parse Phase Number

Extract the phase number from the command argument.

**If no phase number is provided:**
- Read `.planning/state.json` to get `current_phase`
- If `current_phase` exists, use that
- If `current_phase` is null, show an error and suggest `/gmsd:new-project`

**Validate the phase number:**
- Read `.planning/ROADMAP.md` to confirm the phase exists
- If the phase doesn't exist, show an error and suggest `/gmsd:progress`

### 2. Read Context

Read all available context files:

- `.planning/ROADMAP.md` — Phase goal, scope, dependencies, complexity
- `.planning/PROJECT.md` — Project vision, requirements, constraints
- `.planning/config.json` — Mode setting, team sizes, model overrides
- `.planning/RESEARCH.md` — Project-level research (if exists)
- `.planning/phases/{N}-{name}/RESEARCH.md` — Phase-level research (if exists)
- `.planning/phases/{N}-{name}/CONTEXT.md` — User decisions (if discuss-phase was run)

Also read the existing codebase to understand:
- Current file structure and architecture
- Patterns and conventions in use
- What already exists vs. what needs to be built
- Dependencies and imports

Show what context was found:

```
 ┌─────────────────────────────────────────────────────────────────┐
 │  GMSD Plan — Phase {N}: {phase_name}                           │
 └─────────────────────────────────────────────────────────────────┘

 Context loaded:
   [x] ROADMAP.md     — Phase goal and scope
   [{x or space}] RESEARCH.md    — {Project/phase-level research}
   [{x or space}] CONTEXT.md     — {User-locked decisions}
   [x] Codebase       — {file_count} files analyzed
```

### 3. Phase Research (if needed)

Check if `.planning/phases/{N}-{name}/RESEARCH.md` exists.

**If it does NOT exist**, run a lightweight research pass. This is a single-agent research task (NOT a full team — planning research is lighter than project research).

Read the model overrides from `.planning/config.json`. Check for `model_overrides["gsd-phase-researcher"]` or `model_overrides["researcher"]`. Use the specified model if an override exists.

Spawn a single researcher subagent using the Task tool:

```
Task(
  prompt="You are a GMSD phase researcher. Research the technical landscape for this specific phase.

PROJECT: {project_name}
PHASE {N}: {phase_name}
GOAL: {phase_goal}
SCOPE: {phase_scope}

EXISTING CODEBASE:
{summary of relevant existing code}

USER DECISIONS (from CONTEXT.md):
{decisions summary, or 'No CONTEXT.md — no user decisions locked yet'}

YOUR JOB:
Research the specific technical needs of this phase:
1. Best practices for implementing {phase scope} on {platform}
2. Libraries or APIs needed for this phase
3. Common patterns and pitfalls
4. How this integrates with existing code

Write your findings as a RESEARCH.md file at .planning/phases/{N}-{name}/RESEARCH.md using the GMSD research template format."
)
```

Wait for the researcher to complete.

Show: `Research complete. Phase-level RESEARCH.md written.`

### 4. Plan Creation

Now spawn the planner agent to create the execution plan.

Read the model overrides from `.planning/config.json`. Check for `model_overrides["gsd-planner"]` or `model_overrides["planner"]`. Use the specified model if an override exists.

Spawn the planner subagent:

```
Task(
  prompt="You are a GMSD planner. Create a detailed execution plan for this phase.

PROJECT: {project_name}
PHASE {N}: {phase_name}
GOAL: {phase_goal}
SCOPE: {phase_scope}
COMPLEXITY: {complexity}

RESEARCH FINDINGS:
{contents of RESEARCH.md}

USER DECISIONS:
{contents of CONTEXT.md, or 'No user decisions locked. Use best judgment based on research.'}

EXISTING CODEBASE:
{detailed summary of relevant existing code — file paths, patterns, architecture}

DEPENDENCY PHASES:
{what previous phases produced — API contracts, data models, established patterns}

YOUR JOB:
Create PLAN.md at .planning/phases/{N}-{name}/PLAN.md using the GMSD plan template.

Requirements for the plan:
1. TASKS — Break the phase into atomic tasks. Each task should:
   - Be completable by one executor in isolation
   - Have clear acceptance criteria (testable, not vague)
   - List specific files to create or modify
   - Declare dependencies on other tasks (by task number)
   - Be estimated as trivial/low/medium/high complexity

2. TASK ORDERING — Tasks must be ordered so dependencies flow top-down. An executor should be able to claim any task whose dependencies are marked done.

3. FILE OWNERSHIP — Map every file that will be touched to the task(s) that own it. Flag shared files that multiple tasks need (the team lead will serialize access to these).

4. VERIFICATION SPEC — Define how to verify the PHASE GOAL (not individual tasks). Use goal-backward reasoning:
   - Start from the goal statement
   - Decompose it into verifiable criteria
   - Define specific verification steps (manual and automated)
   - Include shell commands or test commands where possible

5. RISK ASSESSMENT — Identify 2-4 risks specific to this phase with mitigations.

IMPORTANT CONSTRAINTS:
- Respect ALL decisions in CONTEXT.md. Do not override user choices.
- Follow existing codebase patterns and conventions.
- Tasks should be sized for parallel execution (no single task should take more than ~30 minutes of agent time).
- Every task needs 'Files to Touch' — the executor must know exactly where to write code.
- The verification spec must be concrete enough for an automated check."
)
```

Wait for the planner to complete.

### 5. Plan Verification

Spawn a plan checker to review the plan quality.

Read the model overrides from `.planning/config.json`. Check for `model_overrides["gsd-plan-checker"]` or `model_overrides["plan-checker"]`. Use the specified model if an override exists.

```
Task(
  prompt="You are a GMSD plan checker. Review the execution plan and verify its quality.

PHASE GOAL: {phase_goal}
USER DECISIONS: {CONTEXT.md contents or 'none'}
RESEARCH: {RESEARCH.md key points}

PLAN TO REVIEW:
{contents of the PLAN.md that was just created}

CHECK THE FOLLOWING:

1. GOAL COVERAGE — Does the plan, if fully executed, achieve the phase goal? Are there gaps?

2. TASK QUALITY — For each task:
   - Is the description clear enough for an executor to work independently?
   - Are acceptance criteria testable (not vague)?
   - Are file paths specific (not 'relevant files')?
   - Are dependencies correctly declared?

3. DECISION COMPLIANCE — Does the plan respect every decision in CONTEXT.md? Flag any deviations.

4. DEPENDENCY CORRECTNESS — Are task dependencies valid? No circular deps? No missing deps?

5. FILE OWNERSHIP — Are there file conflicts (multiple tasks modifying same file without being flagged as shared)?

6. VERIFICATION SPEC — Is the verification spec concrete enough to actually verify the goal? Does it include automated checks?

7. RISK COVERAGE — Are the identified risks reasonable? Any obvious risks missing?

OUTPUT FORMAT:
If the plan PASSES: Write 'PLAN APPROVED' followed by a brief summary of strengths.
If the plan has ISSUES: Write 'REVISION NEEDED' followed by a numbered list of specific issues to fix. Be precise — tell the planner exactly what to change."
)
```

Wait for the checker to complete.

**If revision is needed:**

Show the user: `Plan checker found issues. Revising...`

Send the checker's feedback back to the planner (spawn a new planner Task with the revision instructions). Allow up to 2 revision cycles.

```
Task(
  prompt="You are a GMSD planner. Revise the plan based on checker feedback.

ORIGINAL PLAN:
{contents of PLAN.md}

CHECKER FEEDBACK:
{checker output}

Revise the plan to address every issue. Write the updated plan to .planning/phases/{N}-{name}/PLAN.md, overwriting the previous version.

Do NOT remove content that wasn't flagged — only fix the issues identified."
)
```

After revision, run the checker again. If it still has issues after 2 cycles, present the remaining issues to the user for resolution.

### 6. User Approval (Guided Mode)

Read `.planning/config.json` mode.

**If mode is `guided`:**

Present the plan summary to the user:

```
 PLAN SUMMARY — Phase {N}: {phase_name}
 ─────────────────────────────────────────────────────────────

 Tasks: {count} tasks ({trivial} trivial, {low} low, {medium} medium, {high} high)

 Task List:
   1. {task_name} [{complexity}] — {brief description}
   2. {task_name} [{complexity}] — {brief description}
   ...

 Dependencies:
   {task N} depends on {task M}
   ...

 Shared Files (require serialized access):
   {file} — touched by tasks {list}
   ...

 Verification:
   {verification criteria summary}

 Risks:
   {risk 1} — {mitigation}
   ...
```

Ask: **"Does this plan look good? Options:"**
- **Approve** — Proceed as planned
- **Request changes** — Tell me what to adjust (re-runs planner with your feedback)
- **Reject** — Scrap the plan and re-discuss (routes to `/gmsd:discuss-phase`)

If the user requests changes, feed their feedback to a new planner revision and re-present.

**If mode is `balanced`:**
- Show a brief summary (task count, key decisions, risks)
- Ask: "Plan ready. Proceed? (yes / show details / request changes)"

**If mode is `yolo`:**
- Show a one-line summary: "Phase {N} planned: {count} tasks, {complexity} complexity. Plan checker: approved."
- Continue without pausing.

### 7. Check for UI Components

Scan the PLAN.md for UI-related indicators:
- Tasks that mention: UI, frontend, component, screen, page, layout, style, design, button, form, modal, dialog, animation, responsive, CSS, Tailwind, view, template
- Files targeting: `components/`, `pages/`, `screens/`, `views/`, `styles/`, `*.css`, `*.scss`, `*.tsx` (with JSX), `*.vue`, `*.svelte`

Set a flag: `has_ui_components` = true/false

Also check `.planning/config.json` for `design.enabled` and `design.auto_detect`.

### 8. Update State

Update `.planning/state.json`:
- Set `current_phase` to the phase number
- Set `phase_status` to `"planned"`
- Update `last_command` to `/gmsd:plan-phase`
- Update `last_updated` to current ISO timestamp
- Append to history:
```json
{ "command": "/gmsd:plan-phase {N}", "timestamp": "{ISO}", "result": "Plan created with {count} tasks, checker: {approved/revised}" }
```

Update `.planning/STATE.md` to reflect the new status.

Update ROADMAP.md phase status to "planned" (in the phase list table).

### 9. What's Next

Determine the recommendation based on UI detection:

**If `has_ui_components` is true AND design is enabled:**

```
---
## What's Next

Current: Phase {N} — {phase_name} | Status: planned | Mode: {mode}

**Recommended next step:**
--> /gmsd:design-phase {N} — This phase has UI components. Create design specs before execution so executors have pixel-perfect targets.

**Other options:**
- /gmsd:execute-phase {N} — Skip design and go straight to execution (executors will use their judgment for UI)
- /gmsd:discuss-phase {N} — Re-discuss decisions (will require re-planning)
- /gmsd:progress — Check full project status
- /gmsd:settings — Adjust configuration
```

**If `has_ui_components` is false OR design is disabled:**

```
---
## What's Next

Current: Phase {N} — {phase_name} | Status: planned | Mode: {mode}

**Recommended next step:**
--> /gmsd:execute-phase {N} — The plan is locked and ready. Launch the executor team to start building.

**Other options:**
- /gmsd:plan-phase {N} — Re-plan from scratch (discards current plan)
- /gmsd:discuss-phase {N} — Re-discuss decisions (will require re-planning)
- /gmsd:progress — Check full project status
- /gmsd:settings — Adjust configuration
```
