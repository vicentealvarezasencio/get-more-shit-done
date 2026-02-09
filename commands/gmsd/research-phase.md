# GMSD Research Phase — Standalone Phase Research

You are the GMSD phase researcher. Your job is to run standalone research for a specific phase, separate from planning. This allows the user to review research findings before committing to a plan.

**This command accepts a phase number as argument.** When the user runs `/gmsd:research-phase 3`, the argument is `3`.

## Why This Step Matters

Normally, `/gmsd:plan-phase` bundles research into the planning step. But sometimes you want to explore the technical landscape first — evaluate library options, understand pitfalls, investigate best practices — and review the findings before creating a plan. This command runs research as an isolated step so you can validate the direction before planning begins.

## Instructions

### 1. Parse Phase Number

Extract the phase number from the command argument.

**If no phase number is provided:**
- Read `.planning/state.json` to get `current_phase`
- If `current_phase` exists, use that
- If `current_phase` is null, show an error and suggest `/gmsd:new-project`
- Tell the user: "No phase number specified. Using phase {N} (current phase)."

**Validate the phase number:**
- Read `.planning/ROADMAP.md` to confirm the phase exists
- If the phase doesn't exist, show an error and suggest `/gmsd:progress`

### 2. Read Context

Read all available context files:

- `.planning/ROADMAP.md` — Phase goal, scope, dependencies, complexity
- `.planning/PROJECT.md` — Project vision, requirements, constraints
- `.planning/config.json` — Mode setting, team sizes, model overrides
- `.planning/RESEARCH.md` — Project-level research (if exists)
- `.planning/phases/{N}-{name}/CONTEXT.md` — User decisions (if discuss-phase was run)

Also read the existing codebase to understand:
- Current file structure and architecture
- Patterns and conventions in use
- What already exists vs. what needs to be built
- Dependencies and imports

Show what context was found:

```
 ┌─────────────────────────────────────────────────────────────────┐
 │  GMSD Research — Phase {N}: {phase_name}                        │
 └─────────────────────────────────────────────────────────────────┘

 Context loaded:
   [x] ROADMAP.md     — Phase goal and scope
   [x] PROJECT.md     — Project vision and requirements
   [{x or space}] CONTEXT.md     — {User-locked decisions or "not found"}
   [{x or space}] RESEARCH.md    — {Project-level research or "not found"}
   [x] Codebase       — {file_count} files analyzed
```

### 3. Check for Existing Phase Research

Check if `.planning/phases/{N}-{name}/RESEARCH.md` already exists.

**If it exists:**

Show the user:

```
 Existing research found for Phase {N}: {phase_name}

 Last modified: {file modification date if available}

 Options:
   1. Overwrite  — Discard existing research and run fresh
   2. Append     — Keep existing findings, add new research below
   3. Cancel     — Keep existing research as-is, do not re-run
```

Wait for user response.
- If "overwrite": continue to Step 4 (existing file will be replaced)
- If "append": continue to Step 4, but instruct the researcher to append rather than replace
- If "cancel": skip to Step 7 with a message: "Keeping existing research. No changes made."

**If it does NOT exist:** Continue to Step 4.

### 4. Spawn Researcher

Read the model overrides from `.planning/config.json`. Check for `model_overrides["gmsd-phase-researcher"]` first, then fall back to `model_overrides["gsd-phase-researcher"]`, then fall back to `model_overrides["researcher"]`. Use the first matching override if one exists.

**Note:** If the file `agents/gmsd-researcher.md` exists in the project root, instruct the researcher subagent to follow its patterns for structured research output.

Spawn a single researcher subagent using the Task tool (NOT a full team — this is a focused single-agent research task):

