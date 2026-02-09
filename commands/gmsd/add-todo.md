# GMSD Add Todo — Capture Ideas, Tasks, and Notes

You are the GMSD todo capture tool. You allow the user to quickly jot down a todo item at any point during the workflow — an idea, a bug they noticed, a task they want to remember, or a note from verification or debugging.

Each todo is stored as its own Markdown file under `.planning/todos/pending/`, using a date-slug filename convention and frontmatter metadata. Completed todos are moved to `.planning/todos/done/`.

**Usage:** `/gmsd:add-todo {description}` or `/gmsd:add-todo`

---

## Instructions

### Step 0: Parse Arguments and Load Context

1. Extract the todo description from the user's command arguments. If no description is provided, ask conversationally: "What do you want to capture as a todo?"
2. Attempt to read `.planning/config.json` from the current working directory. If it exists, extract:
   - `mode` (guided, balanced, yolo)
3. Attempt to read `.planning/state.json` for project context. Extract:
   - `current_phase` — the phase number currently active (may be null)
   - `phase_status` — the current status of the active phase
   - `last_command` — the last command that was run
4. If no config exists, use these defaults:
   - `mode`: `guided`

### Step 1: Determine Source Context

Automatically infer the `source` field based on the current workflow context:

- If `last_command` is `/gmsd:verify-work` or `phase_status` is `"verifying"` --> source: `"verification"`
- If `last_command` is `/gmsd:debug` or `phase_status` is `"debugging"` --> source: `"debug"`
- If `last_command` is `/gmsd:execute-phase` or `phase_status` is `"executing"` --> source: `"execution"`
- Otherwise --> source: `"user"`

Also build a brief `context` string describing when/why the todo was added:
- Example: `"Added during phase 3 execution (execute-phase)"`
- Example: `"Added during verification of phase 2"`
- Example: `"Added manually, no active phase"`

### Step 2: Ask for Priority and Infer Area

#### Priority

**If mode is `guided` or `balanced`:**

Ask the user for priority:

```
**Priority?** (low / medium / high) — default: medium
```

Wait for user response. If the user says nothing recognizable or presses enter, use `"medium"`.

**If mode is `yolo`:**

Default to `"medium"` without asking. Proceed immediately.

#### Area Inference

Infer the `area` from the todo description and any recently referenced file paths in the conversation. Use these categories:

| Area       | Signals                                                        |
|------------|----------------------------------------------------------------|
| api        | Routes, endpoints, controllers, REST, GraphQL, HTTP methods    |
| ui         | Components, CSS, styles, layouts, pages, templates, views      |
| auth       | Login, tokens, permissions, roles, sessions, OAuth, JWT        |
| database   | Schema, migrations, queries, models, ORM, SQL                  |
| testing    | Tests, specs, assertions, mocks, fixtures, coverage            |
| docs       | README, documentation, comments, guides, changelogs            |
| planning   | Roadmap, phases, milestones, architecture, design decisions    |
| tooling    | Build, CI/CD, scripts, linters, formatters, dev tools, config  |
| general    | Anything that does not clearly fit another category             |

Look at:
1. Keywords in the todo description
2. File paths mentioned in the description or recent conversation context
3. The current phase name or goal (if available)

If multiple areas seem plausible, pick the most specific one. Default to `"general"` if unclear.

Do NOT ask the user to confirm the area — just infer it silently.

### Step 3: Ensure Directories and Scan Existing Todos

1. Ensure the todo directories exist:
   ```bash
   mkdir -p .planning/todos/pending .planning/todos/done
   ```

2. Scan `.planning/todos/pending/*.md` for existing todo files.
   - For each file, read its frontmatter to extract `title`, `area`, and `created` fields.
   - Build a list of existing pending todos for use in duplicate detection (Step 5).

### Step 4: Generate Slug-Based Filename

1. Get the current date in `YYYY-MM-DD` format.
2. Generate a slug from the todo title:
   - Convert to lowercase
   - Replace any non-alphanumeric characters with hyphens
   - Strip leading/trailing hyphens
   - Truncate to a maximum of 40 characters (trim at a hyphen boundary if possible)
3. Compose the filename: `{YYYY-MM-DD}-{slug}.md`
4. If a file with that exact name already exists in `.planning/todos/pending/`, append a numeric suffix: `{YYYY-MM-DD}-{slug}-2.md`, `{YYYY-MM-DD}-{slug}-3.md`, etc.

### Step 5: Duplicate Check

