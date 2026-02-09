# Workflow: UI/UX Design Phase

**Slash Command:** `/gmsd:design-phase {N}`
**Role:** Team Lead
**Produces:** Design tokens, screen specs, component inventory, UI-SPEC.md

---

## Overview

Create detailed UI/UX specifications for phases that involve visual/interactive components. This workflow detects whether a phase has UI work, determines scope (small vs. large), and either runs a single designer or a full design team. The output is a complete set of screen specs, design tokens, and a component inventory that executors use during implementation.

---

## Prerequisites

Before starting, verify these conditions:

```
1. .planning/phases/{N}-{name}/PLAN.md exists
   - If NOT: STOP. "No plan found for Phase {N}. Run /gmsd:plan-phase {N} first."

2. Phase involves UI work (auto-detect or user override)
   - Run UI detection logic (see below)
   - If no UI detected: inform user, suggest /gmsd:execute-phase {N} instead
   - User can override: "Force design phase even though no UI detected"

3. Design is enabled in config
   - Read config.json design.enabled
   - If false: STOP. "Design phase is disabled. Enable via /gmsd:settings."

4. Phase is in "planned" status
   - Read state.json
   - If phase_status != "planned": WARN but allow if user confirms
```

---

## State Transitions

```
planned --> detecting_ui --> designing --> designed
```

---

## Step 1: UI Detection

**Actor:** Lead

### 1a. Scan for UI Keywords

```
UI_KEYWORDS = [
  "screen", "view", "UI", "component", "layout", "style", "design",
  "frontend", "page", "form", "modal", "dialog", "button", "navigation",
  "menu", "sidebar", "header", "footer", "dashboard", "card", "table",
  "list", "grid", "input", "select", "checkbox", "radio", "toggle",
  "tab", "panel", "drawer", "toast", "notification", "tooltip",
  "dropdown", "popover", "avatar", "badge", "icon", "image",
  "responsive", "mobile", "tablet", "desktop", "theme", "dark mode",
  "color", "typography", "font", "animation", "transition"
]

scan_targets = [
  .planning/phases/{N}-{name}/PLAN.md    (tasks section, descriptions)
  .planning/ROADMAP.md                    (phase {N} description and scope)
]

matches = []
For each target file:
  For each keyword in UI_KEYWORDS:
    If keyword found (case-insensitive):
      matches.append({ file, keyword, context_line })

ui_detected = len(matches) > 0
ui_confidence = "high" if len(matches) >= 5 else "medium" if len(matches) >= 2 else "low"
```

### 1b. Report Detection Result

```
IF ui_detected AND ui_confidence in ["high", "medium"]:
  Lead: "UI work detected in Phase {N} ({len(matches)} indicators found).
         Proceeding with design phase."

IF ui_detected AND ui_confidence == "low":
  Lead: "Some UI indicators found in Phase {N}, but confidence is low.
         Found: {list matching keywords}
         Do you want to run the design phase? (yes/no)"
  WAIT for user response
  IF no: GOTO routing (suggest execute-phase)

IF NOT ui_detected:
  Lead: "No UI work detected in Phase {N}. The design phase is not needed.

---
## What's Next

Current: Phase {N} -- {phase_name} | Status: planned | Mode: {mode}

**Recommended next step:**
--> /gmsd:execute-phase {N} -- Execute the plan directly (no UI design needed)

**Other options:**
- /gmsd:design-phase {N} --force -- Force design phase anyway
- /gmsd:progress -- View full project status"
  STOP (unless user uses --force)
```

---

## Step 2: Assess Scope

**Actor:** Lead

### 2a. Count Screens

```
Parse PLAN.md for screen-related tasks:
  - Tasks mentioning "screen", "page", "view", "layout"
  - Tasks that create .tsx/.jsx/.vue/.svelte files in pages/ or views/ or screens/
  - Tasks that reference routes/navigation

screen_count = count of distinct screens identified

IF screen_count == 0:
  // UI work exists but no distinct screens (e.g., just component styling)
  scope = "minimal"
  Lead: "UI work detected but no distinct screens. Running minimal design pass."

IF screen_count < 5:
  scope = "small"
  Lead: "Small UI scope: {screen_count} screens. Single designer will handle this."

IF screen_count >= 5:
  scope = "large"
  Lead: "Large UI scope: {screen_count} screens. Spawning design team."
```