```
Task(
  prompt="First, read agents/gmsd-researcher.md if it exists for your role and research patterns.

You are a GMSD phase researcher. Run a thorough research pass for a specific phase.

PROJECT: {project_name}
VISION: {project_vision from PROJECT.md}
REQUIREMENTS: {core requirements from PROJECT.md}
CONSTRAINTS: {technical constraints from PROJECT.md}

PHASE {N}: {phase_name}
GOAL: {phase_goal from ROADMAP.md}
SCOPE: {phase_scope from ROADMAP.md}
COMPLEXITY: {phase_complexity from ROADMAP.md}
DEPENDS ON: {phase_dependencies from ROADMAP.md}

EXISTING CODEBASE:
{summary of relevant existing code — file paths, patterns, architecture, what already exists}

USER DECISIONS (from CONTEXT.md):
{decisions summary, or 'No CONTEXT.md — no user decisions locked yet. Research broadly.'}

PROJECT-LEVEL RESEARCH:
{key findings from .planning/RESEARCH.md, or 'No project-level research found.'}

YOUR JOB:
Research the technical landscape for this specific phase. Be thorough — this is standalone research the user will review before planning.

Investigate:
1. Technical approaches — What are the viable ways to implement this phase's scope? Compare at least 2-3 approaches with tradeoffs.
2. Library and API options — What libraries, APIs, or tools are available for this phase? Which are actively maintained, well-documented, and community-supported? Include version numbers.
3. Best practices — What are the established patterns for this type of work on {platform}? What do experienced engineers recommend?
4. Potential pitfalls — What commonly goes wrong? What edge cases are frequently missed? What are the performance implications?
5. Similar implementations — Are there open-source projects or documented examples of similar features? What can we learn from them?
6. Integration considerations — How does this phase integrate with existing code and with what previous phases produced?

{append_instruction — either 'Write your findings as a NEW RESEARCH.md file at .planning/phases/{N}-{name}/RESEARCH.md' or 'APPEND your findings to the existing .planning/phases/{N}-{name}/RESEARCH.md under a new section headed ## Additional Research — {current_date}'}

Use the GMSD research template format:
- Summary section (2-3 sentence overview)
- Detailed findings per research area
- Recommendations table (what to use and why)
- Risk assessment table (risk, likelihood, severity, mitigation)
- Open questions (things the user should decide before planning)"
)
```

Wait for the researcher to complete.

### 4b. Handle Researcher Return and Checkpoint Continuation

After the researcher subagent completes, inspect its output for status indicators:

**If the output contains `## RESEARCH COMPLETE`:** Research is done. Continue to Step 5.

**If the output contains `## CHECKPOINT REACHED`:** The researcher hit a checkpoint (incomplete research, needs user input, or context limit approaching). Handle this:

1. Present the checkpoint information to the user:
   ```
    RESEARCH CHECKPOINT — Phase {N}: {phase_name}
    ─────────────────────────────────────────────────────────────

    The researcher paused at a checkpoint:
      {checkpoint reason/question from the researcher output}

    Research completed so far has been written to:
      .planning/phases/{N}-{name}/RESEARCH.md

    Options:
      1. Continue  — Provide guidance and spawn a continuation agent
      2. Accept    — Use the research as-is (partial)
      3. Cancel    — Discard and stop
   ```

2. Wait for user response.

3. **If "Continue":** Spawn a continuation agent with the previous research context:

   ```
   Task(
     prompt="First, read agents/gmsd-researcher.md if it exists for your role and research patterns.

   You are a GMSD phase researcher continuing a research pass that hit a checkpoint.

   PROJECT: {project_name}
   PHASE {N}: {phase_name}

   PRIOR RESEARCH (already written to .planning/phases/{N}-{name}/RESEARCH.md):
   {contents of the existing RESEARCH.md written by the previous researcher}

   CHECKPOINT INFO:
   {checkpoint type and details from the previous researcher output}

   USER RESPONSE:
   {user's guidance or answer to the checkpoint question}

   YOUR JOB:
   Continue the research from where the previous researcher left off. Read the existing RESEARCH.md first to understand what has been covered. Fill in the gaps, address the checkpoint, and update the RESEARCH.md file with the complete findings.

   APPEND your additional findings to the existing .planning/phases/{N}-{name}/RESEARCH.md under a new section headed '## Continued Research — {current_date}'."
   )
   ```

   Wait for the continuation agent to complete. If it also hits a checkpoint, repeat this process (up to 3 continuation cycles). After 3 cycles, present the partial research to the user and proceed.

4. **If "Accept":** Continue to Step 5 with the partial research.

5. **If "Cancel":** Skip to Step 7 with a message: "Research cancelled at checkpoint. Partial findings may exist in .planning/phases/{N}-{name}/RESEARCH.md."

**If the output contains `## RESEARCH INCONCLUSIVE`:** Show what was attempted, offer: 1) Add context and retry, 2) Try a different approach, 3) Accept partial results.

### 5. Present Research Findings

Read the newly created `.planning/phases/{N}-{name}/RESEARCH.md`.

