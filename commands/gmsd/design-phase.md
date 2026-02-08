# GMSD: Design Phase

You are the GMSD design phase orchestrator. You create UI/UX design specifications for a phase before execution begins. This produces design tokens, screen specs, and a component inventory that executors reference during implementation.

**Usage:** `/gmsd:design-phase {N}` where `{N}` is the phase number.

---

## Instructions

### Step 0: Parse Arguments and Load State

1. Extract the phase number `{N}` from the user's command. If no phase number is provided, read `.planning/state.json` and use `current_phase`. If `current_phase` is null, ask the user which phase to design.
2. Read `.planning/state.json` for current state.
3. Read `.planning/config.json` for mode, team settings, and design settings.
4. Validate that `config.design.enabled` is not `false`. If design is disabled, inform the user and suggest skipping to `/gmsd:execute-phase {N}`.
5. Store the current timestamp for tracking.

### Step 1: Read Phase Context

1. Read `.planning/ROADMAP.md` and find the entry for phase `{N}`. Extract the phase name, goal, scope, and complexity.
2. Read `.planning/phases/{N}-{name}/PLAN.md` for the task list and file ownership map.
3. Read `.planning/phases/{N}-{name}/CONTEXT.md` for user decisions that affect UI (color preferences, component library choices, accessibility requirements).
4. Read `.planning/phases/{N}-{name}/RESEARCH.md` for any research findings about UI libraries, patterns, or constraints.

### Step 2: Detect UI Scope

Scan the phase for UI work. Look for:

- Tasks that reference screens, pages, views, components, layouts, forms, modals, or dialogs
- Files to touch that match patterns like: `*.tsx`, `*.jsx`, `*.vue`, `*.svelte`, `*.css`, `*.scss`, `app/**/page.*`, `components/**`, `screens/**`, `views/**`
- Task descriptions containing: "UI", "display", "render", "form", "button", "input", "navigation", "sidebar", "header", "footer", "dashboard", "list view", "detail view", "modal", "dialog", "toast", "notification"
- Design references in CONTEXT.md decisions

**If NO UI work is detected:**

Display:
```
## Phase {N}: {name} — No UI Components Detected

This phase does not contain visual/UI work. The design phase is not needed.

Tasks in this phase focus on: {brief summary of task types — e.g., "backend API routes, database migrations, and service logic"}.
```

Then show the What's Next section pointing to `/gmsd:execute-phase {N}` and exit.

**If UI work IS detected**, continue to Step 3.

### Step 3: Build Screen List

From the PLAN.md tasks that involve UI work, build a screen inventory:

For each screen/page/view detected, record:
- **Screen ID**: `SCR-{NN}` (sequential, zero-padded)
- **Screen name**: Descriptive name (e.g., "User Login", "Dashboard Overview", "Settings — Profile")
- **Source task(s)**: Which PLAN.md task(s) reference this screen
- **Route/path**: The URL route or navigation path if determinable
- **Complexity**: simple (static content, few interactions) | moderate (forms, state, conditional rendering) | complex (real-time data, animations, multi-step flows)

Display the screen list to the user:
```
## Screens Detected for Phase {N}: {name}

| ID     | Screen Name                | Source Task(s) | Route           | Complexity |
|--------|----------------------------|----------------|-----------------|------------|
| SCR-01 | {name}                     | Task {X}       | {route}         | {level}    |
| SCR-02 | {name}                     | Task {Y}       | {route}         | {level}    |
...

Total screens: {count}
```

### Step 4: Read Existing UI Patterns

Before designing, understand what already exists in the codebase:

1. Search for existing design tokens (look for files named `tokens.*`, `theme.*`, `design-system.*`, `tailwind.config.*`, `globals.css`, `variables.css`)
2. Search for existing component patterns (look in `components/`, `ui/`, `shared/`)
3. Search for existing layout patterns (look for layout files, wrappers, containers)
4. Read `.planning/design/UI-CONTEXT.md` if it exists from a previous design phase
5. Read `.planning/design/design-tokens.json` if it exists from a previous design phase
6. Read `.planning/design/COMPONENTS.md` if it exists from a previous design phase

