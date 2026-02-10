# Workflow: Team Execution

**Slash Command:** `/gmsd:execute-phase {N}`
**Role:** Team Lead
**Produces:** Implemented code with per-task commits

---

## Overview

THE MOST CRITICAL WORKFLOW IN GMSD. Execute a planned phase using a team of executor agents who autonomously claim tasks from a shared task list, implement code, commit atomically, and coordinate via messaging. The lead monitors progress, handles checkpoints, resolves conflicts, dynamically scales the team, and manages completion.

This workflow replaces wave-based execution with continuous-flow task claiming. Agents work in parallel on unblocked tasks, and new tasks automatically unblock as dependencies complete. No artificial wave boundaries.

---

## Prerequisites

Before starting, verify ALL of these conditions:

```
1. PLAN.md exists and has tasks
   path = .planning/phases/{N}-{name}/PLAN.md
   IF NOT exists: STOP. "No plan for Phase {N}. Run /gmsd:plan-phase {N} first."
   Parse tasks from PLAN.md. IF task_count == 0: STOP. "Plan has no tasks."

2. Read config.json
   path = .planning/config.json
   Extract: mode, teams.default_executors, teams.max_executors, teams.scale_up_threshold
   Extract: git.auto_commit, git.commit_per, git.commit_prefix
   Extract: model_overrides (check for "executor" key)

3. Design specs exist (if applicable)
   IF .planning/design/UI-SPEC.md exists:
     has_design = true
     design_path = .planning/design/
   ELSE:
     has_design = false

4. State is correct
   Read state.json
   IF phase_status not in ["planned", "designed"]:
     WARN: "Phase {N} status is '{phase_status}', expected 'planned' or 'designed'."
     Ask user to confirm proceeding.

5. No active team
   IF state.json.active_team is not null:
     WARN: "Team '{active_team}' is still active."
     Ask: "Shut down existing team and start fresh, or abort?"
     IF abort: STOP.
     IF shutdown: send shutdown_request to all members, wait, delete team.
```

---

## State Transitions

```
planned/designed --> executing --> executed
```

---

## Step 1: Parse PLAN.md into Task List

**Actor:** Lead
**This step is critical. Every task description must be self-contained.**

### 1a. Read All Context

```
Read and hold in context:
  plan = Read(.planning/phases/{N}-{name}/PLAN.md)
  roadmap = Read(.planning/ROADMAP.md)
  config = Read(.planning/config.json)
  project = Read(.planning/PROJECT.md)

  IF exists: context = Read(.planning/phases/{N}-{name}/CONTEXT.md)
  IF exists: research = Read(.planning/phases/{N}-{name}/RESEARCH.md)

Extract from ROADMAP.md:
  phase_goal = Phase {N} goal
  phase_name = Phase {N} name
  phase_scope = Phase {N} scope

Extract from PLAN.md:
  tasks[] = all tasks with: id, name, description, depends_on, files_read,
            files_create, files_modify, acceptance_criteria
  file_ownership = file ownership matrix
  verification_spec = verification spec section
```

### 1b. Create Tasks in Shared Task List

For each task parsed from PLAN.md, create a task in the Agent Teams shared task list with a FULL self-contained brief:

```
For each task in plan.tasks:

  // Build the self-contained task brief
  task_brief = "
## Task: {task.id} -- {task.name}

## Goal
{task.description -- what this task achieves}

## Context
- Project: {project_name}
- Phase: {N} -- {phase_name}
- Phase goal: {phase_goal}
- Mode: {mode}
{IF relevant decisions from CONTEXT.md:}
- Key decisions:
  {for each relevant decision:}
  - Decision #{num}: {answer} (implications: {implications})
  {endfor}
{ENDIF}
{IF has_design AND task references a screen:}
- Design spec: .planning/design/screens/{screen_id}-{screen_name}.md
- Design tokens: .planning/design/design-tokens.json
- Component inventory: .planning/design/COMPONENTS.md
{ENDIF}

## Instructions

### Step 1: Read Context Files
Read these files to understand the context:
{for each file in task.files_read:}
- {file} -- {why this file is relevant}
{endfor}
{IF has_design:}
- .planning/design/UI-SPEC.md -- design system overview
{ENDIF}

### Step 2: Implementation
{task.description -- detailed implementation instructions}

{Include specific patterns to follow, referencing existing files:}
- Pattern reference: See {existing_file} for the convention to follow
- Error handling: {specific error handling approach}
- Naming convention: {specific naming rules}

### Step 3: Create/Modify Files
{for each file in task.files_create:}
- CREATE: {file} -- {what this file should contain}
{endfor}
{for each file in task.files_modify:}
- MODIFY: {file} -- {what changes to make}
{endfor}

## Acceptance Criteria
{for each criterion in task.acceptance_criteria:}
- [ ] {criterion}
{endfor}

## File Ownership
This task owns these files:
{for each file in task.files_create + task.files_modify:}
- {file}
{endfor}
Do NOT modify files outside this list without first messaging the lead
to request permission. If you must read files owned by another task,
that is fine -- just do not write to them.

## Git
After completing all implementation:
- Stage only the files listed in File Ownership
- Commit with message: {config.git.commit_prefix}({task.id}): {brief description}
- Example: gmsd(T-03): implement user authentication middleware

## Deviation Protocol
If you need to deviate from these instructions:
{IF mode == 'yolo':}
- Minor deviations (different variable names, small refactors): proceed without asking
- Moderate deviations (different approach, additional files): proceed but message lead after
- Major deviations (different architecture, scope change): message lead BEFORE proceeding
{ENDIF}
{IF mode == 'balanced':}
- Minor deviations: proceed without asking
- Moderate deviations: message lead BEFORE proceeding
- Major deviations: message lead BEFORE proceeding, wait for approval
{ENDIF}
{IF mode == 'guided':}
- Any deviation from the plan: message lead BEFORE proceeding, wait for approval
{ENDIF}
"

  // Create the task in Agent Teams shared task list
  task_result = TaskCreate({
    subject: "{task.id}: {task.name}",
    description: task_brief,
    activeForm: "{present continuous form of task.name}"
  })

  // Store the mapping: plan_task_id -> shared_task_id
  task_map[task.id] = task_result.id

// Now set dependencies using the stored mappings
For each task in plan.tasks:
  IF task.depends_on is not empty:
    dependency_ids = [task_map[dep_id] for dep_id in task.depends_on]
    TaskUpdate(task_map[task.id], addBlockedBy: dependency_ids)
```

### 1c. Verify Task List

```
Call TaskList to verify:
  - All tasks created successfully
  - Dependency graph matches PLAN.md
  - At least 1 task has no blockers (otherwise execution cannot start)

total_tasks = len(tasks)
unblocked_tasks = count tasks with no blockers and status=pending
blocked_tasks = total_tasks - unblocked_tasks

Log:
  "Task list created: {total_tasks} tasks, {unblocked_tasks} unblocked, {blocked_tasks} blocked"
```

---

## Step 2: Determine Initial Team Size

**Actor:** Lead

```
// How many tasks can start immediately?
unblocked_count = count tasks with no blockers

// Config limits
default_executors = config.teams.default_executors    // default: 3
max_executors = config.teams.max_executors            // default: 5

// Initial team size = min(unblocked tasks, default executors)
initial_size = min(unblocked_count, default_executors)
initial_size = max(initial_size, 1)  // at least 1 executor

Log:
  "Initial team size: {initial_size} executors ({unblocked_count} unblocked tasks, config default: {default_executors})"
```

---

## Step 3: Create Team and Spawn Executors

**Actor:** Lead

### 3a. Check Model Overrides

```
Read .planning/config.json
IF config.model_overrides["executor"] exists:
  executor_model = config.model_overrides["executor"]
ELSE:
  executor_model = default
```

### 3b. Create Team

```
TeamCreate("gmsd-exec-{N}")
```

### 3c. Update State

```
Update state.json:
  current_phase: {N}
  phase_status: "executing"
  active_team: "gmsd-exec-{N}"
  last_command: "/gmsd:execute-phase"
  last_updated: "{ISO timestamp}"
  history: [..., { "command": "/gmsd:execute-phase {N}", "timestamp": "{ISO}",
                   "result": "Execution started: {initial_size} executors, {total_tasks} tasks" }]
```

### 3d. Build Executor System Prompt

This is the base prompt used for ALL executors. It includes the executor agent definition and project-specific context.

```
executor_system_prompt = "
{contents of agents/gmsd-executor.md -- the executor agent definition}

PROJECT CONTEXT:
- Project: {project_name}
- Phase: {N} -- {phase_name}
- Phase goal: {phase_goal}
- Mode: {mode}
- Git auto-commit: {config.git.auto_commit}
- Git commit prefix: {config.git.commit_prefix}
- Design specs available: {has_design}
{IF has_design:}
- Design directory: .planning/design/
{ENDIF}

FILE OWNERSHIP MATRIX (from PLAN.md):
{paste the full file ownership matrix from PLAN.md}

IMPORTANT RULES:
1. Claim ONE task at a time from the shared task list
2. Only claim tasks with status=pending and no unresolved blockers
3. Read the FULL task description before starting implementation
4. Commit after completing each task (one commit per task)
5. Mark task complete, then check for the next available task
6. If you encounter a file conflict, STOP and message the lead
7. If you hit a checkpoint or need user input, message the lead
8. When no more tasks are available, message the lead that you are standing by

START WORKING:
1. Call TaskList to see all available tasks
2. Find an unblocked, unclaimed task (status=pending, no owner)
3. Claim it: TaskUpdate(task_id, owner=your-name, status=in_progress)
4. Read full description: TaskGet(task_id)
5. Execute the task following its instructions
6. When complete:
   a. Git commit (if auto_commit enabled)
   b. TaskUpdate(task_id, status=completed)
   c. SendMessage to lead: 'Task {id} complete. {brief summary}. Claiming next.'
7. Call TaskList again, find next available task
8. Repeat until no tasks remain
9. SendMessage to lead: 'No tasks remaining. Standing by for shutdown.'
"
```