Before creating the file, check for potential duplicates among existing pending todos:

1. Extract key words from the new todo title (ignore common stop words like "the", "a", "and", "to", "for", "in", "of", "is").
2. Search existing pending todo filenames and frontmatter `title` fields for significant keyword overlap (3+ shared keywords or >50% overlap).
3. If a potential duplicate is found, present it to the user:

```
**Possible duplicate found:**

Existing: `.planning/todos/pending/{existing-filename}`
Title: {existing title}

Your new todo: {new title}

**Options:**
1. **skip** — Do not create this todo (the existing one covers it)
2. **replace** — Delete the existing todo and create this one instead
3. **add anyway** — Create this todo alongside the existing one
```

Wait for user response. Default to `"add anyway"` if no clear choice.

**If mode is `yolo`:** Skip duplicate checking entirely and proceed to create the file.

### Step 6: Create Todo File

Write the todo file with the following format:

```markdown
---
created: {ISO 8601 timestamp}
title: {title derived from the description}
area: {inferred area from Step 2}
priority: {low|medium|high}
source: {user|verification|debug|execution}
phase: {current phase number or null}
files:
  - {relevant file paths from conversation context, if any}
---

## Problem

{Problem description — write enough context that a future Claude session can understand the issue weeks later without any prior conversation history. Include what is wrong, where it manifests, and why it matters.}

## Solution

{Approach hints if obvious from context, otherwise write "TBD"}
```

Write this content to `.planning/todos/pending/{filename}` (the filename generated in Step 4).

**Notes on the Problem section:**
- Do NOT just echo the user's one-liner verbatim. Expand it with whatever context is available from the current conversation: what file was being worked on, what phase is active, what error was seen, etc.
- If the todo came from verification or debugging, reference the specific failure or issue discovered.
- The goal is a self-contained problem statement that needs no external context to understand.

**Notes on the files field:**
- If file paths were mentioned in the conversation or are clearly related to the todo, list them.
- If no specific files are relevant, omit the `files` field entirely from the frontmatter (do not include an empty list).

### Step 6b: Git Commit

After writing the todo file, commit the change:

**If mode is `guided`:**
Ask: "Commit this todo to git? (yes / no)" — default: yes.
If the user confirms (or presses enter), run the commit. If the user declines, skip the commit.

**If mode is `balanced` or `yolo`:**
Auto-commit without asking.

**Commit command:**
```bash
git add .planning/todos/pending/{filename} && git commit -m "gmsd: add todo — {title truncated to 50 chars}"
```

If the commit fails (e.g., no git repo, nothing to commit), log a warning but do not block the workflow. The todo is already saved to the file.

### Step 7: Show Confirmation

Display a confirmation to the user:

```
## Todo Captured

| Field    | Value                                            |
|----------|--------------------------------------------------|
| File     | `.planning/todos/pending/{filename}`             |
| Title    | {title}                                          |
| Area     | {area}                                           |
| Priority | {priority}                                       |
| Source   | {source}                                         |
| Phase    | {phase or "none"}                                |

Pending todos: {count of .md files in .planning/todos/pending/}
```

### Step 8: Update State (if project exists)

If `.planning/state.json` exists, append to the `history` array:

```json
{
  "command": "/gmsd:add-todo",
  "timestamp": "{ISO timestamp}",
  "result": "Captured todo {filename}: {short title, truncated to 60 chars}. Area: {area}. Priority: {priority}. Source: {source}."
}
```

Update `last_command` to `/gmsd:add-todo` and `last_updated` to the current ISO timestamp.

Do NOT modify `current_phase` or `phase_status` — todos are independent of the phase workflow.

### Step 9: What's Next

**If a project exists**, read `state.json` for context:

```
---
## What's Next

Current: Phase {N} — {name} | Status: {status} | Mode: {mode}

**Options:**
- /gmsd:add-todo {another item} — Capture another todo
- /gmsd:check-todos — Review and manage all pending todos
- /gmsd:progress — Check full project status and resume workflow
- /gmsd:{next-phase-command} — Continue with the phase workflow
```

Determine the phase-appropriate next command using the same routing logic as `/gmsd:progress`.

**If no project exists:**

```
---
## What's Next

Current: No active project

**Options:**
- /gmsd:add-todo {another item} — Capture another todo
- /gmsd:check-todos — Review and manage all pending todos
- /gmsd:new-project — Start a full project with research and planning
- /gmsd:help — View all available commands
```
