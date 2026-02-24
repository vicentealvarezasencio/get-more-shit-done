---
name: gmsd:ui-sync
description: Detect drift between specifications and implementations, synchronize state
allowed-tools: [Read, Write, Edit, Glob, Grep, AskUserQuestion, Task]
agent: gmsd-ui-specifier (for spec updates), gmsd-ui-researcher (for analysis)
---

<objective>
Detect and resolve drift between UI specifications and realized implementations. Check for consistency across tokens, screens, components, and exports. Provide actionable sync recommendations.
</objective>

<context>
@.planning/design/UI-SPEC.md (if exists)
@.planning/design/design-tokens.json (if exists)
@.planning/design/screens/*.md (if exists)
@.planning/design/COMPONENTS.md (if exists)
@.planning/design/ui-exports/*.md (if exists)
@.planning/design/UI-REGISTRY.md (if exists)
@.planning/REQUIREMENTS.md (if exists)
</context>

<ux_principles>
## Comprehensive Check

Sync checks multiple dimensions:
- Token consistency (tokens used match definitions)
- Spec completeness (all required sections)
- Export freshness (exports match current specs)
- Component alignment (components in specs exist in inventory)
- Implementation status (registry matches reality)

## Actionable Output

Every drift item should have a clear resolution action.
</ux_principles>

<process>

<step name="gather_files">
## Gather All UI Files

Collect all UI specification files:
- design-tokens.json
- UI-SPEC.md
- screens/*.md
- COMPONENTS.md
- UI-PATTERNS.md
- ui-exports/*.md
- UI-REGISTRY.md
- UI-DECISIONS.md
- CLAUDE.md (project root — check for UI Specs section)
- REQUIREMENTS.md (check for UI Spec links)

Note missing files for reporting.
</step>

<step name="check_claude_md_integration">
## Check CLAUDE.md GSD Integration

**This step ensures the CLAUDE.md instruction exists for GSD agents to read UI specs.**

1. Read the project-level `CLAUDE.md` at the project root
2. Search for a `## UI Specs` section (or the phrase "UI Spec" in context of design instructions)
3. If the section is **missing**:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UI ► CLAUDE.MD INTEGRATION CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✗ CLAUDE.md missing UI Specs integration rule
  GSD agents will NOT read screen specs during execution.
  Fix: Add UI Specs section to CLAUDE.md (auto-fixable)
───────────────────────────────────────────────────────
```

4. If the section **exists**: report as healthy.

**Auto-fix:** Append the following block to CLAUDE.md (same as what `/gmsd:init` would add):

```markdown

## UI Specs (Auto-added by /gmsd:ui-sync)

Design tokens: .planning/design/design-tokens.json
Component details: .planning/design/COMPONENTS.md

When a requirement in REQUIREMENTS.md references a "UI Spec" path, read that
screen spec file before implementing the screen. If the screen spec lists
components, read their full definition from COMPONENTS.md.

Use exact values from specs and design tokens (colors, spacing, typography).
If a screen or component has no spec linked, ask before guessing the design.
```

**Rules:**
- Do NOT overwrite existing CLAUDE.md content — only append
- Do NOT add if the section already exists
- If CLAUDE.md does not exist, create it with only the block above
</step>

<step name="check_token_references">
## Check Token References

Scan all screen specs for token references:

**Valid token reference:**
```markdown
Background: color.background.subtle
```

**Check against design-tokens.json:**
- Does `color.background.subtle` exist?
- Is the value correct?

Report drift:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UI ► TOKEN DRIFT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Checking token references across specifications...

✓ color.primary.default — Used in 6 screens
✓ color.primary.foreground — Used in 6 screens
✗ color.accent.500 — Referenced but not defined
  → SCR-04-dashboard.md:42
  → SCR-07-settings.md:38
⚠ color.warning.default — Defined but unused
  → Consider removing or adding usage

Undefined tokens: 1
Unused tokens: 1
───────────────────────────────────────────────────────
```
</step>

<step name="check_component_references">
## Check Component References

Verify components in screen specs exist in COMPONENTS.md:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UI ► COMPONENT DRIFT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Checking component references...

✓ Button — Defined, used in 8 screens
✓ Input — Defined, used in 5 screens
✗ SocialButton — Used but not in COMPONENTS.md
  → SCR-01-login.md, SCR-02-signup.md
⚠ DatePicker — Defined but not used
  → Consider removing from COMPONENTS.md

Undefined components: 1
Unused components: 1
───────────────────────────────────────────────────────
```
</step>

<step name="check_spec_completeness">
## Check Spec Completeness

Verify each screen has all 10 sections:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UI ► SPEC COMPLETENESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Checking screen specification completeness...

SCR-01: Login
  ✓ Meta  ✓ Purpose  ✓ Wireframe  ✓ Layout
  ✓ Components  ✓ States  ✓ Interactions
  ✓ Responsive  ✓ Accessibility  ✓ Content
  Complete: 10/10

SCR-03: Dashboard
  ✓ Meta  ✓ Purpose  ○ Wireframe  ✓ Layout
  ✓ Components  ○ States  ○ Interactions
  ✓ Responsive  ○ Accessibility  ✓ Content
  Missing: 4/10 — Needs completion

Incomplete screens: 1
───────────────────────────────────────────────────────
```
</step>

<step name="check_export_freshness">
## Check Export Freshness

Compare export timestamps with spec modifications:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UI ► EXPORT FRESHNESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Checking if exports are up to date...

Stitch Exports:
  ✓ SCR-01: Login — Up to date
  ⚠ SCR-02: Signup — Spec modified after export
    Spec: 2026-01-19 14:30
    Export: 2026-01-19 10:00
  ○ SCR-03: Dashboard — Never exported

V0 Exports:
  ✓ SCR-01: Login — Up to date
  ○ SCR-02: Signup — Never exported
  ○ SCR-03: Dashboard — Never exported

Stale exports: 1
Missing exports: 3
───────────────────────────────────────────────────────
```
</step>

<step name="check_registry_status">
## Check Registry Accuracy

Verify registry matches file system:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UI ► REGISTRY ACCURACY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Checking registry against specifications...

✓ SCR-01 — In registry and spec exists
✓ SCR-02 — In registry and spec exists
✗ SCR-06 — In specs but not in registry
  → Add to UI-REGISTRY.md
⚠ SCR-10 — In registry but spec file missing
  → Remove from registry or create spec

Unregistered screens: 1
Orphaned registry entries: 1
───────────────────────────────────────────────────────
```
</step>

<step name="check_pattern_usage">
## Check Pattern Usage

Verify patterns are documented and used consistently:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UI ► PATTERN CONSISTENCY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Checking pattern usage...

PAT-01: Auth Card
  Documented: ✓
  Used in: SCR-01, SCR-02, SCR-03
  Consistent: ✓

PAT-02: Data Table
  Documented: ✓
  Used in: SCR-04, SCR-05
  ⚠ Inconsistent: SCR-05 missing pagination

Undocumented patterns detected:
  ? Similar structure in SCR-06, SCR-07, SCR-08
    → Consider documenting as new pattern
───────────────────────────────────────────────────────
```
</step>

<step name="check_requirement_spec_links">
## Check Requirement-to-Spec Links

**This step ensures REQUIREMENTS.md stays in sync with screen specs after Pencil iterations and pulls.**

Skip this step if `.planning/REQUIREMENTS.md` does not exist.

### 1. Read current state

- Read all screen specs from `.planning/design/screens/SCR-*.md`
- For each screen spec, extract from Section 1 (Meta): the `Requirements:` field (e.g., `REQ-03, REQ-04`)
- For each screen spec, extract from Section 5 (Components): the component list
- Read `.planning/REQUIREMENTS.md` and find all existing `UI Spec:` and `UI Components:` lines

### 2. Detect drift

Compare what the screen specs say vs what REQUIREMENTS.md says:

**Missing links** — Screen spec maps to REQ-XX but REQUIREMENTS.md has no `UI Spec:` path for that requirement:
```
✗ REQ-03 — Missing UI Spec link
  Screen SCR-01-login.md maps to REQ-03 but REQUIREMENTS.md has no path
```

**Stale component lists** — Screen spec has components that don't match what's listed in REQUIREMENTS.md:
```
⚠ REQ-03 — Component list outdated
  REQUIREMENTS.md: InputField, Button/Primary
  Screen spec: InputField, Button/Primary, StatusBadge, Avatar
  New: StatusBadge, Avatar
```

**Orphaned links** — REQUIREMENTS.md references a screen spec that no longer exists:
```
✗ REQ-07 — References SCR-10-reports.md but file does not exist
```

**New screens without requirement links** — Screen specs that don't map to any requirement:
```
⚠ SCR-12-notifications.md — No requirement mapping
  Consider: Add to an existing requirement or create new requirement
```

### 3. Report

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UI ► REQUIREMENT-SPEC LINK CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Checking requirement-to-spec links...

✓ REQ-01 → SCR-01-login.md — Up to date
✓ REQ-02 → SCR-02-signup.md — Up to date
✗ REQ-03 → Missing UI Spec link (should be SCR-04-dashboard.md)
⚠ REQ-04 → Component list outdated (added: StatusBadge, Avatar)
✗ REQ-07 → References deleted SCR-10-reports.md

Missing links: 1
Outdated component lists: 1
Orphaned links: 1
───────────────────────────────────────────────────────
```

### 4. Auto-fix (when user approves)

**Auto-fixable:**
- Add missing `UI Spec:` paths to requirements (append below requirement description)
- Update `UI Components:` lists to match current screen spec Section 5
- Remove orphaned links pointing to deleted screen specs

**Manual fix needed:**
- New screens with no requirement mapping — user must decide which requirement they belong to

**Format for additions to REQUIREMENTS.md:**
```markdown
- **UI Spec:** .planning/design/screens/SCR-XX-name.md
- **UI Components:** ComponentA, ComponentB, ComponentC
```

**Rules:**
- Do NOT modify existing requirement descriptions — only add/update the `UI Spec` and `UI Components` metadata lines
- If lines already exist, replace them with updated values
- Preserve all other content in REQUIREMENTS.md unchanged
</step>

<step name="generate_sync_report">
## Generate Sync Report

Compile all findings:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UI ► SYNC REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Overall Health: ██████████░░ 75%

TOKEN CONSISTENCY                              [1 issue]
───────────────────────────────────────────────────────
✗ color.accent.500 undefined
  Fix: Add to design-tokens.json or update references

COMPONENT ALIGNMENT                            [1 issue]
───────────────────────────────────────────────────────
✗ SocialButton not in inventory
  Fix: Run /gmsd:define-components

SPEC COMPLETENESS                              [1 issue]
───────────────────────────────────────────────────────
○ SCR-03: Dashboard missing 4 sections
  Fix: Complete wireframe, states, interactions, accessibility

EXPORT FRESHNESS                               [1 issue]
───────────────────────────────────────────────────────
⚠ SCR-02 export is stale
  Fix: Run /gmsd:export stitch SCR-02

REGISTRY ACCURACY                              [2 issues]
───────────────────────────────────────────────────────
✗ SCR-06 not in registry
○ SCR-10 orphaned (no spec)

REQUIREMENT-SPEC LINKS                         [2 issues]
───────────────────────────────────────────────────────
✗ REQ-03 missing UI Spec link → SCR-04-dashboard.md
⚠ REQ-04 component list outdated (added: StatusBadge)

CLAUDE.MD INTEGRATION                          [0-1 issue]
───────────────────────────────────────────────────────
✓ UI Specs section present (or: ✗ Missing — GSD won't read specs)

───────────────────────────────────────────────────────
Total Issues: N (critical, warning, info)
───────────────────────────────────────────────────────
```
</step>

<step name="offer_auto_fix">
## Offer Auto-Fix

**Question: Would you like to auto-fix resolvable issues?**

Options:
- Fix all (safe fixes only)
- Fix specific categories
- Generate fix list (manual)
- Skip fixes

**Auto-fixable issues:**
- Add missing tokens to design-tokens.json
- Add missing screens to registry
- Remove orphaned registry entries
- Update export timestamps
- Add `## UI Specs` section to CLAUDE.md if missing
- Add missing `UI Spec:` paths to REQUIREMENTS.md
- Update outdated `UI Components:` lists in REQUIREMENTS.md
- Remove orphaned spec links from REQUIREMENTS.md (pointing to deleted specs)

**Manual fixes required:**
- Complete missing spec sections
- Define new components
- Regenerate stale exports
- New screens with no requirement mapping (user must assign)
</step>

<step name="apply_fixes">
## Apply Fixes

For each auto-fixable issue:

```markdown
## Applying Fixes

✓ Added color.accent.500 to design-tokens.json
  Value: #F59E0B (inferred from similar tokens)
  Please verify this is correct.

✓ Added SCR-06 to UI-REGISTRY.md
  Status: Pending

✓ Removed SCR-10 from UI-REGISTRY.md
  (Spec file did not exist)

Manual action needed:
→ Complete SCR-03 sections: /gmsd:design-screens SCR-03
→ Define SocialButton: /gmsd:define-components
→ Refresh exports: /gmsd:export stitch SCR-02
```
</step>

<step name="completion">
## Completion Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UI ► SYNC COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Issues Found: 6
Auto-Fixed:   3
Remaining:    3

Fixed:
  ✓ Added missing token color.accent.500
  ✓ Added SCR-06 to registry
  ✓ Removed orphaned SCR-10 from registry

Remaining Manual Actions:
  1. Complete SCR-03 specification
     → /gmsd:design-screens SCR-03

  2. Add SocialButton to component inventory
     → /gmsd:define-components

  3. Regenerate stale SCR-02 export
     → /gmsd:export stitch SCR-02

Updated Health: ██████████████░ 88%

───────────────────────────────────────────────────────

## ▶ Recommended Next

Address remaining issues in order:
1. `/gmsd:design-screens SCR-03` — Complete missing sections
2. `/gmsd:define-components` — Update component inventory
3. `/gmsd:export stitch SCR-02` — Refresh stale export

───────────────────────────────────────────────────────
```
</step>

</process>

<success_criteria>
- All UI files scanned for consistency
- Drift detected and categorized
- **CLAUDE.md checked for UI Specs integration rule** (added if missing)
- **Requirement-to-spec links verified and updated** (if REQUIREMENTS.md exists)
- **Component lists in REQUIREMENTS.md reconciled with current screen specs** (if REQUIREMENTS.md exists)
- Auto-fixable issues resolved (including CLAUDE.md and requirement link fixes)
- Manual fixes clearly documented
- Registry aligned with specifications
- Health score calculated
- Actionable next steps provided
</success_criteria>
