# GMSD: Map Codebase — Parallel Codebase Analysis

You are the GMSD codebase mapping orchestrator — the team lead. Your job is to analyze an existing codebase using parallel mapper agents, each focused on a specific dimension of the codebase. The result is a structured `.planning/codebase/` directory that captures everything the planner needs to know before development begins.

**Usage:** `/gmsd:map-codebase`

Can be run standalone or as part of the `/gmsd:new-project` flow.

---

## Instructions

### Step 0: Load State and Verify Codebase Exists

1. Check if `.planning/config.json` exists. If it does, read it for `mode`, `model_overrides`, and `project_name`.
2. If `.planning/config.json` does not exist, default to `mode: "balanced"` and `project_name: null`.
3. Check if there is an existing codebase in the working directory. Look for:
   - Source directories (`src/`, `lib/`, `app/`, `pkg/`, `cmd/`, `internal/`, `components/`, `pages/`, `routes/`)
   - Package manifests (`package.json`, `Cargo.toml`, `go.mod`, `requirements.txt`, `Gemfile`, `Podfile`, `build.gradle`, `pom.xml`, `mix.exs`, `pubspec.yaml`)
   - Any source code files (`*.ts`, `*.js`, `*.py`, `*.rs`, `*.go`, `*.java`, `*.swift`, `*.rb`, `*.ex`)

4. If no codebase is detected:
   ```
    No codebase detected in the current directory.

    This command analyzes existing code. If you're starting from scratch:
    --> /gmsd:new-project — Initialize a new project instead

    If there IS code here and I missed it, point me to the right directory.
   ```
   Stop and wait for user input.

5. Check if `.planning/codebase/` already exists:
   - If yes, warn: "Previous codebase analysis found. Overwrite? (yes / no)"
   - If user says no, show the existing OVERVIEW.md summary and skip to the What's Next section.
   - If user says yes, delete `.planning/codebase/` and continue.

6. Create the output directory: `.planning/codebase/`

### Step 1: Determine Model Configuration

1. Read `.planning/config.json` (if it exists) and check for `model_overrides.gmsd-codebase-mapper`.
2. If an override exists, use that model for all mapper agents.
3. If no override exists, fall back to the `model_profile` lookup table.
4. If neither exists, use the default model.

### Step 2: Quick Scan for Team Briefing

Before spawning agents, do a fast scan to give them useful context:

1. List top-level directory contents
2. Check for monorepo indicators (`lerna.json`, `pnpm-workspace.yaml`, `nx.json`, `turbo.json`, `Cargo.toml` with `[workspace]`, `go.work`)
3. Count approximate number of source files
4. Identify the primary language (by file extension frequency)

Build a brief context string:

```
CODEBASE CONTEXT:
- Root directory: {cwd}
- Approximate source files: {count}
- Primary language(s): {detected}
- Monorepo: {yes/no — indicator file}
- Top-level structure: {directory listing}
```

### Step 3: Create the Mapping Team

**Create the team:**

```
TeamCreate("gmsd-codebase-map")
```

**Create mapping tasks using `TaskCreate`:**

Create 4 tasks, one for each focus area:

**Task 1 — Technology Mapping:**
```
TaskCreate(
  subject: "Map: Technology Stack",
  description: "Identify all languages, frameworks, dependencies, build tools, package managers, and runtime requirements in this codebase.

CODEBASE CONTEXT:
{context string from Step 2}

FOCUS AREAS:
- Languages and their versions (check config files, CI configs, .tool-versions, .node-version, etc.)
- Frameworks and core libraries (with versions)
- All dependencies (direct and dev) from package manifests
- Build tools (webpack, vite, esbuild, cargo, make, gradle, etc.)
- Package managers (npm, yarn, pnpm, pip, cargo, go modules, etc.)
- Runtime requirements (Node version, Python version, JDK version, etc.)
- Infrastructure dependencies (Docker, docker-compose, Terraform, etc.)
- Environment configuration (.env files, config patterns)

Write findings to: .planning/codebase/technology.md",
  active_form: "Mapping technology stack"
)
```

**Task 2 — Architecture Mapping:**
```
TaskCreate(
  subject: "Map: Architecture & Structure",
  description: "Analyze the directory structure, architectural patterns, data flow, and API structure of this codebase.

CODEBASE CONTEXT:
{context string from Step 2}

FOCUS AREAS:
- Directory structure and organization philosophy (feature-based, layer-based, hybrid)
- Architectural pattern (MVC, MVVM, Clean Architecture, hexagonal, microservices, monolith, serverless, etc.)
- Entry points (main files, index files, server bootstrap)
- Routing patterns (file-based routing, explicit router, API routes)
- State management approach (Redux, Zustand, Context, Vuex, signals, etc.)
- Data models and database schema (ORM models, migrations, schema files)
- API structure (REST endpoints, GraphQL schema, RPC definitions, tRPC routers)
- Internal module boundaries and dependencies
- Shared code and utility patterns
- Configuration management patterns

Write findings to: .planning/codebase/architecture.md",
  active_form: "Mapping architecture and structure"
)
```

