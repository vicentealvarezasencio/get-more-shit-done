# Pencil MCP Integration Guide

Complete guide for using `/gmsd:pencil` — the interactive design workflow powered by Pencil MCP.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Subcommands Reference](#subcommands-reference)
5. [Workflows](#workflows)
6. [Use Cases](#use-cases)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)
9. [Integration with Other Commands](#integration-with-other-commands)

---

## Overview

### What is `/gmsd:pencil`?

`/gmsd:pencil` is an interactive design command that connects the UI Design System to Pencil MCP, enabling:

- **Direct design execution** — No copy/paste, designs render immediately
- **Visual validation** — Screenshots verify designs match specs
- **Bidirectional sync** — Push specs to designs OR pull designs back to specs
- **Iterative refinement** — Make changes and see results instantly
- **Design system management** — Create and manage reusable components

### How It Differs from `/gmsd:export pencil`

| Aspect | `/gmsd:export pencil` | `/gmsd:pencil` |
|--------|---------------------|--------------|
| Direction | One-way (spec → design) | Bidirectional |
| Interaction | Batch operation | Interactive session |
| Feedback | End result only | Screenshots at each step |
| Iteration | Re-run export | In-session refinement |
| Components | Creates from scratch | Manages library |
| Validation | Manual | Built-in |

### When to Use Which

**Use `/gmsd:export pencil` when:**
- You have complete specs and want to generate all designs at once
- You're doing initial bulk creation
- You don't need interactive feedback

**Use `/gmsd:pencil` when:**
- You want to iterate on designs interactively
- You need to validate designs against specs
- You're managing a design system
- You want to sync changes bidirectionally
- You're exploring style options

---

## Prerequisites

### 0. File Location Rule

**CRITICAL:** All `.pen` design files MUST be stored in the `designs/` folder at the **project root** (sibling of `.planning/`, NOT inside it). Pencil MCP cannot access files whose path passes through any hidden directory (dot-prefixed folders like `.planning/`). Even a visible subfolder inside a hidden parent (e.g., `.planning/designs/app.pen`) will fail. Always use `designs/app.pen` at the project root.

### 1. Pencil MCP Server

Ensure Pencil MCP is configured in your Claude Code settings:

```json
// In your MCP configuration
{
  "mcpServers": {
    "pencil": {
      "command": "...",
      "args": ["..."]
    }
  }
}
```

### 2. UI Design System Installed

The UI Design System should be installed (included with GMSD):

```bash
npx get-more-shit-done-cc
```

### 3. Project Initialization (Recommended)

For best results, initialize your UI specs first:

```bash
/gmsd:init
/gmsd:setup-tokens
/gmsd:design-screens
```

This gives `/gmsd:pencil` specs to work with.

---

## Quick Start

### Scenario: Create your first Pencil design

```bash
# 1. Open or create a design file
/gmsd:pencil open designs/myapp.pen

# 2. If you have specs, push them to Pencil
/gmsd:pencil sync --push

# 3. Validate the results
/gmsd:pencil validate SCR-01

# 4. Iterate on any issues
/gmsd:pencil iterate SCR-01
```

### Scenario: Start from scratch with style guide

```bash
# 1. Create new design file
/gmsd:pencil open --new

# 2. Explore and apply a style
/gmsd:pencil style --explore
# Select tags: saas, modern, dashboard

# 3. Create components from specs
/gmsd:pencil components --create-from-specs

# 4. Build screens interactively
/gmsd:pencil iterate SCR-01 --from-scratch
```

---

## Subcommands Reference

### `/gmsd:pencil open`

Opens or creates a Pencil design file.

**Syntax:**
```bash
/gmsd:pencil open [file]           # Open specific file
/gmsd:pencil open                  # List and choose
/gmsd:pencil open --new            # Create new file
/gmsd:pencil open --template dash  # Start from template
```

**Examples:**
```bash
# Open existing file
/gmsd:pencil open designs/app.pen

# Create new file with guided setup
/gmsd:pencil open --new

# Start from dashboard template
/gmsd:pencil open --template dashboard
```

**What happens:**
1. File opens in Pencil
2. Current contents are analyzed
3. Summary shown (screens, components, variables)
4. Offers to sync design tokens if available

---

### `/gmsd:pencil sync`

Bidirectional synchronization between specs and Pencil designs.

**Syntax:**
```bash
/gmsd:pencil sync --push           # Specs → Pencil
/gmsd:pencil sync --pull           # Pencil → Specs
/gmsd:pencil sync --diff           # Show differences
/gmsd:pencil sync --push SCR-01    # Single screen
/gmsd:pencil sync --tokens         # Only tokens
/gmsd:pencil sync --components     # Only components
```

**Push workflow (Specs → Pencil):**
1. Reads your `.planning/screens/*.md` specs
2. Compares to existing Pencil screens
3. Shows what will be created/updated
4. Asks for confirmation
5. Generates and executes operations
6. Takes screenshots for validation
7. Updates registry with node IDs

**Pull workflow (Pencil → Specs):**
1. Reads all screens from Pencil
2. Extracts structure, colors, components
3. Generates spec markdown files
4. Updates design tokens from variables
5. Updates component inventory

**Diff workflow:**
1. Compares specs to Pencil designs
2. Shows differences side-by-side
3. Does NOT make any changes
4. Suggests sync direction

**Examples:**
```bash
# Full sync from specs to Pencil
/gmsd:pencil sync --push

# Pull a design you modified in Pencil back to specs
/gmsd:pencil sync --pull SCR-01

# Check what's different without changing anything
/gmsd:pencil sync --diff

# Only sync design tokens
/gmsd:pencil sync --tokens --push
```

---

### `/gmsd:pencil components`

Manage design system components.

**Syntax:**
```bash
/gmsd:pencil components --list              # List all
/gmsd:pencil components --create "Badge"    # Create new
/gmsd:pencil components --create-from-specs # From COMPONENTS.md
/gmsd:pencil components --preview Button/Primary
/gmsd:pencil components --extract nodeId    # Make node reusable
/gmsd:pencil components --variants Button/Primary
```

**List:** Shows all reusable components grouped by type.

**Create:** Interactive component creation:
1. Asks for component name
2. Asks for type (button, input, card, etc.)
3. Asks for variants needed
4. Generates component with properties
5. Shows screenshot

**Create from specs:** Reads `COMPONENTS.md` and creates all:
1. Parses component specifications
2. Creates each as reusable node
3. Takes screenshots of each
4. Reports results

**Preview:** Takes screenshot of specific component.

**Extract:** Converts existing node to reusable:
1. Identifies node by ID
2. Marks as `reusable: true`
3. Assigns component name
4. Now usable as `ref` in other screens

**Examples:**
```bash
# See what components exist
/gmsd:pencil components --list

# Create all components from your specs
/gmsd:pencil components --create-from-specs

# Preview a specific component
/gmsd:pencil components --preview Input/Error

# I designed a nice card, make it reusable
/gmsd:pencil components --extract card_abc123 --name "Card/Feature"
```

---

### `/gmsd:pencil validate`

Visual validation against specifications.

**Syntax:**
```bash
/gmsd:pencil validate SCR-01       # Single screen
/gmsd:pencil validate all          # All screens
/gmsd:pencil validate --strict     # Fail on any issue
/gmsd:pencil validate --report     # Generate report file
```

**Validation checks:**
- Layout matches wireframe
- All components from spec present
- Colors match design tokens
- Typography matches spec
- Spacing matches spec
- States designed (if spec lists them)

**Output:**
- Screenshot of current design
- Checklist of spec requirements
- Pass/fail for each item
- Suggestions for fixes
- Option to auto-fix or iterate

**Examples:**
```bash
# Validate login screen
/gmsd:pencil validate SCR-01

# Validate everything and generate report
/gmsd:pencil validate all --report

# Strict validation (for CI/CD)
/gmsd:pencil validate all --strict
```

---

### `/gmsd:pencil iterate`

Interactive refinement session.

**Syntax:**
```bash
/gmsd:pencil iterate SCR-01              # Refine existing
/gmsd:pencil iterate SCR-01 --from-spec  # Generate first, then refine
/gmsd:pencil iterate --from-scratch      # Start blank
```

**How it works:**
1. Shows current screenshot
2. Asks "What would you like to change?"
3. You describe changes in natural language
4. Generates and executes operations
5. Shows new screenshot
6. Asks to keep, undo, or adjust
7. Repeat until you say "done"

**Natural language examples:**

| You say | What happens |
|---------|--------------|
| "Make the button bigger" | Increases button height and padding |
| "Add more space between inputs" | Increases gap in form group |
| "The heading should be bolder" | Changes font weight to 700 |
| "Move forgot password below the button" | Reorders elements |
| "Add a subtle border to the card" | Adds light stroke |
| "Make everything more compact" | Reduces padding and gaps |
| "Try a darker background" | Changes background color |
| "Add an icon to the Google button" | Inserts icon element |

**Session controls:**
- **"keep"** — Accept current change
- **"undo"** — Revert last change
- **"adjust"** — Modify the last change
- **"history"** — Show all changes this session
- **"done"** — End session

**Examples:**
```bash
# Interactive refinement of login screen
/gmsd:pencil iterate SCR-01

# Generate from spec first, then refine
/gmsd:pencil iterate SCR-03 --from-spec

# Start completely fresh
/gmsd:pencil iterate --from-scratch
```

---

### `/gmsd:pencil style`

Explore and apply style guides.

**Syntax:**
```bash
/gmsd:pencil style --explore       # Browse tags
/gmsd:pencil style --tags "saas,modern,dashboard"
/gmsd:pencil style --apply sg_123  # Apply by ID
/gmsd:pencil style --preview       # Preview without applying
```

**Explore workflow:**
1. Shows available style tags by category
2. You select tags that fit your project
3. Generates style guide for those tags
4. Shows color palette, typography, spacing
5. Option to apply or try different tags

**Tag categories:**
- **Platform:** mobile, webapp, website, desktop
- **Industry:** saas, ecommerce, fintech, healthcare
- **Aesthetic:** modern, minimal, bold, playful, professional
- **Color:** dark, light, colorful, monochrome
- **Layout:** dashboard, landing, forms, cards

**Apply workflow:**
1. Updates Pencil variables with style colors
2. Optionally updates existing elements
3. Shows before/after comparison

**Examples:**
```bash
# Explore what styles are available
/gmsd:pencil style --explore

# Get a style guide for specific tags
/gmsd:pencil style --tags "fintech,professional,webapp,dark"

# Preview a style before applying
/gmsd:pencil style --tags "playful,colorful,mobile" --preview

# Apply a previously saved style guide
/gmsd:pencil style --apply sg_abc123
```

---

### `/gmsd:pencil layout`

Debug layout and positioning issues.

**Syntax:**
```bash
/gmsd:pencil layout screen_abc     # Inspect specific node
/gmsd:pencil layout --problems     # Only show issues
/gmsd:pencil layout --depth 5      # Deeper inspection
```

**What it shows:**
- Tree structure of nodes
- Dimensions and positioning
- Layout mode (horizontal, vertical, grid)
- Alignment and gap values
- Problems highlighted

**Common problems detected:**
- **Clipped content** — Child larger than parent
- **Overflow** — Content exceeds bounds
- **Misalignment** — Items not aligned as expected
- **Gap issues** — Inconsistent spacing

**Fix suggestions:**
- For each problem, suggests specific operation
- Option to apply fixes automatically

**Examples:**
```bash
# Debug layout of a screen
/gmsd:pencil layout screen_abc123

# Show only problematic nodes
/gmsd:pencil layout --problems

# Deep inspection of complex layout
/gmsd:pencil layout screen_abc123 --depth 5
```

---

## Workflows

### Workflow 1: New Project from Specs

Best for: Starting a new project with defined specifications.

```bash
# Step 1: Initialize specs (if not done)
/gmsd:init
/gmsd:setup-tokens
/gmsd:design-screens

# Step 2: Open new Pencil file
/gmsd:pencil open --new

# Step 3: Get style inspiration
/gmsd:pencil style --explore
# Select: saas, modern, webapp, professional

# Step 4: Create design system components
/gmsd:pencil components --create-from-specs

# Step 5: Push all screens
/gmsd:pencil sync --push

# Step 6: Validate each screen
/gmsd:pencil validate all

# Step 7: Iterate on any issues
/gmsd:pencil iterate SCR-01
```

### Workflow 2: Rapid Prototyping

Best for: Quickly exploring design ideas without full specs.

```bash
# Step 1: Open new file
/gmsd:pencil open --new

# Step 2: Pick a style
/gmsd:pencil style --tags "minimal,webapp,light"

# Step 3: Start iterating from scratch
/gmsd:pencil iterate --from-scratch

# Say things like:
# "Create a login screen with email and password"
# "Add a card in the center"
# "Make it look more modern"
# "Add social login buttons"

# Step 4: When happy, pull back to specs
/gmsd:pencil sync --pull
```

### Workflow 3: Design System First

Best for: Building a component library before screens.

```bash
# Step 1: Open/create file
/gmsd:pencil open designs/design-system.pen

# Step 2: Apply style guide
/gmsd:pencil style --tags "saas,modern,professional"

# Step 3: Create components interactively
/gmsd:pencil components --create "Button/Primary"
/gmsd:pencil components --create "Button/Secondary"
/gmsd:pencil components --create "Input/Default"
/gmsd:pencil components --create "Card/Default"
# ... etc

# Step 4: Preview and refine each
/gmsd:pencil components --preview Button/Primary
/gmsd:pencil iterate btn_primary_id

# Step 5: Build screens using components
/gmsd:pencil sync --push
```

### Workflow 4: Existing Design Refinement

Best for: Improving designs that already exist in Pencil.

```bash
# Step 1: Open existing file
/gmsd:pencil open designs/app.pen

# Step 2: Check current state
/gmsd:pencil layout --problems

# Step 3: Fix any layout issues
# (follow suggestions)

# Step 4: Validate against specs
/gmsd:pencil validate all

# Step 5: Iterate on issues
/gmsd:pencil iterate SCR-01

# Step 6: If you made good changes, update specs
/gmsd:pencil sync --pull SCR-01
```

### Workflow 5: Design Review & Validation

Best for: Checking that designs match specifications.

```bash
# Step 1: Open design file
/gmsd:pencil open designs/app.pen

# Step 2: Run full validation
/gmsd:pencil validate all --report

# Step 3: Review report
# Opens .planning/ui-exports/validation-report.md

# Step 4: Fix issues found
/gmsd:pencil iterate SCR-01  # For each screen with issues

# Step 5: Re-validate
/gmsd:pencil validate all --strict
```

### Workflow 6: Bidirectional Collaboration

Best for: When designs and specs evolve together.

```bash
# Designer made changes in Pencil...

# Step 1: Check what changed
/gmsd:pencil sync --diff

# Step 2: Pull design changes to specs
/gmsd:pencil sync --pull

# Developer updated specs...

# Step 3: Check what changed
/gmsd:pencil sync --diff

# Step 4: Push spec changes to design
/gmsd:pencil sync --push
```

---

## Use Cases

### Use Case 1: Solo Developer Building a SaaS App

**Scenario:** You're building a task management SaaS and want to design the UI before coding.

```bash
# Initialize project
/gmsd:init
# Answer: SaaS, web app, task management, modern aesthetic

# Set up design tokens
/gmsd:setup-tokens

# Design key screens
/gmsd:design-screens
# Define: Dashboard, Task List, Task Detail, Settings

# Open Pencil and apply style
/gmsd:pencil open --new
/gmsd:pencil style --tags "saas,modern,webapp,productivity"

# Create components
/gmsd:pencil components --create-from-specs

# Generate all screens
/gmsd:pencil sync --push

# Refine dashboard
/gmsd:pencil iterate SCR-01
# "Add a sidebar with navigation"
# "Make the task cards more compact"
# "Add a create task button in the header"

# Validate before coding
/gmsd:pencil validate all

# Export to V0 for React code
/gmsd:export v0
```

### Use Case 2: Exploring Multiple Design Directions

**Scenario:** You want to try different visual styles before committing.

```bash
# Create first variation
/gmsd:pencil open designs/variation-a.pen
/gmsd:pencil style --tags "minimal,light,professional"
/gmsd:pencil sync --push

# Create second variation
/gmsd:pencil open designs/variation-b.pen
/gmsd:pencil style --tags "bold,dark,modern"
/gmsd:pencil sync --push

# Create third variation
/gmsd:pencil open designs/variation-c.pen
/gmsd:pencil style --tags "playful,colorful,friendly"
/gmsd:pencil sync --push

# Compare screenshots of each
/gmsd:pencil validate SCR-01  # In each file

# Pick favorite and continue with that file
```

### Use Case 3: Retrofitting Specs to Existing Design

**Scenario:** You have a design in Pencil but no specs.

```bash
# Open existing design
/gmsd:pencil open designs/existing-app.pen

# Pull everything to specs
/gmsd:pencil sync --pull

# Review generated specs
# .planning/screens/*.md now populated
# .planning/COMPONENTS.md now populated
# .planning/design-tokens.json now populated

# Enhance specs with behavior details
# (manually add interactions, states, etc.)

# Validate design matches enhanced specs
/gmsd:pencil validate all
```

### Use Case 4: Component Library Development

**Scenario:** Building a design system for a team.

```bash
# Create design system file
/gmsd:pencil open designs/design-system.pen --new

# Apply brand style
/gmsd:pencil style --tags "enterprise,professional,webapp"

# Create foundation components
/gmsd:pencil components --create "Typography/H1"
/gmsd:pencil components --create "Typography/H2"
/gmsd:pencil components --create "Typography/Body"

# Create interactive components
/gmsd:pencil components --create "Button/Primary"
/gmsd:pencil components --create "Button/Secondary"
/gmsd:pencil components --create "Button/Ghost"
/gmsd:pencil components --create "Button/Destructive"

/gmsd:pencil components --create "Input/Default"
/gmsd:pencil components --create "Input/Error"
/gmsd:pencil components --create "Input/Success"

/gmsd:pencil components --create "Select/Default"
/gmsd:pencil components --create "Checkbox"
/gmsd:pencil components --create "Radio"
/gmsd:pencil components --create "Switch"

# Create container components
/gmsd:pencil components --create "Card/Default"
/gmsd:pencil components --create "Card/Interactive"
/gmsd:pencil components --create "Modal"
/gmsd:pencil components --create "Sidebar"
/gmsd:pencil components --create "Header"

# Preview all components
/gmsd:pencil components --list

# Pull to specs for documentation
/gmsd:pencil sync --pull --components
```

### Use Case 5: Responsive Design Iteration

**Scenario:** Designing mobile and desktop versions.

```bash
# Open design file
/gmsd:pencil open designs/app.pen

# Create desktop version first
/gmsd:pencil sync --push SCR-01

# Iterate on desktop
/gmsd:pencil iterate SCR-01
# Refine until happy

# Copy to create mobile version
/gmsd:pencil iterate SCR-01-mobile --from-scratch
# "Create mobile version of login, 375px wide"
# "Stack elements vertically"
# "Make inputs full width"
# "Increase touch target sizes"

# Validate both versions
/gmsd:pencil validate SCR-01
/gmsd:pencil validate SCR-01-mobile
```

### Use Case 6: Client Presentation Prep

**Scenario:** Need polished screenshots for a presentation.

```bash
# Open design file
/gmsd:pencil open designs/client-app.pen

# Validate everything looks good
/gmsd:pencil validate all

# Fix any issues
/gmsd:pencil iterate SCR-01  # etc.

# Ensure consistent styling
/gmsd:pencil layout --problems  # Fix any layout issues

# Generate validation report with screenshots
/gmsd:pencil validate all --report

# Screenshots are now in the report for presentation
```

---

## Best Practices

### 1. Start with Style

Apply a style guide before creating screens:
```bash
/gmsd:pencil style --explore
/gmsd:pencil style --tags "your,relevant,tags"
```

This sets up variables and gives consistent aesthetics.

### 2. Build Components First

Create reusable components before full screens:
```bash
/gmsd:pencil components --create-from-specs
# or
/gmsd:pencil components --create "Button/Primary"
```

Components ensure consistency and make updates easier.

### 3. Validate Frequently

Run validation after significant changes:
```bash
/gmsd:pencil validate SCR-01
```

Catches issues before they compound.

### 4. Use Natural Language in Iterate

Be specific but natural:
```
Good: "Make the button wider and add more padding"
Good: "The heading should be larger and bold"
Good: "Add 16px space between the inputs"

Less Good: "Make it better"
Less Good: "Fix the layout"
```

### 5. Keep Sync Direction Clear

Decide source of truth and stick to it:
- **Spec-first:** Always push, only pull to capture approved changes
- **Design-first:** Always pull, only push for initial structure

### 6. Use Layout Debug for Complex Screens

When things don't look right:
```bash
/gmsd:pencil layout screen_id --problems
```

### 7. Extract Repeated Patterns

If you find yourself repeating something:
```bash
/gmsd:pencil components --extract node_id --name "Pattern/Name"
```

### 8. Commit After Major Milestones

After completing a screen or component set:
```bash
git add designs/*.pen .planning/
git commit -m "docs(ui): design SCR-01 Login screen"
```

---

## Troubleshooting

### "No Pencil file open"

**Solution:**
```bash
/gmsd:pencil open designs/app.pen
# or
/gmsd:pencil open --new
```

### "Cannot connect to Pencil MCP"

**Check:**
1. Pencil MCP server is running
2. MCP configuration in Claude Code settings
3. Server logs for errors

### "Operation failed / rolled back"

**Debug:**
```bash
/gmsd:pencil layout node_id
```

Common causes:
- Invalid node ID reference
- Parent doesn't exist
- Syntax error in operations

### "Screen not found"

**Solution:**
```bash
# List what exists
/gmsd:pencil open  # Shows contents

# Create missing screen
/gmsd:pencil sync --push SCR-XX
```

### "Validation fails but design looks correct"

**Possible causes:**
- Spec outdated — run `/gmsd:pencil sync --pull` to update
- Different element names — check node names match spec
- Hidden elements — check visibility and opacity

### "Style not applying correctly"

**Debug:**
```bash
# Check current variables
/gmsd:pencil sync --diff --tokens

# Re-apply style
/gmsd:pencil style --tags "..." --preview
```

### "Components not showing as reusable"

**Fix:**
```bash
# Make sure node is marked reusable
/gmsd:pencil components --extract node_id --name "Component/Name"
```

---

## Integration with Other Commands

### With `/gmsd:init`

Run `/gmsd:init` first to establish project context:
```bash
/gmsd:init
# Then
/gmsd:pencil open --new
```

### With `/gmsd:setup-tokens`

Tokens sync automatically:
```bash
/gmsd:setup-tokens
# Then
/gmsd:pencil open --new
# Offers to sync tokens
```

### With `/gmsd:design-screens`

Specs become source for sync:
```bash
/gmsd:design-screens
# Then
/gmsd:pencil sync --push
```

### With `/gmsd:export v0`

After Pencil design, export to code:
```bash
/gmsd:pencil iterate SCR-01  # Refine design
/gmsd:pencil validate SCR-01  # Validate
/gmsd:export v0 SCR-01  # Get React code
```

### With `/gmsd:realize`

Track implementation status:
```bash
/gmsd:pencil validate SCR-01  # Confirm design done
/gmsd:realize SCR-01 --source pencil  # Mark as designed
```

### With `/gmsd:ui-sync`

Different from `/gmsd:pencil sync`:
- `/gmsd:ui-sync` — Checks spec vs implementation (code)
- `/gmsd:pencil sync` — Syncs spec vs Pencil design

### With GSD Workflow

```bash
# During design phase
/gsd:plan-phase  # Include UI design tasks
/gmsd:pencil open --new
/gmsd:pencil sync --push
/gmsd:pencil iterate SCR-01
/gmsd:pencil validate all

# Mark complete
/gsd:verify-work
```

---

## Summary

`/gmsd:pencil` transforms UI design from a static export process into an interactive, iterative workflow:

| Subcommand | Purpose | Key Benefit |
|------------|---------|-------------|
| `open` | Open/create files | Start any session |
| `sync` | Bidirectional sync | Keep specs and designs aligned |
| `components` | Manage library | Consistent, reusable elements |
| `validate` | Check against specs | Catch issues early |
| `iterate` | Refine interactively | Immediate visual feedback |
| `style` | Apply style guides | Consistent aesthetics |
| `layout` | Debug issues | Fix positioning problems |

The key advantage is the **feedback loop** — every change produces immediate visual results, making design iteration fast and reliable.
