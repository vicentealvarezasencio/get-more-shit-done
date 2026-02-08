# GMSD Help — Command Reference

You are the GMSD help system. Display a comprehensive command reference with current project status.

## Instructions

### 1. Display Banner

Show this banner exactly:

```
 ┌─────────────────────────────────────────────────────────────────┐
 │                                                                 │
 │   Get More Shit Done  — Team-Based Orchestration for Claude Code│
 │                                                                 │
 │   Research  -->  Discuss  -->  Plan  -->  Execute  -->  Verify   │
 │                   Coordinated Agent Teams                       │
 │                                                                 │
 └─────────────────────────────────────────────────────────────────┘
```

### 2. Show Current Project Status

Check if `.planning/state.json` exists in the current working directory.

**If it exists:**
- Read `.planning/state.json` and `.planning/config.json`
- Show a status block:

```
 Current Project: {project_name}
 Version: {version} | Mode: {mode} | Milestone: {current_milestone}
 Phase: {current_phase} — Status: {phase_status}
```

**If it does NOT exist:**
- Show:

```
 No active project. Run /gmsd:new-project to get started.
```

### 3. Display Command Reference

Show all commands grouped by category. Use a clean table format.

```
 PROJECT SETUP
 ─────────────────────────────────────────────────────────────
 /gmsd:new-project         Initialize a new project with parallel
                           research. Creates .planning/ structure,
                           runs research team, defines milestones.

 PHASE WORKFLOW (run in order for each phase)
 ─────────────────────────────────────────────────────────────
 /gmsd:discuss-phase {N}   Gather user decisions before planning.
                           Architecture, technology, UX, scope, and
                           priority choices. Writes CONTEXT.md.

 /gmsd:plan-phase {N}      Research + plan with verification spec.
                           Spawns planner + checker team. Creates
                           PLAN.md with tasks, deps, and file ownership.

 /gmsd:design-phase {N}    UI/UX specifications for phases with
                           visual components. Tokens, screens,
                           component specs. (Requires ui-design-cc)

 /gmsd:execute-phase {N}   Team execution with shared task list.
                           Spawns executor team. Continuous flow —
                           agents claim tasks as they complete others.

 QUALITY
 ─────────────────────────────────────────────────────────────
 /gmsd:verify-work {N}     Goal-backward verification after execution.
                           Checks outcomes against phase goal, not
                           just task completion. Creates gap tasks.

 /gmsd:debug {N}           Collaborative debugging with shared root
                           causes. Spawns debugger team to investigate
                           verification gaps.

 QUICK ACTIONS
 ─────────────────────────────────────────────────────────────
 /gmsd:quick                Execute a small task without the full
                           workflow ceremony. Bug fixes, tweaks,
                           small features. Atomic commit included.

 /gmsd:map-codebase         Analyze an existing codebase with parallel
                           mapper agents. Tech, architecture, quality,
                           and concerns analysis.

 NAVIGATION
 ─────────────────────────────────────────────────────────────
 /gmsd:progress             Check full project status and get routed
                           to the next logical action. The GPS for
                           your development process.

 /gmsd:pause-work           Save current state for later resumption.
                           Records active team, phase, and position.

 /gmsd:resume-work          Resume from a paused session. Restores
                           context and suggests next step.

 LIFECYCLE
 ─────────────────────────────────────────────────────────────
 /gmsd:milestone            Archive completed milestone, prepare next
                           version. Generates completion report.

 /gmsd:retrospective        Post-milestone analysis. Timeline, quality
                           metrics, lessons learned. Run before or
                           after /gmsd:milestone.

 /gmsd:settings             View and modify GMSD configuration.
                           Mode, team sizes, git settings, models.

 /gmsd:update               Check for and install the latest version
                           of GMSD from npm.
```

### 4. Quick Start Guide

Show a quick start section for new users:

```
 QUICK START
 ─────────────────────────────────────────────────────────────

 New project:
   1. /gmsd:new-project          Set up project + run research
   2. /gmsd:discuss-phase 1      Lock decisions for phase 1
   3. /gmsd:plan-phase 1         Create execution plan
   4. /gmsd:execute-phase 1      Run the team
   5. /gmsd:verify-work 1        Check the results
   6. /gmsd:progress             See what's next

 Returning to a project:
   1. /gmsd:progress             See where you left off
   2. Follow the recommended next step

 Changing settings:
   1. /gmsd:settings             View/edit configuration
```

### 5. Show Links

```
 LINKS
 ─────────────────────────────────────────────────────────────
 GitHub:  https://github.com/vicentealvarezasencio/get-more-shit-done
 Issues:  https://github.com/vicentealvarezasencio/get-more-shit-done/issues
```

### 6. What's Next Section

Based on the current project status, show the appropriate next step:

**If no project exists:**
```
---
## What's Next

Current: No active project

**Recommended next step:**
--> /gmsd:new-project — Start a new project with parallel research

**Other options:**
- /gmsd:settings — Pre-configure GMSD before starting a project
```

**If a project exists**, read state.json and recommend based on current phase status. Follow the same routing logic as `/gmsd:progress`.

### 7. Update State (if project exists)

If `.planning/state.json` exists, append to the history array:
```json
{ "command": "/gmsd:help", "timestamp": "{ISO timestamp}", "result": "Displayed command reference" }
```

Update `last_command` to `/gmsd:help` and `last_updated` to the current ISO timestamp.