### 3e. Spawn Executors

```
For i in range(initial_size):
  executor_name = "executor-{i+1}"

  Task(
    team_name="gmsd-exec-{N}",
    name=executor_name,
    subagent_type="general-purpose",
    prompt=executor_system_prompt
  )

  Log: "Spawned {executor_name}"

current_executor_count = initial_size
```

---

## Step 4: Lead Monitoring Protocol

**Actor:** Lead
**This is the main control loop. The lead stays in this loop until all tasks complete.**

### State Tracking

```
// Initialize tracking variables
tasks_total = total_tasks
tasks_completed = 0
tasks_in_progress = 0
tasks_failed = 0
commits = 0
deviations = 0
executor_count = initial_size
peak_executor_count = initial_size
standing_by_executors = []
execution_start_time = now()
last_completion_time = now()
verified_tasks = 0
flagged_tasks = 0
unverified_tasks = 0
consecutive_test_failures = 0
task_verification_status = {}
```

### Main Monitoring Loop

```
WHILE tasks_completed + tasks_failed < tasks_total:

  // ===================================================================
  // HANDLE INCOMING MESSAGES FROM EXECUTORS
  // ===================================================================

  ON message from executor:

    // -----------------------------------------------------------------
    // CASE 1: Task Completion
    // -----------------------------------------------------------------
    IF message indicates task completion:
      tasks_completed += 1
      tasks_in_progress -= 1
      last_completion_time = now()

      IF config.git.auto_commit:
        commits += 1

      Log: "[{timestamp}] {executor}: Completed {task_id}. Progress: {tasks_completed}/{tasks_total}"

      // Check what new tasks may have unblocked
      newly_unblocked = TaskList -> filter tasks that just became unblocked
      IF newly_unblocked.count > 0:
        Log: "{newly_unblocked.count} tasks unblocked: {list task IDs}"

      // Update STATE.md with progress
      // (do this periodically, not on every completion -- every 3 completions or 2 min)

      // -----------------------------------------------------------------
      // INCREMENTAL VERIFICATION TRACKING
      // -----------------------------------------------------------------
      // Track micro-verification results from executor completion messages
      IF message contains "micro-verification: PASS":
        verified_tasks += 1
        task_verification_status[task_id] = "verified"
      ELSE IF message contains "test failure" or "tests fail":
        flagged_tasks += 1
        consecutive_test_failures += 1
        task_verification_status[task_id] = "flagged"
      ELSE:
        unverified_tasks += 1
        task_verification_status[task_id] = "unverified"
        consecutive_test_failures = 0

      // Early warning: 3+ consecutive test failures
      IF consecutive_test_failures >= 3:
        Lead to User: "WARNING: Multiple tasks are causing test failures.
          This may indicate a foundational issue.
          Options:
          a) Continue execution (failures may resolve as dependencies complete)
          b) Pause and investigate now
          c) Run full verification on completed work"

        IF mode == "guided":
          WAIT for user response
        IF mode == "balanced":
          Log: "Continuing execution despite test failures. Will address in verification."
          consecutive_test_failures = 0
        IF mode == "yolo":
          consecutive_test_failures = 0

    // -----------------------------------------------------------------
    // CASE 2: Checkpoint Request
    // -----------------------------------------------------------------
    IF message contains "CHECKPOINT" or indicates user input needed:
      checkpoint_task = extract task ID
      checkpoint_question = extract the question/decision needed

      // Pause ONLY this executor's task -- others continue
      Log: "[{timestamp}] CHECKPOINT from {executor}: {checkpoint_question}"

      // Present to user
      Lead to User: "Checkpoint from {executor} on task {checkpoint_task}:

        {checkpoint_question}

        Other executors are still working. Only {executor} is paused.
        Please provide guidance."

      WAIT for user response

      // Resume executor with user's decision
      SendMessage(type="message", recipient="{executor}",
      content="Checkpoint resolved. User decision: {user_response}.
      Continue with task {checkpoint_task}.",
      summary="Checkpoint resolved: {task_id}")

    // -----------------------------------------------------------------
    // CASE 3: Deviation Report
    // -----------------------------------------------------------------
    IF message contains "DEVIATION" or indicates plan deviation:
      deviations += 1
      deviation_desc = extract deviation description
      deviation_severity = extract severity (minor/moderate/major)

      Log: "[{timestamp}] DEVIATION from {executor}: {deviation_severity} -- {deviation_desc}"

      IF mode == "yolo":
        IF deviation_severity in ["minor", "moderate"]:
          // Auto-approve
          SendMessage(type="message", recipient="{executor}",
          content="Deviation noted and approved. Proceed.",
          summary="Deviation approved")
        IF deviation_severity == "major":
          // Present to user
          Lead to User: "Major deviation from {executor} on {task_id}:
            {deviation_desc}
            Approve or reject?"
          WAIT for user response
          SendMessage(type="message", recipient="{executor}",
          content="Major deviation {approved/rejected}. {user_guidance}.",
          summary="Major deviation decision")

      IF mode == "balanced":
        IF deviation_severity == "minor":
          SendMessage(type="message", recipient="{executor}",
          content="Minor deviation noted. Proceed.",
          summary="Deviation approved")
        IF deviation_severity in ["moderate", "major"]:
          Lead to User: "{deviation_severity} deviation from {executor}:
            {deviation_desc}
            Approve or reject?"
          WAIT for user response
          SendMessage to executor with decision

      IF mode == "guided":
        // All deviations require user approval
        Lead to User: "Deviation ({deviation_severity}) from {executor}:
          {deviation_desc}
          Approve or reject?"
        WAIT for user response
        SendMessage to executor with decision

    // -----------------------------------------------------------------
    // CASE 4: File Conflict
    // -----------------------------------------------------------------
    IF message contains "FILE_CONFLICT" or "file conflict":
      conflict_file = extract file path
      conflicting_executor = extract which executor has the conflict
      conflict_task = extract task ID

      Log: "[{timestamp}] FILE CONFLICT: {conflict_file} -- {executor} vs {conflicting_executor}"

      // Resolution: earlier task ID has priority
      executor_task_num = extract numeric ID from executor's current task
      other_task_num = extract numeric ID from conflicting executor's task

      IF executor_task_num < other_task_num:
        priority_executor = executor
        yielding_executor = conflicting_executor
      ELSE:
        priority_executor = conflicting_executor
        yielding_executor = executor

      SendMessage(type="message", recipient=priority_executor,
      content="File conflict on {conflict_file}: you have priority. Proceed with your changes.",
      summary="File conflict: you have priority")

      SendMessage(type="message", recipient=yielding_executor,
      content="File conflict on {conflict_file}: {priority_executor} has priority (earlier task).
      Wait for them to complete, then integrate your changes after.
      Claim a different task in the meantime if available.",
      summary="File conflict: yield to {priority_executor}")

    // -----------------------------------------------------------------
    // CASE 5: Standing By (no more tasks)
    // -----------------------------------------------------------------
    IF message contains "standing by" or "no tasks":
      standing_by_executors.append(executor)
      Log: "[{timestamp}] {executor} standing by. {len(standing_by_executors)}/{executor_count} idle."

      // Check if more tasks will unblock soon
      in_progress_tasks = TaskList -> filter status=in_progress
      blocked_tasks = TaskList -> filter status with unresolved blockers

      IF in_progress_tasks.count > 0:
        // Tasks are being worked on, more may unblock
        SendMessage(type="message", recipient=executor,
        content="Tasks are still in progress. More may unblock soon. Stand by.",
        summary="Stand by -- tasks may unblock")
      ELSE IF blocked_tasks.count == 0:
        // No more tasks will ever unblock -- execution is done or stuck
        // Check if this executor should be shut down
        Log: "{executor} can be shut down -- no more tasks will unblock."
        // Do NOT shut down yet -- wait for the main loop to detect completion

    // -----------------------------------------------------------------
    // CASE 6: Error Report
    // -----------------------------------------------------------------
    IF message contains "ERROR" or "FAILED" or indicates task failure:
      failed_task = extract task ID
      error_desc = extract error description
      attempt_count = extract attempt number (if retrying)

      Log: "[{timestamp}] ERROR from {executor}: Task {failed_task} attempt {attempt_count}: {error_desc}"

      IF attempt_count < 2:
        // Allow retry
        SendMessage(type="message", recipient=executor,
        content="Task {failed_task} failed. Error: {error_desc}.
        Please retry with a different approach. This is attempt {attempt_count}/2.
        Suggestions: {lead's assessment of alternative approach}.",
        summary="Retry task {failed_task}")
      ELSE:
        // Mark as failed after 2 attempts
        tasks_failed += 1
        tasks_in_progress -= 1
        TaskUpdate(task_map[failed_task], status=blocked)

        Log: "Task {failed_task} FAILED after 2 attempts. Marked as blocked."

        SendMessage(type="message", recipient=executor,
        content="Task {failed_task} marked as blocked after 2 failed attempts.
        Move on to the next available task.",
        summary="Task {failed_task} marked blocked")

        // Notify user about the failure
        Lead to User: "Task {failed_task} failed after 2 attempts:
          Error: {error_desc}
          This task is now blocked. It will be addressed during verification/debug.
          Other tasks continue executing."


  // ===================================================================
  // DYNAMIC SCALING
  // ===================================================================

  // Check periodically (every 30 seconds or after each message)
  unblocked_unclaimed = TaskList -> filter status=pending, no owner, no unresolved blockers
  active_executors = executor_count - len(standing_by_executors)

  // Scale UP: if there are many unblocked tasks waiting
  IF unblocked_unclaimed.count >= config.teams.scale_up_threshold:
    IF executor_count < config.teams.max_executors:
      new_executor_count = min(
        executor_count + 1,
        config.teams.max_executors
      )

      // Spawn additional executor
      new_name = "executor-{new_executor_count}"
      Task(
        team_name="gmsd-exec-{N}",
        name=new_name,
        subagent_type="general-purpose",
        prompt=executor_system_prompt
      )
      executor_count = new_executor_count
      peak_executor_count = max(peak_executor_count, executor_count)

      Log: "SCALED UP: Spawned {new_name}. Team size: {executor_count}. Reason: {unblocked_unclaimed.count} tasks waiting."

  // Scale DOWN: if executors are idle and no tasks will unblock
  IF len(standing_by_executors) > 0:
    remaining_blocked = TaskList -> filter has unresolved blockers
    in_progress = TaskList -> filter status=in_progress

    IF remaining_blocked.count == 0 AND in_progress.count <= active_executors - len(standing_by_executors):
      // Idle executors will never get more work
      For each idle_executor in standing_by_executors:
        SendMessage(type="shutdown_request", recipient=idle_executor,
        content="No more tasks will become available. Shutting you down. Thank you.")
        executor_count -= 1
      standing_by_executors.clear()

      Log: "SCALED DOWN: Shut down idle executors. Team size: {executor_count}."


  // ===================================================================
  // STALL DETECTION
  // ===================================================================

  time_since_last_completion = now() - last_completion_time

  IF time_since_last_completion > 300 seconds (5 minutes):
    Log: "STALL DETECTED: No task completed in 5 minutes."

    // Check what each executor is doing
    For each active_executor:
      SendMessage(type="message", recipient=active_executor,
      content="Status check: What is your current progress? Are you blocked on anything?",
      summary="Status check -- stall detected")

    // Wait for responses, assess situation
    // If executor reports being stuck:
    //   - Provide guidance
    //   - Suggest alternative approach
    //   - If truly stuck, offer to reassign task

    // If no response from an executor:
    //   - Assume crashed
    //   - Its in_progress tasks revert to unowned
    //   - Spawn replacement if tasks remain


  // ===================================================================
  // PROGRESS REPORTING
  // ===================================================================

  // Every 3 completions or every 2 minutes, update STATE.md
  IF should_update_progress:
    Update .planning/STATE.md:
      Active Team section with current executor status
      Tasks total/done/in-progress/blocked

    // Brief progress to user (if mode is guided)
    IF mode == "guided":
      Lead to User: "Progress: {tasks_completed}/{tasks_total} tasks complete.
      {tasks_in_progress} in progress. {executor_count} active executors."

// END OF MAIN MONITORING LOOP
```