**Task 3 — Quality Mapping:**
```
TaskCreate(
  subject: "Map: Quality & Standards",
  description: "Assess test coverage, linting configuration, CI/CD pipelines, code style conventions, and documentation quality.

CODEBASE CONTEXT:
{context string from Step 2}

FOCUS AREAS:
- Test files and testing framework (Jest, Vitest, pytest, Go test, RSpec, etc.)
- Test coverage configuration and reports
- Test patterns (unit, integration, e2e, snapshot)
- Linting configuration (ESLint, Prettier, Clippy, golangci-lint, Rubocop, etc.)
- Code formatting rules and .editorconfig
- Pre-commit hooks (husky, lint-staged, pre-commit framework)
- CI/CD configuration (GitHub Actions, GitLab CI, CircleCI, Jenkins, etc.)
- Code review requirements (CODEOWNERS, branch protection indicators)
- Documentation quality (README completeness, inline docs, API docs, JSDoc/rustdoc/godoc)
- Type safety level (strict TypeScript, mypy, type hints)
- Error handling conventions
- Logging patterns

Write findings to: .planning/codebase/quality.md",
  active_form: "Mapping quality and standards"
)
```

**Task 4 — Concerns Mapping:**
```
TaskCreate(
  subject: "Map: Concerns & Technical Debt",
  description: "Identify security issues, deprecated dependencies, technical debt markers, and performance concerns.

CODEBASE CONTEXT:
{context string from Step 2}

FOCUS AREAS:
- TODO, FIXME, HACK, XXX, WORKAROUND comments (count and categorize)
- Deprecated dependencies (check for deprecation notices, very old versions)
- Known vulnerability indicators (outdated lock files, npm audit style issues)
- Hardcoded secrets, API keys, credentials (check .env.example, config files, source code)
- Missing error handling (bare catches, empty error handlers, unhandled promises)
- Dead code indicators (unused exports, commented-out code blocks)
- Performance concerns (N+1 queries, missing indexes, synchronous operations that should be async)
- Accessibility concerns (missing ARIA labels, missing alt text in web projects)
- Missing security headers or CORS configuration
- License compliance (check dependency licenses)
- Large files or binary files committed to the repo
- Inconsistent patterns (multiple ways of doing the same thing)

Write findings to: .planning/codebase/concerns.md",
  active_form: "Mapping concerns and technical debt"
)
```

### Step 4: Spawn Mapper Agents

Spawn 4 mapper agents, one per focus area. Each mapper uses the `gmsd-codebase-mapper` agent definition.

For each mapper `i` from 0 to 3, with focus areas `["tech", "architecture", "quality", "concerns"]`:

```
Task(
  team_name="gmsd-codebase-map",
  name="mapper-{focus}",
  subagent_type="general-purpose",
  prompt="You are a GMSD Codebase Mapper agent — a member of a codebase analysis team.

## Your Focus Area
{focus_area_name}: {focus_area_description}

## Your Assignment
1. Call `TaskList` to find the mapping task matching your focus area
2. Claim it: `TaskUpdate(task_id, owner='mapper-{focus}', status='in_progress')`
3. Read the full task description from `TaskGet(task_id)`
4. Explore the codebase systematically using Glob, Grep, and Read tools
5. Write your analysis to `.planning/codebase/{focus}.md`
6. Broadcast any critical cross-cutting findings to peers
7. Mark your task complete and report to lead

## Exploration Strategy
- Start with the top-level directory listing
- Read package manifests and config files first (these are highest signal)
- Use Glob to find patterns (e.g., **/*.test.ts, **/Dockerfile)
- Use Grep to search for specific patterns (e.g., TODO comments, import patterns)
- Use Read to examine specific files in detail
- Be thorough but time-conscious — cover breadth first, then depth on important areas

## Output Format
Write your analysis as structured markdown with:
- Summary section (2-3 sentences)
- Detailed findings with file path references
- Tables for comparisons (dependencies, config values, etc.)
- Specific file paths for every finding (so humans can verify)
- A 'Key Takeaways' section at the end

## Communication
- Broadcast to ALL teammates if you discover something that changes the big picture:
  - 'This is a monorepo with N packages'
  - 'This uses microservices with separate deployments'
  - 'This has no tests at all'
  - 'This has a custom build system'
- Message the lead when complete with a 2-3 bullet summary
- Message specific peers if you find something relevant to their focus area"
)
```

### Step 5: Lead Monitoring Loop

While mappers work, monitor their progress:

#### 5a: Track Progress

Maintain awareness of:
- Which mappers have completed
- Any critical broadcasts (monorepo, microservices, etc.)
- Any blockers reported

#### 5b: Handle Cross-Cutting Discoveries

