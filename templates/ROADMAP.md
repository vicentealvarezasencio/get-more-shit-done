# Roadmap — {{PROJECT_NAME}}

<!--
  Phase breakdown for the current milestone.
  Generated during the planning phase. Updated as phases execute.
  Each phase maps to one PLAN.md + one execution cycle.
-->

---

## Milestone Overview

| Field     | Value                      |
|-----------|----------------------------|
| Milestone | {{MILESTONE_NUMBER}}       |
| Version   | {{MILESTONE_VERSION}}      |
| Goal      | {{MILESTONE_GOAL}}         |

---

## Phase List

<!--
  Status values: pending | researching | planning | discussing | executing | verifying | done | blocked
  Dependencies: "none" or comma-separated phase numbers (e.g., "1, 2")
-->

| #   | Phase Name         | Description                          | Status   | Depends On |
|-----|--------------------|--------------------------------------|----------|------------|
| 1   | {{PHASE_1_NAME}}   | {{PHASE_1_DESCRIPTION}}              | pending  | none       |
| 2   | {{PHASE_2_NAME}}   | {{PHASE_2_DESCRIPTION}}              | pending  | {{PHASE_2_DEPS}} |
| 3   | {{PHASE_3_NAME}}   | {{PHASE_3_DESCRIPTION}}              | pending  | {{PHASE_3_DEPS}} |
| 4   | {{PHASE_4_NAME}}   | {{PHASE_4_DESCRIPTION}}              | pending  | {{PHASE_4_DEPS}} |
| 5   | {{PHASE_5_NAME}}   | {{PHASE_5_DESCRIPTION}}              | pending  | {{PHASE_5_DEPS}} |

---

## Phase Details

<!--
  Detailed breakdown of each phase.
  Complexity: low (< 5 tasks) | medium (5-10 tasks) | high (10+ tasks)
-->

### Phase 1 — {{PHASE_1_NAME}}

| Field      | Value                        |
|------------|------------------------------|
| Goal       | {{PHASE_1_GOAL}}             |
| Scope      | {{PHASE_1_SCOPE}}            |
| Complexity | {{PHASE_1_COMPLEXITY}}       |
| Depends On | none                         |

### Phase 2 — {{PHASE_2_NAME}}

| Field      | Value                        |
|------------|------------------------------|
| Goal       | {{PHASE_2_GOAL}}             |
| Scope      | {{PHASE_2_SCOPE}}            |
| Complexity | {{PHASE_2_COMPLEXITY}}       |
| Depends On | {{PHASE_2_DEPS}}             |

### Phase 3 — {{PHASE_3_NAME}}

| Field      | Value                        |
|------------|------------------------------|
| Goal       | {{PHASE_3_GOAL}}             |
| Scope      | {{PHASE_3_SCOPE}}            |
| Complexity | {{PHASE_3_COMPLEXITY}}       |
| Depends On | {{PHASE_3_DEPS}}             |

### Phase 4 — {{PHASE_4_NAME}}

| Field      | Value                        |
|------------|------------------------------|
| Goal       | {{PHASE_4_GOAL}}             |
| Scope      | {{PHASE_4_SCOPE}}            |
| Complexity | {{PHASE_4_COMPLEXITY}}       |
| Depends On | {{PHASE_4_DEPS}}             |

### Phase 5 — {{PHASE_5_NAME}}

| Field      | Value                        |
|------------|------------------------------|
| Goal       | {{PHASE_5_GOAL}}             |
| Scope      | {{PHASE_5_SCOPE}}            |
| Complexity | {{PHASE_5_COMPLEXITY}}       |
| Depends On | {{PHASE_5_DEPS}}             |

---

## Execution Order

<!--
  Defines which phases can run in parallel and which must be sequential.
  This drives how GMSD schedules phase execution.
-->

### Sequential Dependencies

{{SEQUENTIAL_DEPS}}

<!--
  Example:
  - Phase 2 requires Phase 1 (data models must exist before API routes)
  - Phase 4 requires Phase 2 + Phase 3 (integration needs both backend and frontend)
-->

### Parallel Opportunities

{{PARALLEL_OPPORTUNITIES}}

<!--
  Example:
  - Phase 2 and Phase 3 can run in parallel (backend API and frontend components are independent)
-->

### Execution Graph

```
{{EXECUTION_GRAPH}}
```

<!--
  ASCII representation of the dependency graph.
  Example:
  Phase 1 ──> Phase 2 ──┐
              Phase 3 ──┤──> Phase 4 ──> Phase 5
                        │
-->

---

## Current Progress

<!--
  Auto-updated by state tracking. Do not edit manually.
  Shows real-time status of each phase.
-->

| Phase | Status  | Started At          | Completed At        | Duration |
|-------|---------|---------------------|---------------------|----------|
| 1     | pending | —                   | —                   | —        |
| 2     | pending | —                   | —                   | —        |
| 3     | pending | —                   | —                   | —        |
| 4     | pending | —                   | —                   | —        |
| 5     | pending | —                   | —                   | —        |