---

## Step 5: Completion

**Actor:** Lead

### 5a. Verify All Tasks

```
final_task_list = TaskList

completed_tasks = filter status=completed
failed_tasks = filter status=blocked (failed)
remaining_tasks = filter status not in [completed, blocked]

IF remaining_tasks.count > 0:
  Log: "WARNING: {remaining_tasks.count} tasks still in non-terminal state."
  // This should not happen -- investigate
  For each remaining:
    Log: "  {task.id}: status={task.status}, owner={task.owner}"
```

### 5b. Shutdown Team

```
// Send shutdown to ALL remaining executors
For each active teammate in "gmsd-exec-{N}":
  SendMessage(type="shutdown_request", recipient="{teammate-name}",
  content="All tasks complete. Execution phase finished. Shutting down team.")

// Wait for all shutdown_response(approve=true)
// Timeout: 30 seconds per teammate

// Note: if a teammate does not respond, log it and proceed
```

### 5c. Update State

```
execution_end_time = now()
execution_duration = execution_end_time - execution_start_time

Update state.json:
  phase_status: "executed"
  active_team: null
  last_command: "/gmsd:execute-phase"
  last_updated: "{ISO timestamp}"
  history: [..., {
    "command": "/gmsd:execute-phase {N}",
    "timestamp": "{ISO}",
    "result": "Execution complete: {tasks_completed}/{tasks_total} tasks, {commits} commits, {duration}min"
  }]
```

