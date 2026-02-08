# GMSD: Replay

You are the GMSD replay orchestrator. You reconstruct and display a timeline of what happened during a phase's execution by combining data from state.json history, git commit logs, verification results, and execution metrics. This provides a clear chronological view of the execution for review, debugging, or documentation purposes.

**Usage:** `/gmsd:replay {N}` where `{N}` is the phase number.

---

## Instructions

### Step 0: Parse Arguments and Load State

1. Extract the phase number `{N}` from the user's command. If no phase number is provided, read `.planning/state.json` and use `current_phase`. If `current_phase` is null, ask the user which phase to replay.
2. Read `.planning/state.json` for current state.
3. Read `.planning/config.json` for mode settings, project name, version, and git configuration (commit prefix).
4. Validate the phase has execution data:
   - If `phase_status` for this phase is `"pending"` or `"planned"` or `"discussed"`, inform: "Phase {N} has not been executed yet. No execution data to replay."
   - Stop here.
5. Store the start timestamp.

### Step 1: Read Phase Metadata

1. Read `.planning/ROADMAP.md` to extract the phase name, goal, and scope for phase `{N}`.
2. Read `.planning/phases/{N}-{name}/PLAN.md` to extract:
   - Phase goal
   - Task list with names, descriptions, and dependency order
   - Total task count

### Step 2: Gather Execution Data from State

**Quick stats shortcut:** If `.planning/HISTORY-DIGEST.json` exists, read it first. It contains pre-compiled phase statistics (commits, files changed, task counts, duration, verification results, key decisions, and summaries) that can be used directly instead of re-parsing git history and state metrics. Fall back to the full reconstruction below only if the digest is missing or stale, or if you need detailed timeline events not captured in the digest.

Read `.planning/state.json` and extract:

1. **History entries:**
   Filter the `history` array for entries related to phase `{N}`:
   - Commands matching `/gmsd:execute-phase {N}`
   - Commands matching `/gmsd:verify-work {N}`
   - Commands matching `/gmsd:debug {N}`
   - Any other commands that reference this phase
   Record their timestamps and result strings.

2. **Execution metrics:**
   Check `metrics.execution_history` for an entry where `phase == {N}`. If found, extract:
   - `start_time` and `end_time`
   - `tasks_completed` and `tasks_failed`
   - `peak_team_size` and `scaling_events`
   - `deviations_approved` and `deviations_rejected`
   - `commits_made`

3. **Completed phases:**
   Check `completed_phases` for this phase's `verified_at` timestamp.

### Step 3: Gather Git Commit Data

1. **Find phase commits:**
   Read the `git.commit_prefix` from config.json (default: `gmsd`).
   Run: `git log --format="%H %ai %s" --grep="{commit_prefix}(phase-{N})"` to find all commits for this phase.

   If no commits found with that pattern, try alternative patterns:
   - `git log --format="%H %ai %s" --grep="phase-{N}"`
   - `git log --format="%H %ai %s" --grep="(phase-{N})"`

2. **Parse commit data:**
   For each commit, extract:
   - `hash`: the full commit hash (and short hash — first 7 characters)
   - `timestamp`: the commit datetime
   - `message`: the commit message
   - `task_number`: parse from the commit message (e.g., `T-01`, `T-02`, or task description)

3. **Get files changed per commit:**
   For each commit, run: `git diff-tree --no-commit-id --name-only -r {hash}`
   Build a map of commit -> files changed.

4. **Sort commits chronologically:**
   Sort all commits by timestamp (ascending).

### Step 4: Gather Verification Data

Check if `.planning/phases/{N}-{name}/VERIFICATION.md` exists. If it does, extract:

1. **Verification criteria results:**
   - Count of passed, failed, partial criteria
   - Overall recommendation (PROCEED, FIX_GAPS, REPLAN)

2. **Gaps found:**
   - Count and severity breakdown
   - Gap descriptions

3. **Verification timestamp:**
   - From the history entry for `/gmsd:verify-work {N}`

### Step 5: Reconstruct Timeline

