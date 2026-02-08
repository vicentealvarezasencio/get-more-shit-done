# Phase {{PHASE_NUMBER}} Summary: {{PHASE_NAME}}

<!--
  Standard execution summary for phases with 4-8 tasks.
  Auto-generated at the end of execute-phase.
  Template selected based on task count: 4-8 tasks = standard.
-->

---

## Goal

{{PHASE_GOAL}}

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

| # | Task | Description | Status |
|---|------|-------------|--------|
| {{TASK_1_ID}} | {{TASK_1_NAME}} | {{TASK_1_DESCRIPTION}} | {{TASK_1_STATUS}} |
| {{TASK_2_ID}} | {{TASK_2_NAME}} | {{TASK_2_DESCRIPTION}} | {{TASK_2_STATUS}} |
| {{TASK_3_ID}} | {{TASK_3_NAME}} | {{TASK_3_DESCRIPTION}} | {{TASK_3_STATUS}} |
| {{TASK_4_ID}} | {{TASK_4_NAME}} | {{TASK_4_DESCRIPTION}} | {{TASK_4_STATUS}} |
| {{TASK_5_ID}} | {{TASK_5_NAME}} | {{TASK_5_DESCRIPTION}} | {{TASK_5_STATUS}} |
| {{TASK_6_ID}} | {{TASK_6_NAME}} | {{TASK_6_DESCRIPTION}} | {{TASK_6_STATUS}} |
| {{TASK_7_ID}} | {{TASK_7_NAME}} | {{TASK_7_DESCRIPTION}} | {{TASK_7_STATUS}} |
| {{TASK_8_ID}} | {{TASK_8_NAME}} | {{TASK_8_DESCRIPTION}} | {{TASK_8_STATUS}} |

<!--
  Status: completed | failed
  Description: one-line summary of what the task achieved.
  Remove unused rows if fewer than 8 tasks.
-->

**Completed:** {{TASKS_COMPLETED}}/{{TASKS_TOTAL}} | **Failed:** {{TASKS_FAILED}}

---

## Files Changed

<!--
  Files grouped by directory for easier scanning.
  Each entry shows the file path and which task modified it.
-->

### {{DIRECTORY_1}}

- `{{FILE_1_PATH}}` — {{FILE_1_TASK}}
- `{{FILE_2_PATH}}` — {{FILE_2_TASK}}

### {{DIRECTORY_2}}

- `{{FILE_3_PATH}}` — {{FILE_3_TASK}}
- `{{FILE_4_PATH}}` — {{FILE_4_TASK}}

<!--
  Add more directory groups as needed.
-->

---

## Deviations

<!--
  Any deviations from the original plan noted during execution.
  If none: "No deviations from plan."
-->

{{DEVIATIONS}}

> No deviations from plan.

---

## Verification Summary

<!--
  Brief summary of micro-verification results from execution.
  Full verification happens via /gmsd:verify-work.
-->

| Metric         | Value                     |
|----------------|---------------------------|
| Micro-Verified | {{VERIFIED_TASKS}}/{{TASKS_COMPLETED}} tasks |
| Test Warnings  | {{FLAGGED_TASKS}}         |

---

## Execution Stats

| Field            | Value                    |
|------------------|--------------------------|
| Duration         | {{DURATION}}             |
| Commits          | {{COMMIT_COUNT}}         |
| Team Peak Size   | {{PEAK_TEAM_SIZE}}       |
| Checkpoints      | {{CHECKPOINT_COUNT}}     |
| File Conflicts   | {{CONFLICT_COUNT}}       |

---

## Next Steps

<!--
  Recommended actions after this phase completes.
-->

{{NEXT_STEPS}}
