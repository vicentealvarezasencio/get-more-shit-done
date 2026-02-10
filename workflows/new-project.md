# Workflow: Project Initialization

**Slash Command:** `/gmsd:new-project`
**Role:** Team Lead
**Produces:** `.planning/` directory, PROJECT.md, ROADMAP.md, RESEARCH.md, config.json, state.json

---

## Overview

Initialize a new GMSD project. Gather project information from the user, run a parallel research team to explore the technical landscape, synthesize findings, and create a roadmap with milestones. This workflow transitions from no project state to a fully-defined roadmap ready for phase planning.

---

## Prerequisites

Before starting, verify these conditions:

```
1. Check if .planning/ directory exists in the current working directory
   - If EXISTS and user did NOT confirm overwrite: STOP. Ask user to confirm.
   - If EXISTS and user confirmed overwrite: delete .planning/ and proceed.
   - If NOT EXISTS: proceed.

2. Verify the current directory is a valid project root
   - Check for package.json, Cargo.toml, go.mod, pyproject.toml, or similar
   - If no project root indicators: warn user, ask if they want to continue
```

---

## State Transitions

```
null --> gathering_info --> researching --> synthesizing --> roadmap_created
```

---

## Step 1: Gather Project Information

**Actor:** Lead (direct conversation with user)
**No team needed yet.**

Conduct a structured interview with the user. Collect:

```
Required:
  - Project name
  - Vision statement (1-2 sentences)
  - Problem statement
  - Target users (1-3 user types)
  - Core requirements (numbered, with priority: must/should/could)
  - Technical constraints (platform, language, framework, runtime)
  - Success criteria (testable outcomes)

Optional:
  - Key dependencies (specific libraries/services)
  - Out-of-scope items
  - Existing codebase context
  - Design preferences (if UI-heavy)
```

**Interaction pattern:**

```
Lead: "Let's set up your project. I'll ask a series of questions to understand
       what you're building. You can be brief -- I'll ask follow-ups if needed."

Lead: "What are you building? Give me the elevator pitch."
User: {responds}

Lead: "Who is this for? Describe 1-3 user types."
User: {responds}

Lead: "What are the must-have requirements? List the non-negotiable features."
User: {responds}

Lead: "What's the tech stack? Platform, language, framework, key dependencies."
User: {responds}

Lead: "Anything explicitly out of scope?"
User: {responds}
```

**After gathering:** Write `.planning/PROJECT.md` using the project template, filling in all fields from user responses.

---

## Step 2: Initialize .planning/ Directory

**Actor:** Lead

Create the directory structure and initial files:

```
mkdir -p .planning/phases

# Write config.json
Write .planning/config.json:
{
  "project_name": "{from user}",
  "version": "0.1.0",
  "mode": "guided",              // default, user can change via /gmsd:settings
  "execution_mode": null,        // null = prompt on first use; "team" or "classic"
  "teams": {
    "default_executors": 3,
    "max_executors": 5,
    "default_researchers": 3,
    "default_debuggers": 2,
    "scale_up_threshold": 5
  },
  "git": {
    "auto_commit": true,
    "commit_per": "task",
    "commit_prefix": "gmsd"
  },
  "model_overrides": {},
  "design": {
    "enabled": true,
    "auto_detect": true,
    "default_adapter": "v0"
  }
}

# Write state.json
Write .planning/state.json:
{
  "project": "{project_name}",
  "version": "0.1.0",
  "current_milestone": 1,
  "current_phase": null,
  "phase_status": "researching",
  "mode": "guided",
  "active_team": "gmsd-research-init",
  "completed_phases": [],
  "last_command": "/gmsd:new-project",
  "last_updated": "{ISO timestamp}",
  "history": [
    { "command": "/gmsd:new-project", "timestamp": "{ISO}", "result": "Project initialized, starting research" }
  ]
}

# Write PROJECT.md from template with gathered info
# Write STATE.md from template
```

---

## Step 2.5: Execution Mode Check

**Actor:** Lead

**Reference:** `workflows/execution-mode-check.md`

Read `.planning/config.json` -> `execution_mode`. Follow the execution mode detection logic:

