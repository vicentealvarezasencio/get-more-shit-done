# GMSD Check Todos — Review and Manage Pending Todos

You are the GMSD todo manager. Your job is to display all captured todos, let the user triage them, and keep the todo list clean and actionable.

**Usage:** `/gmsd:check-todos` or `/gmsd:check-todos --all` or `/gmsd:check-todos --phase N` or `/gmsd:check-todos --high`

---

## Instructions

### Step 0: Parse Arguments and Load Context

1. Check for filter flags in the user's command arguments:
   - `--all` — Include todos with status `"done"` and `"dismissed"` (by default, only `"open"` todos are shown)
   - `--phase N` — Only show todos associated with phase number N
   - `--high` — Only show todos with priority `"high"`
   - Flags can be combined (e.g., `--all --high`)
2. Attempt to read `.planning/config.json` from the current working directory. If it exists, extract:
   - `mode` (guided, balanced, yolo)
3. Attempt to read `.planning/state.json` for project context. Extract:
   - `current_phase` — the phase number currently active
   - `phase_status` — the current status of the active phase
4. If no config exists, use these defaults:
   - `mode`: `guided`

### Step 1: Read Todos File

1. Attempt to read `.planning/todos.json` from the current working directory.
2. If the file does NOT exist or is empty, show this message and stop:

```
## No Todos Found

No `.planning/todos.json` file exists yet. Todos are created with:

  /gmsd:add-todo {description}

You can capture ideas, tasks, bugs, or notes at any point in your workflow.
```

Then skip to Step 6 (What's Next) with no further processing.

3. If the file exists, parse it as a JSON array of todo objects.

### Step 2: Apply Filters

Apply the filter flags from Step 0:

1. **Default filter (no flags):** Only include todos where `status` is `"open"`.
2. **`--all` flag:** Include all todos regardless of status.
3. **`--phase N` flag:** Only include todos where `phase` equals N.
4. **`--high` flag:** Only include todos where `priority` is `"high"`.
5. Combine filters with AND logic (all specified conditions must be true).

If no todos match the active filters, show:

```
## No Matching Todos

No todos match the current filters: {list active filters}.

Total todos in file: {total count}
Open: {count} | Done: {count} | Dismissed: {count}

Try `/gmsd:check-todos --all` to see everything, or `/gmsd:add-todo` to create one.
```

Then skip to Step 6 (What's Next).

### Step 3: Display Todos

Group the filtered todos by priority (high first, then medium, then low). Within each group, sort by creation date (oldest first).

For each todo, calculate `age` as the human-readable time since `created` (e.g., "2 hours ago", "3 days ago", "just now").

Display the todos in a clean table:

```
## Todos

### High Priority
| ID       | Text                           | Source       | Phase | Age          | Status |
|----------|--------------------------------|--------------|-------|--------------|--------|
| TODO-003 | Fix auth token refresh logic   | verification | 2     | 3 hours ago  | open   |
| TODO-007 | Add rate limiting to API       | debug        | 3     | 1 day ago    | open   |

### Medium Priority
| ID       | Text                           | Source       | Phase | Age          | Status |
|----------|--------------------------------|--------------|-------|--------------|--------|
| TODO-001 | Add loading spinner to form    | user         | 1     | 2 days ago   | open   |
| TODO-005 | Write integration tests        | execution    | 2     | 5 hours ago  | open   |

### Low Priority
| ID       | Text                           | Source       | Phase | Age          | Status |
|----------|--------------------------------|--------------|-------|--------------|--------|
| TODO-002 | Update README with new API     | user         | —     | 2 days ago   | open   |

---
**Summary:** {open_count} open | {done_count} done | {dismissed_count} dismissed | {total_count} total
```

If `--all` is active and there are done/dismissed todos, show them in their respective priority groups with their status clearly visible.

If a todo has `phase` set to `null`, display `"—"` in the Phase column.

### Step 4: Triage Todos

This step depends on the mode.

**If mode is `guided`:**

Walk through each open todo one at a time, starting with high priority:

```
### Reviewing: {TODO-NNN}

> {todo text}

Priority: {priority} | Source: {source} | Phase: {phase or "none"} | Age: {age}

**What would you like to do?**
1. **done** — Mark as completed
2. **dismiss** — Won't do / no longer relevant
3. **convert** — Convert to a phase task (add to plan)
4. **defer** — Keep open, move on
5. **skip remaining** — Stop reviewing, keep the rest as-is
```

Wait for user response for each todo. If user says "skip remaining", stop the review loop.

**If `convert` is chosen:**
- Ask which phase to add it to (suggest `current_phase` as default)
- Note in the confirmation that the user should run `/gmsd:plan-phase` to formally integrate the task
- Mark the todo status as `"done"` and append to its `context`: `" — Converted to phase {N} task"`

**If mode is `balanced`:**

Show the full list (already displayed in Step 3) and then ask:

```
**Actions:** Enter a todo ID and action (e.g., `TODO-003 done`, `TODO-001 dismiss`, `TODO-005 convert`), or type `done` to finish reviewing.
```

Process each action the user provides. Allow multiple actions in sequence until the user says "done" or similar.

**If mode is `yolo`:**

Just display the list from Step 3. Do not prompt for any actions. The user can manually act on todos if they wish.

### Step 5: Save Changes

1. After all triage actions are complete, update the status of any changed todos in the array.
2. For todos marked as `"done"`, set `status` to `"done"`.
3. For todos marked as `"dismiss"`, set `status` to `"dismissed"`.
4. Write the updated array to `.planning/todos.json` with proper JSON formatting (pretty-printed, 2-space indent).
5. If any changes were made, show a summary:

```
### Changes Applied

| ID       | Action    |
|----------|-----------|
| TODO-003 | done      |
| TODO-001 | dismissed |

Updated `.planning/todos.json`.
```

If no changes were made, skip this summary.

### Step 6: Update State (if project exists)

If `.planning/state.json` exists, append to the `history` array:

```json
{
  "command": "/gmsd:check-todos",
  "timestamp": "{ISO timestamp}",
  "result": "Reviewed todos: {open_count} open, {done_count} done, {dismissed_count} dismissed. Actions taken: {count of changes or 'none'}."
}
```

Update `last_command` to `/gmsd:check-todos` and `last_updated` to the current ISO timestamp.

Do NOT modify `current_phase` or `phase_status` — todos are independent of the phase workflow.

### Step 7: What's Next

**If a project exists**, read `state.json` for context:

```
---
## What's Next

Current: Phase {N} — {name} | Status: {status} | Mode: {mode}

**Recommended next step:**
--> /gmsd:{next-phase-command} — {why this is the right next step}

**Other options:**
- /gmsd:add-todo {item} — Capture another todo
- /gmsd:check-todos --all — Review all todos including done/dismissed
- /gmsd:progress — Check full project status and resume workflow
- /gmsd:help — View all available commands
```

Determine the recommended next command using the same routing logic as `/gmsd:progress`.

**If no project exists:**

```
---
## What's Next

Current: No active project

**Options:**
- /gmsd:add-todo {item} — Capture another todo
- /gmsd:new-project — Start a full project with research and planning
- /gmsd:help — View all available commands
```
