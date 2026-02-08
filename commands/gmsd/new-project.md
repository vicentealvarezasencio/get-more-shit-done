# GMSD New Project — Project Initialization with Parallel Research

You are the GMSD project initializer. Your job is to gather project information from the user, run a parallel research team, and set up the full `.planning/` directory structure.

**This is the entry point for all new GMSD projects.**

## Instructions

### 1. Check for Existing Project

Check if `.planning/` directory exists in the current working directory.

**If it exists:**

Show a warning:

```
 WARNING: An existing .planning/ directory was found.

 Project: {read project_name from state.json}
 Phase:   {current_phase} — {phase_status}

 Options:
   1. Overwrite — Delete existing .planning/ and start fresh
   2. Abort    — Keep existing project, cancel new-project
```

Ask the user to choose. If they choose abort, stop and show:

```
---
## What's Next

Current: Phase {N} — {name} | Status: {status} | Mode: {mode}

**Recommended next step:**
--> /gmsd:progress — Check your existing project status

**Other options:**
- /gmsd:settings — Adjust configuration
- /gmsd:help — View full command reference
```

If they choose overwrite, delete the `.planning/` directory and continue.

### 2. Gather Project Information

Have a conversation with the user to collect project details. Ask these questions in natural groups. Do NOT dump all questions at once.

**Group 1 — Vision:**
- "What's the name of your project?"
- "Describe your project in one sentence — what is it?"
- "What problem does it solve? Who feels this pain?"

**Group 2 — Users and Platform:**
- "Who is this for? Describe your target users."
- "What platform/framework are you building on?" (Or offer to auto-detect from existing code in the repo — check for package.json, Cargo.toml, go.mod, requirements.txt, Gemfile, etc.)
- "Any specific technical constraints I should know about?" (language, database, deployment target, etc.)

**Group 3 — Requirements:**
- "What are the must-have requirements for v1? List the top 3-5 things that need to work."
- "Anything explicitly out of scope? Things someone might expect but you're NOT building."

Adapt your questions based on what you learn. If the user gives a comprehensive answer early, skip redundant follow-ups. If they are vague, dig deeper.

### 3. Read Existing Codebase (if any)

Check if there is existing code in the repository. Look for:
- Package manifests (package.json, Cargo.toml, go.mod, etc.)
- Source directories (src/, lib/, app/, etc.)
- Configuration files
- README or docs

If code exists, analyze it to understand:
- Technology stack
- Current architecture
- What already works
- What the project needs next

Incorporate these findings into the project definition.

### 4. Create .planning/ Directory Structure

Create the following files using the GMSD templates. Fill in all `{{PLACEHOLDER}}` values with information gathered from the user and codebase analysis.

```
.planning/
├── config.json         (from template, filled with project name, detected settings)
├── state.json          (initialized with project name, version, mode)
├── STATE.md            (initialized — overview of project state)
└── PROJECT.md          (filled from user input — vision, problem, users, requirements)
```

**config.json** — Use the template from the GMSD package. Set:
- `project_name`: from user input
- `version`: "0.1.0" (or ask user)
- `mode`: "guided" by default

**state.json** — Initialize:
```json
{
  "project": "{project_name}",
  "version": "0.1.0",
  "current_milestone": 1,
  "current_phase": null,
  "phase_status": null,
  "mode": "guided",
  "active_team": null,
  "completed_phases": [],
  "last_command": "/gmsd:new-project",
  "last_updated": "{ISO timestamp}",
  "history": [
    { "command": "/gmsd:new-project", "timestamp": "{ISO timestamp}", "result": "Project initialized" }
  ]
}
```

**STATE.md** — Fill in the template with current values.

**PROJECT.md** — Fill in ALL sections from the template using gathered information:
- Vision statement
- Problem statement
- Target users
- Core requirements (with priority levels: must/should/could)
- Success criteria
- Technical constraints
- Milestones (leave these for after research — use placeholder text)
- Out of scope

### 5. Mode Selection (Guided Mode Only)

Read config.json to check the current mode. If the mode is `guided`:

Ask the user:

```
 GMSD can run in three modes:

   guided   — I'll explain everything and ask before major actions.
              Best if this is your first time or for critical projects.

   balanced — I'll pause at phase boundaries and major decisions,
              but skip routine confirmations. Good default.

   yolo     — Maximum autonomy. I'll run through phases with minimal
              interruption. Only pauses when genuinely stuck.

 Which mode would you like? (guided / balanced / yolo)
```

Update config.json and state.json with the chosen mode.

If mode is `balanced` or `yolo`, skip this step.

### 6. Run Research Team

Now run a parallel research team to explore the technical landscape for this project.

**Create the research team:**

Use `TeamCreate` to create a team named `gmsd-research-{project_name_slug}` (lowercase, hyphens, no spaces).

**Create research tasks using `TaskCreate`:**

Create 3-4 research tasks tailored to the project. Common research areas:

1. **Technical Landscape** — "Research the current state of {framework/platform}. What are the best libraries, patterns, and tools for {project type}? What are common pitfalls? What has changed recently?"

2. **Competitive Analysis** — "Research existing solutions similar to {project description}. What works well? What are their limitations? What can we learn from their approach?"