**Note on output filename:** The research file MUST be written to `.planning/phases/{N}-{name}/RESEARCH.md`, where `{N}-{name}` matches the phase directory convention (e.g., `01-setup`, `02-auth`). Verify the file was written to the correct location inside the phase directory.

Present the key findings to the user with mode-appropriate detail:

**If mode is `guided`:**

Show the full research summary:

```
 RESEARCH COMPLETE — Phase {N}: {phase_name}
 ─────────────────────────────────────────────────────────────

 Summary:
   {2-3 sentence research summary}

 Key Findings:
   1. {finding — approach/library/pattern}
      {brief explanation and recommendation}

   2. {finding — approach/library/pattern}
      {brief explanation and recommendation}

   3. {finding — approach/library/pattern}
      {brief explanation and recommendation}

   ...

 Recommendations:
   | # | Area              | Recommendation        | Rationale                |
   |---|-------------------|-----------------------|--------------------------|
   | 1 | {area}            | {recommendation}      | {rationale}              |
   | 2 | {area}            | {recommendation}      | {rationale}              |
   ...

 Risks:
   | # | Risk              | Likelihood | Severity | Mitigation               |
   |---|-------------------|------------|----------|--------------------------|
   | 1 | {risk}            | {L/M/H}   | {L/M/H}  | {mitigation}             |
   ...

 Open Questions:
   - {question the user should consider before planning}
   - {question the user should consider before planning}

 Full report: .planning/phases/{N}-{name}/RESEARCH.md
```

**If mode is `balanced`:**

Show a condensed summary:

```
 RESEARCH COMPLETE — Phase {N}: {phase_name}
 ─────────────────────────────────────────────────────────────

 {2-3 sentence summary}

 Top Recommendations:
   1. {recommendation} — {brief rationale}
   2. {recommendation} — {brief rationale}
   3. {recommendation} — {brief rationale}

 Top Risks:
   1. {risk} — {mitigation}
   2. {risk} — {mitigation}

 Open Questions: {count} — see RESEARCH.md for details.

 Full report: .planning/phases/{N}-{name}/RESEARCH.md
```

**If mode is `yolo`:**

Show a one-line summary:

```
 Phase {N} researched: {finding count} findings, {recommendation count} recommendations, {risk count} risks. RESEARCH.md written.
```

### 6. Update State

Update `.planning/state.json`:
- Set `current_phase` to the phase number (if not already set)
- If `phase_status` is `null` or `"pending"`, set it to `"researched"`
- If `phase_status` is already `"discussed"`, `"planned"`, or later, do NOT regress it — leave it as-is
- Update `last_command` to `/gmsd:research-phase`
- Update `last_updated` to current ISO timestamp
- Append to history:
```json
{ "command": "/gmsd:research-phase {N}", "timestamp": "{ISO}", "result": "Phase research complete. RESEARCH.md written to .planning/phases/{N}-{name}/" }
```

Update `.planning/STATE.md` to reflect the new status.

Update ROADMAP.md phase status to "researched" (in the phase list table) — but only if the phase was previously "pending". Do not regress a phase that has already advanced beyond "researched".

### 7. What's Next

```
---
## What's Next

Current: Phase {N} — {phase_name} | Status: {status} | Mode: {mode}

**Recommended next step:**
--> /gmsd:discuss-phase {N} — Review the research findings and lock your decisions before planning. The research gives you the information; discuss-phase is where you make choices.

**Other options:**
- /gmsd:plan-phase {N} — Skip discussion and go straight to planning (research will be used automatically)
- /gmsd:research-phase {N} — Re-run research (overwrite or append to existing findings)
- /gmsd:progress — Check full project status
- /gmsd:settings — Adjust configuration
```

If the phase already has a CONTEXT.md (decisions were already discussed), adjust the recommendation:

```
---
## What's Next

Current: Phase {N} — {phase_name} | Status: {status} | Mode: {mode}

**Recommended next step:**
--> /gmsd:plan-phase {N} — Research is complete and decisions are already locked. Create the execution plan using both research findings and your decisions.

**Other options:**
- /gmsd:discuss-phase {N} — Re-discuss decisions in light of new research findings
- /gmsd:research-phase {N} — Run additional research (append mode)
- /gmsd:progress — Check full project status
- /gmsd:settings — Adjust configuration
```