### 2b. Extract Screen List

```
For each detected screen:
  screen_id = "SCR-{NN}" (sequential)
  screen_name = extracted from task description
  screen_route = extracted from task or inferred
  related_task = task ID from PLAN.md that implements this screen

screens = [
  { id: "SCR-01", name: "{name}", route: "{route}", task: "T-{NN}" },
  { id: "SCR-02", name: "{name}", route: "{route}", task: "T-{NN}" },
  ...
]
```

---

## Step 3: Setup Design Directory

**Actor:** Lead

```
mkdir -p .planning/design/screens/

Update state.json:
  phase_status: "designing"
  active_team: "gmsd-design-{N}" (if large scope) or null (if small scope)
```

---

## Step 4a: Small Scope -- Single Designer

**Condition:** `scope == "small" OR scope == "minimal"`

### Spawn Single Designer Subagent

```
Task(
  subagent_type="general-purpose",
  prompt="You are a GMSD UI/UX Designer. Create design specifications for
  Phase {N} ({phase_name}).

  PROJECT CONTEXT:
  - Project: {project_name}
  - Phase: {N} -- {phase_name}
  - Phase goal: {phase_goal}
  - Platform: {platform}
  - Framework: {framework}
  - UI Library: {from PROJECT.md or CONTEXT.md}
  - Styling: {from PROJECT.md or CONTEXT.md}

  INPUT FILES:
  - .planning/PROJECT.md
  - .planning/ROADMAP.md
  - .planning/phases/{N}-{name}/PLAN.md
  - .planning/phases/{N}-{name}/RESEARCH.md
  {IF CONTEXT.md exists:}
  - .planning/phases/{N}-{name}/CONTEXT.md
  {ENDIF}

  SCREENS TO DESIGN:
  {for each screen in screens:}
  - {screen.id}: {screen.name} (route: {screen.route}, implements: {screen.task})
  {endfor}

  DELIVERABLES (create all of these):

  1. UI-CONTEXT.md at .planning/design/UI-CONTEXT.md
     - Platform and framework details
     - Target devices and breakpoints
     - Design constraints (brand colors, accessibility)
     - User personas (from PROJECT.md)
     - Dark mode support decision

  2. design-tokens.json at .planning/design/design-tokens.json
     - Color palette (primary, secondary, neutral, semantic)
     - Typography scale (headings, body, small)
     - Spacing scale (4px base)
     - Border radius scale
     - Shadow scale
     - Breakpoints
     - Dark mode variants for all colors

  3. Screen specs (one per screen):
     For each screen, write .planning/design/screens/{screen.id}-{screen.name}.md:
     - Screen metadata (ID, name, route, auth requirements)
     - Purpose and user story
     - Layout description (header, body, footer zones)
     - ASCII wireframe (approximate layout with boxes)
     - Component breakdown (what components make up this screen)
     - States: default, loading, error, empty, success
     - Interactions (hover, click, scroll, keyboard)
     - Responsive behavior (mobile, tablet, desktop)
     - Accessibility notes
     - Design token usage (reference tokens, not raw values)

  4. COMPONENTS.md at .planning/design/COMPONENTS.md
     - Inventory of all components used across screen specs
     - Grouped by category (layout, navigation, forms, data, feedback, overlay)
     - For each component: name, props, variants, usage locations

  5. UI-SPEC.md at .planning/design/UI-SPEC.md
     - Hub document linking to all design artifacts
     - Screen inventory table (ID, name, route, spec file, status)
     - Component summary
     - Navigation flow diagram (ASCII)
     - Route table
     - Design token quick reference

  IMPORTANT:
  - Reference design tokens by name, not raw values (e.g., 'color.primary' not '#3b82f6')
  - Every screen must have all 5 states (default, loading, error, empty, success)
  - Include accessibility basics in every screen spec
  - ASCII wireframes should show approximate layout, not pixel-perfect
  - Components should be reusable across screens where possible"
)
```

### Wait for Completion

```
WAIT for Task tool to return

Verify deliverables exist:
  - .planning/design/UI-CONTEXT.md
  - .planning/design/design-tokens.json
  - .planning/design/screens/ (contains at least 1 file)
  - .planning/design/COMPONENTS.md
  - .planning/design/UI-SPEC.md

IF any missing: warn user, note incomplete deliverables
GOTO Step 5 (Finalize)
```

