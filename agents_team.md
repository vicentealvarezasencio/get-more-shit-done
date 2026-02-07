# Agent Teams Workflow System — Kickstart Document

## Overview

A next-generation project orchestration system inspired by GSD (Get Shit Done), rebuilt from the ground up to leverage Claude Code's **Agent Teams** feature (Opus 4.6). The goal is to keep the same philosophy — research, discuss, plan, execute, verify, debug, test, report and whatever gsd does well — but redesigned around coordinated teams of agents instead of fire-and-forget subagents.

---

## Claude Code Agent Teams — What It Is

Agent Teams allow multiple independent Claude Code instances to work together as a coordinated unit. Unlike subagents (Task tool), teammates are full Claude sessions with their own context windows that communicate via shared state.

### Architecture

| Component | Description |
|-----------|-------------|
| **Team Lead** | Main Claude session that creates the team, spawns teammates, coordinates work |
| **Teammates** | Independent Claude instances working in parallel, each with full context |
| **Shared Task List** | Central work tracker — teammates claim, update, and complete tasks |
| **Mailbox System** | Direct messaging between agents (DMs and broadcasts) |

### Key Differences from Subagents (Task Tool)

| Aspect | Subagents (Current GSD) | Agent Teams |
|--------|------------------------|-------------|
| Context | Inherits partial context from caller | Full independent context window |
| Communication | One-way: report back to caller | Two-way: agents message each other |
| Coordination | None between peers | Shared task list + mailbox |
| Visibility | Hidden — you wait for results | Split-pane via tmux — watch in real-time |
| State | Isolated per agent | Shared task list + team config |
| Lifecycle | Fire-and-forget | Persistent — can pause, resume, reassign |

### Enabling Agent Teams

**Settings** (`~/.claude/settings.json`):
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

**Environment variable alternative:**
```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

### Display Modes

| Mode | Requirement | Experience |
|------|-------------|------------|
| **In-process** | None (default) | Shift+Up/Down to cycle between teammates |
| **Split-pane** | tmux or iTerm2 | Each teammate gets its own visible terminal pane |

**tmux setup:**
```bash
brew install tmux
tmux new -s claude
claude
```

### Keyboard Shortcuts (In-Process Mode)

| Shortcut | Action |
|----------|--------|
| `Shift+Up/Down` | Cycle between teammates |
| `Shift+Tab` | Toggle delegate mode (lead coordinates only) |
| `Ctrl+T` | Toggle task list visibility |
| `Enter` | View full teammate session |
| `Escape` | Interrupt a teammate |

---

## Current GSD System — Architecture Reference

### Agent Ecosystem (11 Specialized Agents)

| Agent | Role |
|-------|------|
| `gsd-phase-researcher` | Domain research before planning |
| `gsd-planner` | Creates executable PLAN.md files |
| `gsd-plan-checker` | Verifies plan quality before execution |
| `gsd-executor` | Executes plans with atomic commits |
| `gsd-verifier` | Goal-backward verification after execution |
| `gsd-project-researcher` | Project-wide discovery (4 parallel) |
| `gsd-research-synthesizer` | Synthesizes parallel research outputs |
| `gsd-codebase-mapper` | Maps codebase structure |
| `gsd-debugger` | Root cause analysis for UAT gaps |
| `gsd-integration-checker` | Cross-system integration validation |
| `gsd-roadmapper` | Creates/maintains roadmap structure |

### Core Workflow Cycle

```
/new-project → /plan-phase → /execute-phase → /verify-work → /debug → /complete-milestone
     ↓              ↓              ↓                ↓            ↓            ↓
  Research      Discuss →      Wave-based       Goal-backward  Diagnose    Archive +
  + Roadmap     Plan →         parallel         verification   + fix       next version
                Check →        execution
                Verify plan
```

### Wave-Based Parallel Execution (Current Pattern)

Plans are pre-assigned to waves with explicit dependencies:
```
Wave 1: Plans 10, 12, 13 (independent — run in parallel)
Wave 2: Plans 01-08 (depend on Wave 1 — up to max_concurrent_agents)
Wave 3: Plan 09 (checkpoint — depends on all Wave 2)
```

### Configuration System (`.planning/config.json`)

```json
{
  "mode": "yolo",
  "depth": "comprehensive",
  "model_profile": "fullflama",
  "model_overrides": {
    "gsd-phase-researcher": "opus",
    "gsd-planner": "opus",
    "gsd-plan-checker": "opus",
    "gsd-executor": "opus",
    "gsd-verifier": "opus"
  },
  "parallelization": {
    "enabled": true,
    "plan_level": true,
    "task_level": false,
    "max_concurrent_agents": 3,
    "min_plans_for_parallel": 2
  }
}
```

### File Structure

```
~/.claude/
├── commands/gsd/          # Slash command definitions
├── get-shit-done/
│   ├── bin/gsd-tools.js   # CLI utility (model resolution, state, commits)
│   └── workflows/         # 32 orchestrator workflow files
.planning/
├── config.json            # Project configuration
├── PROJECT.md             # Project vision + milestones
├── ROADMAP.md             # Phase breakdown
├── STATE.md               # Current execution state
├── phases/
│   └── {N}-{name}/
│       ├── RESEARCH.md
│       ├── CONTEXT.md     # User-locked decisions
│       ├── {N}-{P}-PLAN.md
│       ├── {N}-{P}-SUMMARY.md
│       ├── VERIFICATION.md
│       └── UAT.md
```

---

## What Agent Teams Would Change

### 1. Cross-Agent Communication During Execution

**Current:** Parallel executors are isolated. If two agents touch overlapping files, they collide silently.

**With Teams:** Teammates can message each other about file conflicts in real-time:
```
Executor-A → Executor-B: "I'm modifying GameViewModel.swift lines 200-250,
                           hold off on that file"
