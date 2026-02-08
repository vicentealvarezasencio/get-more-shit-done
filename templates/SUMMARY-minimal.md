# Phase {{PHASE_NUMBER}} Summary: {{PHASE_NAME}}

<!--
  Minimal execution summary for phases with 3 or fewer tasks.
  Auto-generated at the end of execute-phase.
  Template selected based on task count: ≤3 tasks = minimal.
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

## Tasks

| # | Task | Status |
|---|------|--------|
| {{TASK_1_ID}} | {{TASK_1_NAME}} | {{TASK_1_STATUS}} |
| {{TASK_2_ID}} | {{TASK_2_NAME}} | {{TASK_2_STATUS}} |
| {{TASK_3_ID}} | {{TASK_3_NAME}} | {{TASK_3_STATUS}} |

<!--
  Status: completed | failed
  Remove unused rows if fewer than 3 tasks.
-->

---

## Files Changed

<!--
  Flat list of all files created or modified during execution.
-->

{{FILES_CHANGED}}

---

## Execution Stats

| Field          | Value                    |
|----------------|--------------------------|
| Duration       | {{DURATION}}             |
| Commits        | {{COMMIT_COUNT}}         |
| Team Size      | {{TEAM_SIZE}}            |