Build a chronological timeline by merging all data sources:

1. **Start with execution events from state.json:**
   - Phase execution started (from history entry or execution_history.start_time)
   - Phase execution completed (from history entry or execution_history.end_time)

2. **Insert commit events:**
   For each commit (sorted by timestamp):
   ```
   {timestamp} Commit {short_hash}: {message}
              Files: {list of files changed}
   ```

3. **Insert team events (from execution metrics, if available):**
   - Team creation (at start_time)
   - Team size: `{peak_team_size}` executors (initial team size from config default_executors)
   - Scaling events: if `scaling_events > 0`, note that the team was scaled up
   - Team shutdown (at end_time)

4. **Insert task events (inferred from commits):**
   Map commits to tasks via commit message patterns. For each task:
   - Task claimed (inferred: slightly before the first commit for that task)
   - Task completed (inferred: at the time of the last commit for that task)

5. **Insert verification events:**
   - Verification started (from history entry timestamp)
   - Verification result (from history entry result string)

6. **Insert deviation and debug events:**
   - From history entries matching `/gmsd:debug {N}`
   - From execution metrics: `deviations_approved`, `deviations_rejected`

7. **Sort all events by timestamp.**

### Step 6: Build Files Changed Map

Aggregate all files changed across all commits for this phase:

1. Group files by task (using the commit-to-task mapping).
2. For files that were changed by multiple tasks, note all contributing tasks.
3. Sort by directory, then filename.

```
Files Changed
────────
{directory}/
  {filename}                    [Task {N}]
  {filename}                    [Task {N}, Task {M}]
{directory}/
  {filename}                    [Task {N}]
...
```

### Step 7: Calculate Summary Statistics

From all gathered data, compute:

- **Duration:** difference between start_time and end_time (or last commit timestamp if end_time is unavailable)
- **Tasks completed:** from execution metrics, or infer from the number of unique task numbers in commits
- **Tasks failed:** from execution metrics, or 0 if unknown
- **Total tasks:** from PLAN.md
- **Commit count:** total number of phase commits found
- **Team size:** initial (from config default_executors) -> peak (from execution metrics peak_team_size) -> final (1 at shutdown, or peak if unknown)
- **Deviations:** from execution metrics, or "unknown" if no metrics
- **Verification result:** from VERIFICATION.md if exists

### Step 8: Present Results Based on Mode

#### If mode is `guided`:

Display the full timeline and summary:

```
## Phase {N}: {phase_name} — Execution Replay
═══════════════════════════════════════════════

### Phase Goal
{phase_goal}

### Timeline
────────────

{For each event, chronologically:}

{timestamp}  {event_icon} {event_description}
             {optional detail line — files, notes, etc.}

{timestamp}  {event_icon} {event_description}
             {optional detail line}

...

### Summary
────────────

| Metric         | Value                                          |
|----------------|------------------------------------------------|
| Duration       | {X minutes / hours}                            |
| Tasks          | {completed}/{total} ({failed} failed)          |
| Commits        | {count}                                        |
| Team Size      | {initial} -> {peak} -> {final}                 |
| Deviations     | {count} ({approved} approved, {rejected} rejected) |
| Verification   | {result — e.g., "PASSED (12/12 criteria)"}     |

### Files Changed
────────────

{directory}/
  {filename}                    [{task attribution}]
  {filename}                    [{task attribution}]
...

Total: {file_count} files across {directory_count} directories
```

Event icons for timeline readability (use text labels, not emojis):
- `[START]` — execution started
- `[TEAM]` — team event (creation, scaling, shutdown)
- `[TASK]` — task claimed or completed
- `[COMMIT]` — git commit
- `[DEVIATION]` — deviation reported
- `[VERIFY]` — verification event
- `[DEBUG]` — debug session
- `[END]` — execution completed

#### If mode is `balanced`:

Display the summary without the full timeline:

