# GMSD New Project — Project Initialization with Parallel Research

You are the GMSD project initializer. Your job is to gather project information from the user, run a parallel research team, and set up the full `.planning/` directory structure.

**This is the entry point for all new GMSD projects.**

**Usage:** `/gmsd:new-project [--auto]`

**Flags:**
- `--auto` — Automatic mode. After config questions, runs research, requirements, and roadmap without further interaction. Expects an idea document via `@` reference (e.g., `/gmsd:new-project --auto @prd.md`).

## Instructions

### 0. Auto Mode Detection

Check if `--auto` flag is present in the arguments.

**If auto mode:**
- Skip deep questioning (Step 2) — extract context from provided `@` document instead
- Config questions still required (Step 5)
- After config: run Steps 6-9 automatically with smart defaults:
  - Research: Always yes
  - Requirements: Include all table stakes + features from provided document
  - Requirements approval: Auto-approve
  - Roadmap approval: Auto-approve

**Document requirement:**
Auto mode requires an idea document via `@` reference. If no document is provided, show this error and stop:

```
Error: --auto requires an idea document via @ reference.

Usage: /gmsd:new-project --auto @your-idea.md

The document should describe what you want to build.
```

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

**If auto mode:** Skip deep questioning. Extract project context (name, vision, problem, users, platform, requirements, constraints) from the provided `@` document and proceed directly to Step 2.5. If the document is too vague to extract these details, fall back to asking the user for the missing pieces.

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

### 2.5. Preset Detection

After gathering project information, detect or offer a project-type preset. Presets provide sensible defaults for team sizes, design settings, suggested phases, and research topics.

**1. Auto-detect project type from existing files in the repository:**

Check for these indicators (in priority order):

| Detection Signal | Preset |
|---|---|
| `package.json` with `"next"` in dependencies or devDependencies | `nextjs` |
| `Podfile` exists, or any `*.xcodeproj` directory exists | `ios` |
| `package.json` with `"react-native"` in dependencies | `react-native` |
| `Dockerfile` exists AND no frontend files (no `src/app/`, no `src/pages/`, no `*.tsx` in src/) | `api` |
| `manifest.json` with `browser_action`, `action`, or `content_scripts` fields | `chrome-extension` |
| `package.json` with `workspaces` field, or `lerna.json` exists, or `pnpm-workspace.yaml` exists | `monorepo` |
| `package.json` with `bin` field AND no `src/` directory with UI files (`.tsx`, `.jsx`, `.vue`, `.svelte`) | `cli` |

**2. If a project type was detected, ask the user:**

```
 Detected {type} project. Use the {type} preset?

 The {type} preset provides:
 - Team settings: {default_executors} executors, max {max_executors}
 - Design adapter: {adapter}
 - Suggested phases: {list first 3 phases}...
 - Research topics tailored to {type}

 Options:
   yes       — Apply preset defaults
   customize — Apply preset, then let me adjust specific settings
   skip      — No preset, use generic defaults
```

**3. If no project type was detected, offer preset selection:**

```
 Would you like to start from a project preset?
 Presets provide optimized defaults for team sizes, phases, and research.

 Available presets:
   nextjs           — Next.js web application
   ios              — iOS app (Swift/SwiftUI)
   react-native     — React Native cross-platform app
   api              — Backend API service
   cli              — Command-line tool
   chrome-extension — Browser extension
   monorepo         — Multi-package workspace
   none             — Start with generic defaults

 Select a preset (or "none"):
```

**4. Apply the selected preset:**

Read the preset file from the GMSD templates directory (`~/.claude/get-more-shit-done/templates/presets/{preset}.json`).

- **Merge `config_overrides`** into config.json. Preset values override template defaults, but any explicit user choices (from the interview) take priority.
- **Use `suggested_phases`** as a starting point when defining the milestone roadmap in Step 8. Present them as suggestions the user can modify, not fixed phases.
- **Add `research_topics`** to the research team's context in Step 6. Append them to the standard research topics, do not replace them.
- **Store the preset name** in config.json as `"preset": "{name}"` for future reference.
- **Store `file_patterns`** in config.json as `"file_patterns": {...}` so other commands can use them for codebase navigation.