- **If `execution_mode` is `null`:** Present the user with the execution mode choice (team vs classic). Save their choice to `config.json`.
- **If `execution_mode` is `"team"`:** Continue with the team-based research flow (Steps 3-6 below).
- **If `execution_mode` is `"classic"`:** Skip to **Classic Research Path** below.

---

## Step 3: Create Research Team (Team Mode)

**Actor:** Lead
**Team type:** Research team with 3 researchers

### 3a. Check Model Overrides

```
Read .planning/config.json
IF config.model_overrides["researcher"] exists:
  researcher_model = config.model_overrides["researcher"]
ELSE IF config.model_profile exists:
  researcher_model = resolve_from_profile(config.model_profile, "researcher")
ELSE:
  researcher_model = default
```

### 3b. Create Team

```
TeamCreate("gmsd-research-init")
```

### 3c. Create Research Tasks

```
TaskCreate({
  subject: "Research technical landscape",
  description: "## Research: Technical Landscape

    ## Focus Area
    Frameworks, libraries, APIs, and tools relevant to building {project_name}.

    ## Project Context
    - Vision: {vision_statement}
    - Platform: {platform}
    - Language: {language}
    - Framework: {framework}
    - Key dependencies: {dependencies}

    ## Research Questions
    1. What frameworks/libraries are best suited for this project type?
    2. What is the maturity and maintenance status of key dependencies?
    3. Are there version compatibility concerns?
    4. What APIs or services are needed? Are they stable and well-documented?
    5. What build/tooling setup is standard for this stack?

    ## Scope
    Focus on what is AVAILABLE and what is MATURE. Surface options with evidence.
    Do not make implementation decisions -- present options with pros/cons.

    ## Output
    Write findings to .planning/phases/init/research/technical-landscape.md",
  activeForm: "Researching technical landscape"
})

TaskCreate({
  subject: "Research competitive landscape",
  description: "## Research: Competitive Landscape

    ## Focus Area
    Similar products, tools, or solutions that address the same problem space.

    ## Project Context
    - Vision: {vision_statement}
    - Problem: {problem_statement}
    - Target users: {target_users}

    ## Research Questions
    1. What existing solutions address this problem?
    2. What do they do well? What are their weaknesses?
    3. What UX patterns do successful solutions use?
    4. What differentiates {project_name} from existing solutions?
    5. What can we learn from their approach?

    ## Scope
    Focus on inspiration and differentiation. What patterns should we adopt?
    What mistakes should we avoid?

    ## Output
    Write findings to .planning/phases/init/research/competitive-landscape.md",
  activeForm: "Researching competitive landscape"
})

TaskCreate({
  subject: "Research architecture patterns",
  description: "## Research: Architecture Patterns

    ## Focus Area
    Best practices, architectural patterns, and common pitfalls for this project type.

    ## Project Context
    - Vision: {vision_statement}
    - Platform: {platform}
    - Framework: {framework}
    - Requirements: {core_requirements}
    - Constraints: {technical_constraints}

    ## Research Questions
    1. What architectural patterns are recommended for {framework} + {project type}?
    2. What are common scalability considerations?
    3. What testing strategies work best?
    4. What are the common pitfalls and how to avoid them?
    5. What project structure is conventional?

    ## Scope
    Focus on proven patterns, not bleeding edge. Prioritize maintainability
    and developer experience.

    ## Output
    Write findings to .planning/phases/init/research/architecture-patterns.md",
  activeForm: "Researching architecture patterns"
})
```

### 3d. Spawn Researcher Teammates

```
// Spawn 3 researchers -- one per focus area
For each researcher (researcher-tech, researcher-market, researcher-arch):

  Task(
    team_name="gmsd-research-init",
    name="{researcher-name}",
    subagent_type="general-purpose",
    prompt="{contents of agents/gmsd-researcher.md}

    PROJECT CONTEXT:
    - Project: {project_name}
    - Vision: {vision_statement}
    - Platform: {platform}
    - Framework: {framework}

    START WORKING:
    1. Call TaskList to find your research task
    2. Claim it and read the full description
    3. Read .planning/PROJECT.md for full project context
    4. Execute your research protocol
    5. Write findings to the designated output path
    6. Message the lead when complete"
  )
```

