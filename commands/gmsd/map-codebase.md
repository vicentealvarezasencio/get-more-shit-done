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

### Step 2.5: Execution Mode Check

**Reference:** `workflows/execution-mode-check.md`

Read `.planning/config.json` -> `execution_mode`. Follow the execution mode detection logic:

- **If `execution_mode` is `null`:** Present the user with the execution mode choice (team vs classic). Save their choice to `config.json`.
- **If `execution_mode` is `"team"`:** Continue with the team-based mapping flow (Steps 3-7 below).
- **If `execution_mode` is `"classic"`:** Skip to **Step 3-Classic** below.

### Step 3: Create the Mapping Team (Team Mode)

**Condition:** `execution_mode == "team"`

**Create the team:**

```
TeamCreate("gmsd-codebase-map")
```

**Create mapping tasks using `TaskCreate`:**

Create 4 tasks, one for each focus area:

**Task 1 — Technology Mapping:**
```
TaskCreate(
  subject: "Map: Technology Stack & Integrations",
  description: "Identify all languages, frameworks, dependencies, build tools, package managers, runtime requirements, and external integrations in this codebase.

CODEBASE CONTEXT:
{context string from Step 2}

FOCUS AREAS — STACK.md:
- Languages and their versions (check config files, CI configs, .tool-versions, .node-version, etc.)
- Frameworks and core libraries (with versions)
- All dependencies (direct and dev) from package manifests
- Build tools (webpack, vite, esbuild, cargo, make, gradle, etc.)
- Package managers (npm, yarn, pnpm, pip, cargo, go modules, etc.)
- Runtime requirements (Node version, Python version, JDK version, etc.)
- Infrastructure dependencies (Docker, docker-compose, Terraform, etc.)
- Environment configuration (.env files, config patterns)

FOCUS AREAS — INTEGRATIONS.md:
- External APIs and services (REST, GraphQL, gRPC endpoints called)
- Databases and data stores (PostgreSQL, MongoDB, Redis, S3, etc.)
- Auth providers (OAuth, JWT, Auth0, Firebase Auth, etc.)
- Webhooks (inbound and outbound)
- Third-party SDKs and service clients
- Message queues and event buses (Kafka, RabbitMQ, SQS, etc.)
- Email/SMS/notification services
- Payment providers, analytics, monitoring services

Write TWO files:
- .planning/codebase/STACK.md — Technology stack and dependencies
- .planning/codebase/INTEGRATIONS.md — External APIs, databases, auth providers, webhooks",
  active_form: "Mapping technology stack and integrations"
)
```

**Task 2 — Architecture Mapping:**
```
TaskCreate(
  subject: "Map: Architecture & Structure",
  description: "Analyze the architectural patterns, data flow, directory structure, and code organization of this codebase.

CODEBASE CONTEXT:
{context string from Step 2}

FOCUS AREAS — ARCHITECTURE.md:
- Architectural pattern (MVC, MVVM, Clean Architecture, hexagonal, microservices, monolith, serverless, etc.)
- Entry points (main files, index files, server bootstrap)
- Routing patterns (file-based routing, explicit router, API routes)
- State management approach (Redux, Zustand, Context, Vuex, signals, etc.)
- Data models and database schema (ORM models, migrations, schema files)
- API structure (REST endpoints, GraphQL schema, RPC definitions, tRPC routers)
- Internal module boundaries and dependencies
- Data flow between layers and components
- Abstractions and key interfaces

FOCUS AREAS — STRUCTURE.md:
- Directory structure and organization philosophy (feature-based, layer-based, hybrid)
- Key locations (where to find models, routes, tests, configs, etc.)
- Naming conventions (files, directories, modules)
- Shared code and utility patterns
- Configuration management patterns
- Build output and artifact locations

Write TWO files:
- .planning/codebase/ARCHITECTURE.md — Pattern, layers, data flow, abstractions, entry points
- .planning/codebase/STRUCTURE.md — Directory layout, key locations, naming conventions",
  active_form: "Mapping architecture and structure"
)
```

**Task 3 — Quality Mapping:**
```
TaskCreate(
  subject: "Map: Conventions & Testing",
  description: "Assess code style conventions, coding patterns, test coverage, testing framework, and CI/CD pipelines.

CODEBASE CONTEXT:
{context string from Step 2}

FOCUS AREAS — CONVENTIONS.md:
- Code style and formatting (ESLint, Prettier, Clippy, golangci-lint, Rubocop, etc.)
- Naming conventions (variables, functions, files, classes)
- Code patterns and idioms used consistently
- Error handling conventions
- Logging patterns
- Type safety level (strict TypeScript, mypy, type hints)
- Pre-commit hooks (husky, lint-staged, pre-commit framework)
- Code formatting rules and .editorconfig
- Code review requirements (CODEOWNERS, branch protection indicators)
- Documentation conventions (README, inline docs, API docs, JSDoc/rustdoc/godoc)

FOCUS AREAS — TESTING.md:
- Test files and testing framework (Jest, Vitest, pytest, Go test, RSpec, etc.)
- Test coverage configuration and reports
- Test patterns (unit, integration, e2e, snapshot)
- Test directory structure and naming conventions
- Mocking patterns and test utilities
- CI/CD configuration (GitHub Actions, GitLab CI, CircleCI, Jenkins, etc.)
- Test data and fixtures approach

Write TWO files:
- .planning/codebase/CONVENTIONS.md — Code style, naming, patterns, error handling
- .planning/codebase/TESTING.md — Framework, structure, mocking, coverage",
  active_form: "Mapping conventions and testing"
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

Write findings to: .planning/codebase/CONCERNS.md",
  active_form: "Mapping concerns and technical debt"
)
```