Record what exists so the design phase builds on it rather than overwriting it.

### Step 5: Determine Design Approach

Count the screens from Step 3.

**Small scope (fewer than 5 screens):** Use a single designer subagent.

**Large scope (5 or more screens):** Use a design team.

### Step 5a: Small Scope — Single Designer

Spawn a single subagent using the Task tool with this prompt:

```
You are a GMSD UI/UX Design Specialist. Your job is to create comprehensive design specifications for the following screens.

## Context

Project: {project_name}
Phase: {N} — {phase_name}
Phase Goal: {phase_goal}

### Existing UI Patterns
{summary of what was found in Step 4 — existing tokens, components, layouts}

### User Decisions (from CONTEXT.md)
{relevant UI decisions from CONTEXT.md}

### Screen List
{the screen table from Step 3}

## Tasks

### 1. Create or Update UI-CONTEXT.md
Write to `.planning/design/UI-CONTEXT.md`.
If this file already exists, update it — do not overwrite existing content unless it conflicts.
Include: platform constraints, target devices, accessibility requirements, personas, design inspiration.
Reference the template structure but fill in real values based on the project.

### 2. Create or Update design-tokens.json
Write to `.planning/design/design-tokens.json`.
If this file already exists, extend it — do not break existing tokens.
Structure:
{
  "colors": {
    "primary": { "50": "...", "100": "...", ..., "900": "..." },
    "secondary": { ... },
    "neutral": { ... },
    "success": "...",
    "warning": "...",
    "error": "...",
    "info": "..."
  },
  "typography": {
    "fontFamily": { "sans": "...", "mono": "..." },
    "fontSize": { "xs": "...", "sm": "...", "base": "...", "lg": "...", "xl": "...", "2xl": "...", "3xl": "...", "4xl": "..." },
    "fontWeight": { "normal": "400", "medium": "500", "semibold": "600", "bold": "700" },
    "lineHeight": { "tight": "1.25", "normal": "1.5", "relaxed": "1.75" }
  },
  "spacing": { "0": "0", "1": "0.25rem", "2": "0.5rem", "3": "0.75rem", "4": "1rem", "6": "1.5rem", "8": "2rem", "12": "3rem", "16": "4rem" },
  "borderRadius": { "none": "0", "sm": "0.125rem", "md": "0.375rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px" },
  "shadows": { "sm": "...", "md": "...", "lg": "..." },
  "breakpoints": { "sm": "640px", "md": "768px", "lg": "1024px", "xl": "1280px" },
  "animation": { "duration": { "fast": "150ms", "normal": "300ms", "slow": "500ms" }, "easing": { "default": "ease-in-out" } }
}
Adapt values to the project's framework and styling approach.

### 3. Create Screen Specs
For EACH screen in the list, create a file: `.planning/design/screens/SCR-{NN}.md`

Each screen spec MUST contain:
- Screen name and ID
- Route/path
- Purpose (one sentence)
- Layout description (grid, flex, sidebar+content, etc.)
- Component breakdown (every visual element on the screen, organized by section)
- For each component: name, type, props/data, states (default, hover, active, disabled, loading, error, empty), interactions
- Responsive behavior (how the layout changes at each breakpoint)
- Accessibility notes (ARIA labels, keyboard navigation, focus order)
- Design token references (which tokens apply to which elements)
- State management requirements (what data drives this screen, what actions are available)
- Navigation (where can the user go from here, what triggers navigation)
- Error states (what happens when data fails to load, when actions fail)
- Empty states (what shows when there is no data)
- Loading states (skeleton, spinner, or progressive loading)

### 4. Create COMPONENTS.md
Write to `.planning/design/COMPONENTS.md`.
After all screen specs are done, create a component inventory:
- List every unique component referenced across all screen specs
- Group by category (layout, navigation, data display, forms, feedback, overlays)
- For each component: name, used in (screen IDs), props, variants, design token references
- Note shared vs screen-specific components
- If existing components from the codebase can be reused, mark them as "existing" with file path

Write all files. Report back with a summary of what was created.
```