If the user chose "customize", show the merged config and ask what they want to adjust before proceeding.

If the user chose "skip" or "none", continue with the generic template defaults.

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

### 5.5. Execution Mode Check

**Reference:** `workflows/execution-mode-check.md`

Read `.planning/config.json` -> `execution_mode`. Follow the execution mode detection logic:

- **If `execution_mode` is `null`:** Present the user with the execution mode choice (team vs classic). Save their choice to `config.json`. If auto mode, default to `"team"` and verify the experimental flag.
- **If `execution_mode` is `"team"`:** Continue with the team-based research flow (Step 6 below).
- **If `execution_mode` is `"classic"`:** Skip to **Step 6-Classic** below.

### 6. Run Research Team

**If auto mode:** Default to running research (always yes). Skip asking the user whether to research.

**If `execution_mode` is `"classic"`:** Skip to **Step 6-Classic** below.

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

### 6-Classic. Run Research (Classic Mode)

**Condition:** `execution_mode == "classic"`

Instead of creating a team, spawn 3 parallel `Task()` subagents (fire-and-forget). Each researcher works independently and writes directly to its output file. No shared task list, no inter-agent messaging.

Follow the detailed workflow in `workflows/new-project.md` -> "Classic Research Path" section:

1. Create `.planning/phases/init/research/` directory
2. Spawn 3 parallel `Task()` subagents (one per focus area: technical, competitive, architecture)
3. Each gets a self-contained prompt with project context and research questions
4. Wait for all 3 to return
5. Spawn 1 synthesizer `Task()` to merge findings into `.planning/RESEARCH.md`
6. Wait for synthesizer to return
7. Continue to Step 7 (Present Research Summary)

The rest of the flow (Steps 7-13) is identical regardless of execution mode.

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

**If auto mode:** Auto-generate milestones from the provided document and research findings. Include all table stakes features plus features explicitly mentioned in the document. Auto-approve without asking the user. Skip the "Does this milestone structure work for you?" gate.

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

### 9. Define Requirements

Synthesize research findings, user input, and milestone scope into formal requirements. Create `.planning/REQUIREMENTS.md` as a separate artifact that defines "done" for the first milestone.

**If auto mode:** Auto-include all table stakes features plus features explicitly mentioned in the provided document. Auto-approve without asking the user. Skip the per-category scoping and confirmation gates.

```
 ┌─────────────────────────────────────────────────────────────────┐
 │  GMSD Requirements — v1                                          │
 └─────────────────────────────────────────────────────────────────┘
```

**Load context:**
- Read PROJECT.md: core value, stated constraints, scope boundaries
- If research exists: read `.planning/RESEARCH.md` (or `.planning/research/FEATURES.md` if structured research was run) and extract feature categories

**If research exists — present features by category:**

```
 Here are the features for {domain}:

 ## {Category 1}
 Table stakes: Feature A, Feature B
 Differentiators: Feature C, Feature D
 Research notes: {any relevant notes}

 ## {Category 2}
 ...
```

**If no research — gather through conversation:**
Ask: "What are the main things users need to be able to do?"
For each capability: ask clarifying questions, probe for related capabilities, group into categories.

**Scope each category:**

For each category, ask which features are in v1:
- Present features as a checklist with brief descriptions
- Allow multi-select

Track responses:
- Selected features → v1 requirements (must-have)
- Unselected table stakes → v2 requirements (should-have, users expect these)
- Unselected differentiators → out of scope (nice-to-have or deferred)

**Identify gaps:**
Ask: "Any requirements the research missed? Features specific to your vision?"
- If yes: capture additions
- If no: proceed

**Validate core value:**
Cross-check requirements against Core Value from PROJECT.md. If gaps detected, surface them.

**Generate `.planning/REQUIREMENTS.md`:**

Create the file with categorized requirements using the GMSD requirements template format:

- **v1 Requirements** grouped by category with checkboxes and REQ-IDs
  - Must-have: Core features that define the product
  - Should-have: Important features expected by users
  - Nice-to-have: Enhancements that can slip if needed
- **v2 Requirements** (deferred to future milestone)
- **Out of Scope** (explicit exclusions with reasoning)
- **Traceability** section (empty — filled when roadmap is created)

