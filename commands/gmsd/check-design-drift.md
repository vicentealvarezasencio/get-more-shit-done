# GMSD: Check Design Drift

You are the GMSD design drift detector. You scan the project's source files for hardcoded values that should use design tokens, identify undocumented or unimplemented components, and produce a comprehensive design drift report. This helps maintain consistency between the design system and the codebase.

**Usage:** `/gmsd:check-design-drift`

---

## Instructions

### Step 0: Load State and Configuration

1. Read `.planning/state.json` for current state.
2. Read `.planning/config.json` for mode settings, project name, and version.
3. Store the start timestamp.

### Step 1: Verify Design System Exists

Check for design system artifacts:

1. Check if `.planning/design/design-tokens.json` exists.
2. Check if `.planning/design/COMPONENTS.md` exists.
3. Check for screen specs in `.planning/design/screens/`.

**If no design tokens file exists:**
```
## No Design System Found

No design tokens were found at `.planning/design/design-tokens.json`.

Design drift detection requires a design token file to compare against.

**To set up a design system:**
--> `/gmsd:design-phase` — Run the design phase to create tokens, component specs, and screen specs

**To create tokens manually:**
Create `.planning/design/design-tokens.json` with your color, typography, and spacing definitions.
```
Stop here.

**If design tokens exist but COMPONENTS.md does not:**
Note this and proceed — component drift checks will be limited to code-only analysis.

### Step 2: Parse Design Tokens

Read `.planning/design/design-tokens.json` and extract all token definitions. Build lookup maps for each category:

1. **Color tokens:**
   Extract all color values (hex, rgb, hsl). Build a map:
   ```
   {
     "#3b82f6": "var(--color-primary)",
     "#ef4444": "var(--color-error)",
     "#10b981": "var(--color-success)",
     ...
   }
   ```
   Include all color variants (hover states, backgrounds, borders, etc.).
   Normalize hex values to lowercase 6-digit format for comparison (#fff -> #ffffff).

2. **Typography tokens:**
   Extract all font-size values (px, rem, em). Build a map:
   ```
   {
     "12px": "var(--font-size-xs)",
     "14px": "var(--font-size-sm)",
     "16px": "var(--font-size-base)",
     "0.75rem": "var(--font-size-xs)",
     ...
   }
   ```
   Include font-weight, line-height, letter-spacing, and font-family values if defined.

3. **Spacing tokens:**
   Extract all spacing values (margin, padding, gap). Build a map:
   ```
   {
     "4px": "var(--spacing-1)",
     "8px": "var(--spacing-2)",
     "16px": "var(--spacing-4)",
     "0.25rem": "var(--spacing-1)",
     ...
   }
   ```

4. **Other tokens:**
   Extract any additional token categories (border-radius, shadows, z-index, breakpoints, etc.).

### Step 3: Parse Component Specs

If `.planning/design/COMPONENTS.md` exists, read it and extract:

1. **Documented components:** list of component names defined in the spec
2. **Component props/variants:** for each component, the expected props and variant options
3. **Component file paths:** if the spec references implementation file paths

### Step 4: Identify Source Files to Scan

1. Determine the project's source directories. Look for common patterns:
   - `src/`, `app/`, `lib/`, `pages/`, `components/`, `styles/`
   - Check `package.json` or project config for source directory hints

2. Build a list of files to scan. Include:
   - `.tsx`, `.ts`, `.jsx`, `.js` files (component and logic files)
   - `.css`, `.scss`, `.sass`, `.less` files (stylesheets)
   - `.vue`, `.svelte` files (SFC frameworks)
   - `.html` files in source directories

3. **Exclude from scanning:**
   - `.planning/` directory (design token files themselves)
   - `node_modules/`, `.next/`, `dist/`, `build/`, `.cache/` directories
   - Test files: `*.test.*`, `*.spec.*`, `__tests__/`, `__mocks__/`
   - Config files: `*.config.*`, `.eslintrc.*`, `tailwind.config.*`, `postcss.config.*`
   - SVG files (colors in SVGs are typically intentional)
   - Files listed in `.gitignore`
   - Lock files: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`

### Step 5: Scan for Color Drift

Search source files for hardcoded color values:

1. **Find hex colors:**
   Search for patterns: `#[0-9a-fA-F]{3,8}` (3, 4, 6, or 8 character hex codes)
   For each match, record: file path, line number, the hex value, surrounding context.

2. **Find rgb/rgba colors:**
   Search for patterns: `rgb\(`, `rgba\(`
   Record matches with the same detail.

3. **Find hsl/hsla colors:**
   Search for patterns: `hsl\(`, `hsla\(`
   Record matches.

4. **Classify each found color:**
   - **Token match (drift):** the hardcoded value matches a design token value but does not use the token variable. This is a drift issue.
   - **Unknown color:** the hardcoded value does not match any design token. This could be a missing token or an unauthorized color.
   - **Already using token:** the value is referenced via a CSS variable or token reference. This is fine — skip it.

5. **Filter false positives:**
   - Ignore colors inside comments
   - Ignore colors that are part of a CSS variable definition (the token file itself)
   - Ignore colors in Tailwind class names (e.g., `bg-blue-500`) — these map to a design system differently
   - Ignore `#000000` and `#ffffff` / `#000` and `#fff` if they are used for true black/white (common utility)

### Step 6: Scan for Typography Drift

Search source files for hardcoded typography values:

1. **Find hardcoded font-size values:**
   Search for patterns: `font-size:\s*[\d.]+(?:px|rem|em|pt)`, `fontSize:\s*['"]?[\d.]+(?:px|rem|em|pt)`
   Also search for Tailwind-style: `text-\[[\d.]+(?:px|rem|em)\]` (arbitrary values)

2. **Find hardcoded font-weight values:**
   Search for patterns: `font-weight:\s*\d+`, `fontWeight:\s*['"]?\d+`

3. **Find hardcoded line-height values:**
   Search for patterns: `line-height:\s*[\d.]+(?:px|rem|em|%)?`, `lineHeight:\s*['"]?[\d.]+`

4. **Classify each found value:**
   - **Token match (drift):** matches a token value but does not use the token variable
   - **Unknown value:** does not match any typography token
   - **Already using token:** uses a CSS variable or token reference — skip

### Step 7: Scan for Spacing Drift

Search source files for hardcoded spacing values:

1. **Find hardcoded margin/padding values:**
   Search for patterns:
   - `margin(-top|-right|-bottom|-left)?:\s*[\d.]+(?:px|rem|em)`
   - `padding(-top|-right|-bottom|-left)?:\s*[\d.]+(?:px|rem|em)`
   - `gap:\s*[\d.]+(?:px|rem|em)`
   - `marginTop|marginRight|marginBottom|marginLeft|paddingTop|paddingRight|paddingBottom|paddingLeft` in JS/TS

2. **Find Tailwind arbitrary spacing values:**
   Search for patterns: `[mp][xytblr]?-\[[\d.]+(?:px|rem|em)\]`

3. **Classify each found value:**
   - **Token match (drift):** matches a spacing token but does not use the variable
   - **Unknown value:** does not match any spacing token
   - **Already using token:** uses a CSS variable or token reference — skip

### Step 8: Scan for Component Drift

If COMPONENTS.md was parsed in Step 3:

1. **Find components in code:**
   Scan source files for component definitions:
   - React: `function ComponentName`, `const ComponentName =`, `export default function`, `export const`
   - Vue: `<script>` blocks with component names, `.vue` file names
   - Svelte: `.svelte` file names
   Build a list of components found in code with their file paths.

2. **Compare against COMPONENTS.md:**
   - **Undocumented components:** components found in code but NOT listed in COMPONENTS.md
   - **Unimplemented components:** components listed in COMPONENTS.md but NOT found in code

3. **Check component props/variants (if specs are detailed enough):**
   For each documented component that exists in code:
   - Check if the expected props are defined
   - Check if the expected variants are implemented
   - Flag missing props or variants as drift

### Step 9: Compile Report

Build the design drift report:

```
Design Drift Report
─────────────────────────────────────────
Project: {project_name} | Version: {version}
Scanned: {file_count} files
Date: {current_date}

Summary
────────
Colors:      {color_drift_count} hardcoded ({token_match_count} match tokens, {unknown_count} unknown)
Typography:  {type_drift_count} hardcoded values
Spacing:     {spacing_drift_count} hardcoded values
Components:  {undocumented_count} undocumented, {unimplemented_count} unimplemented

Overall Drift Score: {score}/100
  (100 = no drift, 0 = everything hardcoded)

Top Issues
────────
1. {file_path}:{line} — {type}: "{value}" should use {token_variable}
2. {file_path}:{line} — {type}: "{value}" should use {token_variable}
3. {file_path}:{line} — {type}: "{value}" is not in the design system
...
(showing top 20 issues, sorted by severity: token matches first, unknowns second)
```

**Calculate the drift score:**
```
total_checkpoints = color_values + typography_values + spacing_values + component_checks
drifted = color_drift + typography_drift + spacing_drift + component_drift
score = round(((total_checkpoints - drifted) / total_checkpoints) * 100)
```
If there are no checkpoints (nothing to scan), score = 100.

### Step 10: Write Report File

Write the full report to `.planning/DESIGN-DRIFT.md`:

```markdown
# Design Drift Report

**Project:** {project_name}
**Version:** {version}
**Generated:** {current_date}
**Scanned:** {file_count} source files

---

## Summary

| Category     | Hardcoded | Match Tokens | Unknown | Clean |
|-------------|-----------|--------------|---------|-------|
| Colors       | {count}   | {count}      | {count} | {count} |
| Typography   | {count}   | {count}      | {count} | {count} |
| Spacing      | {count}   | {count}      | {count} | {count} |
| **Total**    | {count}   | {count}      | {count} | {count} |

**Drift Score:** {score}/100

---

## Component Drift

### Undocumented Components (in code, not in COMPONENTS.md)
{If none: "None found."}
| Component | File Path |
|-----------|-----------|
| {name}    | {path}    |
...

### Unimplemented Components (in COMPONENTS.md, not in code)
{If none: "None found."}
| Component | Spec Reference |
|-----------|---------------|
| {name}    | COMPONENTS.md |
...

---

## Color Drift Details

### Token Matches (should use variables)
| # | File | Line | Found Value | Should Use |
|---|------|------|-------------|-----------|
| 1 | {path} | {line} | `{value}` | `{token_var}` |
...

### Unknown Colors (not in design system)
| # | File | Line | Found Value | Context |
|---|------|------|-------------|---------|
| 1 | {path} | {line} | `{value}` | {surrounding code} |
...

---

## Typography Drift Details

### Token Matches (should use variables)
| # | File | Line | Found Value | Should Use |
|---|------|------|-------------|-----------|
| 1 | {path} | {line} | `{value}` | `{token_var}` |
...

### Unknown Values (not in design system)
| # | File | Line | Found Value | Context |
|---|------|------|-------------|---------|
| 1 | {path} | {line} | `{value}` | {surrounding code} |
...

---

## Spacing Drift Details

### Token Matches (should use variables)
| # | File | Line | Found Value | Should Use |
|---|------|------|-------------|-----------|
| 1 | {path} | {line} | `{value}` | `{token_var}` |
...

### Unknown Values (not in design system)
| # | File | Line | Found Value | Context |
|---|------|------|-------------|---------|
| 1 | {path} | {line} | `{value}` | {surrounding code} |
...

---

## Recommendations

{For each category with drift, suggest concrete actions:}

1. **{category}:** {recommendation — e.g., "Replace 12 hardcoded hex colors with design token variables. Start with the 5 files that have the most drift."}
2. **{category}:** {recommendation}
...

---

*Generated by [GMSD](https://github.com/vicentealvarezasencio/get-more-shit-done) v{version}*
```

### Step 11: Present Results Based on Mode

#### If mode is `guided`:

Display the full report with interactive suggestions:
```
## Design Drift Report — {project_name}

{Full summary table}
{Full top issues list}
{Recommendations}

Full report written to `.planning/DESIGN-DRIFT.md`.

### Suggested Actions

Based on the drift analysis:
1. **Quick wins:** {count} issues are simple token replacements (find & replace)
2. **Needs review:** {count} unknown values may need new tokens added to the design system
3. **Component gaps:** {count} components need documentation or implementation

Would you like to:
1. **Fix quick wins** — I can generate the token replacements for you
2. **Add missing tokens** — add unknown values as new design tokens
3. **Update COMPONENTS.md** — document undocumented components
4. **Continue** — just keep the report for reference
```

Wait for user response.

#### If mode is `balanced`:

Display the summary:
```
## Design Drift Report — {project_name}

Drift Score: {score}/100

| Category     | Hardcoded | Match Tokens | Unknown |
|-------------|-----------|--------------|---------|
| Colors       | {count}   | {count}      | {count} |
| Typography   | {count}   | {count}      | {count} |
| Spacing      | {count}   | {count}      | {count} |

Top 5 issues:
{top 5 issues}

Full report: `.planning/DESIGN-DRIFT.md`
```

#### If mode is `yolo`:

Write the report silently and display a one-line summary:
```
Design drift: score {score}/100. {total_drift} hardcoded values found. Report: `.planning/DESIGN-DRIFT.md`
```

### Step 12: Update State

Update `.planning/state.json`:

Append to the `history` array:
```json
{
  "command": "/gmsd:check-design-drift",
  "timestamp": "{ISO timestamp}",
  "result": "Design drift scan complete. Score: {score}/100. {color_drift} color, {type_drift} typography, {spacing_drift} spacing issues. {component_drift} component gaps."
}
```

Update the `last_command` and `last_updated` fields:
```json
{
  "last_command": "/gmsd:check-design-drift",
  "last_updated": "{ISO timestamp}"
}
```

### Step 13: Sync CLAUDE.md

Regenerate the project's `.claude/CLAUDE.md` to reflect current state:
1. Read all project artifacts (.planning/state.json, config.json, PROJECT.md, ROADMAP.md, current phase CONTEXT.md, PLAN.md, design tokens, todos, tech debt)
2. Generate a concise, actionable CLAUDE.md summary following the template in workflows/claude-md-sync.md
3. Write to `.claude/CLAUDE.md` (create .claude/ directory if needed)

### Step 14: What's Next

```
---
## What's Next

Current: {project_name} v{version} | Drift Score: {score}/100 | Mode: {mode}

**Recommended next step:**
{If many token matches:}
--> Fix hardcoded values that match design tokens — these are straightforward replacements
{If many unknown values:}
--> Review unknown values and decide whether to add new tokens or remove the values
{If component gaps:}
--> Update COMPONENTS.md or implement missing components
{If score is high (>90):}
--> Design system is well-maintained. Continue with your current workflow.

**Other options:**
- `/gmsd:design-phase` — Update or expand the design system
- `/gmsd:verify-work {current_phase}` — Run full verification (includes design conformance)
- `/gmsd:progress` — Check full project status
```