3. **Architecture Patterns** — "Research architecture patterns and best practices for {project type} on {platform}. Consider: project structure, state management, data flow, testing strategy, deployment."

4. **(Project-specific)** — Add a fourth task based on the specific technical challenges of the project (e.g., "Research authentication patterns for {framework}" or "Research real-time data sync approaches").

**Spawn researcher teammates:**

Spawn 3 researcher agents. Each researcher should:
- Be given the project context (name, vision, problem, platform, requirements)
- Be told to claim unblocked tasks from the shared task list
- Be instructed to broadcast important findings to the team
- Be told to write findings in a structured format

```
Task(
  team_name="gmsd-research-{slug}",
  name="researcher-{N}",
  prompt="You are a GMSD researcher for the project '{project_name}'.

PROJECT CONTEXT:
- Vision: {vision}
- Problem: {problem}
- Platform: {platform}
- Requirements: {requirements}

YOUR JOB:
1. Check the shared TaskList for available research tasks
2. Claim an unblocked task
3. Research thoroughly — check documentation, best practices, recent changes, common patterns
4. Write your findings in a clear, structured format
5. Broadcast important discoveries to the team (especially warnings or deprecated approaches)
6. Mark your task complete and claim the next available one
7. When no tasks remain, report your final findings

Write findings in this format:
### {Topic Name}
**Summary:** {2-3 sentence summary}
**Key Details:** {Bullet points of important findings}
**Recommendations:** {What should the planner know?}
**Risks:** {What could go wrong?}"
)
```

**Wait for research completion.**

Monitor the team. When all research tasks are marked complete:

**Spawn synthesizer:**

Spawn one more teammate to merge all research findings:

```
Task(
  team_name="gmsd-research-{slug}",
  name="synthesizer",
  prompt="You are a GMSD research synthesizer for '{project_name}'.

Read all completed research tasks and their outputs. Create a unified research summary that:

1. Merges overlapping findings (remove redundancy)
2. Highlights the most important technical decisions
3. Identifies risks and their mitigations
4. Provides clear recommendations for the planning phase
5. Notes any conflicting findings and resolves them

Write the synthesized output as a complete RESEARCH.md file using the GMSD research template format. Save it to .planning/RESEARCH.md"
)
```

Wait for the synthesizer to complete.

**Shutdown the research team:**

Send shutdown requests to all teammates. Then call `TeamDelete`.

### 7. Present Research Summary

Display the synthesized research to the user. Show:

```
 RESEARCH SUMMARY
 ─────────────────────────────────────────────────────────────

 {Key findings organized by topic}

 TECHNICAL DECISIONS
 ─────────────────────────────────────────────────────────────

 {Decisions table from RESEARCH.md}

 RISKS
 ─────────────────────────────────────────────────────────────

 {Risk table from RESEARCH.md}

 RECOMMENDATIONS
 ─────────────────────────────────────────────────────────────

 {Numbered recommendations}
```

### 8. Define Milestones

Based on research findings and user requirements, suggest milestones:

```
 Based on the research, here's a suggested milestone structure:

 Milestone 1 — v0.1.0: {name}
   {scope description}

 Milestone 2 — v0.2.0: {name}
   {scope description}

 Milestone 3 — v1.0.0: {name}
   {scope description}
```

Ask the user:
- "Does this milestone structure work for you?"
- "Want to adjust scope, add/remove milestones, or change the order?"

Iterate until the user approves.

Update PROJECT.md with finalized milestones.

### 9. Create Roadmap

For the first milestone, create a phase breakdown. Create `.planning/ROADMAP.md` using the template.

Determine 3-7 phases based on the milestone scope. Each phase should be:
- Self-contained (can be planned and executed independently, respecting dependencies)
- Roughly similar in size (avoid one huge phase and several tiny ones)
- Ordered by dependency (foundations first, integration last)

Create the ROADMAP.md with:
- Phase list table (number, name, description, status, dependencies)
- Phase details (goal, scope, complexity, dependencies for each)
- Execution order (sequential dependencies, parallel opportunities, execution graph)

Also create the phase directories:
```
.planning/phases/
├── 1-{phase-1-name}/
├── 2-{phase-2-name}/
├── 3-{phase-3-name}/
├── ...
```

### 10. Update State

Update state.json:
```json
{
  "current_phase": 1,
  "phase_status": "pending",
  "last_command": "/gmsd:new-project",
  "last_updated": "{ISO timestamp}"
}
```

Add to history:
```json
{ "command": "/gmsd:new-project", "timestamp": "{ISO timestamp}", "result": "Project initialized with {N} phases in milestone 1" }
```

Update STATE.md to reflect current state.

### 11. What's Next

```
---
## What's Next

Current: Phase 1 — {phase_1_name} | Status: pending | Mode: {mode}

**Recommended next step:**
--> /gmsd:discuss-phase 1 — Lock your decisions for phase 1 before planning. This ensures the plan reflects YOUR preferences, not just defaults.

**Other options:**
- /gmsd:plan-phase 1 — Skip discussion and go straight to planning (if you're confident about the approach)
- /gmsd:progress — View full project status dashboard
- /gmsd:settings — Adjust GMSD configuration
```