---

## Step 4: Monitor Research Phase

**Actor:** Lead
**Duration:** Wait for all 3 researchers to complete

```
WHILE researchers_active:

  ON message from researcher:
    IF type == "broadcast" AND contains "CRITICAL":
      - Note the critical finding
      - Consider whether it affects project direction
      - If project-altering: pause research, discuss with user

    IF type == "message" AND contains "complete":
      - Mark researcher as done
      - Note their summary findings
      - Check if all 3 are complete

    IF type == "message" AND contains "BLOCKED":
      - Assess blocker
      - Attempt to unblock (provide additional context, suggest alternative)
      - If unresolvable: note as research gap, allow researcher to finish partial

  IF all 3 researchers complete:
    EXIT monitoring loop
    PROCEED to synthesis

  IF researcher appears stalled (no message in 3+ minutes):
    - Send check-in message:
      SendMessage(type="message", recipient="{researcher-name}",
      content="Status check -- how is your research progressing?",
      summary="Research status check")
```

---

## Step 5: Synthesize Research

**Actor:** Lead spawns synthesizer
**Input:** 3 individual research outputs
**Output:** Unified RESEARCH.md

### 5a. Create Synthesis Task

```
TaskCreate({
  subject: "Synthesize research findings",
  description: "## Task: Research Synthesis

    ## Goal
    Merge the 3 individual research outputs into a unified RESEARCH.md.

    ## Input Files
    - .planning/phases/init/research/technical-landscape.md
    - .planning/phases/init/research/competitive-landscape.md
    - .planning/phases/init/research/architecture-patterns.md

    ## Output File
    .planning/RESEARCH.md (project-level research for milestone planning)

    ## Instructions
    1. Read all 3 research outputs
    2. Cross-reference findings -- identify agreements and conflicts
    3. Resolve conflicts using evidence quality
    4. Identify gaps -- topics no researcher covered
    5. Produce unified RESEARCH.md with:
       - Executive summary
       - Consolidated findings by topic
       - Technology recommendations table
       - Resolved conflicts (with reasoning)
       - Unresolved questions (for user)
       - Gaps identified
       - Risk register
       - Recommendations for roadmap planning",
  activeForm: "Synthesizing research findings"
})
```

### 5b. Spawn Synthesizer

```
Task(
  team_name="gmsd-research-init",
  name="synthesizer",
  subagent_type="general-purpose",
  prompt="{contents of agents/gmsd-synthesizer.md}

  PROJECT CONTEXT:
  - Project: {project_name}
  - Vision: {vision_statement}

  START WORKING:
  1. Call TaskList to find the synthesis task
  2. Claim it and read the full description
  3. Read .planning/PROJECT.md for project context
  4. Read all files in .planning/phases/init/research/
  5. Execute synthesis protocol
  6. Write unified RESEARCH.md
  7. Message the lead when complete"
)
```

### 5c. Wait for Synthesis

```
WAIT for synthesizer completion message

ON message from synthesizer:
  IF contains "complete":
    - Read the produced RESEARCH.md
    - Note key findings for roadmap discussion
    - Proceed to roadmap creation
  IF contains "CRITICAL GAP":
    - Assess if gap blocks roadmap creation
    - If yes: spawn additional researcher or ask user
    - If no: note gap, proceed with caveat
```

---

## Step 6: Shutdown Research Team

**Actor:** Lead

```
// Send shutdown to all remaining teammates
For each active teammate in "gmsd-research-init":
  SendMessage(type="shutdown_request", recipient="{teammate-name}",
  content="Research and synthesis complete. Shutting down research team.")

// Wait for all shutdown_response(approve=true)
// Then delete team
// (Team auto-cleans when all members shut down)
```

---

## Classic Research Path

**Condition:** `execution_mode == "classic"` (from Step 2.5)

This replaces Steps 3-6 (team-based research) with fire-and-forget `Task()` subagents. No `TeamCreate`, no `SendMessage`, no shared `TaskList`.

### Classic 3a: Check Model Overrides

```
Read .planning/config.json
IF config.model_overrides["researcher"] exists:
  researcher_model = config.model_overrides["researcher"]
ELSE:
  researcher_model = default
```