### 5d. Update STATE.md

```
Regenerate STATE.md with:
  - Phase {N} status: executed
  - Active team: none
  - Clear team member table
```

### 5e. Generate SUMMARY.md

```
// Select summary template based on task count
IF tasks_total <= 3:
  template = "SUMMARY-minimal"
ELSE IF tasks_total <= 8:
  template = "SUMMARY-standard"
ELSE:
  template = "SUMMARY-complex"

Log: "Selected {template} template for {tasks_total} tasks."

// Determine result
IF tasks_failed == 0:
  result = "COMPLETE"
ELSE IF tasks_failed < tasks_total AND tasks_completed > 0:
  result = "PARTIAL"
ELSE:
  result = "FAILED"

// Generate SUMMARY.md from the selected template
// Populate all template variables from execution tracking state
// Write to: .planning/phases/{N}-{name}/SUMMARY.md
Write(.planning/phases/{N}-{name}/SUMMARY.md, render(template, {
  PHASE_NUMBER: N,
  PHASE_NAME: phase_name,
  PHASE_GOAL: phase_goal,
  RESULT: result,
  TASKS_COMPLETED: tasks_completed,
  TASKS_TOTAL: tasks_total,
  TASKS_FAILED: tasks_failed,
  DURATION: execution_duration,
  COMMIT_COUNT: commits,
  TEAM_SIZE: executor_count,
  PEAK_TEAM_SIZE: peak_executor_count,
  VERIFIED_TASKS: verified_tasks,
  FLAGGED_TASKS: flagged_tasks,
  UNVERIFIED_TASKS: unverified_tasks,
  CHECKPOINT_COUNT: checkpoint_count,
  CONFLICT_COUNT: conflict_count,
  MODE: mode,
  PHASE_SCOPE: phase_scope,
  // Task rows, file changes, deviations, etc. populated from execution state
  ...execution_tracking_state
}))

Log: "SUMMARY.md written to .planning/phases/{N}-{name}/SUMMARY.md"
```

