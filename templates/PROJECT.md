# {{PROJECT_NAME}}

<!--
  Project definition document.
  Created during `gmsd init`. Finalized during the discuss phase.
  This is the single source of truth for what the project IS.
  Changes here after planning begins require re-planning affected phases.
-->

---

## Vision

{{VISION_STATEMENT}}

<!--
  1-2 sentences. What does the world look like when this project is done?
  Example: "A CLI tool that lets developers scaffold full-stack apps in under 60 seconds
  with production-ready defaults."
-->

---

## Problem Statement

{{PROBLEM_STATEMENT}}

<!--
  What specific problem does this project solve?
  Who feels this pain? How do they currently work around it?
  Be concrete — avoid "improve developer experience" without specifics.
-->

---

## Target Users

{{TARGET_USERS}}

<!--
  Who is this for? List 1-3 user types with a sentence each.
  Example:
  - **Solo developers** who want to ship side projects faster without boilerplate setup.
  - **Small teams (2-5)** who need shared project structure without heavy tooling.
-->

---

## Core Requirements

<!--
  Numbered list of requirements. Each MUST have a priority level.
  Priorities:
    - must  — Required for the project to be considered done. Ship blocker.
    - should — Important but the project works without it. Next iteration.
    - could  — Nice to have. Only if time permits.
-->

1. {{REQUIREMENT_1}} — **{{PRIORITY_1}}**
2. {{REQUIREMENT_2}} — **{{PRIORITY_2}}**
3. {{REQUIREMENT_3}} — **{{PRIORITY_3}}**
4. {{REQUIREMENT_4}} — **{{PRIORITY_4}}**
5. {{REQUIREMENT_5}} — **{{PRIORITY_5}}**

---

## Success Criteria

<!--
  Measurable outcomes that prove the project works.
  Each criterion should be testable — either it passes or it doesn't.
  Example: "User can create a new project and run it locally in under 2 minutes."
-->

1. {{SUCCESS_CRITERION_1}}
2. {{SUCCESS_CRITERION_2}}
3. {{SUCCESS_CRITERION_3}}

---

## Technical Constraints

<!--
  Hard constraints on technology choices. These are non-negotiable.
  Include: platform, language, framework, key dependencies, deployment target.
-->

| Constraint   | Value                    |
|--------------|--------------------------|
| Platform     | {{PLATFORM}}             |
| Language     | {{LANGUAGE}}             |
| Framework    | {{FRAMEWORK}}            |
| Runtime      | {{RUNTIME}}              |
| Database     | {{DATABASE}}             |
| Deployment   | {{DEPLOYMENT_TARGET}}    |
| Min Version  | {{MIN_VERSION}}          |

### Key Dependencies

{{KEY_DEPENDENCIES}}

<!--
  List critical third-party libraries/services the project depends on.
  Example:
  - `next@14` — React framework (App Router)
  - `supabase` — Auth + database
  - `stripe` — Payments
-->

---

## Milestones

<!--
  Versioned deliverables. Each milestone is a shippable increment.
  The ROADMAP.md breaks the current milestone into phases.
  Milestones are planned at the project level; phases are planned per milestone.
-->

### Milestone 1 — v{{MILESTONE_1_VERSION}}: {{MILESTONE_1_NAME}}

{{MILESTONE_1_SCOPE}}

<!--
  What's included in this milestone? What can the user do when it ships?
-->

### Milestone 2 — v{{MILESTONE_2_VERSION}}: {{MILESTONE_2_NAME}}

{{MILESTONE_2_SCOPE}}

### Milestone 3 — v{{MILESTONE_3_VERSION}}: {{MILESTONE_3_NAME}}

{{MILESTONE_3_SCOPE}}

---

## Out of Scope

<!--
  Explicit exclusions. Things someone might reasonably expect but that are NOT planned.
  Being explicit here prevents scope creep and misaligned expectations.
  Example:
  - Mobile native app (web only for v1)
  - Multi-tenancy (single-tenant for now)
  - Internationalization (English only)
-->

1. {{OUT_OF_SCOPE_1}}
2. {{OUT_OF_SCOPE_2}}
3. {{OUT_OF_SCOPE_3}}
