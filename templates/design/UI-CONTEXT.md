# UI/UX Context — {{PROJECT_NAME}}

<!--
  UI/UX context document. Captured during project init or the first UI-related phase.
  Provides the design foundation that all screen specs and component definitions reference.
  Updated when design direction changes (requires user confirmation).
-->

---

## Platform & Framework

| Field              | Value                          |
|--------------------|--------------------------------|
| Platform           | {{UI_PLATFORM}}                |
| Framework          | {{UI_FRAMEWORK}}               |
| UI Library         | {{UI_LIBRARY}}                 |
| Styling Approach   | {{STYLING_APPROACH}}           |
| Component Library  | {{COMPONENT_LIBRARY}}          |
| Icon Set           | {{ICON_SET}}                   |

<!--
  Examples:
  - Platform: Web (SPA)
  - Framework: Next.js 14 (App Router)
  - UI Library: React 18
  - Styling: Tailwind CSS v3
  - Component Library: shadcn/ui
  - Icon Set: Lucide Icons
-->

---

## Target Devices / Screen Sizes

<!--
  List all target form factors. Primary device is the design-first target.
  Breakpoints here should align with design-tokens.json.
-->

| Device         | Min Width | Max Width | Priority  | Notes                     |
|----------------|-----------|-----------|-----------|---------------------------|
| Mobile         | 320px     | 639px     | {{MOBILE_PRIORITY}}  | {{MOBILE_NOTES}}   |
| Tablet         | 640px     | 1023px    | {{TABLET_PRIORITY}}  | {{TABLET_NOTES}}   |
| Desktop        | 1024px    | 1279px    | {{DESKTOP_PRIORITY}} | {{DESKTOP_NOTES}}  |
| Large Desktop  | 1280px    | --        | {{LARGE_DESKTOP_PRIORITY}} | {{LARGE_DESKTOP_NOTES}} |

**Primary Target:** {{PRIMARY_DEVICE}}

---

## Design Constraints

### Brand Colors

<!--
  If the project has existing brand colors, list them here.
  These override the defaults in design-tokens.json.
-->

| Color Name     | Value     | Usage                     |
|----------------|-----------|---------------------------|
| {{COLOR_1_NAME}} | {{COLOR_1_VALUE}} | {{COLOR_1_USAGE}}  |
| {{COLOR_2_NAME}} | {{COLOR_2_VALUE}} | {{COLOR_2_USAGE}}  |
| {{COLOR_3_NAME}} | {{COLOR_3_VALUE}} | {{COLOR_3_USAGE}}  |

<!--
  If no brand colors exist, leave this table empty and use design token defaults.
-->

### Existing Design System

{{EXISTING_DESIGN_SYSTEM}}

<!--
  Does the project have an existing design system or style guide?
  If yes, describe it and link to it. The design token template should be
  populated to match the existing system.
  If no, write: "No existing design system. Using GMSD defaults."
-->

### Accessibility Requirements

| Requirement           | Value                          |
|-----------------------|--------------------------------|
| WCAG Target Level     | {{WCAG_LEVEL}}                 |
| Color Contrast Ratio  | {{CONTRAST_RATIO}}             |
| Keyboard Navigation   | {{KEYBOARD_NAV}}               |
| Screen Reader Support | {{SCREEN_READER}}              |
| Motion Preferences    | {{MOTION_PREFS}}               |
| Focus Indicators      | {{FOCUS_INDICATORS}}           |

<!--
  Defaults:
  - WCAG Level: AA
  - Contrast Ratio: 4.5:1 (normal text), 3:1 (large text)
  - Keyboard Navigation: Full
  - Screen Reader: All interactive elements labeled
  - Motion: Respect prefers-reduced-motion
  - Focus: Visible focus ring on all interactive elements
-->

---

## User Personas

<!--
  Brief descriptions of the user types relevant to UI decisions.
  Focus on how they USE the interface, not demographics.
-->

### {{PERSONA_1_NAME}}

- **Role:** {{PERSONA_1_ROLE}}
- **Tech Comfort:** {{PERSONA_1_TECH_LEVEL}}
- **Primary Goal:** {{PERSONA_1_GOAL}}
- **Key Behavior:** {{PERSONA_1_BEHAVIOR}}
- **Device Preference:** {{PERSONA_1_DEVICE}}

### {{PERSONA_2_NAME}}

- **Role:** {{PERSONA_2_ROLE}}
- **Tech Comfort:** {{PERSONA_2_TECH_LEVEL}}
- **Primary Goal:** {{PERSONA_2_GOAL}}
- **Key Behavior:** {{PERSONA_2_BEHAVIOR}}
- **Device Preference:** {{PERSONA_2_DEVICE}}

### {{PERSONA_3_NAME}}

- **Role:** {{PERSONA_3_ROLE}}
- **Tech Comfort:** {{PERSONA_3_TECH_LEVEL}}
- **Primary Goal:** {{PERSONA_3_GOAL}}
- **Key Behavior:** {{PERSONA_3_BEHAVIOR}}
- **Device Preference:** {{PERSONA_3_DEVICE}}

---

## Inspiration

<!--
  Reference apps/sites and what design aspects to take from each.
  Be specific about WHAT to borrow, not just "looks nice".
-->

### {{INSPIRATION_1_NAME}}

- **URL:** {{INSPIRATION_1_URL}}
- **What to Take:** {{INSPIRATION_1_TAKEAWAY}}
- **What to Avoid:** {{INSPIRATION_1_AVOID}}

### {{INSPIRATION_2_NAME}}

- **URL:** {{INSPIRATION_2_URL}}
- **What to Take:** {{INSPIRATION_2_TAKEAWAY}}
- **What to Avoid:** {{INSPIRATION_2_AVOID}}

### {{INSPIRATION_3_NAME}}

- **URL:** {{INSPIRATION_3_URL}}
- **What to Take:** {{INSPIRATION_3_TAKEAWAY}}
- **What to Avoid:** {{INSPIRATION_3_AVOID}}

---

## Dark Mode Support

| Field               | Value                          |
|---------------------|--------------------------------|
| Supported           | {{DARK_MODE_SUPPORTED}}        |
| Default Theme       | {{DEFAULT_THEME}}              |
| Toggle Method       | {{DARK_MODE_TOGGLE}}           |
| System Preference   | {{DARK_MODE_SYSTEM_PREF}}      |

<!--
  Examples:
  - Supported: yes
  - Default Theme: light
  - Toggle Method: Manual toggle in header + system preference detection
  - System Preference: Respected on first visit, user choice persisted after toggle

  If dark mode is not supported:
  - Supported: no
  - Reason: "MVP scope — will add in v2"
-->
