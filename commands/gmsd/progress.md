# GMSD Progress — Project Status and Routing Engine

You are the GMSD routing engine. This is the most important command in the system. Your job is to show the user exactly where they are and guide them to the next logical action.

## Instructions

### 1. Load Progress Context

**Load progress context (with file contents to avoid redundant reads):**

```bash
INIT=$(node ~/.claude/get-more-shit-done/bin/gmsd-tools.js init progress --include state,roadmap,project,config)
```

Extract from init JSON: `project_exists`, `roadmap_exists`, `state_exists`, `phases`, `current_phase`, `next_phase`, `milestone_version`, `completed_count`, `phase_count`, `paused_at`.

**File contents (from --include):** `state_content`, `roadmap_content`, `project_content`, `config_content`. These are null if files don't exist.

If `project_exists` is false (no `.planning/` directory):

```
 ┌─────────────────────────────────────────────────────────────────┐
 │  GMSD Progress — No Active Project                             │
 └─────────────────────────────────────────────────────────────────┘

 No .planning/ directory found in this project.

 To get started, run:

   /gmsd:new-project

 This will:
   - Gather your project vision, requirements, and constraints
   - Run a parallel research team to explore the technical landscape
   - Create your project roadmap with phased milestones
   - Set up the .planning/ directory structure

---
## What's Next

Current: No active project

**Recommended next step:**
--> /gmsd:new-project — Initialize your project with parallel research

**Other options:**
- /gmsd:help — View the full command reference
- /gmsd:settings — Pre-configure GMSD settings
```

Then stop. Do not continue.

If missing STATE.md: suggest `/gmsd:new-project`.

**If ROADMAP.md missing but PROJECT.md exists:**

This means a milestone was completed and archived. Route to between-milestones handling (all phases complete).

If missing both ROADMAP.md and PROJECT.md: suggest `/gmsd:new-project`.

Also read (if not already provided by init):
- `.planning/state.json` — Current execution state
- `.planning/config.json` — Project configuration
- `.planning/ROADMAP.md` — Phase breakdown
- `.planning/PROJECT.md` — Project definition

### 2. Display Project Overview

Read state.json and config.json. Show:

```
 ┌─────────────────────────────────────────────────────────────────┐
 │  GMSD Progress — {project_name}                                │
 └─────────────────────────────────────────────────────────────────┘

 Project:    {project_name}
 Version:    {version}
 Mode:       {mode}
 Milestone:  {current_milestone}
```

### 3. Display Active Team (if any)

If `state.json.active_team` is not null, show:

```
 ACTIVE TEAM
 ─────────────────────────────────────────────────────────────
 Team:    {active_team}
 Type:    {team_type — research/planning/execution/verification/debug}
 Status:  Running / Paused

 Note: A team is currently active. You may need to wait for it
 to complete or run /gmsd:resume-work to continue.
```

### 3.5. Analyze Roadmap via gmsd-tools

**Get comprehensive roadmap analysis (replaces manual parsing):**

```bash
ROADMAP=$(node ~/.claude/get-more-shit-done/bin/gmsd-tools.js roadmap analyze)
```

This returns structured JSON with:
- All phases with disk status (complete/partial/planned/empty/no_directory)
- Goal and dependencies per phase
- Plan and summary counts per phase
- Aggregated stats: total plans, summaries, progress percent
- Current and next phase identification

Use this instead of manually reading/parsing ROADMAP.md where possible.

**For recent work context**, use `summary-extract` for efficient SUMMARY parsing:
```bash
node ~/.claude/get-more-shit-done/bin/gmsd-tools.js summary-extract <path> --fields one_liner
```

**For progress bar display:**
```bash
PROGRESS_BAR=$(node ~/.claude/get-more-shit-done/bin/gmsd-tools.js progress bar --raw)
```

### 4. Display Phase Progress Table

Read ROADMAP.md (or use roadmap analyze output) and cross-reference with state.json to build a progress table. For each phase, determine its status from:
- state.json `completed_phases` array (for done phases)
- state.json `current_phase` and `phase_status` (for the active phase)
- Check if `.planning/phases/{N}-{name}/` directory exists
- Check if RESEARCH.md, CONTEXT.md, PLAN.md exist within that directory

Show the table:

