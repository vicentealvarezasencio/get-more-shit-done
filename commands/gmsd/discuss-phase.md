# GMSD Discuss Phase — Gather User Decisions Before Planning

You are the GMSD discussion facilitator. Your job is to have a thorough, conversational discussion with the user to lock in decisions for a specific phase BEFORE planning begins.

**This command accepts a phase number as argument.** When the user runs `/gmsd:discuss-phase 3`, the argument is `3`.

## Why This Step Matters

Plans built without user input make assumptions. Those assumptions lead to rework. The discuss phase eliminates this by capturing the user's architecture preferences, technology choices, UX opinions, and scope decisions BEFORE the planner agent runs. The output — CONTEXT.md — becomes the planner's source of truth.

## Instructions

### 1. Parse Phase Number

Extract the phase number from the command argument.

**If no phase number is provided:**
- Read `.planning/state.json` to get `current_phase`
- If `current_phase` exists, use that
- If `current_phase` is null, default to phase 1
- Tell the user: "No phase number specified. Using phase {N} (current phase)."

**Validate the phase number:**
- Read `.planning/ROADMAP.md` to confirm the phase exists
- If the phase doesn't exist, show an error and suggest `/gmsd:progress`

### 2. Read Context

Read the following files to build context for the discussion:

- `.planning/ROADMAP.md` — Get the phase goal, scope, description, and dependencies
- `.planning/RESEARCH.md` — Get research findings (if exists at project level)
- `.planning/phases/{N}-{name}/RESEARCH.md` — Get phase-specific research (if exists)
- `.planning/PROJECT.md` — Get project vision, requirements, constraints
- `.planning/config.json` — Get mode setting

Also read relevant existing code in the repository to understand the current state. Look for:
- Source files related to this phase's scope
- Existing patterns and conventions
- What already exists vs. what needs to be built

### 3. Present Phase Overview

Show the phase context:

```
 ┌─────────────────────────────────────────────────────────────────┐
 │  GMSD Discuss — Phase {N}: {phase_name}                        │
 └─────────────────────────────────────────────────────────────────┘

 Goal:        {phase_goal from ROADMAP.md}
 Scope:       {phase_scope from ROADMAP.md}
 Complexity:  {phase_complexity}
 Depends On:  {dependencies — or "none"}

 Research Highlights:
   - {key finding 1 relevant to this phase}
   - {key finding 2 relevant to this phase}
   - {key finding 3 relevant to this phase}
```

If there are completed dependency phases, mention what they produced:
```
 From Phase {dep}: {what was built/established}
```

### 4. Conduct Adaptive Discussion

Ask questions in logical groups of 2-4. Do NOT dump all questions at once. Wait for the user's response to each group before asking the next.

**Adapt your questions to the phase scope.** Not every phase needs every category. A data-model phase doesn't need UX questions. A UI phase doesn't need database architecture questions.

#### Question Categories

**Architecture Decisions** (ask when the phase involves structural choices):
- "How do you want to structure {component}? Option A is {description}. Option B is {description}. Research suggests {recommendation} because {reason}."
- "Should {component} be {approach A} or {approach B}? Here's the tradeoff: {tradeoff}."
- "Where should {functionality} live? In {location A} or {location B}?"

**Technology Choices** (ask when the phase involves library/tool selection):
- "For {capability}, research found these options: {option A} ({pros}), {option B} ({pros}). Which direction do you want to go?"
- "The research recommends {library} for {task}. Does that work for you, or do you have a preference?"
- "Should we use {existing pattern in codebase} or switch to {alternative}?"

**UX Decisions** (ask when the phase involves user-facing behavior):
- "When the user {action}, what should happen? Options: {behavior A} or {behavior B}."
- "How should {feature} handle errors? Silently retry, show a message, or both?"
- "What's the priority: {quality A} or {quality B}? (e.g., speed vs. completeness)"

**Scope Decisions** (ask when the phase could grow):
- "This phase could include {optional feature}. Include it now or defer to a later phase?"
- "The research suggests {enhancement}. Is that in scope for this phase or should we keep it simple?"
- "If we run out of budget on this phase, what's the one thing that MUST work?"

**Priority Decisions** (ask when there are tradeoffs):
- "If we can't do everything, rank these: {item A}, {item B}, {item C}."
- "What matters more for this phase: {priority A} or {priority B}?"

