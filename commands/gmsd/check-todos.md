# GMSD Check Todos — Review and Manage Pending Todos

You are the GMSD todo manager. Your job is to display all captured todos, let the user triage them, and keep the todo list clean and actionable.

Todos are stored as individual markdown files with frontmatter in `.planning/todos/pending/` (open) and `.planning/todos/done/` (completed/dismissed).

**Usage:** `/gmsd:check-todos` or `/gmsd:check-todos --all` or `/gmsd:check-todos --phase N` or `/gmsd:check-todos --high` or `/gmsd:check-todos --area {name}`

---

## Instructions

### Step 0: Parse Arguments and Load Context

1. Check for filter flags in the user's command arguments:
   - `--all` — Include todos from the `done/` directory (by default, only `pending/` todos are shown)
   - `--phase N` — Only show todos associated with phase number N (from frontmatter `phase` or `source` context)
   - `--high` — Only show todos with `priority: high` in frontmatter
   - `--area {name}` — Only show todos where frontmatter `area` matches `{name}`
   - Flags can be combined (e.g., `--all --high --area backend`)
2. Attempt to read `.planning/config.json` from the current working directory. If it exists, extract:
   - `mode` (guided, balanced, yolo)
3. Attempt to read `.planning/state.json` for project context. Extract:
   - `current_phase` — the phase number currently active
   - `phase_status` — the current status of the active phase
4. If no config exists, use these defaults:
   - `mode`: `guided`

### Step 1: Read Todos (File-Per-Todo)

1. Scan `.planning/todos/pending/*.md` for open todo files.
2. If `--all` flag is active, also scan `.planning/todos/done/*.md` for completed/dismissed todos.
3. For each `.md` file found, parse its frontmatter (the YAML block between `---` delimiters at the top of the file). Expected frontmatter fields:
   - `created` — ISO timestamp or date string
   - `title` — short description of the todo
   - `area` — project area (e.g., "backend", "frontend", "docs"); defaults to `"general"` if missing
   - `priority` — `high`, `medium`, or `low`; defaults to `"medium"` if missing
   - `source` — origin context (e.g., "user", "verification", "debug", "execution"); defaults to `"user"` if missing
   - `phase` — associated phase number; may be absent or null
   - `files` — list of related file paths (optional)
   - `dismissed` — `true` if the todo was dismissed rather than completed (only in `done/` directory)
4. Also read the file body (after frontmatter) for sections:
   - `## Problem` — description of the issue
   - `## Solution` — proposed solution or approach
5. Track the directory origin for each todo: `"pending"` or `"done"`.
6. Use the filename (without `.md` extension) as the todo's display ID.

If `.planning/todos/` directory does not exist, or `.planning/todos/pending/` does not exist or is empty (and `--all` is not active, or `done/` is also empty), show this message and stop:

```
## No Todos Found

No todo files found in `.planning/todos/pending/`. Todos are created with:

  /gmsd:add-todo {description}

You can capture ideas, tasks, bugs, or notes at any point in your workflow.
```