### 5f. Generate History Digest

```
// Run the history digest generator to keep .planning/HISTORY-DIGEST.json fresh.
// This provides pre-compiled phase stats for the planner and replay commands.
Run: node {gmsd-install-path}/bin/gmsd-history-digest.js --project-dir={project-root}

// If the script fails, log a warning but do not block completion.
IF digest generation fails:
  Log: "WARNING: History digest generation failed. Run manually: node bin/gmsd-history-digest.js"
```

### 5g. Report Execution Summary to User

```
Lead to User: "
Execution Summary -- Phase {N}: {phase_name}
================================================================

  Status:           COMPLETE
  Duration:         {execution_duration} minutes
  Tasks:            {tasks_completed} completed, {tasks_failed} failed, {tasks_total} total
  Commits:          {commits}
  Deviations:       {deviations}
  Team Peak Size:   {peak_executor_count} executors
  Checkpoints:      {checkpoint_count}
  File Conflicts:   {conflict_count}
  Micro-Verified:   {verified_tasks}/{tasks_completed} tasks ({flagged_tasks} had test warnings)
  Summary:          .planning/phases/{N}-{name}/SUMMARY.md ({template})

  Task Breakdown:
  {for each completed task:}
    [{check}] {task.id}: {task.name}
  {endfor}
  {for each failed task:}
    [X] {task.id}: {task.name} -- FAILED: {failure_reason}
  {endfor}

{IF tasks_failed > 0:}
  WARNING: {tasks_failed} tasks failed. These will be addressed during verification.
  Run /gmsd:verify-work {N} to assess the impact.
{ENDIF}

---
## What's Next

Current: Phase {N} -- {phase_name} | Status: executed | Mode: {mode}

**Recommended next step:**
--> /gmsd:verify-work {N} -- Verify the phase goal was achieved

**Other options:**
- /gmsd:execute-phase {N} -- Re-execute (will re-run all tasks)
- /gmsd:progress -- View full project status
"
```

---

## Error Handling

### Executor Crash/Disconnect

```
IF executor stops responding or crashes:
  1. Log: "Executor {name} appears to have crashed."

  2. Find its in_progress tasks:
     crashed_tasks = TaskList -> filter owner={crashed_executor}, status=in_progress

  3. Revert tasks to unowned:
     For each task in crashed_tasks:
       TaskUpdate(task.id, owner=null, status=pending)
     Log: "Reverted {count} tasks to unowned."

  4. Check if git is in a dirty state:
     - If uncommitted changes exist from crashed executor:
       git stash with descriptive name
       Log: "Stashed uncommitted changes from {crashed_executor}"

  5. IF tasks remain that need execution:
     Spawn replacement executor:
     Task(
       team_name="gmsd-exec-{N}",
       name="executor-{next_number}",
       subagent_type="general-purpose",
       prompt=executor_system_prompt
     )
     Log: "Spawned replacement executor."
```

