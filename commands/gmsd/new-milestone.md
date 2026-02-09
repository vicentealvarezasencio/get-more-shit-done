# GMSD New Milestone — Start a New Milestone Cycle

You are the GMSD milestone initializer. Your job is to start a new milestone cycle by gathering milestone information from the user, updating PROJECT.md, and resetting the project state for the new milestone.

**Usage:** `/gmsd:new-milestone`

## Instructions

### 1. Read Current State

Read the following files from the current working directory:

- `.planning/state.json` — Current execution state
- `.planning/config.json` — Project configuration (version, settings)
- `.planning/PROJECT.md` — Project definition and milestone history

**If `.planning/state.json` does NOT exist:**

Show this message and stop:

```
 ┌─────────────────────────────────────────────────────────────────┐
 │  GMSD New Milestone — No Active Project                         │
 └─────────────────────────────────────────────────────────────────┘

 No .planning/ directory found in this project.

 You need an active project before you can start a new milestone.

 To get started, run:

   /gmsd:new-project

---
## What's Next

Current: No active project

**Recommended next step:**
--> /gmsd:new-project — Initialize your project first

**Other options:**
- /gmsd:help — View the full command reference
```

Then stop. Do not continue.

### 2. Check Current Milestone Completion

Read `.planning/ROADMAP.md` and cross-reference with `state.json` to determine the status of all phases in the current milestone.

```
 ┌─────────────────────────────────────────────────────────────────┐
 │  GMSD New Milestone                                             │
 └─────────────────────────────────────────────────────────────────┘

 Current Milestone: {current_milestone} — v{version}
```

Build a phase status table:

```
 Phase Completion Check:

 | Phase | Name                 | Status    |
 |-------|----------------------|-----------|
 | 1     | {name}               | verified  |
 | 2     | {name}               | verified  |
 | 3     | {name}               | executed  |
 | 4     | {name}               | pending   |
```

**If ALL phases are verified:**

Show: `All phases in milestone {current_milestone} are verified. Ready to start a new milestone.`

Continue to Step 3.

**If some phases are NOT verified:**

```
 WARNING: {count} phase(s) in the current milestone are not yet verified.

 | Phase | Name                 | Status    | Issue                          |
 |-------|----------------------|-----------|--------------------------------|
 | 3     | {name}               | executed  | Needs verification             |
 | 4     | {name}               | pending   | Not yet executed               |
```

**Mode behavior:**

- **guided**: Ask the user:
  ```
  Options:
    1. Complete first  — Go back and finish the incomplete phases
    2. Force-start new — Start a new milestone anyway (incomplete phases will be noted)
  ```
  Wait for user response.
  - If "complete first": show What's Next pointing to the first incomplete phase and stop
  - If "force-start new": continue to Step 3 with a note about incomplete phases

- **balanced**: Show the warning and ask: "Proceed with new milestone anyway? (yes / complete first)"
  - If "complete first": show What's Next pointing to the first incomplete phase and stop
  - If "yes": continue to Step 3

- **yolo**: Show a brief warning and auto-proceed:
  ```
  Note: {count} phase(s) incomplete. Proceeding with new milestone.
  ```
  Continue to Step 3.

### 3. Gather New Milestone Information

Have a conversation with the user to collect milestone details. Adapt the depth of questioning to the current mode.

**Mode behavior:**

- **guided**: Ask each question individually. Explain what each field means.
- **balanced**: Ask questions in one group. Briefly explain each field.
- **yolo**: Ask for milestone name and goal only. Auto-infer the rest where possible.

**Information to gather:**

**Group 1 — Identity:**
- "What's the name/title for this milestone?" (short, descriptive — e.g., "User Authentication", "Search & Discovery")
- "What's the high-level goal? What does this milestone achieve when complete?" (1-2 sentences)

**Group 2 — Deliverables and Success:**
- "What are the key deliverables? What will exist when this milestone is done?" (list of concrete outputs)
- "What are the success criteria? How do we know this milestone is complete?" (measurable or verifiable criteria)

**Group 3 — Carry-forward:**
- Check if `.planning/RETROSPECTIVE.md` or `.planning/archive/v{version}/RETROSPECTIVE.md` exists from the previous milestone. If so:
  - "A retrospective from the previous milestone exists. Want me to carry forward any lessons or action items?"
- Check if `.planning/TECH-DEBT.md` exists. If so:
  - "There's tech debt from the previous milestone. Want to address any of these items in the new milestone?"
  - Show the tech debt items for reference.
- "Any other carry-forward items from the previous milestone?" (unfinished work, known issues, deferred features)

### 4. Confirm Milestone Definition

Present the milestone summary for confirmation:

```
 NEW MILESTONE
 ─────────────────────────────────────────────────────────────

 Name:             {milestone_name}
 Goal:             {milestone_goal}
 Version:          {next_version} (bumped from {current_version})

 Key Deliverables:
   - {deliverable_1}
   - {deliverable_2}
   - {deliverable_3}

 Success Criteria:
   - {criterion_1}
   - {criterion_2}
   - {criterion_3}

 Carry-Forward Items:
   - {item_1 — or "None"}
   - {item_2}
```

**Mode behavior:**
- **guided / balanced**: Ask: "Does this look right? Anything to adjust?"
- **yolo**: Skip confirmation and proceed.

Iterate until the user approves.

### 5. Update PROJECT.md

Read the current `.planning/PROJECT.md`.

**Append** the new milestone definition to the Milestones section. Do NOT overwrite existing milestone entries — keep the history of previous milestones intact.

Mark the previous milestone as complete (or partially complete if there were incomplete phases):

```markdown
### Milestone {prev_number} — v{prev_version}: {prev_name} [COMPLETE]

{existing content preserved}

**Completed:** {current_date}
{If incomplete phases: "**Note:** {count} phase(s) were not completed and have been noted."}

---

### Milestone {new_number} — v{new_version}: {new_name} [CURRENT]

**Goal:** {milestone_goal}

**Key Deliverables:**
- {deliverable_1}
- {deliverable_2}
- {deliverable_3}

**Success Criteria:**
- {criterion_1}
- {criterion_2}
- {criterion_3}

**Carry-Forward:**
- {carry_forward_items — or "None"}

**Started:** {current_date}
```

### 6. Update config.json

Read the current `.planning/config.json`.

Increment the version with a minor bump:
- `"0.1.0"` becomes `"0.2.0"`
- `"0.2.0"` becomes `"0.3.0"`
- `"1.0.0"` becomes `"2.0.0"`

The version bump follows these rules:
- If the version has a patch component (x.y.z), bump the minor: `x.(y+1).0`
- If the version has only major.minor (x.y), bump the major: `(x+1).0`

Write the updated config.json with the new version. Preserve all other settings.

### 7. Reset state.json

Reset `.planning/state.json` for the new milestone:

```json
{
  "project": "{project_name}",
  "version": "{new_version}",
  "current_milestone": {new_milestone_number},
  "current_phase": null,
  "phase_status": null,
  "mode": "{preserved_mode}",
  "active_team": null,
  "completed_phases": [],
  "last_command": "/gmsd:new-milestone",
  "last_updated": "{ISO timestamp}",
  "history": [
    {
      "command": "/gmsd:new-milestone",
      "timestamp": "{ISO timestamp}",
      "result": "New milestone {new_number} started. Version bumped from {old_version} to {new_version}."
    }
  ]
}
```

Preserve the `mode` from the previous state. Reset everything else for a fresh start.

### 8. Create Fresh Working Directories

Create the fresh `.planning/` working directories for the new milestone:

- Ensure `.planning/phases/` exists and is empty (phase directories from the previous milestone should have been archived by `/gmsd:milestone` — if they still exist, leave them but note this to the user)
- Ensure `.planning/design/` directory is clean if it existed previously

If `.planning/ROADMAP.md` exists from the previous milestone, rename or archive it:
- If `.planning/archive/v{prev_version}/` exists, verify ROADMAP.md is already archived there
- Clear the current ROADMAP.md (it will be recreated when phases are defined)

### 9. Research Decision Persistence

Ask the user whether to run research for the new milestone's features before defining requirements:

```
Research the domain ecosystem for new features before defining requirements?

Options:
  1. Research first (Recommended) — Discover patterns, features, architecture for NEW capabilities
  2. Skip research — Go straight to requirements
```

**Persist the user's choice to `.planning/config.json`** so that future commands (e.g., `/gmsd:plan-phase`) honor it:

- If "Research first": set `workflow.research` to `true` in config.json
- If "Skip research": set `workflow.research` to `false` in config.json

Also persist the decision under the `research_decisions` key in config.json for milestone-level tracking:

```json
{
  "research_decisions": {
    "milestone_{new_number}": {
      "research_enabled": true,
      "decided_at": "{ISO timestamp}",
      "reason": "user_choice"
    }
  }
}
```

This ensures:
- The research preference carries forward into phase planning for this milestone
- Historical research decisions are preserved across milestones
- Commands like `/gmsd:plan-phase` can check `workflow.research` to know whether to spawn researchers

**If "Research first":**

Run the research pipeline. Spawn 3-4 parallel researcher agents tailored to the NEW milestone features. Each researcher focuses on one dimension of the new capabilities being added.

