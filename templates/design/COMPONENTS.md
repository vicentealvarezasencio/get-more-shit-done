# Component Inventory — {{PROJECT_NAME}}

<!--
  Master component inventory. Lists every reusable component in the design system.
  Referenced from UI-SPEC.md and individual screen specs.

  Each component should be implemented once and reused across screens.
  Components are organized by category for easy discovery.
-->

---

## Component List

<!--
  Master table of all components.
  Category: layout | navigation | form | data-display | feedback | overlay
  Variants: the different visual/behavioral variations of the component
  Used In: screen IDs where this component appears (comma-separated)
-->

| Name                | Category      | Variants                               | Used In Screens         |
|---------------------|---------------|----------------------------------------|-------------------------|
| {{COMP_1_NAME}}     | {{COMP_1_CAT}} | {{COMP_1_VARIANTS}}                  | {{COMP_1_SCREENS}}      |
| {{COMP_2_NAME}}     | {{COMP_2_CAT}} | {{COMP_2_VARIANTS}}                  | {{COMP_2_SCREENS}}      |
| {{COMP_3_NAME}}     | {{COMP_3_CAT}} | {{COMP_3_VARIANTS}}                  | {{COMP_3_SCREENS}}      |
| {{COMP_4_NAME}}     | {{COMP_4_CAT}} | {{COMP_4_VARIANTS}}                  | {{COMP_4_SCREENS}}      |
| {{COMP_5_NAME}}     | {{COMP_5_CAT}} | {{COMP_5_VARIANTS}}                  | {{COMP_5_SCREENS}}      |
| {{COMP_6_NAME}}     | {{COMP_6_CAT}} | {{COMP_6_VARIANTS}}                  | {{COMP_6_SCREENS}}      |
| {{COMP_7_NAME}}     | {{COMP_7_CAT}} | {{COMP_7_VARIANTS}}                  | {{COMP_7_SCREENS}}      |
| {{COMP_8_NAME}}     | {{COMP_8_CAT}} | {{COMP_8_VARIANTS}}                  | {{COMP_8_SCREENS}}      |
| {{COMP_9_NAME}}     | {{COMP_9_CAT}} | {{COMP_9_VARIANTS}}                  | {{COMP_9_SCREENS}}      |
| {{COMP_10_NAME}}    | {{COMP_10_CAT}} | {{COMP_10_VARIANTS}}                | {{COMP_10_SCREENS}}     |

<!--
  Add more components as needed.
-->

---

## Component Details

<!--
  Detailed specification for each component.
  Copy this template block for each component.
-->

### {{COMP_DETAIL_1_NAME}}

**Category:** {{COMP_DETAIL_1_CATEGORY}}

**Description:** {{COMP_DETAIL_1_DESC}}

#### Props

| Prop Name      | Type              | Default          | Required | Description                    |
|----------------|-------------------|------------------|----------|--------------------------------|
| {{PROP_1_NAME}} | {{PROP_1_TYPE}}  | {{PROP_1_DEFAULT}} | {{PROP_1_REQUIRED}} | {{PROP_1_DESC}}     |
| {{PROP_2_NAME}} | {{PROP_2_TYPE}}  | {{PROP_2_DEFAULT}} | {{PROP_2_REQUIRED}} | {{PROP_2_DESC}}     |
| {{PROP_3_NAME}} | {{PROP_3_TYPE}}  | {{PROP_3_DEFAULT}} | {{PROP_3_REQUIRED}} | {{PROP_3_DESC}}     |
| {{PROP_4_NAME}} | {{PROP_4_TYPE}}  | {{PROP_4_DEFAULT}} | {{PROP_4_REQUIRED}} | {{PROP_4_DESC}}     |

#### Variants

| Variant          | Description                       | Visual Difference              |
|------------------|-----------------------------------|--------------------------------|
| {{VAR_1_NAME}}   | {{VAR_1_DESC}}                    | {{VAR_1_VISUAL}}               |
| {{VAR_2_NAME}}   | {{VAR_2_DESC}}                    | {{VAR_2_VISUAL}}               |
| {{VAR_3_NAME}}   | {{VAR_3_DESC}}                    | {{VAR_3_VISUAL}}               |

#### States

| State            | Description                       | Visual Change                  |
|------------------|-----------------------------------|--------------------------------|
| default          | {{STATE_DEFAULT_DESC}}            | {{STATE_DEFAULT_VISUAL}}       |
| hover            | {{STATE_HOVER_DESC}}              | {{STATE_HOVER_VISUAL}}         |
| focused          | {{STATE_FOCUSED_DESC}}            | {{STATE_FOCUSED_VISUAL}}       |
| active           | {{STATE_ACTIVE_DESC}}             | {{STATE_ACTIVE_VISUAL}}        |
| disabled         | {{STATE_DISABLED_DESC}}           | {{STATE_DISABLED_VISUAL}}      |
| loading          | {{STATE_LOADING_DESC}}            | {{STATE_LOADING_VISUAL}}       |

