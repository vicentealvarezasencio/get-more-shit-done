---
name: gmsd:whats-new
description: Show what's new in GMSD UI Design System
allowed-tools: [Read]
---

<objective>
Display changelog and new features in the GMSD UI Design System for Claude Code. Help users stay up to date with capabilities.
</objective>

<process>

Display version history and recent changes:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GMSD UI Design System — What's New
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current Version: 0.6.0

## v0.6.0 — GSD Integration Bridge + Canvas Layout Planning

NEW FEATURES:
  • GSD-to-UI Spec Bridge
    - /gmsd:init now adds UI Specs rule to CLAUDE.md
      so GSD agents always read screen specs before coding
    - /gmsd:design-screens now links spec paths + component
      lists into REQUIREMENTS.md for each requirement
    - /gmsd:ui-sync now reconciles requirement-spec links after
      Pencil pull (new components, stale links, orphans)

  • Retroactive Fix for Existing Projects
    - /gmsd:ui-sync detects missing CLAUDE.md integration rule
      and missing REQUIREMENTS.md links, auto-fixes both
    - One command brings old projects up to date

  • Canvas Layout Pre-planning (Parallel Push)
    - Orchestrator pre-calculates canvas positions for all
      screens before spawning parallel subagents
    - Uses snapshot_layout + find_empty_space_on_canvas
    - Each agent receives assigned {x, y} coordinates
    - Eliminates screen overlap when pushing 2+ screens

───────────────────────────────────────────────────────

## v0.5.0 — Orchestrator + Subagent Pattern

NEW FEATURES:
  • Parallel multi-screen push/pull via subagents
  • Per-screen agents with isolated context windows
  • Orchestrator handles shared setup and collection

───────────────────────────────────────────────────────

## v0.2.0 — Multi-Agent Architecture

NEW FEATURES:
  • Multi-agent system with specialized agents
    - UI Researcher: Context discovery, inspiration analysis
    - UI Specifier: Screen specs, component definitions
    - UI Prompter: Export generation, prompt optimization
    - UI Designer: Coordination, quick tasks

  • Enhanced commands
    - /gmsd:init — Project initialization with context discovery
    - /gmsd:import-design — Reverse sync from external tools
    - /gmsd:realize — Track implementation status
    - /gmsd:ui-sync — Drift detection and resolution
    - /gmsd:decisions — Design decision tracking
    - /gmsd:patterns — Pattern library management

  • Improved adapters
    - Iteration guidance for all services
    - Reverse sync protocols
    - Handoff document generation
    - Cross-tool comparison

IMPROVEMENTS:
  • 10-section screen specification format
  • ASCII wireframes in all specs
  • Component usage matrix
  • Export versioning and freshness tracking
  • State persistence across sessions

───────────────────────────────────────────────────────

## v0.1.0 — Initial Release

FEATURES:
  • Design token system (W3C format)
  • Screen specification workflow
  • Component inventory extraction
  • Export to Stitch, V0, Figma, Generic
  • GSD integration support

ADAPTERS:
  • Stitch adapter with visual descriptions
  • V0 adapter with shadcn/ui mapping
  • Figma Variables export
  • Generic tool-agnostic prompts

───────────────────────────────────────────────────────

## Roadmap

PLANNED FOR v0.3.0:
  ○ Dark mode specification support
  ○ Animation/transition tokens
  ○ Responsive variant documentation
  ○ Accessibility audit integration
  ○ More component library mappings

FUTURE:
  ○ Figma plugin integration
  ○ Live preview generation
  ○ Design-to-code feedback loop
  ○ Team collaboration features

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Full Documentation:
  ~/.claude/get-more-shit-done/ui-design/README.md

Get Started:
  /gmsd:init — Initialize a new project
  /gmsd:help — Show all commands

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

</process>

<success_criteria>
- Version history displayed clearly
- New features highlighted
- Roadmap shown for future direction
- Links to documentation provided
</success_criteria>