Executor-B: Claims a different task from shared list instead
```

### 2. Shared Task List Replaces Wave Orchestration

**Current:** Orchestrator pre-computes waves, spawns agents per wave, waits, spawns next wave.

**With Teams:** Tasks go into shared TaskList with dependency metadata. Teammates autonomously claim unblocked tasks as they finish previous ones — no artificial wave boundaries needed. Work flows continuously.

```
TaskCreate: "Implement sound manager" (blocked by: setup audio session)
TaskCreate: "Setup audio session" (no blockers)
TaskCreate: "Add haptic feedback" (no blockers)

→ Two teammates grab unblocked tasks immediately
→ Third task unblocks when dependency completes
→ No waiting for entire "wave" to finish
```

### 3. Non-Blocking Checkpoints

**Current:** Checkpoint halts entire execution. User responds. Fresh agent spawned.

**With Teams:** Only the blocked teammate pauses. Others keep working. Lead coordinates the checkpoint without stalling the team.

### 4. Live Cross-Pollination During Research

**Current:** 4 research agents run independently, then a synthesizer merges their output.

**With Teams:** Researchers share findings mid-flight:
```
Researcher-API → broadcast: "MusicKit deprecated X in iOS 18,
                              don't waste time exploring that path"
```
This eliminates redundant work and dead-end exploration.

### 5. Real-Time Debugging Collaboration

**Current:** One debug agent per UAT gap, isolated.

**With Teams:** Debug agents share root cause discoveries:
```
Debugger-A → Debugger-B: "Root cause is in GameViewModel.swift:240 —
                           the state mutation. Your symptom is likely
                           a downstream effect of same bug."
Debugger-B: Shifts focus, confirms, avoids duplicate investigation
```

### 6. Split-Pane Visibility

**Current:** Parallel agents run invisibly. You wait.

**With Teams + tmux:** Every teammate visible in its own pane. Watch code being written across 3-5 agents simultaneously. Intervene in any pane at any time.

---

## Proposed System Design

### Philosophy (Inherited from GSD)

1. **Research before planning** — never plan blind
2. **Discuss before committing** — lock decisions with user input
3. **Plan with verification spec** — every plan defines what "done" looks like
4. **Execute atomically** — per-task commits, deviation rules
5. **Verify goal-backward** — check outcomes, not task completion
6. **Debug systematically** — root cause analysis, not symptom whacking
7. **Report everything** — full audit trail in `.planning/`

### New Principles (Enabled by Agent Teams)

8. **Continuous flow over wave batching** — tasks flow through the team via shared TaskList with dependency tracking, no artificial wave grouping
9. **Collaborative intelligence** — agents share discoveries, warn about conflicts, cross-pollinate findings
10. **Non-blocking human interaction** — checkpoints pause one agent, not the whole team
11. **Observable execution** — every agent visible in its own tmux pane
12. **Autonomous task claiming** — teammates pull work when ready instead of being assigned waves
13. **Graceful degradation** — if a teammate fails, others continue; lead reassigns failed work

### Agent Roles (Redesigned for Teams)

| Role | Team Membership | Behavior |
|------|----------------|----------|
| **Lead** | Always present | Creates team, populates TaskList, coordinates checkpoints, handles user interaction |
| **Researcher** | Spawned 2-4 per research phase | Explore domains in parallel, broadcast findings, write to shared RESEARCH.md |
| **Planner** | Spawned 1-2 per planning phase | Reads research, creates PLAN.md files, populates TaskList with execution tasks |
| **Plan Checker** | Spawned 1 | Reviews plans against goals, messages planner with revision requests |
| **Executor** | Spawned 2-5 per execution phase | Claims tasks from TaskList, writes code, commits atomically, messages peers about file conflicts |
| **Verifier** | Spawned 1 after execution | Goal-backward verification, creates gap tasks if needed |
| **Debugger** | Spawned 1-3 for gap closure | Investigates failures, shares root causes with peers, proposes fixes |

### Workflow: Execute Phase (Team-Based)

```
1. Lead creates team: TeamCreate("execute-phase-15")

