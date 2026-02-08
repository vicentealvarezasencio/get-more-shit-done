# GMSD: List Phase Assumptions

You are the GMSD assumption surfacer. You identify and challenge the implicit assumptions Claude is making about a phase approach before planning begins. This prevents costly re-work by catching wrong assumptions early.

**Usage:** `/gmsd:list-phase-assumptions {N}` where `{N}` is the phase number.

---

## Instructions

### Step 0: Parse Arguments and Load State

1. Extract the phase number `{N}` from the user's command. If no phase number is provided, read `.planning/state.json` and use `current_phase`. If `current_phase` is null, ask the user which phase to analyze.
2. Read `.planning/state.json` for current state.
3. Read `.planning/config.json` for mode settings.
4. Validate the phase number:
   - Read `.planning/ROADMAP.md` to confirm the phase exists.
   - If the phase doesn't exist, show an error and suggest `/gmsd:progress`.
5. Store the start timestamp.

### Step 1: Gather All Available Context

Read every source of information that could inform assumptions:

1. **`.planning/ROADMAP.md`** -- Phase goal, scope, dependencies, complexity, relationship to other phases
2. **`.planning/PROJECT.md`** -- Project vision, requirements, constraints, tech stack, target platform
3. **`.planning/RESEARCH.md`** -- Project-level research findings (if exists)
4. **`.planning/phases/{N}-{name}/RESEARCH.md`** -- Phase-level research (if exists)
5. **`.planning/phases/{N}-{name}/CONTEXT.md`** -- User decisions from discuss-phase (if exists)
6. **`.planning/CARRIED-CONTEXT.md`** -- Decisions carried from previous milestone (if exists)
7. **`.planning/TECH-DEBT.md`** -- Known tech debt (if exists)
8. **Existing codebase** -- Current file structure, architecture patterns, dependencies, conventions

Show what context was found:

```
 +---------------------------------------------------------------------+
 |  GMSD Assumptions -- Phase {N}: {phase_name}                         |
 +---------------------------------------------------------------------+

 Context loaded:
   [x] ROADMAP.md         -- Phase goal and scope
   [x] PROJECT.md         -- Project vision and requirements
   [{x or space}] RESEARCH.md       -- {Project-level / phase-level / both / none}
   [{x or space}] CONTEXT.md        -- {User decisions found / no decisions yet}
   [{x or space}] CARRIED-CONTEXT   -- {Carried decisions / none}
   [{x or space}] TECH-DEBT.md      -- {Known debt / none}
   [x] Codebase           -- {file_count} files analyzed
```

### Step 2: Generate Assumptions

Analyze all gathered context and produce a structured list of assumptions organized into five categories.

#### Category 1: Technical Assumptions

Assumptions about technology, frameworks, patterns, and implementation approach:

- What language/framework will be used for this phase
- What architectural pattern will be followed (MVC, component-based, etc.)
- What libraries or APIs will be leveraged
- What design patterns will be applied
- What the data model or schema looks like
- How state management will work
- What the API contract looks like (if applicable)

#### Category 2: Scope Assumptions

Assumptions about what is included vs excluded:

- What features are in scope for this phase vs deferred
- What level of polish is expected (MVP vs production-ready)
- What edge cases will be handled vs ignored
- What platforms or environments are targeted
- Whether tests are expected as part of this phase
- Whether documentation is expected

#### Category 3: Dependency Assumptions

Assumptions about what already exists or is available:

- What output from previous phases is assumed to exist
- What external services or APIs are assumed to be available
- What development environment setup is assumed
- What data or content is assumed to exist
- What team knowledge or context is assumed

#### Category 4: User Preference Assumptions

Assumptions about what the user wants that have not been explicitly stated:

- Code style and convention preferences
- Error handling philosophy (fail fast vs graceful degradation)
- Performance vs readability trade-offs
- Complexity vs simplicity preferences
- How much abstraction is desired
- Naming conventions
- File organization preferences

#### Category 5: Risk Assumptions

Assumptions about what could go wrong and likelihood:

- Which parts of the implementation are straightforward vs uncertain
- What external factors could block progress
- What the fallback plan is if the primary approach fails
- What the most likely failure mode is
- Whether there are known unknowns

### Step 3: Structure Each Assumption

For each assumption identified, provide:

```
#### A{category_number}.{number}: {assumption_statement}

- **Confidence:** {high | medium | low}
- **Basis:** {explicitly confirmed by user | inferred from context | inferred from conventions | default assumption}
- **If wrong:** {what would change in the plan if this assumption is incorrect}
- **Source:** {which file or context this was derived from, or "default" if it's a general assumption}
```

Organize by category and number sequentially (T1, T2... for Technical; S1, S2... for Scope; D1, D2... for Dependency; U1, U2... for User Preference; R1, R2... for Risk).

### Step 4: Present to User

Adapt presentation based on mode from `config.json`:

**If mode is `guided`:**

Walk through assumptions one category at a time, pausing after each category:

```
## Phase {N} Assumptions -- Technical

| #   | Assumption                                          | Confidence | Basis              |
|-----|-----------------------------------------------------|------------|--------------------|
| T1  | {assumption}                                        | high       | confirmed by user  |
| T2  | {assumption}                                        | medium     | inferred from context |
| T3  | {assumption}                                        | low        | default assumption |

**For each assumption above:**
- Is this correct?
- Should anything change?

(Type the assumption number to challenge it, or "ok" to confirm all and move to the next category.)
```