Then skip to Step 6 (What's Next) with no further processing.

### Step 2: Apply Filters

Apply the filter flags from Step 0:

1. **Default filter (no flags):** Only include todos from the `pending/` directory.
2. **`--all` flag:** Include todos from both `pending/` and `done/` directories.
3. **`--phase N` flag:** Only include todos where frontmatter `phase` equals N.
4. **`--high` flag:** Only include todos where frontmatter `priority` is `"high"`.
5. **`--area {name}` flag:** Only include todos where frontmatter `area` matches `{name}` (case-insensitive).
6. Combine filters with AND logic (all specified conditions must be true).

If no todos match the active filters, show:

```
## No Matching Todos

No todos match the current filters: {list active filters}.

Total todo files: {total count across pending + done}
Pending: {count} | Done: {count} | Dismissed: {count}

Try `/gmsd:check-todos --all` to see everything, or `/gmsd:add-todo` to create one.
```

Then skip to Step 6 (What's Next).

### Step 3: Display Todos

Group the filtered todos by priority (high first, then medium, then low). Within each group, sort by creation date (oldest first).

For each todo, calculate `age` as the human-readable time since `created` (e.g., "2 hours ago", "3 days ago", "just now").

Determine status from directory and frontmatter:
- Files in `pending/` have status `"pending"`
- Files in `done/` with `dismissed: true` have status `"dismissed"`
- Files in `done/` without `dismissed: true` have status `"done"`

Display the todos in a clean table:

```
## Todos

### High Priority
| Filename              | Title                          | Area     | Source       | Phase | Age          | Status  |
|-----------------------|--------------------------------|----------|--------------|-------|--------------|---------|
| fix-auth-refresh      | Fix auth token refresh logic   | backend  | verification | 2     | 3 hours ago  | pending |
| add-rate-limiting     | Add rate limiting to API       | backend  | debug        | 3     | 1 day ago    | pending |

### Medium Priority
| Filename              | Title                          | Area     | Source       | Phase | Age          | Status  |
|-----------------------|--------------------------------|----------|--------------|-------|--------------|---------|
| loading-spinner       | Add loading spinner to form    | frontend | user         | 1     | 2 days ago   | pending |
| integration-tests     | Write integration tests        | testing  | execution    | 2     | 5 hours ago  | pending |

### Low Priority
| Filename              | Title                          | Area     | Source       | Phase | Age          | Status  |
|-----------------------|--------------------------------|----------|--------------|-------|--------------|---------|
| update-readme         | Update README with new API     | docs     | user         | —     | 2 days ago   | pending |

---
**Summary:** {pending_count} pending | {done_count} done | {dismissed_count} dismissed | {total_count} total
```

If `--all` is active and there are done/dismissed todos, show them in their respective priority groups with their status clearly visible.

If a todo has no `phase` in frontmatter or `phase` is null, display `"—"` in the Phase column.

### Step 3b: Roadmap Correlation

If `.planning/ROADMAP.md` exists, cross-reference todos with roadmap phases:

1. Read `.planning/ROADMAP.md` and extract all phases with their names, goals, key tasks, and statuses.
2. For each pending todo, attempt to match it to a roadmap phase:
   - **By phase field:** If the todo has a `phase` value in frontmatter, link it directly to that phase.
   - **By text similarity:** Check if the todo's `title` or body content relates to any phase's goal or tasks (keyword matching).
   - **By source:** If the todo's `source` is `"verification"` or `"execution"` and has a `phase`, it maps to that phase.
3. Flag any todos that do NOT align with any roadmap phase as **orphaned** — these may indicate scope creep or items that need their own phase.

Display the correlation after the main table:

```
### Roadmap Correlation

| Phase | Phase Name               | Related Todos                     |
|-------|--------------------------|-----------------------------------|
| 1     | {name}                   | loading-spinner, integration-tests|
| 2     | {name}                   | fix-auth-refresh                  |
| 3     | {name}                   | (none)                            |

**Orphaned todos** (not linked to any phase):
- update-readme: {title} — Consider creating a phase or assigning to an existing one.
```

If no ROADMAP.md exists, skip this step silently.

### Step 4: Triage Todos

This step depends on the mode.

**If mode is `guided`:**

Walk through each pending todo one at a time, starting with high priority. For each todo, read the full file content (frontmatter + body) to show full context:

```
### Reviewing: {filename}

> **{title}**
>
> {Problem section content, if present}
> {Solution section content, if present}

Priority: {priority} | Area: {area} | Source: {source} | Phase: {phase or "none"} | Age: {age}
Files: {files list or "none"}

**What would you like to do?**
1. **done** — Mark as completed (move to done/)
2. **dismiss** — Won't do / no longer relevant (move to done/ with dismissed flag)
3. **convert** — Convert to a phase task (add to plan)
4. **defer** — Keep in pending/, move on
5. **work now** — Start working on this todo immediately
6. **brainstorm** — Expand this todo into a detailed exploration
7. **create phase** — Convert this todo into a new roadmap phase
8. **skip remaining** — Stop reviewing, keep the rest as-is
```

Wait for user response for each todo. If user says "skip remaining", stop the review loop.

**If `done` is chosen:**
- Move the file from `pending/` to `done/`: `mv .planning/todos/pending/{filename}.md .planning/todos/done/{filename}.md`

**If `dismiss` is chosen:**
- Add `dismissed: true` to the file's frontmatter
- Move the file from `pending/` to `done/`: `mv .planning/todos/pending/{filename}.md .planning/todos/done/{filename}.md`

**If `convert` is chosen:**
- Ask which phase to add it to (suggest `current_phase` as default)
- Note in the confirmation that the user should run `/gmsd:plan-phase` to formally integrate the task
- Mark the todo as done by moving it to `done/`
- Append `— Converted to phase {N} task` to the file body before moving

**If `defer` is chosen:**
- Keep the file in `pending/`, no changes. Move to the next todo.

**If `work now` is chosen:**
- Move the file from `pending/` to `done/`
- After moving, route to `/gmsd:quick` with the todo's title as the task description. Display:
  ```
  Starting work on: {title}

  --> /gmsd:quick {title}
  ```

**If `brainstorm` is chosen:**
- Keep the file in `pending/` (it remains in the list)
- Start a brainstorming discussion about the todo: present the problem, explore approaches, discuss trade-offs, and help the user think through the best solution
- After brainstorming, ask if the user wants to update the todo file with any insights, then continue with the next todo

**If `create phase` is chosen:**
- Route to `/gmsd:add-phase` with the todo's title as the phase description. Display:
  ```
  Creating new roadmap phase from todo: {title}

  --> /gmsd:add-phase {title}
  ```
- After the phase is created, move the file from `pending/` to `done/`

**If mode is `balanced`:**

Show the full list (already displayed in Step 3) and then ask:

```
**Actions:** Enter a filename and action (e.g., `fix-auth-refresh done`, `loading-spinner dismiss`, `integration-tests convert`, `update-readme work`, `add-rate-limiting brainstorm`, `loading-spinner create-phase`), or type `done` to finish reviewing.
```

Process each action the user provides. Apply the same file move logic as guided mode. Allow multiple actions in sequence until the user says "done" or similar.

**If mode is `yolo`:**

Just display the list from Step 3. Do not prompt for any actions. The user can manually act on todos if they wish.

### Step 5: Save Changes

No JSON file to write. Changes are performed as individual file moves during triage:
- **done**: `mv .planning/todos/pending/{filename}.md .planning/todos/done/{filename}.md`
- **dismiss**: Add `dismissed: true` to frontmatter, then `mv .planning/todos/pending/{filename}.md .planning/todos/done/{filename}.md`
- **convert / work now / create phase**: Move file to `done/` with appropriate note appended to body

Ensure `.planning/todos/done/` directory exists before moving files (create it if needed).

If any changes were made, show a summary:

```
### Changes Applied

| Filename              | Action    |
|-----------------------|-----------|
| fix-auth-refresh      | done      |
| loading-spinner       | dismissed |

Moved {count} todo file(s).
```

If no changes were made, skip this summary.

### Step 5b: Git Commit

If any todo files were moved or modified in Step 5, commit the changes:

```bash
git add .planning/todos/ && git commit -m "gmsd: update todos — {summary of changes}"
```

Where `{summary of changes}` is a brief description like "2 done, 1 dismissed" or "fix-auth-refresh done, loading-spinner dismissed".

If the commit fails (e.g., no git repo, nothing to commit), log a warning but do not block the workflow. The file moves are already applied.

### Step 6: Update State (if project exists)

If `.planning/state.json` exists, append to the `history` array:

```json
{
  "command": "/gmsd:check-todos",
  "timestamp": "{ISO timestamp}",
  "result": "Reviewed todos: {pending_count} pending, {done_count} done, {dismissed_count} dismissed. Actions taken: {count of changes or 'none'}."
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