---

## Step 4b: Large Scope -- Design Team

**Condition:** `scope == "large"`

### 4b-i. Create Team

```
TeamCreate("gmsd-design-{N}")
```

### 4b-ii. Create Tasks

```
// Task 1: UI Context (no blockers)
TaskCreate({
  subject: "T-D01: Create UI context document",
  description: "## Task: UI Context Document

    Create .planning/design/UI-CONTEXT.md

    Read these files first:
    - .planning/PROJECT.md
    - .planning/phases/{N}-{name}/PLAN.md
    - .planning/phases/{N}-{name}/CONTEXT.md (if exists)

    Document:
    - Platform and framework details
    - Target devices and breakpoints (from PROJECT.md constraints)
    - Design constraints (brand colors if any, accessibility requirements)
    - User personas (from PROJECT.md target users)
    - Existing design system (if codebase has one)
    - Dark mode support decision
    - Inspiration references (if from CONTEXT.md or user discussions)

    Use the UI-CONTEXT.md template at templates/design/UI-CONTEXT.md",
  activeForm: "Creating UI context document"
})
// result: task_d01_id

// Task 2: Design Tokens (blocked by T-D01)
TaskCreate({
  subject: "T-D02: Define design token system",
  description: "## Task: Design Token System

    Create .planning/design/design-tokens.json

    Read first:
    - .planning/design/UI-CONTEXT.md (MUST exist -- wait if not)
    - Existing codebase theme/styling files (if any)

    Define tokens for:
    - Colors: primary, secondary, neutral (50-950), semantic (success, warning, error, info)
    - Typography: font families, size scale (xs through 4xl), weight scale, line heights
    - Spacing: 4px base unit scale (1 through 16)
    - Border radius: none, sm, md, lg, xl, full
    - Shadows: none, sm, md, lg, xl
    - Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
    - Z-index: base, dropdown, sticky, overlay, modal, toast
    - Dark mode: variant for every color token

    MUST align with:
    - Brand colors from UI-CONTEXT.md (if specified)
    - Existing codebase conventions (if any)
    - Accessibility contrast requirements from UI-CONTEXT.md

    Output format: JSON with nested structure by category.",
  activeForm: "Defining design token system"
})
// result: task_d02_id
TaskUpdate(task_d02_id, addBlockedBy: [task_d01_id])

// Tasks 3-N: Screen Specs (blocked by T-D02)
// Split between two specifiers: odd screens to spec-1, even to spec-2
For i, screen in enumerate(screens):
  specifier = "designer-spec-1" if (i % 2 == 0) else "designer-spec-2"
  task_num = i + 3  // T-D03, T-D04, ...

  TaskCreate({
    subject: "T-D{task_num:02d}: Specify screen {screen.id}",
    description: "## Task: Screen Specification -- {screen.id}: {screen.name}

      Create .planning/design/screens/{screen.id}-{screen.name}.md

      Read first:
      - .planning/design/UI-CONTEXT.md
      - .planning/design/design-tokens.json
      - .planning/phases/{N}-{name}/PLAN.md (task {screen.task})
      - Any peer screen specs already written (for consistency)

      Screen Details:
      - ID: {screen.id}
      - Name: {screen.name}
      - Route: {screen.route}
      - Implements PLAN.md task: {screen.task}

      Spec must include these 10 sections:
      1. Screen metadata (ID, name, route, auth, layout type)
      2. Purpose and user story ('As a {persona}, I want to...')
      3. Layout description (zones: header, body, sidebar, footer)
      4. ASCII wireframe (approximate layout using box-drawing chars)
      5. Component breakdown (list of components with props)
      6. States: default, loading, error, empty, success (describe each)
      7. Interactions (hover, click, scroll, keyboard, gestures)
      8. Responsive behavior (mobile, tablet, desktop variations)
      9. Accessibility notes (focus order, ARIA labels, screen reader)
      10. Design token usage (reference tokens by name, never raw values)

      CONSISTENCY RULES:
      - Use design tokens from design-tokens.json (never raw colors/sizes)
      - Navigation patterns must match peer screens
      - Shared components must use same props/variants across screens
      - If you discover a reusable component, broadcast it to your peer",
    activeForm: "Specifying screen {screen.id}"
  })
  // result: task_screen_id
  TaskUpdate(task_screen_id, addBlockedBy: [task_d02_id])
  // Store task_screen_id for final task dependency

// Final Task: Component Inventory (blocked by all screen tasks)
TaskCreate({
  subject: "T-D{final_num}: Create component inventory",
  description: "## Task: Component Inventory

    Create:
    - .planning/design/COMPONENTS.md
    - .planning/design/UI-SPEC.md

    Read first:
    - All screen spec files in .planning/design/screens/
    - .planning/design/design-tokens.json
    - .planning/design/UI-CONTEXT.md

    COMPONENTS.md:
    Extract every component referenced in screen specs. For each:
    - Name (PascalCase)
    - Category (layout, navigation, forms, data display, feedback, overlay)
    - Props (with types and defaults)
    - Variants (sizes, colors, states)
    - Used in screens (list screen IDs)
    - Existing equivalent (if codebase already has a similar component)

    Group by category. Identify:
    - Shared components (used in 2+ screens)
    - Screen-specific components (used in 1 screen)
    - Components from the component library (e.g., shadcn/ui) vs custom

    UI-SPEC.md:
    Create the master hub using the UI-SPEC.md template:
    - Link to all design artifacts
    - Screen inventory table
    - Component summary by category
    - Navigation flow diagram (ASCII)
    - Route table
    - Design token quick reference (subset of tokens most used)
    - Design principles (3 guiding principles for this project's UI)",
  activeForm: "Creating component inventory and UI spec"
})
// result: task_final_id
TaskUpdate(task_final_id, addBlockedBy: [all screen task IDs])
```