### Step 5b: Large Scope — Design Team

Create a design team with a UI Lead and 2 UI Specifiers.

**Create the team:**
```
TeamCreate("gmsd-design-{N}")
```

**Create the shared task list:**

```
TaskCreate:
  Subject: "Create UI-CONTEXT.md"
  Description: "{full brief for UI context — same as single-designer T1 above}"
  ActiveForm: "Creating UI context document"

TaskCreate:
  Subject: "Create design-tokens.json"
  Description: "{full brief for design tokens — same as single-designer T2 above}"
  ActiveForm: "Defining design token system"

# Split screens between specifiers
# First half of screens:
TaskCreate:
  Subject: "Create screen specs: SCR-01 through SCR-{mid}"
  Description: "{full brief for these screens — same format as single-designer T3}"
  ActiveForm: "Specifying screens SCR-01 through SCR-{mid}"
  BlockedBy: ["Create UI-CONTEXT.md", "Create design-tokens.json"]

# Second half of screens:
TaskCreate:
  Subject: "Create screen specs: SCR-{mid+1} through SCR-{last}"
  Description: "{full brief for these screens — same format as single-designer T3}"
  ActiveForm: "Specifying screens SCR-{mid+1} through SCR-{last}"
  BlockedBy: ["Create UI-CONTEXT.md", "Create design-tokens.json"]

# Final task — blocked by all screen specs:
TaskCreate:
  Subject: "Create COMPONENTS.md"
  Description: "{full brief for component inventory — same as single-designer T4}"
  ActiveForm: "Building component inventory from all screen specs"
  BlockedBy: ["Create screen specs: SCR-01 through SCR-{mid}", "Create screen specs: SCR-{mid+1} through SCR-{last}"]
```

**Spawn the UI Lead:**
```
Task(
  team_name="gmsd-design-{N}",
  name="ui-lead",
  subagent_type="general-purpose",
  prompt="You are the UI Lead for GMSD design phase {N}. You handle the foundational design tasks: UI-CONTEXT.md and design-tokens.json. Read the project's existing codebase for current UI patterns before starting. Claim the 'Create UI-CONTEXT.md' and 'Create design-tokens.json' tasks from the task list. After completing these foundation tasks, broadcast the key design decisions (color palette, typography, spacing scale) to all teammates so the specifiers can reference them. If there are unclaimed screen spec tasks after finishing the foundation, claim and work on those too. When all tasks are done, claim the 'Create COMPONENTS.md' task and build the inventory from all screen specs."
)
```

**Spawn UI Specifier 1:**
```
Task(
  team_name="gmsd-design-{N}",
  name="specifier-1",
  subagent_type="general-purpose",
  prompt="You are a UI Specifier for GMSD design phase {N}. Wait for the UI-CONTEXT.md and design-tokens.json tasks to be completed (they will unblock your screen spec tasks). Then claim your assigned screen spec task from the task list. For each screen, create a detailed spec file at .planning/design/screens/SCR-{NN}.md. Reference the design tokens from design-tokens.json. Include: layout, component breakdown, all states (default/hover/active/disabled/loading/error/empty), responsive behavior, accessibility notes, navigation flows. Broadcast any cross-screen pattern decisions (e.g., 'I'm using a consistent card layout for all list items') to teammates for consistency."
)
```

**Spawn UI Specifier 2:**
```
Task(
  team_name="gmsd-design-{N}",
  name="specifier-2",
  subagent_type="general-purpose",
  prompt="You are a UI Specifier for GMSD design phase {N}. Wait for the UI-CONTEXT.md and design-tokens.json tasks to be completed (they will unblock your screen spec tasks). Then claim your assigned screen spec task from the task list. For each screen, create a detailed spec file at .planning/design/screens/SCR-{NN}.md. Reference the design tokens from design-tokens.json. Include: layout, component breakdown, all states (default/hover/active/disabled/loading/error/empty), responsive behavior, accessibility notes, navigation flows. Broadcast any cross-screen pattern decisions to teammates for consistency."
)
```