2. Lead reads all PLAN.md files, creates TaskList:
   - TaskCreate("Setup audio session", depends: none)
   - TaskCreate("Implement sound manager", depends: "Setup audio session")
   - TaskCreate("Add haptic feedback", depends: none)
   - TaskCreate("Victory animation polish", depends: none)
   - TaskCreate("Integration test", depends: all above)

3. Lead spawns 3 executor teammates:
   Task(team_name="execute-phase-15", name="executor-1", subagent_type="general-purpose")
   Task(team_name="execute-phase-15", name="executor-2", subagent_type="general-purpose")
   Task(team_name="execute-phase-15", name="executor-3", subagent_type="general-purpose")

4. Each executor:
   - Calls TaskList → finds unblocked, unowned tasks
   - Claims task via TaskUpdate(owner="executor-1")
   - Executes with atomic commits
   - Marks complete via TaskUpdate(status="completed")
   - Messages lead if checkpoint hit
   - Claims next available task
   - Repeat until no tasks remain

5. Lead monitors:
   - Handles checkpoint messages from teammates
   - Watches for task conflicts
   - Spawns additional executors if throughput is low
   - Sends shutdown_request when all tasks complete

6. Lead spawns verifier:
   Task(team_name="execute-phase-15", name="verifier", subagent_type="general-purpose")
   - Goal-backward verification
   - Creates gap tasks if needed → executors pick them up

7. Lead cleans up:
   - SendMessage(type="shutdown_request") to all teammates
   - TeamDelete()
```

### Proposed Command Structure

```
/team:new-project      — Initialize project with parallel research team
/team:discuss-phase    — Gather user decisions (lead-only, no team needed)
/team:plan-phase       — Research + plan with researcher/planner/checker team
/team:execute-phase    — Full team execution with shared TaskList
/team:verify-work      — Conversational UAT (lead-only)
/team:debug            — Parallel debug team with cross-agent communication
/team:progress         — Show team status, task completion, active agents
/team:milestone        — Archive and prepare next version
```

### Proposed File Structure

```
~/.claude/
├── commands/team/           # Slash command definitions
├── team-workflow/
│   ├── bin/team-tools.js    # CLI utility
│   ├── workflows/           # Orchestrator workflow files
│   └── agents/              # Agent role definitions
.planning/
├── config.json              # Project config (extended with team settings)
├── teams/                   # Team execution logs
│   └── {team-name}/
│       ├── config.json      # Team members, roles
│       └── messages.log     # Communication audit trail
└── phases/                  # Same structure as GSD
```

### Configuration Extensions

```json
{
  "teams": {
    "default_executors": 3,
    "default_researchers": 4,
    "default_debuggers": 2,
    "teammate_mode": "auto",
    "auto_claim_tasks": true,
    "broadcast_findings": true,
    "file_conflict_detection": true
  },
  "model_overrides": {
    "lead": "opus",
    "researcher": "sonnet",
    "planner": "opus",
    "plan-checker": "opus",
    "executor": "opus",
    "verifier": "opus",
    "debugger": "sonnet"
  }
}
```

---

## Key Risks and Considerations

1. **Token cost** — Each teammate is a full Claude session. A 5-agent team burns ~5x the tokens of a single session. Model overrides (using sonnet for researchers, opus for executors) can help manage cost.

2. **File conflicts** — Multiple agents writing to the same file simultaneously. Needs file-lock messaging convention or task-level file ownership.

3. **Context window limits** — Teammates don't share context. Each needs enough context inlined in their task description to work independently.

4. **Experimental feature** — Agent Teams is still behind `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`. API and behavior may change.

5. **No session resumption** — If a teammate crashes, it can't resume. Tasks need to be self-contained enough that a fresh agent can pick up where another left off (GSD already handles this with its continuation protocol).

6. **Max concurrency** — Cloud API limits may throttle how many agents can run simultaneously. Current GSD config uses `max_concurrent_agents: 3`.

---

## Reference Links

- [Claude Code Agent Teams Documentation](https://code.claude.com/docs/en/agent-teams)
- [Building a C compiler with parallel Claudes](https://www.anthropic.com/engineering/building-c-compiler)
- [Claude Code Agent Teams Tutorial (NxCode)](https://www.nxcode.io/resources/news/claude-agent-teams-parallel-ai-development-guide-2026)
- [Claude Code's Hidden Multi-Agent System (Paddo)](https://paddo.dev/blog/claude-code-hidden-swarm/)
- [Claude Code Swarms (Addy Osmani)](https://addyosmani.com/blog/claude-code-agent-teams/)