### Step 4: Spawn Mapper Agents

Spawn 4 mapper agents, one per focus area. Each mapper uses the `gmsd-codebase-mapper` agent definition.

For each mapper `i` from 0 to 3, with focus areas `["tech", "architecture", "quality", "concerns"]`:

**Output file mapping:**
- tech mapper writes: `STACK.md` + `INTEGRATIONS.md`
- architecture mapper writes: `ARCHITECTURE.md` + `STRUCTURE.md`
- quality mapper writes: `CONVENTIONS.md` + `TESTING.md`
- concerns mapper writes: `CONCERNS.md`

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
5. Write your analysis to the output file(s) specified in the task description under `.planning/codebase/`
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

### Step 3-Classic: Map Codebase with Parallel Task() Agents

**Condition:** `execution_mode == "classic"`

Instead of creating a team, spawn 4 parallel `Task()` subagents (fire-and-forget). Each mapper writes its output files independently. No shared task list, no inter-agent messaging.

```
// Spawn 4 parallel Task() subagents -- one per focus area
// Use the same task descriptions from Step 3's TaskCreate calls above
// Each gets a self-contained prompt with codebase context and focus area

mapper_tech = Task(
  subagent_type="general-purpose",
  run_in_background=true,
  prompt="You are a GMSD Codebase Mapper. Analyze the technology stack and integrations.

  CODEBASE CONTEXT:
  {context string from Step 2}

  {Same focus areas and instructions as Task 1 from Step 3}

  Write TWO files:
  - .planning/codebase/STACK.md
  - .planning/codebase/INTEGRATIONS.md"
)

mapper_arch = Task(
  subagent_type="general-purpose",
  run_in_background=true,
  prompt="You are a GMSD Codebase Mapper. Analyze the architecture and structure.

  CODEBASE CONTEXT:
  {context string from Step 2}

  {Same focus areas and instructions as Task 2 from Step 3}

  Write TWO files:
  - .planning/codebase/ARCHITECTURE.md
  - .planning/codebase/STRUCTURE.md"
)

mapper_quality = Task(
  subagent_type="general-purpose",
  run_in_background=true,
  prompt="You are a GMSD Codebase Mapper. Analyze conventions and testing.

  CODEBASE CONTEXT:
  {context string from Step 2}

  {Same focus areas and instructions as Task 3 from Step 3}

  Write TWO files:
  - .planning/codebase/CONVENTIONS.md
  - .planning/codebase/TESTING.md"
)

mapper_concerns = Task(
  subagent_type="general-purpose",
  run_in_background=true,
  prompt="You are a GMSD Codebase Mapper. Identify concerns and technical debt.

  CODEBASE CONTEXT:
  {context string from Step 2}

  {Same focus areas and instructions as Task 4 from Step 3}

  Write findings to: .planning/codebase/CONCERNS.md"
)

// Wait for all 4 to complete
WAIT for mapper_tech, mapper_arch, mapper_quality, mapper_concerns

// Verify output files exist
Verify existence of all 7 expected files in .planning/codebase/

// Skip Steps 4-5 (spawn mapper agents, lead monitoring) and Step 7 (team shutdown)
// Proceed directly to Step 6 (Synthesize Results)
```

### Step 6: Synthesize Results

After all mappers complete, read all seven analysis files:
- `.planning/codebase/STACK.md`
- `.planning/codebase/INTEGRATIONS.md`
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/CONVENTIONS.md`
- `.planning/codebase/TESTING.md`
- `.planning/codebase/CONCERNS.md`

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

{Summarized from STACK.md — key technologies, versions, and dependencies}

## External Integrations

{Summarized from INTEGRATIONS.md — APIs, databases, auth providers, services}

## Architecture

{Summarized from ARCHITECTURE.md — patterns, layers, data flow, abstractions}

## Project Structure

{Summarized from STRUCTURE.md — directory layout, key locations, naming}

## Conventions

{Summarized from CONVENTIONS.md — code style, naming, patterns, error handling}

## Testing

{Summarized from TESTING.md — framework, structure, coverage, CI/CD}

## Concerns & Technical Debt

{Summarized from CONCERNS.md — prioritized list of concerns}

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
- [Technology Stack](.planning/codebase/STACK.md)
- [External Integrations](.planning/codebase/INTEGRATIONS.md)
- [Architecture](.planning/codebase/ARCHITECTURE.md)
- [Project Structure](.planning/codebase/STRUCTURE.md)
- [Conventions](.planning/codebase/CONVENTIONS.md)
- [Testing](.planning/codebase/TESTING.md)
- [Concerns & Technical Debt](.planning/codebase/CONCERNS.md)
```

### Step 7: Shutdown Team (Team Mode Only)

**Skip this step if `execution_mode == "classic"`.** Classic mode does not create a team, so there is nothing to shut down.

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

### Step 7b: Commit Codebase Map

After the team is shut down and all documents (including OVERVIEW.md) are written, commit the codebase map:

```bash
git add .planning/codebase/ && git commit -m "gmsd: codebase map for {project_name}"
```

If `project_name` is not available (standalone run without config), use the directory name:
```bash
git add .planning/codebase/ && git commit -m "gmsd: codebase map for $(basename $(pwd))"
```

If the commit fails (e.g., nothing to commit, or git not initialized), note the issue but continue to the summary.

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
- STACK.md — Languages, frameworks, dependencies
- INTEGRATIONS.md — External APIs, databases, services
- ARCHITECTURE.md — Patterns, layers, data flow
- STRUCTURE.md — Directory layout, organization
- CONVENTIONS.md — Code style, naming, patterns
- TESTING.md — Test framework, structure, coverage
- CONCERNS.md — Tech debt, security, deprecated deps
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