**REQ-ID format:** `[CATEGORY]-[NUMBER]` (e.g., AUTH-01, CONT-02, SOCL-03)

**Requirement quality criteria:**
- **Specific and testable:** "User can reset password via email link" (not "Handle password reset")
- **User-centric:** "User can X" (not "System does Y")
- **Atomic:** One capability per requirement (not "User can login and manage profile")
- **Independent:** Minimal dependencies on other requirements

Reject vague requirements. Push for specificity:
- "Handle authentication" → "User can log in with email/password and stay logged in across sessions"
- "Support sharing" → "User can share post via link that opens in recipient's browser"

**Present full requirements for confirmation (interactive mode only):**

```
 v1 Requirements
 ─────────────────────────────────────────────────────────────

 Authentication
 - [ ] AUTH-01: User can create account with email/password
 - [ ] AUTH-02: User can log in and stay logged in across sessions
 - [ ] AUTH-03: User can log out from any page

 {Category 2}
 - [ ] CAT2-01: User can do X
 - [ ] CAT2-02: User can do Y

 ... (full list)

 Does this capture what you're building? (yes / adjust)
```

If "adjust": return to scoping and iterate.

**Link requirements to roadmap phases** — After the roadmap is created in Step 10, the traceability section will be populated. Each requirement maps to exactly one phase. Unmapped requirements indicate a roadmap gap.

### 10. Create Roadmap

**If auto mode:** Auto-approve the roadmap without asking the user. Skip the iteration/feedback loop and commit directly.

For the first milestone, create a phase breakdown. Create `.planning/ROADMAP.md` using the template.

Determine 3-7 phases based on the milestone scope and requirements from Step 9. Each phase should be:
- Self-contained (can be planned and executed independently, respecting dependencies)
- Roughly similar in size (avoid one huge phase and several tiny ones)
- Ordered by dependency (foundations first, integration last)
- Mapped to specific requirements from REQUIREMENTS.md

Create the ROADMAP.md with:
- Phase list table (number, name, description, status, dependencies)
- Phase details (goal, scope, complexity, requirements covered, success criteria for each)
- Execution order (sequential dependencies, parallel opportunities, execution graph)

**After creating the roadmap, update REQUIREMENTS.md:**
- Fill in the Traceability section with phase mappings for every v1 requirement
- Verify 100% coverage (every v1 requirement mapped to a phase)
- Report any unmapped requirements as warnings

Also create the phase directories:
```
.planning/phases/
├── 1-{phase-1-name}/
├── 2-{phase-2-name}/
├── 3-{phase-3-name}/
├── ...
```

### 11. Update State

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
{ "command": "/gmsd:new-project", "timestamp": "{ISO timestamp}", "result": "Project initialized with {N} phases, {X} requirements in milestone 1" }
```

Update STATE.md to reflect current state.

### 12. Sync CLAUDE.md

Regenerate the project's `.claude/CLAUDE.md` to reflect current state:
1. Read all project artifacts (.planning/state.json, config.json, PROJECT.md, REQUIREMENTS.md, ROADMAP.md, current phase CONTEXT.md, PLAN.md, design tokens, todos, tech debt)
2. Generate a concise, actionable CLAUDE.md summary following the template in workflows/claude-md-sync.md
3. Write to `.claude/CLAUDE.md` (create .claude/ directory if needed)

### 13. What's Next

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

───────────────────────────────────────────────────────

## 🎨 UI Design Workflow

If your project has a user interface, you can set up your design system now or at any point:

1. /gmsd:setup-tokens     — Pick a style preset or customize colors, fonts, spacing
2. /gmsd:design-screens    — Spec out each screen with wireframes and components
3. /gmsd:define-components — Extract a reusable component inventory
4. /gmsd:export            — Export to Pencil, Figma, V0, Stitch, or generic prompts
5. /gmsd:pencil            — Design interactively in Pencil editor
6. /gmsd:realize           — Track which screens are implemented

Quick start: `/gmsd:setup-tokens` — pick a preset and go.
Existing codebase: `/gmsd:scan` → `/gmsd:generate-specs` to reverse-engineer specs from code.

───────────────────────────────────────────────────────
```