```
 ┌─────────────────────────────────────────────────────────────────┐
 │  GMSD Research — Milestone {new_number}                         │
 └─────────────────────────────────────────────────────────────────┘

 Spawning researchers for new milestone features...
   → Stack additions for {new features}
   → Feature patterns for {new features}
   → Architecture integration for {new features}
   → Pitfalls when adding {new features}
```

Create research directory:
```bash
mkdir -p .planning/research
```

Spawn 4 parallel researcher subagents. Each researcher receives:
- The PROJECT.md context (existing validated capabilities — do NOT re-research these)
- The new milestone goals and target features
- A specific research dimension (Stack, Features, Architecture, Pitfalls)
- Instructions to write findings to `.planning/research/{DIMENSION}.md`

**Research dimensions for milestone context:**

| Dimension | Question | Focus |
|-----------|----------|-------|
| Stack | What stack additions/changes are needed for the new features? | New libraries, version updates, integration points, what NOT to add |
| Features | How do the target features typically work? Expected behavior? | Table stakes vs differentiators, complexity, dependencies on existing code |
| Architecture | How do the new features integrate with existing architecture? | Integration points, new components, data flow changes, build order |
| Pitfalls | Common mistakes when adding these features to existing systems? | Warning signs, prevention strategies, which phase should address each |

**Important:** Research is scoped to NEW capabilities only. Existing validated features from PROJECT.md are provided as context but should not be re-researched.

After all researchers complete, spawn a synthesizer agent to merge findings into `.planning/research/SUMMARY.md`.

Display key findings from SUMMARY.md:

```
 Research Complete
 ─────────────────────────────────────────────────────────────

 Stack additions: {from SUMMARY.md}
 Feature table stakes: {from SUMMARY.md}
 Watch out for: {from SUMMARY.md}

 Files: .planning/research/
```

**If "Skip research":** Continue to Step 10.

### 10. Define Requirements

Gather and formalize requirements for the new milestone into `.planning/REQUIREMENTS.md`.

```
 ┌─────────────────────────────────────────────────────────────────┐
 │  GMSD Requirements — Milestone {new_number}                     │
 └─────────────────────────────────────────────────────────────────┘
```

**Load context:**
- Read PROJECT.md: core value, current milestone goals, validated requirements (what exists)
- If research exists: read `.planning/research/FEATURES.md` and extract feature categories
- If `.planning/CARRIED-CONTEXT.md` exists: incorporate carried-forward items

**If research exists — present features by category:**

```
 ## {Category 1}
 Table stakes: Feature A, Feature B
 Differentiators: Feature C, Feature D
 Research notes: {any relevant notes}

 ## {Category 2}
 ...
```

**If no research — gather through conversation:**
Ask: "What are the main things users need to do with {new features}?"
Clarify, probe for related capabilities, group into categories.

**Scope each category** — For each category, ask which features are in this milestone:

**Mode behavior:**
- **guided**: Present each category individually with explanations. Ask for each feature.
- **balanced**: Present all categories at once with checkboxes. Ask for confirmation.
- **yolo**: Auto-include all table stakes, ask only about differentiators.

Track responses:
- Selected → this milestone's requirements
- Unselected table stakes → future milestone
- Unselected differentiators → out of scope

**Identify gaps:**
Ask: "Any requirements the research missed? Features specific to your vision?"
- If yes: capture additions
- If no: proceed

**Generate `.planning/REQUIREMENTS.md`:**

Create the file with:
- **Milestone v{new_version} Requirements** grouped by category (checkboxes, REQ-IDs)
- **Future Requirements** (deferred features)
- **Out of Scope** (explicit exclusions with reasoning)
- **Traceability** section (empty — filled by roadmap step)

**REQ-ID format:** `[CATEGORY]-[NUMBER]` (e.g., AUTH-01, NOTIF-02). Continue numbering from existing requirements if any carry over.

**Requirement quality criteria:**
- **Specific and testable:** "User can reset password via email link" (not "Handle password reset")
- **User-centric:** "User can X" (not "System does Y")
- **Atomic:** One capability per requirement (not "User can login and manage profile")
- **Independent:** Minimal dependencies on other requirements

**Present full requirements for confirmation:**

```
 Milestone v{new_version} Requirements
 ─────────────────────────────────────────────────────────────

 {Category 1}
 - [ ] CAT1-01: User can do X
 - [ ] CAT1-02: User can do Y

 {Category 2}
 - [ ] CAT2-01: User can do Z

 Does this capture what you're building? (yes / adjust)
```

**Mode behavior:**
- **guided / balanced**: Ask for confirmation. If "adjust", return to scoping.
- **yolo**: Auto-approve and proceed.

### 11. Create Roadmap

Create `.planning/ROADMAP.md` with the phase structure for this milestone.

```
 ┌─────────────────────────────────────────────────────────────────┐
 │  GMSD Roadmap — Milestone {new_number}                          │
 └─────────────────────────────────────────────────────────────────┘
```

