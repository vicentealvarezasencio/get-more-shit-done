# UI Specification — {{PROJECT_NAME}}

<!--
  Master UI specification hub. Links to all screen specs, component inventory,
  and design tokens. This is the top-level entry point for all UI documentation.

  Updated as new screens are designed. Referenced by executors during implementation.
-->

---

## Design System Overview

| Field                | Value                          |
|----------------------|--------------------------------|
| Component Library    | {{COMPONENT_LIBRARY}}          |
| Styling Approach     | {{STYLING_APPROACH}}           |
| Design Tokens        | [design-tokens.json](./design-tokens.json) |
| Components Inventory | [COMPONENTS.md](./COMPONENTS.md) |
| UI Context           | [UI-CONTEXT.md](./UI-CONTEXT.md) |

### Design Principles

1. **{{PRINCIPLE_1_NAME}}** — {{PRINCIPLE_1_DESC}}
2. **{{PRINCIPLE_2_NAME}}** — {{PRINCIPLE_2_DESC}}
3. **{{PRINCIPLE_3_NAME}}** — {{PRINCIPLE_3_DESC}}

<!--
  Examples:
  1. Clarity over cleverness — Every element has one obvious purpose
  2. Progressive disclosure — Show only what's needed, reveal on demand
  3. Speed is a feature — Perceived performance matters as much as actual performance
-->

---

## Screen Inventory

<!--
  Master list of all screens in the application.
  Each screen has its own spec file in the design/ directory.

  Status: draft | designed | implementing | done
  Priority: p0 (MVP blocker) | p1 (should have) | p2 (nice to have)
-->

| ID         | Screen Name          | Route                  | Spec File                 | Status | Priority |
|------------|----------------------|------------------------|---------------------------|--------|----------|
| {{SCREEN_1_ID}} | {{SCREEN_1_NAME}} | {{SCREEN_1_ROUTE}} | [{{SCREEN_1_FILE}}](./{{SCREEN_1_FILE}}) | draft  | {{SCREEN_1_PRIORITY}} |
| {{SCREEN_2_ID}} | {{SCREEN_2_NAME}} | {{SCREEN_2_ROUTE}} | [{{SCREEN_2_FILE}}](./{{SCREEN_2_FILE}}) | draft  | {{SCREEN_2_PRIORITY}} |
| {{SCREEN_3_ID}} | {{SCREEN_3_NAME}} | {{SCREEN_3_ROUTE}} | [{{SCREEN_3_FILE}}](./{{SCREEN_3_FILE}}) | draft  | {{SCREEN_3_PRIORITY}} |
| {{SCREEN_4_ID}} | {{SCREEN_4_NAME}} | {{SCREEN_4_ROUTE}} | [{{SCREEN_4_FILE}}](./{{SCREEN_4_FILE}}) | draft  | {{SCREEN_4_PRIORITY}} |
| {{SCREEN_5_ID}} | {{SCREEN_5_NAME}} | {{SCREEN_5_ROUTE}} | [{{SCREEN_5_FILE}}](./{{SCREEN_5_FILE}}) | draft  | {{SCREEN_5_PRIORITY}} |

<!--
  Add more screens as needed.
-->

---

## Component Inventory

See [COMPONENTS.md](./COMPONENTS.md) for the full component inventory.

### Component Summary

| Category       | Count | Key Components                      |
|----------------|-------|-------------------------------------|
| Layout         | {{LAYOUT_COUNT}}   | {{LAYOUT_COMPONENTS}}      |
| Navigation     | {{NAV_COUNT}}      | {{NAV_COMPONENTS}}         |
| Forms          | {{FORM_COUNT}}     | {{FORM_COMPONENTS}}        |
| Data Display   | {{DATA_COUNT}}     | {{DATA_COMPONENTS}}        |
| Feedback       | {{FEEDBACK_COUNT}} | {{FEEDBACK_COMPONENTS}}    |
| Overlay        | {{OVERLAY_COUNT}}  | {{OVERLAY_COMPONENTS}}     |

---

## Design Token Reference

See [design-tokens.json](./design-tokens.json) for the complete token definitions.

### Quick Reference

#### Color Palette

| Token                 | Light Mode      | Dark Mode       |
|-----------------------|-----------------|-----------------|
| `color.primary`       | {{PRIMARY_LIGHT}} | {{PRIMARY_DARK}} |
| `color.secondary`     | {{SECONDARY_LIGHT}} | {{SECONDARY_DARK}} |
| `color.background`    | {{BG_LIGHT}}    | {{BG_DARK}}     |
| `color.surface`       | {{SURFACE_LIGHT}} | {{SURFACE_DARK}} |
| `color.text.primary`  | {{TEXT_LIGHT}}  | {{TEXT_DARK}}   |

#### Typography Scale

| Token       | Size   | Weight | Line Height |
|-------------|--------|--------|-------------|
| `type.h1`   | {{H1_SIZE}}  | {{H1_WEIGHT}}  | {{H1_LH}} |
| `type.h2`   | {{H2_SIZE}}  | {{H2_WEIGHT}}  | {{H2_LH}} |
| `type.h3`   | {{H3_SIZE}}  | {{H3_WEIGHT}}  | {{H3_LH}} |
| `type.body` | {{BODY_SIZE}} | {{BODY_WEIGHT}} | {{BODY_LH}} |
| `type.small`| {{SMALL_SIZE}} | {{SMALL_WEIGHT}} | {{SMALL_LH}} |

#### Spacing Scale

| Token    | Value  |
|----------|--------|
| `space.1`| 4px    |
| `space.2`| 8px    |
| `space.3`| 12px   |
| `space.4`| 16px   |
| `space.5`| 20px   |
| `space.6`| 24px   |
| `space.8`| 32px   |
| `space.10`| 40px  |
| `space.12`| 48px  |
| `space.16`| 64px  |

---

## Navigation Flow

<!--
  How screens connect to each other.
  Shows the primary navigation paths through the application.
-->

### Primary Navigation

{{PRIMARY_NAV_DESCRIPTION}}

### Navigation Diagram

```
{{NAV_DIAGRAM}}
```

<!--
  ASCII diagram showing screen connections.
  Example:

  Landing ──> Sign Up ──> Onboarding ──> Dashboard
     │                                      │
     └──> Login ────────────────────────────┘
                                             │
                                   ┌─────────┼──────────┐
                                   v         v          v
                                Settings  Projects   Profile
-->

### Route Table

| Route                  | Screen            | Auth Required | Layout        |
|------------------------|-------------------|---------------|---------------|
| {{ROUTE_1}}            | {{ROUTE_1_SCREEN}} | {{ROUTE_1_AUTH}} | {{ROUTE_1_LAYOUT}} |
| {{ROUTE_2}}            | {{ROUTE_2_SCREEN}} | {{ROUTE_2_AUTH}} | {{ROUTE_2_LAYOUT}} |
| {{ROUTE_3}}            | {{ROUTE_3_SCREEN}} | {{ROUTE_3_AUTH}} | {{ROUTE_3_LAYOUT}} |
| {{ROUTE_4}}            | {{ROUTE_4_SCREEN}} | {{ROUTE_4_AUTH}} | {{ROUTE_4_LAYOUT}} |
| {{ROUTE_5}}            | {{ROUTE_5_SCREEN}} | {{ROUTE_5_AUTH}} | {{ROUTE_5_LAYOUT}} |