### All Executors Stuck on Same Blocker

```
IF multiple executors report the same blocker:
  1. Identify the common blocker
  2. Escalate to user:
     Lead to User: "Multiple executors blocked by the same issue:
       {blocker_description}
       This affects tasks: {list task IDs}
       Please advise on how to proceed."

  3. IF mode == "yolo" AND blocker is technical:
     Attempt alternative approach:
     SendMessage to one executor:
       "Try this alternative approach: {suggestion}.
        If it works, share the solution with peers."
```

### Task Fails After 2 Attempts

```
IF task fails after 2 attempts:
  1. Mark task as blocked
  2. Check dependent tasks:
     dependents = tasks that depend on failed task
     For each dependent:
       Log: "Task {dependent.id} is now transitively blocked by {failed.id}"
       // These tasks cannot be claimed until the failed task is resolved

  3. Continue with remaining independent tasks
  4. Failed tasks will be addressed in verification/debug phase

  5. IF all remaining tasks are transitively blocked by the failed task:
     Lead to User: "All remaining tasks are blocked by failed task {id}.
       Cannot continue execution.
       Options:
       1. Debug the failed task now (/gmsd:debug {N})
       2. Manually fix the issue and re-run execute
       3. Skip this task and re-plan without it"
```

### Git Conflict Between Executors

```
IF git conflict detected (executor reports merge conflict):
  1. Identify which executors are involved
  2. Determine task priority (lower task number = higher priority)
  3. Priority executor keeps their changes
  4. Other executor must:
     a. Pull latest changes
     b. Resolve conflicts by adapting to priority executor's code
     c. Re-implement their changes on top

  SendMessage to affected executors with resolution instructions.
```

### Mode-Specific Behavior

```
YOLO MODE:
  - Checkpoints only for major issues (security, data loss, architecture)
  - Deviations auto-approved unless major
  - Stall detection threshold: 3 minutes
  - Auto-scale aggressively (spawn quickly)
  - Minimal progress reporting to user

BALANCED MODE:
  - Checkpoints for moderate and major issues
  - Minor deviations auto-approved
  - Stall detection threshold: 5 minutes
  - Moderate scaling
  - Progress every 5 completions

GUIDED MODE:
  - All checkpoints presented to user
  - All deviations require user approval
  - Stall detection threshold: 5 minutes
  - Conservative scaling
  - Progress on every completion
```

---

## Classic Execution Path

**Condition:** `config.execution_mode == "classic"`

This path replaces the team-based flow (Steps 1-5 above) with wave-based fire-and-forget execution using `Task()` subagents. No `TeamCreate`, no `SendMessage`, no shared `TaskList`. Each subagent runs independently and returns its results when done.

Reference: `workflows/execution-mode-check.md`

---

### Classic Step C1: Parse PLAN.md into Waves

**Actor:** Lead

```
Read all context (same as Step 1a above):
  plan, roadmap, config, project, context, research

Extract tasks[] from PLAN.md with: id, name, description, depends_on,
  files_read, files_create, files_modify, acceptance_criteria

// Group tasks by dependency level into waves:
// Wave 1: tasks with NO dependencies
// Wave 2: tasks that depend ONLY on Wave 1 tasks
// Wave 3: tasks that depend on Wave 1 + Wave 2 tasks
// etc.

waves = []
assigned = set()

WHILE len(assigned) < len(tasks):
  current_wave = []
  For each task in tasks:
    IF task.id NOT in assigned:
      IF all dependencies of task are in assigned:
        current_wave.append(task)

  IF current_wave is empty:
    ERROR: "Circular dependency detected. Cannot compute waves."
    STOP.

  waves.append(current_wave)
  For each task in current_wave:
    assigned.add(task.id)

Log:
  "Classic mode: {len(tasks)} tasks organized into {len(waves)} waves."
  For i, wave in enumerate(waves):
    "  Wave {i+1}: {len(wave)} tasks -- {[t.id for t in wave]}"
```

---

### Classic Step C2: Execute Waves Sequentially

**Actor:** Lead

