---
name: gmsd:pencil
description: Interactive design workflow with Pencil MCP — create, iterate, validate, and sync designs
argument-hint: "[subcommand: open|sync|components|validate|iterate|style|layout] [args]"
allowed-tools: [Read, Write, Glob, Grep, AskUserQuestion, Task, mcp__pencil__*]
agent: gmsd-ui-designer (for complex operations)
---

<objective>
Provide an interactive design workflow using Pencil MCP. Unlike `/gmsd:export pencil` which is a one-way batch operation, `/gmsd:pencil` enables bidirectional sync, iterative refinement, visual validation, and design system management — all with immediate visual feedback via screenshots.
</objective>

<context>
@~/.claude/get-more-shit-done/ui-design/adapters/pencil.md
@.planning/design/UI-SPEC.md (if exists)
@.planning/design/screens/*.md (if exists)
@.planning/design/COMPONENTS.md (if exists)
@.planning/design/design-tokens.json (if exists)
</context>

<subcommands>

## Available Subcommands

| Subcommand | Description | Example |
|------------|-------------|---------|
| `open` | Open or create a .pen design file | `/gmsd:pencil open designs/app.pen` |
| `sync` | Bidirectional sync between specs and designs | `/gmsd:pencil sync --push` |
| `components` | Manage design system components | `/gmsd:pencil components --list` |
| `validate` | Visual validation against specifications | `/gmsd:pencil validate SCR-01` |
| `iterate` | Interactive refinement session | `/gmsd:pencil iterate SCR-01` |
| `style` | Explore and apply style guides | `/gmsd:pencil style --explore` |
| `layout` | Debug layout issues | `/gmsd:pencil layout screen_abc` |

If no subcommand provided, show interactive menu.

</subcommands>

<ux_principles>

## Interactive Experience

This command prioritizes:
1. **Immediate feedback** — Screenshots after every significant change
2. **Conversational flow** — Ask clarifying questions, offer choices
3. **Progressive disclosure** — Start simple, reveal complexity as needed
4. **Recovery friendly** — Easy to undo, iterate, try alternatives

## No Subcommand Behavior

If user runs just `/gmsd:pencil`, present options:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UI ► PENCIL DESIGN WORKFLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What would you like to do?

1. Open/Create    → Open a .pen file or create new design
2. Sync           → Sync between specs and Pencil designs
3. Components     → Manage design system components
4. Validate       → Check designs against specifications
5. Iterate        → Refine a screen interactively
6. Style          → Explore style guides for inspiration
7. Layout         → Debug layout and positioning issues

───────────────────────────────────────────────────────
```

</ux_principles>

<subcommand_open>

## /gmsd:pencil open [file]

Open an existing .pen file or create a new one.

### Arguments
- `[file]` — Path to .pen file (optional)
- `--new` — Force create new file
- `--template [name]` — Start from template (blank, dashboard, landing, mobile)

### Process

<step name="open_determine_file">
**IMPORTANT — .pen file location:** Pencil MCP does NOT work reliably with files whose path passes through hidden directories (any folder starting with `.` like `.planning/`). Even if the file or its immediate folder isn't hidden, a hidden ancestor directory (e.g., `.planning/designs/app.pen`) will cause failures. ALL .pen files MUST be created in a `designs/` folder at the **project root** — at the same level as `.planning/`, NOT inside it. If `designs/` does not exist at the project root, create it first. NEVER create or open .pen files inside `.planning/`, `.planning/design/`, `.planning/designs/`, or any path that passes through a dot-prefixed directory.

If no file specified:
1. Check for existing .pen files in the `designs/` folder
2. If found, list them and ask which to open
3. If none, offer to create new in `designs/` folder

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UI ► PENCIL OPEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Found existing design files:
  1. designs/app.pen (modified 2 hours ago)
  2. designs/components.pen (modified yesterday)

Or create new:
  3. Create new design file

Which would you like to open?
───────────────────────────────────────────────────────
```
</step>

<step name="open_file">
Open or create the file. The file MUST be in the `designs/` folder at the **project root** (sibling of `.planning/`, not inside it):

```javascript
// Open existing (always from project-root designs/ folder)
mcp__pencil__open_document({ filePathOrTemplate: "designs/app.pen" })

// Or create new — after creating, save to project-root designs/ folder
mcp__pencil__open_document({ filePathOrTemplate: "new" })
// The resulting file should be saved as designs/app.pen (or designs/{project-name}.pen)
```

**If user provides a path that passes through any hidden directory** (e.g., `.planning/design/app.pen`, `.planning/designs/app.pen`), redirect to `designs/app.pen` at the project root instead and inform the user that Pencil cannot work with paths through hidden directories.
</step>

<step name="open_get_state">
Get current editor state:

```javascript
mcp__pencil__get_editor_state({ include_schema: false })
```

Report contents:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UI ► PENCIL OPENED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: designs/app.pen

Contents:
  Screens:     3 (SCR-01, SCR-02, SCR-03)
  Components:  12 reusable
  Variables:   24 defined

Quick Actions:
  • /gmsd:pencil iterate SCR-01  — Refine a screen
  • /gmsd:pencil components      — Manage components
  • /gmsd:pencil sync --push     — Push specs to design

───────────────────────────────────────────────────────
```
</step>

<step name="open_sync_tokens">
If `design-tokens.json` exists and file is new/empty, offer to sync:

```
Design tokens found. Sync to Pencil variables?
  • Yes — Set up variables from design-tokens.json
  • No  — I'll set up manually
```

If yes:
```javascript
// Read tokens
const tokens = readFile(".planning/design/design-tokens.json")

// Convert and set
mcp__pencil__set_variables({
  filePath: "designs/app.pen",
  variables: convertW3CTokensToPencil(tokens)
})
```
</step>

</subcommand_open>

<subcommand_sync>

## /gmsd:pencil sync [direction]

Bidirectional synchronization between specs and Pencil designs.

### Arguments
- `--push` — Specs → Pencil (create/update designs from specs)
- `--pull` — Pencil → Specs (extract designs back to specs)
- `--diff` — Show differences without changing anything
- `--screen [SCR-XX]` — Limit to specific screen(s)
- `--tokens` — Sync only design tokens/variables
- `--components` — Sync only components

### Process: Push (Specs → Pencil)

<step name="sync_push_load">
Load specifications:

```javascript
// Read all specs
const specs = glob(".planning/design/screens/*.md")
const tokens = readFile(".planning/design/design-tokens.json")
const components = readFile(".planning/design/COMPONENTS.md")
```
</step>

<step name="sync_push_compare">
Compare with existing Pencil content:

```javascript
mcp__pencil__batch_get({
  filePath: "designs/app.pen",
  patterns: [{ name: "SCR-.*" }],
  readDepth: 1
})
```

Report differences:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UI ► SYNC PUSH PREVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Comparing specs to Pencil designs...

Will CREATE (not in Pencil):
  + SCR-03: Dashboard
  + SCR-04: Settings

Will UPDATE (spec changed):
  ~ SCR-01: Login (spec modified after design)

Already synced:
  ✓ SCR-02: Signup

Proceed with push?
───────────────────────────────────────────────────────
```
</step>

<step name="sync_push_execute">
For each screen to create/update:

```javascript
// Generate operations from spec
const operations = transformSpecToOperations(spec)

// Execute
mcp__pencil__batch_design({
  filePath: "designs/app.pen",
  operations: operations
})

// Validate with screenshot
mcp__pencil__get_screenshot({
  filePath: "designs/app.pen",
  nodeId: screenId
})
```
</step>

### Process: Pull (Pencil → Specs)

<step name="sync_pull_read">
Read all designs from Pencil:

```javascript
// Get all screens
mcp__pencil__batch_get({
  filePath: "designs/app.pen",
  patterns: [{ name: "SCR-.*" }],
  readDepth: 4
})

// Get variables
mcp__pencil__get_variables({ filePath: "designs/app.pen" })

// Get components
mcp__pencil__batch_get({
  filePath: "designs/app.pen",
  patterns: [{ reusable: true }],
  readDepth: 2
})
```
</step>

<step name="sync_pull_transform">
Transform Pencil nodes to spec format:

```markdown
# SCR-01: Login

Route: /login
Layout: centered-card
Status: Designed (from Pencil)

## Wireframe
[Generate ASCII from node structure]

## Components
[Extract from node tree]

## Design Tokens Used
[Map from variables]
```
</step>

<step name="sync_pull_write">
Write or update spec files:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UI ► SYNC PULL COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Extracted from Pencil:

Screens:
  ✓ .planning/design/screens/SCR-01-login.md (updated)
  ✓ .planning/design/screens/SCR-05-profile.md (created)

Tokens:
  ✓ .planning/design/design-tokens.json (updated)

Components:
  ✓ .planning/design/COMPONENTS.md (updated)

───────────────────────────────────────────────────────
```
</step>

### Process: Diff

<step name="sync_diff">
Show differences without making changes:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UI ► SYNC DIFF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SCR-01: Login
  Spec                      │ Pencil
  ─────────────────────────────────────────────────
  Primary: #2563EB          │ Primary: #3B82F6 ⚠️
  Card padding: 32px        │ Card padding: 24px ⚠️
  Has "Forgot password"     │ Has "Forgot password" ✓
  Has Google button         │ Missing Google button ⚠️

SCR-02: Signup
  ✓ In sync

Actions:
  • /gmsd:pencil sync --push SCR-01  — Update Pencil from spec
  • /gmsd:pencil sync --pull SCR-01  — Update spec from Pencil

───────────────────────────────────────────────────────
```
</step>

</subcommand_sync>

<subcommand_components>

## /gmsd:pencil components [action]

Manage design system components in Pencil.

### Arguments
- `--list` — List all reusable components
- `--create [name]` — Create new component
- `--create-from-specs` — Create components from COMPONENTS.md
- `--preview [name]` — Screenshot a component
- `--extract [nodeId]` — Convert existing node to reusable component
- `--variants [name]` — Show/create component variants

### Process: List

<step name="components_list">
```javascript
mcp__pencil__batch_get({
  filePath: "designs/app.pen",
  patterns: [{ reusable: true }],
  readDepth: 2
})
```

Display:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UI ► DESIGN SYSTEM COMPONENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Buttons (4)
  • Button/Primary      ID: btn_primary
  • Button/Secondary    ID: btn_secondary
  • Button/Ghost        ID: btn_ghost
  • Button/Destructive  ID: btn_destructive

Inputs (3)
  • Input/Default       ID: input_default
  • Input/Error         ID: input_error
  • Input/Disabled      ID: input_disabled

Cards (2)
  • Card/Default        ID: card_default
  • Card/Elevated       ID: card_elevated

Actions:
  • /gmsd:pencil components --preview Button/Primary
  • /gmsd:pencil components --create "Badge"
  • /gmsd:pencil components --variants Button/Primary

───────────────────────────────────────────────────────
```
</step>

### Process: Create from Specs

<step name="components_from_specs">
Read COMPONENTS.md and create each:

```javascript
// For each component in spec
const operations = `
btnPrimary=I(dsFrame, { type: "frame", name: "Button/Primary", reusable: true, layout: "horizontal", fill: "#2563EB", padding: [12, 24], cornerRadius: 6 })
btnLabel=I(btnPrimary, { type: "text", name: "label", content: "Button", fill: "#FFFFFF", fontSize: 14, fontWeight: "500" })
`

mcp__pencil__batch_design({
  filePath: "designs/app.pen",
  operations: operations
})
```

Report with screenshots:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UI ► COMPONENTS CREATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Created 8 components from COMPONENTS.md:

✓ Button/Primary     [screenshot]
✓ Button/Secondary   [screenshot]
✓ Input/Default      [screenshot]
✓ Input/Error        [screenshot]
✓ Card/Default       [screenshot]
✓ Avatar             [screenshot]
✓ Badge              [screenshot]
✓ Divider            [screenshot]

───────────────────────────────────────────────────────
```
</step>

### Process: Extract

<step name="components_extract">
Convert existing node to reusable component:

```javascript
// Make node reusable
mcp__pencil__batch_design({
  filePath: "designs/app.pen",
  operations: `U("existingNodeId", { reusable: true, name: "Component/Name" })`
})
```
</step>

### Process: Preview

<step name="components_preview">
```javascript
mcp__pencil__get_screenshot({
  filePath: "designs/app.pen",
  nodeId: "componentId"
})
```

Show screenshot with component details.
</step>

</subcommand_components>

<subcommand_validate>

## /gmsd:pencil validate [screen]

Visual validation of designs against specifications.

### Arguments
- `[screen]` — Screen ID (SCR-XX) or "all"
- `--strict` — Fail on any deviation
- `--report` — Generate validation report file

### Process

<step name="validate_load">
Load spec and capture screenshot:

```javascript
// Read spec
const spec = readFile(".planning/design/screens/SCR-01-login.md")

// Get screenshot
mcp__pencil__get_screenshot({
  filePath: "designs/app.pen",
  nodeId: "screen_abc123"
})
```
</step>

<step name="validate_compare">
Compare spec requirements to visual:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UI ► VALIDATION: SCR-01 Login
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Screenshot displayed]

Checking against spec...

Layout:
  ✓ Centered card layout
  ✓ Card max-width ~400px
  ✓ Vertical centering

Components:
  ✓ Logo present
  ✓ "Welcome back" heading
  ✓ Email input with label
  ✓ Password input with label
  ✓ Primary "Sign In" button
  ⚠️ "Forgot password?" link — not visible
  ✓ Divider with "or"
  ⚠️ Google button — missing icon

Colors:
  ✓ Primary button matches #2563EB
  ✓ Background matches #F8FAFC
  ⚠️ Muted text appears darker than spec

Overall: 2 issues found

Fix suggestions:
  • Add "Forgot password?" text link below Sign In button
  • Add Google icon to secondary button

───────────────────────────────────────────────────────
```
</step>

<step name="validate_offer_fix">
Offer to fix issues:

```
Would you like to fix these issues?
  • Yes — Generate fix operations
  • No  — I'll fix manually
  • Iterate — Open interactive refinement
```

If yes:
```javascript
mcp__pencil__batch_design({
  filePath: "designs/app.pen",
  operations: `
forgotLink=I("cardId", { type: "text", content: "Forgot password?", fontSize: 14, fill: "#64748B" })
M(forgotLink, "cardId", 5)
`
})
```
</step>

<step name="validate_report">
If `--report` flag, generate report file:

```markdown
# Validation Report: SCR-01 Login

Date: 2026-01-23
Status: 2 issues

## Screenshot
[embedded or linked]

## Checklist

### Layout
- [x] Centered card layout
- [x] Card max-width ~400px
- [x] Vertical centering

### Components
- [x] Logo present
- [x] "Welcome back" heading
- [x] Email input with label
- [x] Password input with label
- [x] Primary "Sign In" button
- [ ] "Forgot password?" link — **MISSING**
- [x] Divider with "or"
- [ ] Google button icon — **MISSING**

### Colors
- [x] Primary: #2563EB
- [x] Background: #F8FAFC
- [ ] Muted text: appears darker

## Recommendations
1. Add forgot password link
2. Add Google icon to button
3. Adjust muted text color
```
</step>

</subcommand_validate>

<subcommand_iterate>

## /gmsd:pencil iterate [screen]

Interactive refinement session with immediate visual feedback.

### Arguments
- `[screen]` — Screen ID (SCR-XX) or node ID
- `--from-scratch` — Start with blank screen
- `--from-spec` — Generate initial design from spec first

### Process

<step name="iterate_init">
Initialize session:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UI ► ITERATE: SCR-01 Login
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Starting interactive refinement session.

[Current screenshot displayed]

I'll help you refine this design. You can:
  • Describe changes in natural language
  • Request specific operations
  • Ask for style suggestions
  • Say "done" when finished

What would you like to change?
───────────────────────────────────────────────────────
```
</step>

<step name="iterate_loop">
Refinement loop:

1. **User describes change:**
   "Make the card shadow more prominent"

2. **Generate operations:**
   ```javascript
   U("cardId", { effects: [{ type: "dropShadow", offsetX: 0, offsetY: 4, blur: 12, color: "rgba(0,0,0,0.15)" }] })
   ```

3. **Execute:**
   ```javascript
   mcp__pencil__batch_design({ operations: "..." })
   ```

4. **Show result:**
   ```javascript
   mcp__pencil__get_screenshot({ nodeId: "screenId" })
   ```

5. **Confirm:**
   ```
   [New screenshot]

   Changed: Card shadow increased to 12px blur, 15% opacity

   • Keep — Accept this change
   • Undo — Revert to previous
   • Adjust — Make it even more/less
   • Next — Move on to something else
   ```

6. **Repeat until "done"**
</step>

<step name="iterate_history">
Track changes during session:

```
Session History:
  1. ✓ Increased card shadow
  2. ✓ Changed heading to 28px
  3. ✓ Added forgot password link
  4. ↩ Reverted button color (undone)
  5. ✓ Adjusted input border color

Total changes: 4 applied, 1 reverted
```
</step>

<step name="iterate_complete">
When user says "done":

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UI ► ITERATE COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Session summary:
  Screen: SCR-01 Login
  Changes: 4 applied
  Duration: ~5 minutes

[Final screenshot]

Would you like to:
  • Sync — Update spec from this design
  • Validate — Run validation check
  • Continue — Keep iterating
  • Done — End session

───────────────────────────────────────────────────────
```
</step>

### Natural Language Examples

| User Says | Generated Operation |
|-----------|---------------------|
| "Make the button bigger" | `U(btnId, { height: 48, padding: [14, 28] })` |
| "Add more space between inputs" | `U(formGroup, { gap: 20 })` |
| "The heading should be bolder" | `U(heading, { fontWeight: "700" })` |
| "Center the forgot password text" | `U(forgotLink, { textAlign: "center", width: "fill_container" })` |
| "Add a subtle border to the card" | `U(card, { stroke: "#E2E8F0", strokeWidth: 1 })` |
| "Make everything more compact" | `U(card, { padding: 24, gap: 16 })` |

</subcommand_iterate>

<subcommand_style>

## /gmsd:pencil style [action]

Explore and apply style guides for design inspiration.

### Arguments
- `--explore` — Browse available style tags
- `--apply [id]` — Apply a specific style guide
- `--tags [tags]` — Get style guide for specific tags
- `--preview` — Preview style without applying

### Process: Explore

<step name="style_explore">
Get available tags:

```javascript
mcp__pencil__get_style_guide_tags()
```

Display grouped by category:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UI ► STYLE GUIDE EXPLORER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Available style tags:

Platform:
  mobile, webapp, website, desktop

Industry:
  saas, ecommerce, fintech, healthcare, education

Aesthetic:
  modern, minimal, bold, playful, professional, elegant

Color:
  dark, light, colorful, monochrome, gradient

Layout:
  dashboard, landing, forms, cards, data-heavy

Select tags to generate a style guide:
───────────────────────────────────────────────────────
```
</step>

<step name="style_get">
Get style guide for selected tags:

```javascript
mcp__pencil__get_style_guide({
  tags: ["saas", "modern", "webapp", "professional", "dashboard"]
})
```

Display style guide:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UI ► STYLE GUIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tags: saas, modern, webapp, professional, dashboard

Color Palette:
  Primary:    #2563EB (Blue)
  Secondary:  #64748B (Slate)
  Accent:     #8B5CF6 (Purple)
  Background: #F8FAFC (Light gray)
  Surface:    #FFFFFF (White)

Typography:
  Headings:   Inter, semibold
  Body:       Inter, regular
  Mono:       JetBrains Mono

Spacing:
  Base unit:  4px
  Component:  16px gaps
  Section:    32px gaps

Style Notes:
  • Clean lines, minimal decoration
  • Subtle shadows for depth
  • Rounded corners (6-8px)
  • High contrast for readability
  • Consistent icon style

Apply this style?
  • Yes — Apply to current design
  • Preview — Show example first
  • Different — Try other tags

───────────────────────────────────────────────────────
```
</step>

<step name="style_apply">
Apply style to design:

```javascript
// Update variables
mcp__pencil__set_variables({
  filePath: "designs/app.pen",
  variables: styleGuide.variables
})

// Update existing elements
mcp__pencil__replace_all_matching_properties({
  filePath: "designs/app.pen",
  parents: ["screenId"],
  properties: {
    fillColor: styleGuide.colorMapping,
    fontFamily: styleGuide.fontMapping,
    cornerRadius: styleGuide.radiusMapping
  }
})
```
</step>

</subcommand_style>

<subcommand_layout>

## /gmsd:pencil layout [node]

Debug layout and positioning issues.

### Arguments
- `[node]` — Node ID to inspect (optional, defaults to selected)
- `--problems` — Only show nodes with issues
- `--depth [n]` — How deep to inspect (default: 3)

### Process

<step name="layout_snapshot">
Get layout snapshot:

```javascript
mcp__pencil__snapshot_layout({
  filePath: "designs/app.pen",
  parentId: nodeId,
  maxDepth: 3,
  problemsOnly: false  // or true for --problems
})
```
</step>

<step name="layout_display">
Display layout structure:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UI ► LAYOUT DEBUG: SCR-01 Login
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Layout Tree:
  Screen (1440×900)
  └── CenterContainer (1440×900, vertical, center)
      └── Card (400×auto, vertical, gap:24)
          ├── Logo (48×48) ✓
          ├── Heading (400×36) ✓
          ├── FormGroup (400×auto, vertical, gap:16)
          │   ├── EmailLabel (400×20) ✓
          │   ├── EmailInput (400×40) ✓
          │   ├── PasswordLabel (400×20) ✓
          │   └── PasswordInput (400×40) ✓
          ├── SignInButton (400×44) ✓
          ├── ForgotLink (400×20) ✓
          ├── Divider (400×1) ✓
          └── GoogleButton (400×44) ✓

No layout issues detected.

───────────────────────────────────────────────────────
```
</step>

<step name="layout_problems">
When problems detected:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UI ► LAYOUT ISSUES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ 2 layout issues found:

1. CLIPPED: PasswordInput
   Parent: FormGroup (400×160)
   Child:  PasswordInput (420×40)
   Issue:  Child width exceeds parent by 20px
   Fix:    U("passwordInput", { width: "fill_container" })

2. OVERFLOW: Card
   Parent: CenterContainer (1440×900)
   Child:  Card (400×950)
   Issue:  Card height exceeds container
   Fix:    Reduce padding or content

Apply fixes?
  • Fix all — Apply suggested fixes
  • Fix #1 — Apply specific fix
  • Manual — I'll fix myself

───────────────────────────────────────────────────────
```
</step>

<step name="layout_find_space">
Helper for finding empty space:

```javascript
mcp__pencil__find_empty_space_on_canvas({
  filePath: "designs/app.pen",
  nodeId: "existingScreenId",
  width: 1440,
  height: 900,
  padding: 100,
  direction: "right"
})
```

Returns coordinates for new screen placement.
</step>

</subcommand_layout>

<state_management>

## File Location Rule

**CRITICAL:** All `.pen` design files MUST live in the `designs/` folder at the **project root** (sibling of `.planning/`, NOT inside it). Pencil MCP cannot work with files whose path passes through any hidden directory (folders starting with `.`). Even a visible folder inside a hidden parent will fail.

- Correct: `designs/app.pen`, `designs/components.pen`, `designs/variation-a.pen` (at project root)
- Wrong: `.planning/design/app.pen`, `.planning/designs/app.pen`, `.planning/app.pen`

```
project-root/
├── .planning/          ← hidden, Pencil CANNOT access anything here
│   ├── design/         ← even though "design" is visible, parent is hidden
│   └── ...
├── designs/            ← CORRECT location for .pen files
│   ├── app.pen
│   └── components.pen
└── ...
```

## State Tracking

Track Pencil session state in `.planning/design/ui-state/pencil-state.json`:

```json
{
  "active_file": "designs/app.pen",
  "last_opened": "2026-01-23T10:30:00Z",
  "screens": {
    "SCR-01": {
      "node_id": "screen_abc123",
      "last_synced": "2026-01-23T10:35:00Z",
      "sync_direction": "push",
      "validated": true,
      "validation_issues": 0
    }
  },
  "components": {
    "Button/Primary": "btn_primary",
    "Input/Default": "input_default"
  },
  "variables_synced": true,
  "last_style_guide": {
    "tags": ["saas", "modern", "webapp"],
    "applied": "2026-01-23T10:32:00Z"
  },
  "iterate_sessions": [
    {
      "screen": "SCR-01",
      "started": "2026-01-23T10:40:00Z",
      "changes": 4,
      "completed": true
    }
  ]
}
```

</state_management>

<error_handling>

## Error Handling

### No .pen File Open
```
⚠️ No Pencil file is currently open.

Run: /gmsd:pencil open [file]
```

### MCP Connection Failed
```
⚠️ Cannot connect to Pencil MCP server.

Ensure Pencil MCP is running and configured in your Claude Code settings.
```

### Operation Failed
```
⚠️ Operation failed: [error message]

The batch was rolled back. No changes were made.

Debug:
  • /gmsd:pencil layout — Check for layout issues
  • Review operation syntax
```

### File in Hidden Directory Path
```
⚠️ The .pen file path passes through a hidden directory (.planning/).

Pencil MCP cannot access files through hidden (dot-prefixed) directories,
even if the file's immediate folder is visible.

Moving to: designs/app.pen (at project root)

Run: /gmsd:pencil open designs/app.pen
```

If the user has an existing .pen file inside `.planning/design/`, `.planning/designs/`, or any path through a hidden directory, offer to move/copy it to the project-root `designs/` folder and open from there.

### Screen Not Found
```
⚠️ Screen "SCR-05" not found in Pencil file.

Available screens:
  • SCR-01: Login
  • SCR-02: Signup
  • SCR-03: Dashboard

Create it?
  • /gmsd:pencil sync --push SCR-05
```

</error_handling>

<success_criteria>

## Success Criteria

**Open:**
- File opened or created successfully
- Current state displayed
- Variables synced if requested

**Sync:**
- All specified screens processed
- Screenshots captured for push operations
- Specs updated for pull operations
- Registry updated with node mappings

**Components:**
- Components created/listed successfully
- Preview screenshots generated
- Components marked as reusable

**Validate:**
- Screenshot captured
- All spec requirements checked
- Issues clearly reported
- Fix suggestions provided

**Iterate:**
- Changes executed successfully
- Screenshots shown after each change
- History tracked
- Final state confirmed

**Style:**
- Tags explored or style guide retrieved
- Style applied if requested
- Variables updated

**Layout:**
- Layout tree displayed
- Problems identified
- Fixes suggested or applied

</success_criteria>

<workflow_guidance>

## Next Steps After Pencil Work

After any Pencil subcommand completes, suggest the logical next action:

**After /gmsd:pencil open:**
- `/gmsd:pencil sync --push` — Push screen specs into the design
- `/gmsd:pencil iterate` — Start refining the design interactively

**After /gmsd:pencil sync:**
- `/gmsd:pencil validate` — Verify the design matches specs
- `/gmsd:pencil iterate` — Refine specific elements
- `/gmsd:realize` — Mark synced screens as realized

**After /gmsd:pencil iterate (done):**
- `/gmsd:pencil sync --pull` — Pull changes back into specs
- `/gmsd:pencil validate` — Check against spec requirements
- `/gmsd:export` — Export updated designs to other tools

**After /gmsd:pencil validate:**
- `/gmsd:pencil iterate` — Fix any issues found
- `/gmsd:realize` — Mark validated screens as realized
- `/gmsd:ui-sync` — Sync specs with implementation

**After /gmsd:pencil style:**
- `/gmsd:pencil iterate` — Refine after style application
- `/gmsd:export` — Export the styled design

**General workflow reminder:**
```
───────────────────────────────────────────────────────

## ▶ Typical Flow

/gmsd:pencil open → sync --push → iterate → validate → sync --pull → /gmsd:realize

Other commands:
  /gmsd:export      — Export to Figma, V0, Stitch, or generic
  /gmsd:ui-sync     — Check drift between specs and code
  /gmsd:ui-status   — Review overall progress

───────────────────────────────────────────────────────
```

</workflow_guidance>