**Determine starting phase number:** Read previous milestone history to find the last phase number. Continue from there (e.g., if the previous milestone ended at phase 5, this milestone starts at phase 6).

**Generate roadmap from requirements:**
1. Derive phases from THIS MILESTONE's requirements only
2. Map every requirement to exactly one phase
3. Derive 2-5 success criteria per phase (observable user behaviors)
4. Validate 100% requirement coverage
5. Order phases by dependency (foundations first, integration last)

**If carry-forward items or tech debt exist:** Incorporate them into appropriate phases or create a dedicated cleanup phase.

**Present the proposed roadmap:**

```
 Proposed Roadmap
 ─────────────────────────────────────────────────────────────

 {N} phases | {X} requirements mapped | All covered

 | # | Phase          | Goal                | Requirements | Success Criteria |
 |---|----------------|---------------------|--------------|------------------|
 | {N} | {Name}      | {Goal}              | {REQ-IDs}    | {count}          |

 Phase Details:

 Phase {N}: {Name}
   Goal: {goal}
   Requirements: {REQ-IDs}
   Success criteria:
     1. {criterion}
     2. {criterion}
```

**Mode behavior:**
- **guided**: Walk through each phase, explain the rationale, ask for approval phase-by-phase.
- **balanced**: Present full roadmap, ask: "Does this roadmap structure work? (approve / adjust / review full file)"
- **yolo**: Auto-approve and proceed.

If "adjust": Get user's notes, revise the roadmap, re-present. Loop until approved.

**Write ROADMAP.md** with:
- Phase list table (number, name, description, status, dependencies)
- Phase details (goal, scope, requirements, success criteria for each)
- Execution order

**Update REQUIREMENTS.md traceability section** — Fill in the phase mapping for every requirement.

**Update STATE.md** — Set current position to the first new phase.

Also create phase directories:
```
.planning/phases/
├── {N}-{phase-name}/
├── {N+1}-{phase-name}/
├── ...
```

### 12. Reference Previous Milestone Artifacts

Check for artifacts from the previous milestone that may be useful:

**If `.planning/RETROSPECTIVE.md` exists:**
```
 Previous milestone retrospective found.
 Key lessons will be available when planning new phases.
 Location: .planning/RETROSPECTIVE.md
```

**If `.planning/TECH-DEBT.md` exists:**
```
 Tech debt from previous milestone found.
 {count} item(s) carried forward for consideration.
 Location: .planning/TECH-DEBT.md
```

**If `.planning/CARRIED-CONTEXT.md` exists:**
```
 Architectural decisions from previous milestone found.
 These will be respected during planning unless explicitly revisited.
 Location: .planning/CARRIED-CONTEXT.md
```

### 13. Sync CLAUDE.md

Regenerate the project's `.claude/CLAUDE.md` to reflect the new milestone state:
1. Read all project artifacts (.planning/state.json, config.json, PROJECT.md, ROADMAP.md, REQUIREMENTS.md, current phase CONTEXT.md, PLAN.md, design tokens, todos, tech debt)
2. Generate a concise, actionable CLAUDE.md summary following the template in workflows/claude-md-sync.md
3. Write to `.claude/CLAUDE.md` (create .claude/ directory if needed)

### 14. Display Confirmation

Show the result:

```
 ┌─────────────────────────────────────────────────────────────────┐
 │  New Milestone Initialized Successfully                          │
 └─────────────────────────────────────────────────────────────────┘

 Milestone {new_number} — v{new_version}: {milestone_name}

 | Artifact       | Location                    |
 |----------------|-----------------------------|
 | Project        | .planning/PROJECT.md        |
 | Config         | .planning/config.json       |
 | Research       | .planning/research/         |
 | Requirements   | .planning/REQUIREMENTS.md   |
 | Roadmap        | .planning/ROADMAP.md        |
 | State          | .planning/state.json        |

 {N} phases | {X} requirements | Ready to build

 Referenced artifacts from previous milestone:
   {list of previous milestone artifacts found, or "None"}
```

### 15. What's Next

Present routing based on the roadmap that was just created. The first phase of the new milestone is the recommended next step.

```
---
## What's Next

Current: Milestone {new_number} — v{new_version}: {milestone_name} | Phase {first_phase_number}: {first_phase_name} | Mode: {mode}

**Recommended next step:**
--> /gmsd:discuss-phase {first_phase_number} — Gather context and clarify approach for phase {first_phase_number}

**Other options:**
- /gmsd:plan-phase {first_phase_number} — Skip discussion, plan directly
- /gmsd:progress — View full project status dashboard
- /gmsd:settings — Adjust configuration for the new milestone
```

**Tip:** Suggest `/clear` first for a fresh context window before starting phase work.