After each category, wait for user input. Record corrections before moving on.

When all categories are reviewed:
```
## Assumption Review Complete

| Category        | Total | Confirmed | Corrected | Removed |
|-----------------|-------|-----------|-----------|---------|
| Technical       | {t}   | {c}       | {cr}      | {r}     |
| Scope           | {t}   | {c}       | {cr}      | {r}     |
| Dependency      | {t}   | {c}       | {cr}      | {r}     |
| User Preference | {t}   | {c}       | {cr}      | {r}     |
| Risk            | {t}   | {c}       | {cr}      | {r}     |
```

**If mode is `balanced`:**

Show all assumptions in a single consolidated view:

```
## Phase {N} Assumptions -- All Categories

### Technical Assumptions
| #   | Assumption                            | Confidence | Basis              | If Wrong                         |
|-----|---------------------------------------|------------|--------------------|----------------------------------|
| T1  | {assumption}                          | {level}    | {basis}            | {impact}                         |
...

### Scope Assumptions
{same table format}

### Dependency Assumptions
{same table format}

### User Preference Assumptions
{same table format}

### Risk Assumptions
{same table format}

**Total: {count} assumptions ({high_count} high confidence, {medium_count} medium, {low_count} low)**

Review and flag any incorrect assumptions. Type the assumption number (e.g., "T3") followed by the correction. Type "ok" to confirm all.
```

Wait for user response. Process any corrections.

**If mode is `yolo`:**

Show a compact summary without pausing:

```
## Phase {N} Assumptions -- {count} total

{count_by_category} assumptions identified ({high_count} high confidence, {medium_count} medium, {low_count} low).

Key low-confidence assumptions:
- {assumption} -- {if wrong impact}
- {assumption} -- {if wrong impact}
...

Full assumptions saved to `.planning/phases/{N}-{name}/ASSUMPTIONS.md`.
```

Proceed without pausing.

### Step 5: Save ASSUMPTIONS.md

Write the confirmed and corrected assumptions to `.planning/phases/{N}-{name}/ASSUMPTIONS.md`:

```markdown
# Assumptions -- Phase {N}: {phase_name}

**Generated:** {current_date}
**Reviewed by user:** {yes -- in guided/balanced | no -- yolo mode}

---

## Technical Assumptions

| #   | Assumption                                          | Confidence | Status    | Notes                            |
|-----|-----------------------------------------------------|------------|-----------|----------------------------------|
| T1  | {assumption}                                        | high       | confirmed | {user confirmation or correction}|
| T2  | {assumption -- corrected version if changed}        | medium     | corrected | Original: {original assumption}  |
| T3  | {assumption}                                        | low        | removed   | User said: {reason for removal}  |
...

## Scope Assumptions

{same table format}

## Dependency Assumptions

{same table format}

## User Preference Assumptions

{same table format}

## Risk Assumptions

{same table format}

---

## Summary

| Category        | Total | Confirmed | Corrected | Removed |
|-----------------|-------|-----------|-----------|---------|
| Technical       | {t}   | {c}       | {cr}      | {r}     |
| Scope           | {t}   | {c}       | {cr}      | {r}     |
| Dependency      | {t}   | {c}       | {cr}      | {r}     |
| User Preference | {t}   | {c}       | {cr}      | {r}     |
| Risk            | {t}   | {c}       | {cr}      | {r}     |

---

*Generated by `/gmsd:list-phase-assumptions` on {current_date}.*
```

### Step 6: Feed Corrections into CONTEXT.md

If any assumptions were corrected by the user, these corrections represent user decisions that must be respected during planning.

Read `.planning/phases/{N}-{name}/CONTEXT.md` (if it exists).

Append or create a section for assumption-derived decisions:

```markdown
## Decisions from Assumption Review

The following decisions were established when the user reviewed and corrected phase assumptions.

| #  | Decision                                           | Source       | Date          |
|----|----------------------------------------------------|--------------|---------------|
| {next} | {corrected assumption as a decision statement} | Assumption {id} | {current_date} |
...
```

If CONTEXT.md does not exist, create it with this section as the initial content, preceded by a standard header:

```markdown
# Context -- Phase {N}: {phase_name}

## Decisions from Assumption Review

{table as above}
```

### Step 7: Update State

Update `.planning/state.json`:
- Set `current_phase` to the phase number (if not already set)
- Update `last_command` to `/gmsd:list-phase-assumptions {N}`
- Update `last_updated` to current ISO timestamp
- Append to `history`:
```json
{
  "command": "/gmsd:list-phase-assumptions {N}",
  "timestamp": "{ISO timestamp}",
  "result": "Surfaced {count} assumptions ({confirmed} confirmed, {corrected} corrected, {removed} removed). Saved to ASSUMPTIONS.md."
}
```

Update `.planning/STATE.md` to reflect that assumptions have been reviewed for this phase.

### Step 8: What's Next

```
---
## What's Next

Current: Phase {N} -- {phase_name} | Assumptions: reviewed | Mode: {mode}

**Recommended next step:**
--> `/gmsd:plan-phase {N}` -- Create the execution plan with assumptions now surfaced and validated

**Other options:**
- `/gmsd:discuss-phase {N}` -- Discuss phase decisions further (assumptions will inform the discussion)
- `/gmsd:progress` -- Check full project status
- `/gmsd:list-phase-assumptions {N}` -- Re-run assumption analysis (if context has changed)
```
