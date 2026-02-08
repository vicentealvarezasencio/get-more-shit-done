# Context & Decisions — Phase {{PHASE_NUMBER}}: {{PHASE_NAME}}

<!--
  User decisions captured during the discuss phase.
  These decisions are LOCKED once execution begins.
  Changing a locked decision requires re-planning (gmsd replan).

  The discuss phase presents the user with key questions from the planner
  and records their answers here as immutable context for executors.
-->

---

## Phase Reference

| Field     | Value                      |
|-----------|----------------------------|
| Phase     | {{PHASE_NUMBER}} — {{PHASE_NAME}} |
| Milestone | {{MILESTONE_NUMBER}}       |
| Plan      | [PLAN.md](./PLAN.md)       |
| Research  | [RESEARCH.md](./RESEARCH.md) |

---

## Decisions

<!--
  Numbered decisions. Each records:
  - The question posed to the user
  - The user's answer (verbatim or summarized with their approval)
  - Implications for implementation
  - When it was locked

  Decisions are referenced by number in PLAN.md tasks.
  Example: "Per Decision #3, use JWT tokens instead of session cookies."
-->

### Decision 1

| Field        | Value                              |
|--------------|------------------------------------|
| Question     | {{DECISION_1_QUESTION}}            |
| Answer       | {{DECISION_1_ANSWER}}              |
| Locked       | {{DECISION_1_LOCKED_DATE}}         |

**Implications:**

{{DECISION_1_IMPLICATIONS}}

---

### Decision 2

| Field        | Value                              |
|--------------|------------------------------------|
| Question     | {{DECISION_2_QUESTION}}            |
| Answer       | {{DECISION_2_ANSWER}}              |
| Locked       | {{DECISION_2_LOCKED_DATE}}         |

**Implications:**

{{DECISION_2_IMPLICATIONS}}

---

### Decision 3

| Field        | Value                              |
|--------------|------------------------------------|
| Question     | {{DECISION_3_QUESTION}}            |
| Answer       | {{DECISION_3_ANSWER}}              |
| Locked       | {{DECISION_3_LOCKED_DATE}}         |

**Implications:**

{{DECISION_3_IMPLICATIONS}}

---

<!--
  Add more decisions as needed. Copy the decision template block above.
-->

## Open Questions

<!--
  Questions that surfaced during planning or discuss but haven't been answered yet.
  These do NOT block execution unless marked as blocking.
  The team lead will raise blocking questions before proceeding.
-->

| #  | Question                           | Raised By   | Blocking | Notes                |
|----|------------------------------------|-------------|----------|----------------------|
| 1  | {{OPEN_Q_1}}                       | {{OPEN_Q_1_RAISED_BY}} | {{OPEN_Q_1_BLOCKING}} | {{OPEN_Q_1_NOTES}} |
| 2  | {{OPEN_Q_2}}                       | {{OPEN_Q_2_RAISED_BY}} | {{OPEN_Q_2_BLOCKING}} | {{OPEN_Q_2_NOTES}} |
| 3  | {{OPEN_Q_3}}                       | {{OPEN_Q_3_RAISED_BY}} | {{OPEN_Q_3_BLOCKING}} | {{OPEN_Q_3_NOTES}} |

---

## Assumptions

<!--
  Things assumed to be true for this phase.
  If an assumption is wrong, the affected tasks may need re-planning.
  The user can challenge any assumption during the discuss phase.
-->

| #  | Assumption                         | Confidence  | Impact if Wrong              |
|----|------------------------------------|-------------|------------------------------|
| 1  | {{ASSUMPTION_1}}                   | {{ASSUMPTION_1_CONFIDENCE}} | {{ASSUMPTION_1_IMPACT}} |
| 2  | {{ASSUMPTION_2}}                   | {{ASSUMPTION_2_CONFIDENCE}} | {{ASSUMPTION_2_IMPACT}} |
| 3  | {{ASSUMPTION_3}}                   | {{ASSUMPTION_3_CONFIDENCE}} | {{ASSUMPTION_3_IMPACT}} |

<!--
  Confidence: high | medium | low
  If confidence is "low", consider raising it as an Open Question instead.
-->