### 4b-iii. Spawn Design Teammates

```
// Designer Lead: handles T-D01, T-D02, T-D{final}
Task(
  team_name="gmsd-design-{N}",
  name="designer-lead",
  subagent_type="general-purpose",
  prompt="You are a GMSD Design Lead. You handle the foundational design
  artifacts (UI context, design tokens) and the final synthesis (component
  inventory, UI spec).

  PROJECT CONTEXT:
  - Project: {project_name}
  - Phase: {N} -- {phase_name}

  YOUR TASKS: T-D01 (UI context), T-D02 (design tokens), T-D{final} (component inventory)

  PROTOCOL:
  1. Call TaskList to find your tasks
  2. Claim and execute T-D01 first (no blockers)
  3. When T-D01 complete: broadcast a summary of key UI context decisions
  4. Claim and execute T-D02 (blocked by T-D01 -- should unblock automatically)
  5. When T-D02 complete: broadcast token system summary (color names, type scale)
  6. Wait for all screen specs to complete, then claim T-D{final}
  7. Message lead when all tasks done

  BROADCAST PROTOCOL:
  After finalizing tokens, broadcast:
    'TOKENS READY: Primary={color}, Secondary={color}, Font={font family}.
     Full tokens at design-tokens.json. Use token names in screen specs.'

  After finalizing UI context, broadcast:
    'UI CONTEXT: Platform={platform}, Primary device={device},
     Dark mode={yes/no}, Accessibility={WCAG level}.
     Full context at UI-CONTEXT.md.'"
)

// Designer Spec 1: handles odd-indexed screen specs
Task(
  team_name="gmsd-design-{N}",
  name="designer-spec-1",
  subagent_type="general-purpose",
  prompt="You are a GMSD Screen Specifier. You create detailed screen
  specifications for UI screens.

  PROJECT CONTEXT:
  - Project: {project_name}
  - Phase: {N} -- {phase_name}

  YOUR SCREENS: {list odd-indexed screen IDs and names}

  PROTOCOL:
  1. Call TaskList to find your screen spec tasks
  2. Wait for design tokens to be ready (T-D02 must complete first)
  3. Read UI-CONTEXT.md and design-tokens.json before starting
  4. Claim and execute each screen spec task
  5. For each screen, create the full 10-section spec
  6. If you create a reusable component pattern, broadcast to peer:
     'NEW COMPONENT: {ComponentName} -- {brief description}. Using in {screen ID}.'
  7. If you pick a navigation pattern, broadcast to peer:
     'NAV PATTERN: Using {pattern} for {screen}. Suggest consistency.'
  8. Message lead when all your screens are done"
)

// Designer Spec 2: handles even-indexed screen specs
Task(
  team_name="gmsd-design-{N}",
  name="designer-spec-2",
  subagent_type="general-purpose",
  prompt="You are a GMSD Screen Specifier. You create detailed screen
  specifications for UI screens.

  PROJECT CONTEXT:
  - Project: {project_name}
  - Phase: {N} -- {phase_name}

  YOUR SCREENS: {list even-indexed screen IDs and names}

  PROTOCOL:
  {same as designer-spec-1 but for even-indexed screens}"
)
```

