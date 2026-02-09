---
name: gmsd:ui-status
description: Show comprehensive UI specification coverage and realization status
allowed-tools: [Read, Glob, Grep]
---

<objective>
Display the current state of UI specifications: what's defined, what's been realized in external tools, export coverage, and overall project health. Provide actionable recommendations for next steps.
</objective>

<context>
@.planning/design/UI-SPEC.md (if exists)
@.planning/design/design-tokens.json (if exists)
@.planning/design/COMPONENTS.md (if exists)
@.planning/design/screens/*.md (if exists)
@.planning/design/ui-exports/*.md (if exists)
@.planning/design/UI-REGISTRY.md (if exists)
@.planning/design/UI-PATTERNS.md (if exists)
@.planning/design/UI-DECISIONS.md (if exists)
@.planning/design/ui-state/coordinator-state.json (if exists)
</context>

<process>

<step name="check_all_artifacts">
## Check All Artifacts

Check for existence and content of all UI artifacts:

**Core Specifications:**
- `.planning/design/UI-CONTEXT.md` — Project context
- `.planning/design/UI-SPEC.md` — Master specification
- `.planning/design/design-tokens.json` — Design tokens
- `.planning/design/COMPONENTS.md` — Component inventory
- `.planning/design/UI-PATTERNS.md` — Pattern library
- `.planning/design/UI-DECISIONS.md` — Decision log

**Screen Specifications:**
- `.planning/design/screens/SCR-*.md` — Individual screens

**Exports:**
- `.planning/design/ui-exports/stitch-prompts.md`
- `.planning/design/ui-exports/v0-prompts.md`
- `.planning/design/ui-exports/figma-tokens.json`
- `.planning/design/ui-exports/generic-prompts.md`
- `.planning/design/ui-exports/handoffs/*.md`

**State:**
- `.planning/design/UI-REGISTRY.md` — Realization tracking
- `.planning/design/ui-state/coordinator-state.json`
</step>

<step name="calculate_metrics">
## Calculate Metrics

**Token Metrics:**
- Total tokens defined
- Tokens by category (colors, typography, spacing, etc.)
- Token usage count across specs

**Screen Metrics:**
- Total screens specified
- Screens with complete specs (all 10 sections)
- Screens with wireframes
- Screens realized

**Component Metrics:**
- Total components defined
- Components with full specs
- Component usage frequency
- Library alignment percentage

**Export Metrics:**
- Screens exported per service
- Export freshness (stale vs. current)
- Handoffs generated

**Realization Metrics:**
- Screens done
- Screens partial
- Screens blocked
- Screens pending
</step>

<step name="display_status">
## Display Status

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UI Design System Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROJECT CONTEXT                              [✓ Defined]
───────────────────────────────────────────────────────
  Platform:    Web (Next.js)
  Styling:     Tailwind CSS
  Library:     shadcn/ui
  Inspiration: Linear, Vercel
  Phase:       Specification → Export

DESIGN TOKENS                                [✓ 45 tokens]
───────────────────────────────────────────────────────
  Colors:       24 values  ████████████████████████
  Typography:    8 values  ████████
  Spacing:      10 values  ██████████
  Borders:       3 values  ███
  Shadows:       4 values  ████

  Dark mode:    ✓ Supported

SCREENS                                      [6/8 specified]
───────────────────────────────────────────────────────
  ✓ SCR-01: Login              Complete  ✓ Realized
  ✓ SCR-02: Signup             Complete  ✓ Realized
  ✓ SCR-03: Forgot Password    Complete  ○ Pending
  ✓ SCR-04: Dashboard          Complete  ◆ Partial
  ◆ SCR-05: Items List         Partial   ○ Pending
  ◆ SCR-06: Item Detail        Partial   ○ Pending
  ○ SCR-07: Settings           Pending   ○ Pending
  ○ SCR-08: Profile            Pending   ○ Pending

  Specification: ██████████████░░░░░░ 75%
  Realization:   ████░░░░░░░░░░░░░░░░ 25%

COMPONENTS                                   [18 defined]
───────────────────────────────────────────────────────
  Primitives:     6  Button, Link, Icon, Badge, Avatar, Separator
  Form Elements:  5  Input, TextArea, Select, Checkbox, Switch
  Layout:         3  Card, Container, Divider
  Navigation:     2  Navbar, Tabs
  Feedback:       3  Alert, Toast, Dialog
  Composite:      2  LoginForm, DataTable

  Library match:  14/18 (78% shadcn/ui)
  Fully specified: 12/18 (67%)

PATTERNS                                     [3 documented]
───────────────────────────────────────────────────────
  PAT-01: Auth Card        Used in 3 screens
  PAT-02: Data Table       Used in 2 screens
  PAT-03: Detail View      Used in 2 screens

EXPORTS                                      [2 services]
───────────────────────────────────────────────────────
  Stitch:
    ✓ 4/6 screens exported
    ⚠ 1 stale (spec updated since export)

  V0:
    ✓ 3/6 screens exported
    ○ 3 pending

  Figma:
    ✓ Tokens exported

  Generic:
    ○ Not exported

REALIZATION PROGRESS                         [2/8 done]
───────────────────────────────────────────────────────
  ✓ Done:      2 screens  ████
  ◆ Partial:   1 screen   ██
  ✗ Blocked:   0 screens
  ○ Pending:   5 screens  ██████████████

DECISIONS                                    [8 recorded]
───────────────────────────────────────────────────────
  Recent:
    • DEC-008: Social login addition (Jan 19)
    • DEC-007: Background color token (Jan 19)
    • DEC-006: Typography scale choice (Jan 18)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HEALTH CHECK
───────────────────────────────────────────────────────
  ✓ Tokens defined
  ✓ Screens specified (6/8)
  ⚠ 1 stale export
  ○ 2 screens need completion
  ○ 3 screens need realization

  Overall: ██████████████░░░░░░ 70%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
</step>

<step name="suggest_actions">
## Suggest Actions

Based on current status, recommend next steps:

```
## ▶ Suggested Actions

Based on current status:

[If specs incomplete]
1. **Complete screen specifications**
   `/gmsd:design-screens SCR-07,SCR-08`
   2 screens need specification

[If exports stale]
2. **Refresh stale exports**
   `/gmsd:export stitch SCR-02`
   1 export needs refresh

[If realization pending]
3. **Continue realization**
   Screens ready for design: SCR-03, SCR-05, SCR-06
   `/gmsd:export stitch SCR-03`

[If sync needed]
4. **Check for drift**
   `/gmsd:ui-sync`
   Verify specs match implementations

───────────────────────────────────────────────────────

## Quick Commands

/gmsd:design-screens        Complete remaining screens
/gmsd:export stitch        Export to Stitch
/gmsd:realize SCR-XX       Mark screen as realized
/gmsd:ui-sync                 Check system consistency

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
</step>

<step name="check_gsd_context">
## Check GSD Integration

If GSD artifacts exist:

```
GSD INTEGRATION                              [✓ Linked]
───────────────────────────────────────────────────────
  Project:     .planning/PROJECT.md
  Phase:       3 - Frontend Implementation
  Milestone:   v0.1.0

  UI Coverage:
    REQ-001 → SCR-01, SCR-02  ✓ Realized
    REQ-002 → SCR-04          ◆ Partial
    REQ-003 → SCR-05, SCR-06  ○ Pending
```
</step>

</process>

<success_criteria>
- All UI artifacts checked for existence
- Comprehensive metrics calculated
- Clear status display for each category
- Health check performed
- Actionable next steps provided
- GSD integration shown if applicable
</success_criteria>