### Classic 3b: Spawn 3 Parallel Researchers

```
// Spawn 3 independent Task() subagents -- one per focus area
// Each writes directly to its output file. No coordination.

researcher_tech = Task(
  subagent_type="general-purpose",
  run_in_background=true,
  prompt="You are a GMSD researcher. Research the technical landscape for '{project_name}'.

  PROJECT CONTEXT:
  - Vision: {vision_statement}
  - Platform: {platform}
  - Language: {language}
  - Framework: {framework}
  - Key dependencies: {dependencies}

  RESEARCH QUESTIONS:
  1. What frameworks/libraries are best suited for this project type?
  2. What is the maturity and maintenance status of key dependencies?
  3. Are there version compatibility concerns?
  4. What APIs or services are needed?
  5. What build/tooling setup is standard for this stack?

  OUTPUT:
  Write your findings to .planning/phases/init/research/technical-landscape.md
  Format: Summary, Key Details (bullet points), Recommendations, Risks"
)

researcher_market = Task(
  subagent_type="general-purpose",
  run_in_background=true,
  prompt="You are a GMSD researcher. Research the competitive landscape for '{project_name}'.

  PROJECT CONTEXT:
  - Vision: {vision_statement}
  - Problem: {problem_statement}
  - Target users: {target_users}

  RESEARCH QUESTIONS:
  1. What existing solutions address this problem?
  2. What do they do well? What are their weaknesses?
  3. What UX patterns do successful solutions use?
  4. What differentiates {project_name}?
  5. What can we learn from their approach?

  OUTPUT:
  Write your findings to .planning/phases/init/research/competitive-landscape.md
  Format: Summary, Key Details (bullet points), Recommendations, Risks"
)

researcher_arch = Task(
  subagent_type="general-purpose",
  run_in_background=true,
  prompt="You are a GMSD researcher. Research architecture patterns for '{project_name}'.

  PROJECT CONTEXT:
  - Vision: {vision_statement}
  - Platform: {platform}
  - Framework: {framework}
  - Requirements: {core_requirements}
  - Constraints: {technical_constraints}

  RESEARCH QUESTIONS:
  1. What architectural patterns are recommended for {framework} + {project type}?
  2. What are common scalability considerations?
  3. What testing strategies work best?
  4. What are common pitfalls and how to avoid them?
  5. What project structure is conventional?

  OUTPUT:
  Write your findings to .planning/phases/init/research/architecture-patterns.md
  Format: Summary, Key Details (bullet points), Recommendations, Risks"
)
```

### Classic 3c: Wait for All Researchers

```
// Wait for all 3 Task() subagents to return
WAIT for researcher_tech, researcher_market, researcher_arch

// Check if output files were written
Verify existence of:
  - .planning/phases/init/research/technical-landscape.md
  - .planning/phases/init/research/competitive-landscape.md
  - .planning/phases/init/research/architecture-patterns.md

IF any missing: warn user, note incomplete research
```

### Classic 3d: Spawn Synthesizer

```
// Spawn one more Task() subagent to merge research findings
synthesizer = Task(
  subagent_type="general-purpose",
  prompt="You are a GMSD research synthesizer for '{project_name}'.

  Read all 3 research outputs and create a unified RESEARCH.md:
  - .planning/phases/init/research/technical-landscape.md
  - .planning/phases/init/research/competitive-landscape.md
  - .planning/phases/init/research/architecture-patterns.md

  Also read: .planning/PROJECT.md for project context.

  Create .planning/RESEARCH.md with:
  1. Executive summary
  2. Consolidated findings by topic
  3. Technology recommendations table
  4. Resolved conflicts (with reasoning)
  5. Unresolved questions (for user)
  6. Gaps identified
  7. Risk register
  8. Recommendations for roadmap planning"
)

WAIT for synthesizer to return

// Verify RESEARCH.md was written
IF .planning/RESEARCH.md does not exist:
  Log: "WARNING: Synthesizer did not produce RESEARCH.md. Attempting manual synthesis."
  // Lead reads individual research files and produces a basic synthesis
```

### Classic 3e: Continue to Roadmap

After synthesis is complete, proceed to Step 7 (Create Roadmap with User) -- same as team mode.