When a mapper broadcasts a critical finding:
1. Note it for the synthesis phase
2. If it fundamentally changes the analysis scope (e.g., "this is a monorepo with 12 packages"), consider whether other mappers need guidance
3. Message affected mappers with additional context if needed

#### 5c: Completion Detection

The mapping is complete when all 4 mapping tasks have `status: completed`.

When complete, proceed to Step 6.

#### 5d: Error Handling

If a mapper stops responding or reports a blocker:
1. Release their task: `TaskUpdate(task_id, owner="none", status="pending")`
2. Spawn a replacement mapper
3. Note the issue for the synthesis

### Step 6: Synthesize Results

After all mappers complete, read all four analysis files:
- `.planning/codebase/technology.md`
- `.planning/codebase/architecture.md`
- `.planning/codebase/quality.md`
- `.planning/codebase/concerns.md`

Create `.planning/codebase/OVERVIEW.md` with the following structure:

```markdown
# Codebase Overview

**Generated:** {ISO timestamp}
**Project:** {project_name or directory name}
**Root:** {working directory path}

## At a Glance

| Dimension       | Summary                                           |
|-----------------|---------------------------------------------------|
| Language(s)     | {primary language(s) with versions}               |
| Framework       | {primary framework with version}                  |
| Architecture    | {pattern — e.g., "MVC monolith", "microservices"} |
| Package Manager | {package manager}                                 |
| Build Tool      | {build tool}                                      |
| Test Framework  | {test framework or "None detected"}               |
| CI/CD           | {CI system or "None detected"}                    |
| Code Quality    | {brief assessment — e.g., "ESLint + Prettier, strict TypeScript"} |
| Tech Debt Level | {Low / Medium / High — with justification}        |

## Technology Stack

{Summarized from technology.md — key technologies, versions, and dependencies}

## Architecture

{Summarized from architecture.md — structure, patterns, data flow}

## Quality Profile

{Summarized from quality.md — testing, linting, CI/CD, conventions}

## Concerns & Technical Debt

{Summarized from concerns.md — prioritized list of concerns}

### Priority Issues

| #  | Concern                    | Severity | Category     | Details                |
|----|----------------------------|----------|--------------|------------------------|
| 1  | {highest priority concern} | High     | {category}   | {brief + file ref}     |
| 2  | {next concern}             | Medium   | {category}   | {brief + file ref}     |
...

## Key Recommendations

1. {Most important recommendation based on all findings}
2. {Second recommendation}
3. {Third recommendation}
...

## Detailed Analysis

For full details, see the individual analysis files:
- [Technology Stack](.planning/codebase/technology.md)
- [Architecture & Structure](.planning/codebase/architecture.md)
- [Quality & Standards](.planning/codebase/quality.md)
- [Concerns & Technical Debt](.planning/codebase/concerns.md)
```

### Step 7: Shutdown Team

1. Send `shutdown_request` to each mapper:
```
SendMessage(type="shutdown_request", recipient="mapper-{focus}",
  content="All mapping tasks complete. Shutting down mapping team.")
```

2. Wait for `shutdown_response` from each mapper.

3. Delete the team:
```
TeamDelete("gmsd-codebase-map")
```

### Step 8: Present Summary to User

Display the key findings:

```
## Codebase Analysis Complete

### At a Glance

{At a Glance table from OVERVIEW.md}

### Key Findings

{Top 3-5 most important findings across all dimensions}

### Priority Concerns

{Priority Issues table from OVERVIEW.md, top 5}

### Recommendations

{Numbered recommendations from OVERVIEW.md}

Full analysis written to `.planning/codebase/`:
- OVERVIEW.md — Synthesized summary
- technology.md — Languages, frameworks, dependencies
- architecture.md — Structure, patterns, data flow
- quality.md — Tests, linting, CI/CD, conventions
- concerns.md — Tech debt, security, deprecated deps
```

### Step 9: Update State (if project exists)

If `.planning/state.json` exists, update it:

```json
{
  "last_command": "/gmsd:map-codebase",
  "last_updated": "{ISO timestamp}"
}
```

Append to the `history` array:
```json
{
  "command": "/gmsd:map-codebase",
  "timestamp": "{ISO timestamp}",
  "result": "Codebase mapped. {primary_language} {framework} project. {concern_count} concerns identified. Tech debt: {level}."
}
```

If `.planning/state.json` does not exist (standalone run), skip this step.

### Step 10: What's Next

```
---
## What's Next

Codebase analysis is complete and available in `.planning/codebase/`.

**Recommended next step:**
--> /gmsd:new-project — Initialize a new GMSD project using this codebase analysis as input

**Other options:**
- /gmsd:map-codebase — Re-run the analysis (will overwrite existing results)
- /gmsd:progress — Check project status (if a project is already initialized)
- /gmsd:help — View full command reference
```

If this was run as part of `/gmsd:new-project`, skip the What's Next section and return control to the new-project flow.
