# Phase {{PHASE_NUMBER}} Summary: {{PHASE_NAME}}

<!--
  Complex execution summary for phases with more than 8 tasks.
  Auto-generated at the end of execute-phase.
  Template selected based on task count: >8 tasks = complex.
-->

---

## Goal and Context

{{PHASE_GOAL}}

<!--
  Full phase goal restated from ROADMAP.md.
  Include any relevant context from CONTEXT.md decisions.
-->

**Mode:** {{MODE}}
**Phase Scope:** {{PHASE_SCOPE}}

---

## Result: {{RESULT}}

<!--
  RESULT is one of: COMPLETE | PARTIAL | FAILED
  COMPLETE = all tasks finished successfully
  PARTIAL  = some tasks failed but phase is substantially done
  FAILED   = critical tasks failed, phase goal not met
-->

---

## Task Completion

| # | Task | Status | Acceptance Criteria |
|---|------|--------|---------------------|
| {{TASK_1_ID}} | {{TASK_1_NAME}} | {{TASK_1_STATUS}} | {{TASK_1_CRITERIA_STATUS}} |
| {{TASK_2_ID}} | {{TASK_2_NAME}} | {{TASK_2_STATUS}} | {{TASK_2_CRITERIA_STATUS}} |
| {{TASK_3_ID}} | {{TASK_3_NAME}} | {{TASK_3_STATUS}} | {{TASK_3_CRITERIA_STATUS}} |
| {{TASK_4_ID}} | {{TASK_4_NAME}} | {{TASK_4_STATUS}} | {{TASK_4_CRITERIA_STATUS}} |
| {{TASK_5_ID}} | {{TASK_5_NAME}} | {{TASK_5_STATUS}} | {{TASK_5_CRITERIA_STATUS}} |
| {{TASK_6_ID}} | {{TASK_6_NAME}} | {{TASK_6_STATUS}} | {{TASK_6_CRITERIA_STATUS}} |
| {{TASK_7_ID}} | {{TASK_7_NAME}} | {{TASK_7_STATUS}} | {{TASK_7_CRITERIA_STATUS}} |
| {{TASK_8_ID}} | {{TASK_8_NAME}} | {{TASK_8_STATUS}} | {{TASK_8_CRITERIA_STATUS}} |
| {{TASK_9_ID}} | {{TASK_9_NAME}} | {{TASK_9_STATUS}} | {{TASK_9_CRITERIA_STATUS}} |

<!--
  Status: completed | failed
  Acceptance Criteria: all met | N/M met | not met
  Add more rows as needed for phases with >9 tasks.
-->

**Completed:** {{TASKS_COMPLETED}}/{{TASKS_TOTAL}} | **Failed:** {{TASKS_FAILED}}

---

## Files Changed

<!--
  Files grouped by directory, with task attribution for traceability.
-->

### {{DIRECTORY_1}}

| File | Task | Action |
|------|------|--------|
| `{{FILE_1_PATH}}` | {{FILE_1_TASK}} | {{FILE_1_ACTION}} |
| `{{FILE_2_PATH}}` | {{FILE_2_TASK}} | {{FILE_2_ACTION}} |

### {{DIRECTORY_2}}

| File | Task | Action |
|------|------|--------|
| `{{FILE_3_PATH}}` | {{FILE_3_TASK}} | {{FILE_3_ACTION}} |
| `{{FILE_4_PATH}}` | {{FILE_4_TASK}} | {{FILE_4_ACTION}} |

<!--
  Action: created | modified
  Add more directory groups and files as needed.
-->

---

## Dependency Graph Execution Order

<!--
  Shows the order tasks were actually executed in,
  reflecting the dependency graph and parallel execution.
-->

```
{{EXECUTION_ORDER}}
```

<!--
  Example:
  Wave 1 (parallel): T-01, T-02, T-03
  Wave 2 (parallel): T-04, T-05 (after T-01)
  Wave 3 (sequential): T-06 (after T-04, T-05)
  Wave 4 (parallel): T-07, T-08, T-09 (after T-06)
-->

---

## Deviations

<!--
  Deviations from the original plan, with resolution details.
  If none: "No deviations from plan."
-->

| # | Task | Severity | Deviation | Resolution |
|---|------|----------|-----------|------------|
| 1 | {{DEVIATION_1_TASK}} | {{DEVIATION_1_SEVERITY}} | {{DEVIATION_1_DESCRIPTION}} | {{DEVIATION_1_RESOLUTION}} |
| 2 | {{DEVIATION_2_TASK}} | {{DEVIATION_2_SEVERITY}} | {{DEVIATION_2_DESCRIPTION}} | {{DEVIATION_2_RESOLUTION}} |

<!--
  Severity: minor | moderate | major
  Add more rows as needed, or replace table with:
  > No deviations from plan.
-->

---

## Team Metrics

| Metric              | Value                       |
|---------------------|-----------------------------|
| Peak Team Size      | {{PEAK_TEAM_SIZE}} executors |
| Scale-Up Events     | {{SCALE_UP_COUNT}}          |
| Scale-Down Events   | {{SCALE_DOWN_COUNT}}        |
| Executor Crashes    | {{CRASH_COUNT}}             |

---

## Verification Criteria Breakdown

<!--
  Per-criterion micro-verification status from execution.
  Full goal-backward verification happens via /gmsd:verify-work.
-->

| # | Criterion | Micro-Verification | Notes |
|---|-----------|-------------------|-------|
| 1 | {{CRITERION_1}} | {{CRITERION_1_STATUS}} | {{CRITERION_1_NOTES}} |
| 2 | {{CRITERION_2}} | {{CRITERION_2_STATUS}} | {{CRITERION_2_NOTES}} |
| 3 | {{CRITERION_3}} | {{CRITERION_3_STATUS}} | {{CRITERION_3_NOTES}} |

<!--
  Status: verified | flagged | unverified
  Add more rows as needed.
-->

**Micro-Verified:** {{VERIFIED_TASKS}}/{{TASKS_COMPLETED}} tasks | **Flagged:** {{FLAGGED_TASKS}} | **Unverified:** {{UNVERIFIED_TASKS}}

---

## Gaps and Fixes

<!--
  Issues identified during execution that were resolved inline
  or deferred to verification. Helps the verifier prioritize.
-->

| # | Description | Severity | Status |
|---|-------------|----------|--------|
| 1 | {{GAP_1_DESCRIPTION}} | {{GAP_1_SEVERITY}} | {{GAP_1_STATUS}} |
| 2 | {{GAP_2_DESCRIPTION}} | {{GAP_2_SEVERITY}} | {{GAP_2_STATUS}} |

<!--
  Status: fixed-inline | deferred-to-verification
  If no gaps: "No gaps identified during execution."
-->

---

## Lessons Learned

<!--
  Observations from execution that may help future phases.
  Patterns that worked well, things that caused friction, etc.
-->

- {{LESSON_1}}
- {{LESSON_2}}
- {{LESSON_3}}

---

## Execution Stats

| Field            | Value                    |
|------------------|--------------------------|
| Duration         | {{DURATION}}             |
| Commits          | {{COMMIT_COUNT}}         |
| Checkpoints      | {{CHECKPOINT_COUNT}}     |
| File Conflicts   | {{CONFLICT_COUNT}}       |
| Stall Events     | {{STALL_COUNT}}          |

---

## Next Steps

<!--
  Recommended actions and relevant commands.
-->

{{NEXT_STEPS}}