**Lead monitoring loop:**

While the team is working, monitor for:
- Task completions (update progress)
- Broadcasts about design decisions (log them)
- Completion of all tasks

When all tasks are completed:
- Send `shutdown_request` to all teammates
- Wait for confirmations
- `TeamDelete("gmsd-design-{N}")`

### Step 6: Present Design Summary

After the designer(s) complete, present a summary to the user:

```
## Design Phase Complete — Phase {N}: {name}

### Token System
- Colors: {count} color scales defined ({primary}, {secondary}, {neutral} + {semantic count} semantic colors)
- Typography: {font family}, {count} sizes, {count} weights
- Spacing: {count}-step scale
- Breakpoints: {list}

### Screens Specified
| ID     | Screen Name                | Complexity | Components |
|--------|----------------------------|------------|------------|
| SCR-01 | {name}                     | {level}    | {count}    |
| SCR-02 | {name}                     | {level}    | {count}    |
...

### Component Inventory
- Total unique components: {count}
- Reusable (shared across screens): {count}
- Screen-specific: {count}
- Existing (already in codebase): {count}

### Key Design Decisions
{bullet list of major decisions made during design — layout system, navigation pattern, form approach, etc.}

### Files Created
- `.planning/design/UI-CONTEXT.md`
- `.planning/design/design-tokens.json`
- `.planning/design/screens/SCR-01.md` through `.planning/design/screens/SCR-{last}.md`
- `.planning/design/COMPONENTS.md`
```

### Step 7: User Review (Mode-Dependent)

**If mode is `guided`:**
Ask the user to review the designs:
```
### Review Required

Mode is **guided** — please review the design specifications before proceeding.

**Quick review checklist:**
- [ ] Token system matches your brand/preferences
- [ ] Screen specs cover all required states
- [ ] Component inventory looks complete
- [ ] No missing screens or flows

Would you like to:
1. **Approve** — proceed to execution
2. **Request changes** — tell me what to adjust
3. **Re-run** — regenerate designs with different direction
```

Wait for user response. If changes requested, update the relevant files and re-present.

**If mode is `balanced`:**
Show the summary and note:
```
Design specs created. Review the files above at your convenience. Proceeding to recommend next step.
```

**If mode is `yolo`:**
Show a brief summary and proceed immediately.

### Step 8: Update State

Update `.planning/state.json`:
```json
{
  "current_phase": {N},
  "phase_status": "designed",
  "last_command": "/gmsd:design-phase {N}",
  "last_updated": "{ISO timestamp}",
  "active_team": null
}
```

Append to the `history` array:
```json
{
  "command": "/gmsd:design-phase {N}",
  "timestamp": "{ISO timestamp}",
  "result": "Design phase complete. {screen_count} screens specified, {component_count} components inventoried."
}
```

Update `.planning/STATE.md` to reflect the new status.

Update the ROADMAP.md phase status to `"designing"` -> `"designed"` (or the appropriate status field).

### Step 9: Sync CLAUDE.md

Regenerate the project's `.claude/CLAUDE.md` to reflect current state:
1. Read all project artifacts (.planning/state.json, config.json, PROJECT.md, ROADMAP.md, current phase CONTEXT.md, PLAN.md, design tokens, todos, tech debt)
2. Generate a concise, actionable CLAUDE.md summary following the template in workflows/claude-md-sync.md
3. Write to `.claude/CLAUDE.md` (create .claude/ directory if needed)

### Step 10: What's Next

```
---
## What's Next

Current: Phase {N} — {name} | Status: designed | Mode: {mode}

**Recommended next step:**
--> `/gmsd:execute-phase {N}` — Execute the phase with the design specs as implementation reference

**Other options:**
- `/gmsd:design-phase {N}` — Re-run design phase with different direction
- `/gmsd:plan-phase {N}` — Re-plan if designs revealed scope issues
- `/gmsd:progress` — Check full project status
```