#### Discussion Flow

1. Start with the most impactful decisions (architecture and technology)
2. Move to behavior and UX decisions
3. End with scope and priority decisions
4. Summarize all decisions and ask for confirmation

**Mode behavior:**
- **guided**: Ask every relevant question. Explain tradeoffs in detail. Confirm each group.
- **balanced**: Ask the most important questions. Briefly explain tradeoffs. Confirm at the end.
- **yolo**: Ask only decisions that can't be made without user input. Skip anything with a clear default.

### 5. Summarize Decisions

After all questions are answered, present a decision summary:

```
 DECISION SUMMARY — Phase {N}: {phase_name}
 ─────────────────────────────────────────────────────────────

 Architecture:
   1. {decision} — {brief rationale}
   2. {decision} — {brief rationale}

 Technology:
   3. {decision} — {brief rationale}
   4. {decision} — {brief rationale}

 UX / Behavior:
   5. {decision} — {brief rationale}

 Scope:
   6. {decision} — {brief rationale}

 Priority:
   7. If constrained, focus on: {priority list}
```

Ask: **"Does this capture your decisions correctly? Anything to add or change?"**

Iterate until the user approves.

### 6. Write CONTEXT.md

Create `.planning/phases/{N}-{name}/CONTEXT.md` with the locked decisions.

Format:

```markdown
# Context — Phase {N}: {phase_name}

<!--
  User-locked decisions for this phase.
  Generated by /gmsd:discuss-phase on {date}.
  The planner MUST respect these decisions.
  Changes require re-running /gmsd:discuss-phase.
-->

---

## Phase Goal

{phase_goal}

---

## Decisions

### Architecture

| # | Decision | Rationale | Alternatives Considered |
|---|----------|-----------|------------------------|
| 1 | {decision} | {rationale} | {alternatives} |
| 2 | {decision} | {rationale} | {alternatives} |

### Technology

| # | Decision | Rationale | Alternatives Considered |
|---|----------|-----------|------------------------|
| 3 | {decision} | {rationale} | {alternatives} |

### UX / Behavior

| # | Decision | Rationale | Alternatives Considered |
|---|----------|-----------|------------------------|
| 4 | {decision} | {rationale} | {alternatives} |

### Scope

| # | Decision | Rationale |
|---|----------|-----------|
| 5 | {decision} | {rationale} |

### Priority Order

If constrained, focus areas in this order:
1. {highest priority}
2. {second priority}
3. {third priority}

---

## Existing Code Context

{Summary of relevant existing code found during discussion}
{Patterns to follow, conventions to maintain}

---

## Constraints from Dependencies

{What previous phases produced that this phase must work with}
{API contracts, data models, established patterns}

---

## Notes

{Any additional context from the discussion}
{Edge cases mentioned, future considerations flagged}
```

### 7. Update State

Update `.planning/state.json`:
- Set `current_phase` to the phase number (if not already set)
- Set `phase_status` to `"discussed"`
- Update `last_command` to `/gmsd:discuss-phase`
- Update `last_updated` to current ISO timestamp
- Append to history:
```json
{ "command": "/gmsd:discuss-phase {N}", "timestamp": "{ISO}", "result": "Locked {count} decisions for phase {N}" }
```

Update `.planning/STATE.md` to reflect the new status.

Update ROADMAP.md phase status to "discussed" (in the phase list table).

### 8. Sync CLAUDE.md

Regenerate the project's `.claude/CLAUDE.md` to reflect current state:
1. Read all project artifacts (.planning/state.json, config.json, PROJECT.md, ROADMAP.md, current phase CONTEXT.md, PLAN.md, design tokens, todos, tech debt)
2. Generate a concise, actionable CLAUDE.md summary following the template in workflows/claude-md-sync.md
3. Write to `.claude/CLAUDE.md` (create .claude/ directory if needed)

### 9. What's Next

```
---
## What's Next

Current: Phase {N} — {phase_name} | Status: discussed | Mode: {mode}

**Recommended next step:**
--> /gmsd:plan-phase {N} — Your decisions are locked. Create the execution plan based on your choices. The planner will respect every decision in CONTEXT.md.

**Other options:**
- /gmsd:discuss-phase {N} — Re-run discussion to change decisions (overwrites CONTEXT.md)
- /gmsd:progress — Check full project status
- /gmsd:settings — Adjust configuration
```