#### Accessibility

- **Role:** {{COMP_A11Y_ROLE}}
- **Keyboard:** {{COMP_A11Y_KEYBOARD}}
- **ARIA:** {{COMP_A11Y_ARIA}}
- **Notes:** {{COMP_A11Y_NOTES}}

---

### {{COMP_DETAIL_2_NAME}}

**Category:** {{COMP_DETAIL_2_CATEGORY}}

**Description:** {{COMP_DETAIL_2_DESC}}

#### Props

| Prop Name      | Type              | Default          | Required | Description                    |
|----------------|-------------------|------------------|----------|--------------------------------|
| {{PROP_1_NAME}} | {{PROP_1_TYPE}}  | {{PROP_1_DEFAULT}} | {{PROP_1_REQUIRED}} | {{PROP_1_DESC}}     |
| {{PROP_2_NAME}} | {{PROP_2_TYPE}}  | {{PROP_2_DEFAULT}} | {{PROP_2_REQUIRED}} | {{PROP_2_DESC}}     |
| {{PROP_3_NAME}} | {{PROP_3_TYPE}}  | {{PROP_3_DEFAULT}} | {{PROP_3_REQUIRED}} | {{PROP_3_DESC}}     |

#### Variants

| Variant          | Description                       | Visual Difference              |
|------------------|-----------------------------------|--------------------------------|
| {{VAR_1_NAME}}   | {{VAR_1_DESC}}                    | {{VAR_1_VISUAL}}               |
| {{VAR_2_NAME}}   | {{VAR_2_DESC}}                    | {{VAR_2_VISUAL}}               |

#### States

| State            | Description                       | Visual Change                  |
|------------------|-----------------------------------|--------------------------------|
| default          | {{STATE_DEFAULT_DESC}}            | {{STATE_DEFAULT_VISUAL}}       |
| hover            | {{STATE_HOVER_DESC}}              | {{STATE_HOVER_VISUAL}}         |
| focused          | {{STATE_FOCUSED_DESC}}            | {{STATE_FOCUSED_VISUAL}}       |
| active           | {{STATE_ACTIVE_DESC}}             | {{STATE_ACTIVE_VISUAL}}        |
| disabled         | {{STATE_DISABLED_DESC}}           | {{STATE_DISABLED_VISUAL}}      |

#### Accessibility

- **Role:** {{COMP_A11Y_ROLE}}
- **Keyboard:** {{COMP_A11Y_KEYBOARD}}
- **ARIA:** {{COMP_A11Y_ARIA}}
- **Notes:** {{COMP_A11Y_NOTES}}

---

<!--
  Add more component detail blocks as needed.
  Copy the template block above for each component in the Component List.
-->

## Component Hierarchy

<!--
  Tree showing how components compose into larger UI structures.
  This helps executors understand which components are children of which.
-->

```
{{COMPONENT_HIERARCHY}}
```

<!--
  Example:

  App
  ├── Layout
  │   ├── Header
  │   │   ├── Logo
  │   │   ├── NavBar
  │   │   │   └── NavLink
  │   │   └── UserMenu
  │   │       ├── Avatar
  │   │       └── DropdownMenu
  │   │           └── DropdownItem
  │   ├── Sidebar (optional)
  │   │   ├── SidebarSection
  │   │   │   └── SidebarLink
  │   │   └── SidebarFooter
  │   ├── MainContent
  │   │   ├── PageHeader
  │   │   │   ├── Breadcrumb
  │   │   │   └── PageActions
  │   │   └── PageBody
  │   └── Footer
  │       └── FooterLink
  ├── Shared Components
  │   ├── Button
  │   ├── Input
  │   ├── Select
  │   ├── Checkbox
  │   ├── Radio
  │   ├── TextArea
  │   ├── Badge
  │   ├── Tag
  │   ├── Card
  │   │   ├── CardHeader
  │   │   ├── CardBody
  │   │   └── CardFooter
  │   ├── Table
  │   │   ├── TableHeader
  │   │   ├── TableRow
  │   │   └── TableCell
  │   ├── EmptyState
  │   ├── ErrorState
  │   └── LoadingSkeleton
  └── Overlay Components
      ├── Modal
      │   ├── ModalHeader
      │   ├── ModalBody
      │   └── ModalFooter
      ├── Toast
      ├── Tooltip
      ├── Popover
      └── ConfirmDialog
-->
