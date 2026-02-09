# Get More Shit Done (GMSD)

Team-based project orchestration system for [Claude Code](https://claude.ai/claude-code). Built on Claude Code's Agent Teams feature (Opus 4.6).

> Research. Design. Plan. Execute. Verify. — With coordinated agent teams.

## What is GMSD?

GMSD is a disciplined development workflow system that coordinates multiple Claude Code agents working as a team. Instead of isolated fire-and-forget subagents, GMSD uses Agent Teams — full Claude sessions that communicate, share task lists, and collaborate in real-time.

Inspired by [GSD (Get Shit Done)](https://github.com/vicentealvarezasencio/get-shit-done), rebuilt from the ground up for parallel, team-based execution.

### Key Differences from GSD

| Aspect | GSD | GMSD |
|--------|-----|------|
| Execution | Wave-batched (wait for entire wave) | Continuous flow (tasks claimed as available) |
| Communication | One-way (report to caller) | Two-way (agents message each other) |
| Coordination | None between peers | Shared task list + mailbox |
| Conflicts | Silent file collisions | Real-time conflict resolution |
| Checkpoints | Halt everything | Only blocked agent pauses |
| Visibility | Hidden parallel work | Split-pane tmux (watch all agents) |

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
- Agent Teams enabled:
  ```json
  // ~/.claude/settings.json
  {
    "env": {
      "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
    }
  }
  ```
- **Recommended:** [tmux](https://github.com/tmux/tmux) for split-pane visibility
  ```bash
  brew install tmux
  tmux new -s claude
  ```

## Quick Start

```
/gmsd:new-project       Start a new project with parallel research
/gmsd:discuss-phase     Lock decisions with user input before planning
/gmsd:plan-phase        Research + plan with verification spec
/gmsd:design-phase      UI/UX specifications (screens, tokens, components)
/gmsd:execute-phase     Team execution with shared task list
/gmsd:verify-work       Goal-backward verification
/gmsd:debug             Collaborative debugging with shared root causes
/gmsd:quick             Quick task without full workflow ceremony
/gmsd:map-codebase      Analyze existing codebase with parallel mappers
/gmsd:add-todo          Capture ideas and tasks as todos
/gmsd:check-todos       Review and manage pending todos
/gmsd:add-phase         Add a phase to the roadmap
/gmsd:insert-phase      Insert urgent work (decimal phases)
/gmsd:remove-phase      Remove a pending phase and renumber
/gmsd:research-phase    Standalone research before planning
/gmsd:list-phase-assumptions  Surface assumptions before planning
/gmsd:audit-milestone   Audit milestone against original intent
/gmsd:plan-milestone-gaps  Create phases to close audit gaps
/gmsd:retrospective     Post-milestone analysis and lessons learned
/gmsd:new-milestone     Start a new milestone cycle
/gmsd:preflight         Validate plan before execution
/gmsd:create-pr         Auto-generate GitHub PR from phase work
/gmsd:check-design-drift  Detect hardcoded values vs design tokens
/gmsd:replay            Timeline view of execution history
/gmsd:estimate-cost     Preview token/dollar cost before running
/gmsd:sync              Regenerate project CLAUDE.md context
/gmsd:tour              Interactive walkthrough (~5 min)
/gmsd:progress          Check status and route to next action
/gmsd:update            Check for and install latest version
/gmsd:help              Full command reference
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
- **UI/UX design workflow** — Full design system built in (see below)

### UI Design System (ui-design-cc)

GMSD's UI/UX commands (`/gmsd:setup-tokens`, `/gmsd:design-screens`, `/gmsd:export`, `/gmsd:pencil`, etc.) come from [ui-design-cc](https://github.com/vicentealvarezasencio/ui-design-cc) — a standalone, service-agnostic UI/UX design specification system for Claude Code.

**ui-design-cc** can be used independently in any project without GSD or GMSD. It provides:
- Design tokens (W3C format with dark mode)
- Screen specifications with ASCII wireframes
- Component inventory extraction
- Export to Stitch, V0, Figma, Pencil, or any tool
- Codebase reverse-engineering (scan existing code → generate specs)
- 6 specialized agents (Designer, Researcher, Specifier, Prompter, Brander, Scanner)

Inside GMSD, these same capabilities are available under the `/gmsd:` prefix and integrate with the project lifecycle — design tokens inform planning, screen specs guide execution, and drift detection runs during verification.

**Use ui-design-cc standalone** when you only need UI/UX design without project orchestration.
**Use GMSD** when you want the full workflow: research → design → plan → execute → verify with coordinated teams.

## License

MIT