```
total_completed = 0
total_failed = 0
all_results = []

FOR wave_num, wave in enumerate(waves):
  Log: "Starting Wave {wave_num+1}/{len(waves)}: {len(wave)} tasks"

  // Determine how many subagents to spawn (capped by config)
  batch_size = min(len(wave), config.teams.default_executors)

  // Split wave tasks into batches if wave is larger than batch_size
  batches = chunk(wave, batch_size)

  FOR batch in batches:
    // Spawn parallel Task() subagents -- one per task
    spawned = []
    FOR task in batch:
      agent = Task(
        subagent_type="general-purpose",
        prompt=build_classic_task_prompt(task),  // see below
        run_in_background=true
      )
      spawned.append({ task: task, agent: agent })

    // Wait for ALL subagents in this batch to complete
    FOR entry in spawned:
      result = WAIT for entry.agent to return

      IF result indicates success:
        total_completed += 1
        all_results.append({ task: entry.task, status: "completed", output: result })
        Log: "[Wave {wave_num+1}] Task {entry.task.id} completed."

      ELSE IF result indicates failure:
        // Retry ONCE with adjusted approach
        Log: "[Wave {wave_num+1}] Task {entry.task.id} failed. Retrying..."

        retry_agent = Task(
          subagent_type="general-purpose",
          prompt=build_classic_task_prompt(entry.task, retry=true, error=result)
        )
        retry_result = WAIT for retry_agent

        IF retry_result indicates success:
          total_completed += 1
          all_results.append({ task: entry.task, status: "completed", output: retry_result })
          Log: "[Wave {wave_num+1}] Task {entry.task.id} completed on retry."
        ELSE:
          total_failed += 1
          all_results.append({ task: entry.task, status: "failed", output: retry_result })
          Log: "[Wave {wave_num+1}] Task {entry.task.id} FAILED after retry."

  Log: "Wave {wave_num+1} complete. Progress: {total_completed}/{len(tasks)} tasks."
```

---

### Classic Step C3: Build Task Prompt (Helper)

The task prompt for classic mode uses the **same self-contained brief format** as team mode. The only differences are:

1. No `SendMessage` instructions (agent cannot message peers)
2. No `TaskList` / `TaskUpdate` instructions (no shared task list)
3. Deviation protocol is simplified: proceed with best judgment, document deviations in output

```
build_classic_task_prompt(task, retry=false, error=null):

  prompt = "
You are a GMSD Executor agent working independently on a single task.

## Your Task

{full self-contained task brief -- same format as team mode Step 1b}
  - Task ID, name, objective
  - Project and phase context
  - Key decisions from CONTEXT.md
  - Design references (if applicable)
  - Step-by-step instructions
  - Files to read before starting
  - Files to create or modify
  - Acceptance criteria
  - File ownership
  - Git commit convention

## Execution Protocol

1. Read ALL files listed in 'Files to Read Before Starting'
2. Implement the task following the instructions exactly
3. Self-check against every acceptance criterion
4. Stage ONLY the files listed in 'Files to Create or Modify'
5. Commit with format: {config.git.commit_prefix}({task.id}): {description}
6. Report what you did: files modified, criteria met, any deviations

## Deviation Handling

If you need to deviate from the instructions:
- Minor (variable names, small refactors): proceed, note in your output
- Moderate (different approach, extra files): proceed with best judgment, document clearly
- Major (scope change, architecture change): implement what you can, document what could not be done and why

{IF retry:}
## RETRY CONTEXT

This is a retry. The previous attempt failed with:
{error}

Adjust your approach to avoid the same failure. Try an alternative strategy.
{ENDIF}

## Output

When complete, report:
- Files created or modified (list)
- Acceptance criteria status (pass/fail for each)
- Any deviations from the plan (describe each)
- Any issues discovered (for the lead to address)
"

  return prompt
```

---

### Classic Step C4: Completion

**Actor:** Lead

Same as team mode Step 5 (state update, summary, CLAUDE.md sync), with these differences:

```
// No team to shut down (no TeamCreate was called)
// No TaskList to verify (no shared task list was used)

// Collect results from all_results
completed_tasks = [r for r in all_results if r.status == "completed"]
failed_tasks = [r for r in all_results if r.status == "failed"]

// Count commits
commits = count git commits with "{config.git.commit_prefix}(phase-{N})" or task ID prefix

// Generate SUMMARY.md (same format as team mode)
// Update state.json (same as team mode)
// Update STATE.md (same as team mode)
// Sync CLAUDE.md (same as team mode)

// Present execution summary to user (same format as team mode)
// Include note about execution mode:
Log: "Execution mode: Classic (wave-based, {len(waves)} waves)"
```

---

### Classic Mode Differences Summary

| Aspect | Team Mode | Classic Mode |
|---|---|---|
| Dispatch | Shared task list, agents claim dynamically | Pre-computed waves, one Task() per task |
| Communication | Real-time messaging (SendMessage, broadcast) | None -- agents are independent |
| Scaling | Dynamic (spawn more if tasks pile up) | Fixed (batch_size per wave) |
| Checkpoints | Executor messages lead, lead asks user | Not supported -- agents proceed autonomously |
| Deviation handling | Executor messages lead for approval | Agent proceeds with best judgment |
| File conflicts | Detected via messaging, lead arbitrates | Prevented by wave ordering |
| Stall detection | Lead monitors for 5-min gaps | Not needed -- lead waits for Task() return |
| Error recovery | Lead reverts task, another executor claims | Lead retries with new Task() once |