```
 PHASE PROGRESS
 ─────────────────────────────────────────────────────────────
 #   Phase Name              Status          Artifacts
 --- ----------------------- --------------- ------------------
 1   {phase_1_name}          {status}        {artifacts_list}
 2   {phase_2_name}          {status}        {artifacts_list}
 3   {phase_3_name}          {status}        {artifacts_list}
 4   {phase_4_name}          {status}        {artifacts_list}
 5   {phase_5_name}          {status}        {artifacts_list}
```

**Status values:** pending, researched, discussed, planned, designed, executing, executed, verifying, verified, done, blocked

**Artifacts:** Show which key files exist for each phase:
- R = RESEARCH.md exists
- C = CONTEXT.md exists
- P = PLAN.md exists
- D = DESIGN.md exists
- V = VERIFICATION.md exists

Example: `[R C P _ V]` means research, context, and plan done; no design; verification done.

### 5. Check for Paused Sessions

If state.json contains a `paused_at` field or `phase_status` is "paused":

```
 PAUSED SESSION DETECTED
 ─────────────────────────────────────────────────────────────
 Paused at: {paused_at timestamp}
 Phase:     {current_phase}
 Status:    {phase_status} (paused)

 Run /gmsd:resume-work to pick up where you left off.
```

### 6. Route to Next Action

This is the core routing logic. Evaluate the current state and determine the single best next action.

**Routing rules (evaluated in priority order):**

1. **Paused session exists** --> `/gmsd:resume-work`
   - "You have a paused session. Resume to continue where you left off."

2. **Active team running** --> Wait or `/gmsd:resume-work`
   - "A team is currently active. Wait for completion or check on it."

3. **No phases in ROADMAP.md** --> `/gmsd:new-project`
   - "Your roadmap has no phases. Run project setup to define them."

4. **Current phase has status "executed" or "verifying"** --> `/gmsd:verify-work {N}`
   - "Phase {N} has been executed. Verify the results before moving on."

5. **Current phase has verification gaps (VERIFICATION.md exists with gaps)** --> `/gmsd:debug {N}`
   - "Verification found gaps in phase {N}. Debug to resolve them."

6. **Current phase has status "verified" or "done"** --> Advance to next phase
   - If next phase exists: determine what it needs next (discuss/plan/execute)
   - If no next phase: `/gmsd:milestone` — "All phases complete!"

7. **Current phase has status "planned" or "designed"** --> `/gmsd:execute-phase {N}`
   - "Phase {N} is planned and ready for execution."

8. **Current phase has status "planned" AND phase has UI components** --> `/gmsd:design-phase {N}`
   - Check PLAN.md for UI-related tasks. If found, suggest design first.

9. **Current phase has status "discussed"** --> `/gmsd:plan-phase {N}`
   - "Decisions are locked for phase {N}. Create the execution plan."

10. **Current phase has status "researched"** --> `/gmsd:discuss-phase {N}`
    - "Research is complete for phase {N}. Discuss decisions with your input."

11. **Current phase has status "pending"** --> `/gmsd:discuss-phase {N}` or `/gmsd:plan-phase {N}`
    - If this is the kind of phase that benefits from discussion, suggest discuss.
    - Otherwise suggest plan-phase directly.

12. **All phases in current milestone are done** --> `/gmsd:milestone`
    - "Milestone {M} is complete! Archive and prepare the next version."

### 7. Display Routing Result

Show the recommended action prominently:

```
 RECOMMENDED NEXT STEP
 ─────────────────────────────────────────────────────────────

   --> /gmsd:{recommended-command} {args}

   {Explanation of why this is the right next step.}
   {1-2 sentences of context about what this command will do.}
```

### 8. What's Next Section

```
---
## What's Next

Current: Phase {N} — {name} | Status: {status} | Mode: {mode}

**Recommended next step:**
--> /gmsd:{recommended-command} — {why this is the right next step}

**Other options:**
- /gmsd:{option-1} — {when you'd use this}
- /gmsd:{option-2} — {when you'd use this}
- /gmsd:settings — Adjust configuration
- /gmsd:help — View full command reference
```

The "other options" should include contextually relevant alternatives. For example:
- If the recommendation is execute-phase, alternatives might be discuss-phase (to revisit decisions) or plan-phase (to revise the plan)
- If the recommendation is verify-work, alternatives might be execute-phase (to add more work) or progress (to check overall status)

### 9. Update State

Append to state.json history:
```json
{ "command": "/gmsd:progress", "timestamp": "{ISO timestamp}", "result": "Routed to /gmsd:{recommended}" }
```

Update `last_command` to `/gmsd:progress` and `last_updated` to the current ISO timestamp.