---

## Step 7: Create Roadmap with User

**Actor:** Lead (direct conversation with user)
**No team needed.**

### 7a. Present Research Summary

```
Lead: "Research is complete. Here's a summary of what we found:"

Present:
  - Executive summary from RESEARCH.md
  - Top 3 technology recommendations
  - Key risks
  - Any unresolved questions that need user input

Lead: "Based on this research, I'd suggest breaking Milestone 1 into these phases:"
```

### 7b. Suggest Milestones and Phases

```
Based on:
  - PROJECT.md requirements (must > should > could)
  - RESEARCH.md recommendations
  - Architectural dependencies

Propose a phase breakdown:

Lead: "Here's my suggested roadmap:

  Phase 1: {name} -- {goal}
    Scope: {what's included}
    Depends on: nothing

  Phase 2: {name} -- {goal}
    Scope: {what's included}
    Depends on: Phase 1

  Phase 3: {name} -- {goal}
    Scope: {what's included}
    Depends on: Phase 1

  Phase 4: {name} -- {goal}
    Scope: {what's included}
    Depends on: Phase 2, Phase 3

  Phase 5: {name} -- {goal}
    Scope: {what's included}
    Depends on: Phase 4

Does this breakdown make sense? Want to adjust anything?"
```

### 7c. User Confirms/Adjusts

```
WHILE user has changes:
  User: {proposes changes}
  Lead: {adjusts proposed roadmap}
  Lead: "Updated. Here's the revised roadmap: {show changes}. Good?"

WHEN user confirms:
  PROCEED to write ROADMAP.md
```

### 7d. Write ROADMAP.md

```
Write .planning/ROADMAP.md using the roadmap template, filling in:
  - Milestone number, version, goal
  - All phases with names, descriptions, goals, scope, complexity, dependencies
  - Sequential dependencies
  - Parallel opportunities
  - Execution graph (ASCII diagram)

Create phase directories:
  For each phase N with name {name}:
    mkdir -p .planning/phases/{N}-{name}/
```

---

## Step 8: Finalize State

**Actor:** Lead

```
Update .planning/state.json:
{
  "project": "{project_name}",
  "version": "0.1.0",
  "current_milestone": 1,
  "current_phase": null,
  "phase_status": null,
  "mode": "{mode}",
  "active_team": null,
  "completed_phases": [],
  "last_command": "/gmsd:new-project",
  "last_updated": "{ISO timestamp}",
  "history": [
    ...previous entries,
    { "command": "/gmsd:new-project", "timestamp": "{ISO}", "result": "Project initialized with {N} phases" }
  ]
}

Update .planning/STATE.md from template with current values.
```

---

## Step 9: Present Summary and Route

**Actor:** Lead

```
Lead: "Project '{project_name}' is set up!

  .planning/ directory created
  Research: 3 topics investigated, synthesized into RESEARCH.md
  Roadmap: {N} phases defined for Milestone 1

  Phase overview:
  {list phases with names and goals}

---
## What's Next

Current: Project initialized | {N} phases defined | Mode: {mode}

**Recommended next step:**
--> /gmsd:discuss-phase 1 -- Lock decisions for Phase 1 before planning

**Other options:**
- /gmsd:plan-phase 1 -- Skip discussion, go straight to planning
- /gmsd:settings -- Adjust configuration (mode, team sizes, models)
- /gmsd:progress -- View full project status"
```

---

## Error Handling

```
IF user abandons mid-interview (Step 1):
  - Save whatever was collected to PROJECT.md with Status: Incomplete
  - State remains null -- next /gmsd:new-project will resume or restart

IF researcher crashes during research (Step 4):
  - Other researchers continue
  - Note which focus area has no output
  - During synthesis, synthesizer notes the gap
  - If critical area missing: spawn replacement researcher

IF synthesizer crashes (Step 5):
  - Read individual research files directly
  - Lead performs manual synthesis or spawns replacement
  - Less polished but functional RESEARCH.md

IF user rejects all proposed phases (Step 7):
  - Ask user to describe their preferred breakdown
  - Adapt roadmap to user's structure
  - Do NOT force a structure the user disagrees with
```
