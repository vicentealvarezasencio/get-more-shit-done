# Get More Shit Done (GMSD)

Project orchestration system for [Claude Code](https://claude.ai/claude-code). Supports both Agent Teams (Opus 4.6) and classic wave-based execution.

> Research. Design. Plan. Execute. Verify. — Solo or with coordinated agent teams.

## What is GMSD?

GMSD is a disciplined development workflow system that coordinates multiple Claude Code agents working as a team. Instead of isolated fire-and-forget subagents, GMSD uses Agent Teams — full Claude sessions that communicate, share task lists, and collaborate in real-time.

Inspired by [GSD (Get Shit Done)](https://github.com/vicentealvarezasencio/get-shit-done), rebuilt from the ground up for parallel, team-based execution — with a full UI/UX design system built in.

### Key Differences from GSD

| Aspect | GSD | GMSD |
|--------|-----|------|
| Execution | Wave-batched (wait for entire wave) | Continuous flow (tasks claimed as available) |
| Communication | One-way (report to caller) | Two-way (agents message each other) |
| Coordination | None between peers | Shared task list + mailbox |
| Conflicts | Silent file collisions | Real-time conflict resolution |
| Checkpoints | Halt everything | Only blocked agent pauses |
| Visibility | Hidden parallel work | Split-pane tmux (watch all agents) |
| UI/UX Design | None | Full design system (tokens, screens, components, export) |

The UI/UX design system is GMSD's biggest differentiator. While GSD focuses purely on code execution, GMSD treats design as a first-class phase — with design tokens, screen specifications, component inventories, and export to external tools like Figma, V0, Stitch, and Pencil. See [UI/UX Design System — Two Paths](#uiux-design-system--two-paths) for details.

## Installation

```bash
# Install globally (recommended)
npx get-more-shit-done-cc

# Install with a project preset
npx get-more-shit-done-cc --preset nextjs

# Install for current project only
npx get-more-shit-done-cc --local

# Preview without installing
npx get-more-shit-done-cc --dry-run

# Uninstall
npx get-more-shit-done-cc --uninstall
```

### Requirements

- [Claude Code](https://claude.ai/claude-code) CLI
- **For team mode** (recommended): Agent Teams enabled:
  ```json
  // ~/.claude/settings.json
  {
    "env": {
      "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
    }
  }
  ```
  Classic mode works without this flag — see [Execution Modes](#execution-modes).
- **Recommended:** [tmux](https://github.com/tmux/tmux) for split-pane visibility (team mode)
  ```bash
  brew install tmux
  tmux new -s claude
  ```

## Commands

### Project Lifecycle

```
/gmsd:new-project    Start a new project with parallel research
/gmsd:progress       Check status and route to next action
/gmsd:sync           Regenerate project CLAUDE.md context
/gmsd:settings       Configure workflow toggles and model profile
```

### Phase Workflow

```
/gmsd:discuss-phase  Lock decisions with user input before planning
/gmsd:plan-phase     Research + plan with verification spec
/gmsd:design-phase   UI/UX specifications (screens, tokens, components)
/gmsd:execute-phase  Team execution with shared task list
/gmsd:verify-work    Goal-backward verification
/gmsd:pause-work     Create context handoff when pausing mid-phase
/gmsd:resume-work    Resume work from previous session
```

### UI Design — Standalone Path

```
/gmsd:init               Initialize UI design context for a project
/gmsd:setup-tokens       Design tokens (colors, typography, spacing)
/gmsd:design-screens     Screen specs with wireframes and component mapping
/gmsd:define-components  Component inventory from screen specifications
/gmsd:patterns           Document and manage reusable UI patterns
/gmsd:logo               Generate project logo
```

### UI Design — Analysis & Reverse Engineering

```
/gmsd:scan               Scan codebase to discover components and tokens
/gmsd:generate-specs     Auto-generate UI specs from code analysis
/gmsd:reverse-engineer   One-shot: scan → generate specs → export
```

### UI Design — Export & Tools

```
/gmsd:export          Export to Stitch, V0, Figma, Pencil, or any tool
/gmsd:pencil          Interactive design workflow with Pencil MCP
/gmsd:import-tokens   Import tokens from Figma, Style Dictionary, Tailwind, W3C
/gmsd:import-design   Import design from external tools back into specs
```

### UI Design — Monitoring

```
/gmsd:ui-status            UI specification coverage and realization status
/gmsd:ui-sync              Detect drift between specs and implementations
/gmsd:check-design-drift   Detect hardcoded values vs design tokens
/gmsd:realize              Mark screens as realized and track status
/gmsd:decisions            View and manage UI design decisions log
```

### Roadmap Management

```
/gmsd:add-phase               Add a phase to the roadmap
/gmsd:insert-phase            Insert urgent work (decimal phases)
/gmsd:remove-phase            Remove a pending phase and renumber
/gmsd:research-phase          Standalone research before planning
/gmsd:list-phase-assumptions  Surface assumptions before planning
```

### Milestone Lifecycle

```
/gmsd:milestone            Archive completed milestone
/gmsd:audit-milestone      Audit milestone against original intent
/gmsd:plan-milestone-gaps  Create phases to close audit gaps
/gmsd:retrospective        Post-milestone analysis and lessons learned
/gmsd:new-milestone        Start a new milestone cycle
```

### Utilities

```
/gmsd:debug           Collaborative debugging with shared root causes
/gmsd:quick           Quick task without full workflow ceremony
/gmsd:map-codebase    Analyze existing codebase with parallel mappers
/gmsd:add-todo        Capture ideas and tasks as todos
/gmsd:check-todos     Review and manage pending todos
/gmsd:preflight       Validate plan before execution
/gmsd:create-pr       Auto-generate GitHub PR from phase work
/gmsd:replay          Timeline view of execution history
/gmsd:estimate-cost   Preview token/dollar cost before running
/gmsd:reapply-patches Restore local modifications after update
/gmsd:tour            Interactive walkthrough (~5 min)
/gmsd:update          Check for and install latest version
/gmsd:help            Full command reference
```

## Workflow

```
/gmsd:new-project
    ↓
Research Team (parallel domain exploration with live broadcasts)
    ↓
/gmsd:discuss-phase (lock decisions with user)
    ↓
/gmsd:plan-phase (planner + plan checker)
    ↓
/gmsd:design-phase (UI/UX team — tokens, screens, components)
    ↓
/gmsd:execute-phase (executor team — continuous task flow)
    ↓
/gmsd:verify-work (goal-backward verification + UI conformance)
    ↓
/gmsd:debug (collaborative debugging team)
    ↓
/gmsd:milestone (archive + next version)
```

## Execution Modes

GMSD supports two execution modes. On first run of any team-creating command (`execute-phase`, `new-project`, `map-codebase`, `debug`, `design-phase`), you'll be prompted to choose. Your choice is saved to `.planning/config.json` and reused for all future commands. You can change it anytime with `/gmsd:settings`.

### Team Mode (recommended)

Coordinated Agent Teams with shared task lists and real-time messaging. Agents claim tasks dynamically, communicate findings, and resolve conflicts as they work.

- Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
- Best for: complex projects, multi-file changes, collaborative debugging
- Agents visible in tmux split panes

### Classic Mode

The original GSD approach — independent fire-and-forget agents dispatched in pre-computed waves. No inter-agent communication, no shared task list.

- Works on any Claude Code installation, no experimental flags needed
- Best for: simpler projects, environments where Agent Teams isn't available
- Same task quality — agents receive identical self-contained briefs

### Comparison

| Feature | Team Mode | Classic Mode |
|---------|-----------|--------------|
| Dispatch | Shared task list, dynamic claiming | Pre-computed waves, fire-and-forget |
| Communication | Real-time messaging between agents | None — agents work independently |
| Scaling | Dynamic (spawn more agents on demand) | Fixed at wave start |
| File conflicts | Detected and resolved via messaging | Prevented by wave ordering |
| Requires | `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` | Nothing — works everywhere |

## UI/UX Design System — Two Paths

GMSD includes a full UI/UX design specification system (from [ui-design-cc](https://github.com/vicentealvarezasencio/ui-design-cc)). Design tokens, screen specifications, component inventories, and export to external tools are all built in. There are two ways to use it.

### Path 1: Phase-Driven (recommended for most projects)

```
new-project → plan-phase → design-phase → execute-phase
```

- `design-phase` auto-detects UI work in the plan and creates tokens, screen specs, and component inventory automatically
- Scales: single designer for <5 screens, full team for 5+
- Output feeds directly into `execute-phase` — design specs become the source of truth for implementation
- Drift detection runs during `verify-work` to catch deviations

Use this path when you already have a roadmap and want design scoped per phase.

### Path 2: Standalone (for upfront or independent design)

```
init → setup-tokens → design-screens → define-components → export
```

- Use when you want to design before any phase exists
- Good for establishing a global design system upfront
- Export to external tools (Figma, V0, Stitch, Pencil)
- Can reverse-engineer existing codebases with `scan` → `generate-specs` → `export`

Use this path when you want to design first and plan later, or when exporting to external tools.

### Mixed Approach

You can combine both paths. Establish tokens and a design system standalone, then let `design-phase` handle individual screens per phase. If standalone artifacts already exist when `design-phase` runs, it reads and builds on them rather than starting from scratch.

### Choosing a Path

| Scenario | Recommended Path |
|----------|-----------------|
| You have a roadmap, want design scoped per phase | Phase-driven |
| You want to design before any plan exists | Standalone |
| You need to export to Figma, V0, or other tools | Standalone |
| You want a global design system + per-phase screens | Mixed |
| You're reverse-engineering an existing codebase | Standalone |

## Agent Roles

| Role | Team Phase | Behavior |
|------|-----------|----------|
| **Lead** | Always | Creates team, manages tasks, coordinates checkpoints |
| **Researcher** | Research | Explores domains in parallel, broadcasts findings |
| **Planner** | Planning | Creates PLAN.md with verification spec |
| **Plan Checker** | Planning | Reviews plans against goals |
| **Designer** | Design | UI/UX specifications, tokens, screen specs |
| **Executor** | Execution | Claims tasks, writes code, atomic commits |
| **Verifier** | Verification | Goal-backward analysis, creates gap tasks |
| **Debugger** | Debug | Root cause analysis, shares findings with peers |
| **Codebase Mapper** | Analysis | Parallel codebase exploration (tech, arch, quality, concerns) |

## Philosophy

1. **Research before planning** — never plan blind
2. **Design before building** — specs are the source of truth
3. **Discuss before committing** — lock decisions with user input
4. **Plan with verification spec** — every plan defines "done"
5. **Execute atomically** — per-task commits, deviation rules
6. **Verify goal-backward** — check outcomes, not task completion
7. **Debug collaboratively** — share root causes across agents
8. **Continuous flow over wave batching** — no artificial boundaries
9. **Observable execution** — every agent visible in tmux
10. **Learn from every milestone** — retrospectives and context carry-forward
11. **Verify continuously** — micro-verification after every task, not just at the end
12. **Enforce quality automatically** — hooks for tests, lint, and file ownership

## Built On

### GSD (Get Shit Done)

GMSD extends [GSD](https://github.com/vicentealvarezasencio/get-shit-done), the original single-agent development workflow for Claude Code. GSD provides the core methodology — research, plan, execute, verify — using one agent at a time with wave-batched parallelism.

**What GMSD adds over GSD:**
- **Agent Teams** — Multiple Claude sessions collaborating in real-time via shared task lists and messaging
- **Continuous flow** — Tasks claimed as available instead of waiting for entire waves
- **Observable execution** — Watch all agents in tmux split panes
- **Collaborative debugging** — Agents share root causes with peers
- **UI/UX design system** — Full design specification workflow with two paths (phase-driven and standalone). See [UI/UX Design System — Two Paths](#uiux-design-system--two-paths)

### UI Design System (ui-design-cc)

GMSD's UI/UX capabilities come from [ui-design-cc](https://github.com/vicentealvarezasencio/ui-design-cc) — a standalone, service-agnostic UI/UX design specification system for Claude Code.

**ui-design-cc** can be used independently in any project without GSD or GMSD. It provides:
- Design tokens (W3C format with dark mode)
- Screen specifications with ASCII wireframes
- Component inventory extraction
- Export to Stitch, V0, Figma, Pencil, or any tool
- Codebase reverse-engineering (scan existing code → generate specs)
- 6 specialized agents (Designer, Researcher, Specifier, Prompter, Brander, Scanner)

Inside GMSD, these same capabilities are available under the `/gmsd:` prefix and integrate with the project lifecycle — design tokens inform planning, screen specs guide execution, and drift detection runs during verification. See [UI/UX Design System — Two Paths](#uiux-design-system--two-paths) for how these commands fit into GMSD's workflow.

**Use ui-design-cc standalone** when you only need UI/UX design without project orchestration.
**Use GMSD** when you want the full workflow: research → design → plan → execute → verify with coordinated teams.

## License

MIT