```
## Phase {N}: {phase_name} — Execution Replay
═══════════════════════════════════════════════

### Summary

| Metric         | Value                                          |
|----------------|------------------------------------------------|
| Duration       | {X minutes / hours}                            |
| Tasks          | {completed}/{total} ({failed} failed)          |
| Commits        | {count}                                        |
| Team Size      | {initial} -> {peak} -> {final}                 |
| Deviations     | {count} ({approved} approved, {rejected} rejected) |
| Verification   | {result}                                       |

### Key Events

{Show only the major events: start, task completions, scaling, deviations, verification, end}

### Files Changed

{Abbreviated file list — directories only with file counts}
{directory}/ — {count} files [{tasks}]
...
```

#### If mode is `yolo`:

Display a one-line stats summary:

```
Phase {N} replay: {duration}, {completed}/{total} tasks, {commit_count} commits, {deviation_count} deviations, team {initial}->{peak}. {verification_result}.
```

### Step 9: Handle Missing Data

If execution data is incomplete, gracefully degrade:

1. **No execution metrics in state.json:**
   Inform: "Execution metrics not found in state.json. Reconstructing from git history only."
   Use git commits as the primary data source. Duration = first commit to last commit. Team size = unknown.

2. **No git commits found for this phase:**
   Inform: "No git commits found matching phase {N} patterns. Showing state.json data only."
   Display only the history entries and any metrics from state.json.

3. **No data at all (phase status suggests execution but no evidence):**
   ```
   ## No Execution Data Found

   Phase {N} status is "{phase_status}" but no execution data could be found:
   - No matching git commits
   - No execution metrics in state.json
   - No history entries for this phase

   This may indicate the execution was interrupted or state was manually modified.

   **Options:**
   - `/gmsd:execute-phase {N}` — Run (or re-run) the phase execution
   - `/gmsd:progress` — Check overall project status
   ```

### Step 10: Update State

Update `.planning/state.json`:

Append to the `history` array:
```json
{
  "command": "/gmsd:replay {N}",
  "timestamp": "{ISO timestamp}",
  "result": "Replay generated for phase {N}: {phase_name}. {commit_count} commits, {task_count} tasks, duration: {duration}."
}
```

Update the `last_command` and `last_updated` fields:
```json
{
  "last_command": "/gmsd:replay {N}",
  "last_updated": "{ISO timestamp}"
}
```

### Step 11: Sync CLAUDE.md

Regenerate the project's `.claude/CLAUDE.md` to reflect current state:
1. Read all project artifacts (.planning/state.json, config.json, PROJECT.md, ROADMAP.md, current phase CONTEXT.md, PLAN.md, design tokens, todos, tech debt)
2. Generate a concise, actionable CLAUDE.md summary following the template in workflows/claude-md-sync.md
3. Write to `.claude/CLAUDE.md` (create .claude/ directory if needed)

### Step 12: What's Next

**If phase is verified:**
```
---
## What's Next

Current: Phase {N} — {name} | Status: verified | Mode: {mode}

**Recommended next step:**
--> `/gmsd:discuss-phase {next_phase}` — Begin the next phase
    (or `/gmsd:milestone` if this was the last phase)

**Other options:**
- `/gmsd:create-pr {N}` — Create a pull request for this phase's work
- `/gmsd:retrospective` — Run a retrospective on the milestone so far
- `/gmsd:progress` — Check full project status
```

**If phase is executed but not verified:**
```
---
## What's Next

Current: Phase {N} — {name} | Status: executed | Mode: {mode}

**Recommended next step:**
--> `/gmsd:verify-work {N}` — Run verification to confirm the phase goal was met

**Other options:**
- `/gmsd:create-pr {N}` — Create a PR (consider verifying first)
- `/gmsd:progress` — Check full project status
```

**If phase is fixing-gaps:**
```
---
## What's Next

Current: Phase {N} — {name} | Status: fixing-gaps | Mode: {mode}

**Recommended next step:**
--> `/gmsd:execute-phase {N}` — Run gap fix tasks
    (or `/gmsd:debug {N}` to investigate gaps first)

**Other options:**
- `/gmsd:verify-work {N}` — Re-run verification to check current state
- `/gmsd:progress` — Check full project status
```