### 4b-iv. Monitor Design Team

```
WHILE design tasks remain:

  ON broadcast from designer-lead:
    IF contains "TOKENS READY":
      - Note token summary for reference
    IF contains "UI CONTEXT":
      - Note context decisions

  ON broadcast from specifier:
    IF contains "NEW COMPONENT":
      - Note component for tracking
    IF contains "NAV PATTERN":
      - Note navigation pattern decision

  ON message from any teammate:
    IF contains "complete" or "done":
      - Track completion
      - Check if all tasks done
    IF contains "BLOCKED":
      - Assess blocker
      - Intervene if needed

  IF all tasks complete:
    EXIT loop
    PROCEED to Step 5
```

### 4b-v. Shutdown Design Team

```
For each active teammate in "gmsd-design-{N}":
  SendMessage(type="shutdown_request", recipient="{teammate-name}",
  content="Design phase complete. Shutting down design team.")

WAIT for all shutdown_response(approve=true)
```

---

## Step 5: Finalize Design

**Actor:** Lead

### 5a. Verify Deliverables

```
Verify all expected files exist:
  - .planning/design/UI-CONTEXT.md
  - .planning/design/design-tokens.json
  - .planning/design/COMPONENTS.md
  - .planning/design/UI-SPEC.md
  - For each screen: .planning/design/screens/{screen.id}-{name}.md

Report any missing artifacts.
```

### 5b. Update State

```
Update state.json:
  phase_status: "designed"
  active_team: null
  last_command: "/gmsd:design-phase"
  last_updated: "{ISO timestamp}"
  history: [..., { "command": "/gmsd:design-phase {N}", "timestamp": "{ISO}",
                   "result": "Phase {N} designed: {screen_count} screens, {component_count} components" }]
```

### 5c. Present Summary

```
Lead: "Design phase complete for Phase {N} ({phase_name})!

  Artifacts created:
  - UI Context: .planning/design/UI-CONTEXT.md
  - Design Tokens: .planning/design/design-tokens.json
  - Screen Specs: {screen_count} screens in design/screens/
  - Component Inventory: .planning/design/COMPONENTS.md
  - UI Spec Hub: .planning/design/UI-SPEC.md

  Screen summary:
  {for each screen:}
  - {screen.id}: {screen.name} ({screen.route})
  {endfor}

  Component summary:
  - {component_count} total components
  - {shared_count} shared across screens
  - {custom_count} custom components needed

---
## What's Next

Current: Phase {N} -- {phase_name} | Status: designed | Mode: {mode}

**Recommended next step:**
--> /gmsd:execute-phase {N} -- Execute the plan with design specs guiding implementation

**Other options:**
- /gmsd:design-phase {N} -- Re-run design phase
- /gmsd:plan-phase {N} -- Re-plan (will require re-design after)
- /gmsd:progress -- View full project status"
```

---

## Error Handling

```
IF UI detection finds keywords but no distinct screens (Step 2):
  - Fall back to "minimal" scope
  - Designer creates tokens and component inventory only
  - No screen specs generated

IF single designer crashes (Step 4a):
  - Check what artifacts were written
  - Re-spawn designer for missing artifacts only
  - Provide list of completed vs. incomplete deliverables

IF design team member crashes (Step 4b):
  - Other team members continue
  - Crashed member's uncompleted screen specs remain unclaimed
  - Lead can reassign or spawn replacement
  - Final task (component inventory) waits for all screens regardless

IF design tokens and screen specs have inconsistencies:
  - Detected during component inventory creation
  - Component inventory task notes inconsistencies
  - Lead reports them as design issues (not blocking for execution)

IF user wants to skip design for some screens:
  - Allow partial design
  - Mark skipped screens as "no spec" in UI-SPEC.md
  - Executors implement those screens without spec guidance
```
