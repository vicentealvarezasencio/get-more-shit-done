---
name: gmsd:export
description: Generate service-specific prompts and exports for external design tools
argument-hint: "[service: stitch|v0|figma|pencil|generic] [screen: SCR-XX (optional)]"
allowed-tools: [Read, Write, Glob, Grep, AskUserQuestion, Task]
agent: gmsd-ui-prompter (for complex exports)
---

<objective>
Transform UI specifications into service-optimized outputs. Generate prompts for AI design tools (Stitch, V0), export formats for design applications (Figma), or execute designs directly via MCP (Pencil). Uses service-specific adapters to ensure optimal output generation.
</objective>

<context>
@~/.claude/get-more-shit-done/ui-design/adapters/stitch.md
@~/.claude/get-more-shit-done/ui-design/adapters/v0.md
@~/.claude/get-more-shit-done/ui-design/adapters/figma.md
@~/.claude/get-more-shit-done/ui-design/adapters/pencil.md
@~/.claude/get-more-shit-done/ui-design/adapters/generic.md
@.planning/design/UI-SPEC.md (required)
@.planning/design/screens/*.md (required)
@.planning/design/COMPONENTS.md (recommended)
@.planning/design/design-tokens.json (recommended)
</context>

<ux_principles>
## Service Selection

If no service specified, offer quick selection:

**Question: Which service to export for?**

Options:
- Stitch — Visual design generation (recommended for high-fidelity mockups)
- V0 — React component generation (recommended for implementation)
- Figma — Token export + setup guide
- Pencil — Direct design execution via MCP (recommended for rapid prototyping)
- Generic — Tool-agnostic prompts

## Scope Selection

Allow exporting:
- All screens (default)
- Specific screen(s) by ID
- Screens needing regeneration (drift detected)
</ux_principles>

<process>

<step name="parse_arguments">
## Parse Arguments

Parse the command arguments:
- `stitch` → Google Stitch prompts
- `v0` → Vercel V0 prompts
- `figma` → Figma token export + setup
- `pencil` → Direct Pencil MCP execution
- `generic` → Tool-agnostic prompts (default if no argument)

Optional screen filter:
- `SCR-01` → Export single screen
- `SCR-01,SCR-02,SCR-03` → Export multiple screens
- No filter → Export all screens

Examples:
- `/gmsd:export stitch` → All screens to Stitch
- `/gmsd:export v0 SCR-01` → Single screen to V0
- `/gmsd:export figma` → Full Figma setup
- `/gmsd:export pencil` → Direct design execution
- `/gmsd:export pencil SCR-01` → Single screen to Pencil
</step>

<step name="verify_prerequisites">
## Verify Prerequisites

Check required files exist:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UI ► EXPORT PREREQUISITES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Checking requirements for [service] export...

✓ UI-SPEC.md              Found
✓ Screen specs            [N] screens found
○ COMPONENTS.md           Optional (adds detail)
○ design-tokens.json      Optional (adds precision)

[If missing required]
✗ Screen specs missing - run /gmsd:design-screens first

───────────────────────────────────────────────────────
```

If required files missing:
- Inform user what's needed
- Suggest command to run
- Exit gracefully
</step>

<step name="load_adapter">
## Load Service Adapter

Load adapter from `~/.claude/get-more-shit-done/ui-design/adapters/[service].md`:

The adapter provides:
- **transformation_rules** — How to convert specs
- **token_mapping** — Convert tokens to service format
- **component_descriptions** — Service-specific language
- **capability_matrix** — What the service supports
- **iteration_guidance** — Refinement patterns
</step>

<step name="spawn_prompter_or_handle">
## Generate Prompts

**For 5+ screens or complex specs:**
- Spawn UI Prompter agent with full context
- Agent handles all transformations
- Returns complete prompt set

**For 1-4 screens:**
- Handle directly without spawning
- Apply adapter rules sequentially
</step>

<step name="transform_to_stitch">
## Stitch Export

For each screen, generate Stitch-optimized prompt:

```markdown
# Stitch Prompts

Generated: [date]
Source: UI specifications
Screens: [N] total

---

## SCR-01: Login

### Prompt

```
Create a modern login screen with the following specifications:

**Layout:**
Full-page layout with centered content card on subtle gray background (#F8FAFC).
Card is elevated with soft shadow, rounded corners (8px).
Maximum width 400px, vertically centered.

**Components:**
- Logo at top of card
- "Welcome back" heading with "Sign in to your account" subtitle
- Email input with label "Email address"
- Password input with label "Password" and show/hide toggle
- Primary blue button (#2563EB) "Sign in" - full width
- "Forgot password?" link below button
- Divider with "or continue with" text
- Google and GitHub social sign-in buttons
- "Don't have an account? Sign up" footer link

**Visual Style:**
- Clean, minimal aesthetic
- Inter or system font
- Primary blue: #2563EB
- Text dark slate: #0F172A
- Muted text: #64748B
- Subtle shadows, not flat

**States to show:**
- Default state (primary view)
```

### Iteration Guidance

**If layout is wrong:**
```
Adjust: Move [element] to [position]. Card should be centered both horizontally and vertically.
```

**If colors are off:**
```
Adjust: Change primary button to #2563EB. Background should be #F8FAFC, not pure white.
```

**If components missing:**
```
Add: Include a "Forgot password?" text link below the submit button.
```

### Handoff
→ See: handoffs/SCR-01-brief.md

---
```
</step>

<step name="transform_to_v0">
## V0 Export

For each screen, generate V0-optimized prompt:

```markdown
# V0 Prompts

Generated: [date]
Source: UI specifications
Screens: [N] total

---

## SCR-01: Login Page

### Prompt

```
Create a login page using shadcn/ui components with the following:

**Container:**
- Full viewport height
- Centered content using flexbox
- Background: bg-slate-50

**Card (shadcn/ui Card):**
- max-w-md mx-auto
- CardHeader with title "Welcome back" and description "Sign in to your account"
- CardContent with form
- CardFooter with signup link

**Form (react-hook-form + zod):**
- Email input (Input component, type="email", required)
- Password input (Input component, type="password", required)
- Submit button (Button variant="default", full width)
- Form validation with zod schema

**Additional elements:**
- "Forgot password?" link (Link component)
- Separator with "or continue with" text
- Social buttons: Google, GitHub (Button variant="outline")
- Footer: "Don't have an account?" with Link to /signup

**Form behavior:**
- Client-side validation
- Loading state on submit
- Error display using form field errors

**Accessibility:**
- Focus first input on mount
- Proper label associations
- Error announcements
```

### Expected Output
- File: `src/components/auth/login-form.tsx`
- shadcn/gmsd: Card, CardHeader, CardContent, CardFooter, Button, Input, Label, Separator
- Dependencies: react-hook-form, @hookform/resolvers, zod

### TypeScript Interface
```typescript
interface LoginFormProps {
  onSubmit: (data: { email: string; password: string }) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}
```

### Iteration Guidance

**If using wrong components:**
```
Use shadcn/ui Card instead of custom div. Import from @/components/ui/card.
```

**If form validation missing:**
```
Add zod schema validation with zodResolver from @hookform/resolvers/zod.
```

---
```
</step>

<step name="transform_to_figma">
## Figma Export

Generate Figma-compatible outputs:

### figma-tokens.json
```json
{
  "$schema": "https://design-tokens.org/schema.json",
  "collections": {
    "Primitives": {
      "Blue": {
        "50": { "$value": "#EFF6FF", "$type": "color" },
        "100": { "$value": "#DBEAFE", "$type": "color" },
        "500": { "$value": "#3B82F6", "$type": "color" },
        "600": { "$value": "#2563EB", "$type": "color" },
        "700": { "$value": "#1D4ED8", "$type": "color" }
      }
    },
    "Semantic": {
      "Primary": {
        "Default": { "$value": "{Primitives.Blue.600}", "$type": "color" },
        "Hover": { "$value": "{Primitives.Blue.700}", "$type": "color" },
        "Foreground": { "$value": "#FFFFFF", "$type": "color" }
      },
      "Background": {
        "Default": { "$value": "#FFFFFF", "$type": "color" },
        "Subtle": { "$value": "#F8FAFC", "$type": "color" }
      }
    }
  },
  "modes": {
    "Light": "default",
    "Dark": {
      "Semantic.Background.Default": "#0F172A",
      "Semantic.Background.Subtle": "#1E293B"
    }
  }
}
```

### figma-setup.md
```markdown
# Figma Setup Guide

## 1. Import Variables

1. Open your Figma file
2. Right-click in canvas → Plugins → Tokens Studio (or Figma Variables)
3. Import `figma-tokens.json`
4. Variables will appear in your Local Variables panel

## 2. Create Component Library

For each component in COMPONENTS.md:

### Button
1. Create frame 40x40px (md size)
2. Add text layer "Button"
3. Apply variables:
   - Fill: Primary/Default
   - Text: Primary/Foreground
   - Corner radius: 6px
4. Create variants: primary, secondary, ghost, destructive
5. Add size variants: sm (32px), md (40px), lg (48px)

[Continue for each component...]

## 3. Build Screen Frames

| Screen | Frame Size | Notes |
|--------|------------|-------|
| SCR-01: Login | 1440x900 (desktop) | Also create 375x812 mobile |
| SCR-02: Signup | 1440x900 (desktop) | Same structure as Login |

## 4. Prototyping

Connect screens per navigation flows in UI-SPEC.md.
```
</step>

<step name="transform_to_pencil">
## Pencil Export (Direct Execution)

Unlike other adapters, Pencil executes designs directly via MCP tools.

### Step 1: Setup Variables

```javascript
// Sync design tokens to Pencil variables
mcp__pencil__set_variables({
  filePath: "designs/app.pen",
  variables: {
    "primary": { "$value": "#2563EB", "type": "color" },
    "primary-foreground": { "$value": "#FFFFFF", "type": "color" },
    "background": { "$value": "#F8FAFC", "type": "color" },
    "foreground": { "$value": "#0F172A", "type": "color" },
    "muted": { "$value": "#64748B", "type": "color" },
    "border": { "$value": "#E2E8F0", "type": "color" }
    // ... extracted from design-tokens.json
  }
})
```

### Step 2: Generate Operations

For each screen, generate batch_design operations:

```javascript
// SCR-01: Login
screen=I(document, { type: "frame", name: "SCR-01 Login", width: 1440, height: 900, fill: "#F8FAFC" })
center=I(screen, { type: "frame", layout: "vertical", width: "fill_container", height: "fill_container", alignItems: "center", justifyContent: "center" })
card=I(center, { type: "frame", name: "Login Card", layout: "vertical", width: 400, padding: 32, gap: 24, fill: "#FFFFFF", cornerRadius: 8 })
// ... full structure from spec wireframe
```

### Step 3: Execute Operations

```javascript
mcp__pencil__batch_design({
  filePath: "designs/app.pen",
  operations: "..." // Generated operations
})
```

### Step 4: Validate with Screenshot

```javascript
mcp__pencil__get_screenshot({
  filePath: "designs/app.pen",
  nodeId: "screenId"
})
```

### Step 5: Iterate if Needed

If visual validation shows issues:
```javascript
U("elementId", { fill: "#2563EB", padding: 16 })
// Re-take screenshot to verify
```

### Output Log

```markdown
# Pencil Operations Log

Generated: [date]
File: designs/app.pen
Screens: [N] total

## SCR-01: Login

**Node ID:** screen_abc123
**Status:** Generated
**Screenshot:** Validated ✓

### Operations Executed
- Created screen frame (1440x900)
- Created centered container
- Created login card (400px, vertical layout)
- Added heading, inputs, buttons
- Set up form structure

### Validation
Screenshot captured and verified.
No issues detected.
```
</step>

<step name="transform_to_generic">
## Generic Export

For each screen, generate tool-agnostic prompt:

```markdown
# Generic UI Prompts

Generated: [date]
Source: UI specifications
Screens: [N] total

Note: These prompts use universal language and work with any design tool.

---

## SCR-01: Login Screen

### Prompt

```
Design a login screen with these specifications:

LAYOUT:
- Full page with content centered both horizontally and vertically
- Main content area is a card/panel, maximum 400 pixels wide
- Background is very light gray (almost white)

CARD STRUCTURE (top to bottom):
1. Application logo at top
2. Large heading: "Welcome back"
3. Smaller subheading: "Sign in to your account"
4. Form with:
   - Email field with label above
   - Password field with label above and show/hide option
   - Large primary button spanning full width of form
5. "Forgot password?" link
6. Horizontal divider with "or" text
7. Two secondary buttons for Google and GitHub sign-in
8. Footer text: "Don't have an account?" with "Sign up" link

VISUAL DETAILS:
- Card has subtle drop shadow and slightly rounded corners
- Primary button is bright blue
- Input fields have light gray borders
- Text uses dark colors for headings, medium gray for secondary text
- Clean, modern, minimal aesthetic
- Sans-serif font throughout

SPACING:
- Generous padding inside the card (24-32 pixels)
- Comfortable spacing between form elements (16-20 pixels)
- Button has vertical padding for easy clicking
```

### What to look for:
- [ ] Card is centered on page
- [ ] Form elements are properly labeled
- [ ] Primary button is visually prominent
- [ ] Social buttons are secondary in style
- [ ] Overall clean, professional appearance

---
```
</step>

<step name="create_handoffs">
## Create Handoff Documents

For each exported screen, create handoff brief:

```markdown
# Design Handoff: SCR-01 Login

## Visual Checklist

### Layout
- [ ] Card centered horizontally and vertically
- [ ] Max width 400px
- [ ] Background color: #F8FAFC

### Typography
- [ ] Heading: 24px, semibold
- [ ] Subheading: 14px, regular, muted color
- [ ] Input labels: 14px, medium

### Colors
- [ ] Primary button: #2563EB
- [ ] Button text: #FFFFFF
- [ ] Input border: #E2E8F0
- [ ] Body text: #0F172A
- [ ] Muted text: #64748B

### Spacing
- [ ] Card padding: 24px
- [ ] Form gap: 16px
- [ ] Button padding: 12px vertical

### Components Used
| Component | Variant | Count |
|-----------|---------|-------|
| Button | primary | 1 |
| Button | outline | 2 |
| Input | default | 2 |
| Separator | with-text | 1 |
| Link | default | 2 |

### States to Design
- [ ] Default (required)
- [ ] Loading (submit in progress)
- [ ] Error (validation failed)
```
</step>

<step name="update_registry">
## Update Registry

Update `.planning/design/UI-REGISTRY.md`:

```markdown
## Export History

| Screen | Stitch | V0 | Figma | Pencil | Generic | Last Export |
|--------|--------|----|-------|--------|---------|-------------|
| SCR-01 | ✓ v2 | ✓ v1 | ✓ | ✓ screen_abc | ✓ | 2026-01-19 |
| SCR-02 | ✓ v1 | ✓ v1 | ✓ | ✓ screen_def | ✓ | 2026-01-19 |
| SCR-03 | ○ | ○ | ○ | ○ | ○ | - |
```
</step>

<step name="update_state">
## Update State

Update `.planning/design/ui-state/coordinator-state.json`:
```json
{
  "project_status": {
    "exports_generated": {
      "stitch": [N],
      "v0": [N],
      "figma": true/false,
      "pencil": {
        "count": [N],
        "file": "designs/app.pen",
        "node_mapping": {
          "SCR-01": "screen_abc123",
          "SCR-02": "screen_def456"
        }
      },
      "generic": [N]
    }
  }
}
```
</step>

<step name="completion">
## Completion Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UI ► EXPORT COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Service:  [stitch/v0/figma/generic]
Screens:  [N] prompts generated

Prompts:
  ✓ SCR-01: Login           → stitch-prompts.md#scr-01
  ✓ SCR-02: Signup          → stitch-prompts.md#scr-02
  ✓ SCR-03: Dashboard       → stitch-prompts.md#scr-03

Handoffs:
  ✓ handoffs/SCR-01-brief.md
  ✓ handoffs/SCR-02-brief.md
  ✓ handoffs/SCR-03-brief.md

Files:
  .planning/design/ui-exports/[service]-prompts.md (or pencil-operations.md)
  .planning/design/ui-exports/handoffs/*.md
  designs/app.pen (for Pencil exports)

───────────────────────────────────────────────────────

## How to Use

[For Stitch]
1. Open stitch.new
2. Copy prompt from stitch-prompts.md
3. Paste and generate
4. If iteration needed, use refinement guidance
5. Export as Figma/HTML/Flutter

[For V0]
1. Open v0.dev
2. Copy prompt from v0-prompts.md
3. Generate component
4. Click "Add to Codebase" or use `npx v0 add`
5. Review and customize generated code

[For Figma]
1. Import figma-tokens.json using Variables panel
2. Follow setup guide in figma-setup.md
3. Build components from COMPONENTS.md specs
4. Create screens following screen specs

[For Pencil]
1. Designs executed directly via MCP
2. Screenshots captured for validation
3. Review pencil-operations.md for details
4. Iterate with Update operations if needed
5. Node IDs recorded for future reference

───────────────────────────────────────────────────────

## ▶ After Generation

**Track realization** — Mark screens as realized

`/gmsd:realize SCR-01`

**Iterate on prompts** — Refine if results need adjustment

`/gmsd:export [service] SCR-01` (regenerate single screen)

**Import back** — If design drifted from spec

`/gmsd:import-design`

───────────────────────────────────────────────────────
```
</step>

</process>

<success_criteria>
- Export files created in `.planning/design/ui-exports/`
- All specified screens have corresponding prompts (or designs for Pencil)
- Prompts follow service adapter best practices
- Handoff documents generated for each screen
- Design tokens included where applicable
- Clear usage instructions provided
- Registry and state updated

**Pencil-specific criteria:**
- Designs executed successfully via batch_design
- Screenshots captured for visual validation
- Node IDs recorded in registry for future updates
- Variables synced from design tokens
</success_criteria>
