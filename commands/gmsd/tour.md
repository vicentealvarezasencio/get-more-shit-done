# GMSD Tour — Interactive Walkthrough

You are the GMSD tour guide. Walk the user through the entire GMSD workflow with explanations, examples, and mock demonstrations so they understand how the system works before starting a real project.

**Usage:** `/gmsd:tour`

**Important:** This tour does NOT modify the user's project. It uses explanations and examples only. No state updates, no file creation in the user's workspace, no team spawning.

---

## Instructions

### Step 0: Check Mode and Greet

1. Read `.planning/config.json` if it exists to check the current mode. If no config exists, assume `guided` mode.
2. Determine the tour depth based on mode:
   - **guided** — Full interactive walkthrough with pauses at each step. Ask questions, offer to elaborate.
   - **balanced** — Condensed version. Show each step with a brief explanation, pause only at key moments.
   - **yolo** — Quick summary of all commands with one-line descriptions. No pauses.

3. Display the welcome message:

```
 ┌─────────────────────────────────────────────────────────────────┐
 │                                                                 │
 │   Welcome to the GMSD Tour                                     │
 │                                                                 │
 │   Learn how Get More Shit Done orchestrates agent teams         │
 │   to build software faster and more reliably.                   │
 │                                                                 │
 │   Duration: ~5 minutes (balanced) | ~10 minutes (guided)        │
 │                                                                 │
 │   This tour will NOT modify your project.                       │
 │   Everything shown is an example or explanation.                │
 │                                                                 │
 └─────────────────────────────────────────────────────────────────┘
```

**If mode is `yolo`, skip to Step 7 (Quick Summary).**

### Step 1: Project Initialization

**Explain:**

```
 STEP 1 of 6: Project Initialization (/gmsd:new-project)
 ─────────────────────────────────────────────────────────────

 This is where every GMSD project starts. The command:

 1. Interviews you about your project (vision, users, requirements)
 2. Auto-detects your tech stack from existing code
 3. Can apply a project preset (nextjs, ios, api, cli, etc.)
 4. Spawns a parallel research team (3 agents) to explore:
    - Technical landscape and best libraries
    - Competitive analysis and existing solutions
    - Architecture patterns and best practices
 5. Synthesizes research into a unified RESEARCH.md
 6. Helps you define milestones and a phase roadmap
```

**Show example directory structure:**

```
 After /gmsd:new-project, your project gets a .planning/ directory:

 .planning/
 ├── config.json        # Team sizes, mode, git settings, model overrides
 ├── state.json         # Current phase, status, history, metrics
 ├── STATE.md           # Human-readable state summary
 ├── PROJECT.md         # Vision, requirements, milestones, constraints
 ├── RESEARCH.md        # Synthesized research findings
 ├── ROADMAP.md         # Phase breakdown with dependencies
 └── phases/
     ├── 1-setup/       # Each phase gets its own directory
     ├── 2-core-ui/
     ├── 3-api/
     └── ...
```

**Show example config.json:**

```json
 {
   "project_name": "todo-app",
   "version": "0.1.0",
   "mode": "balanced",
   "preset": "nextjs",
   "teams": {
     "default_executors": 3,
     "max_executors": 5,
     "scale_up_threshold": 4
   },
   "git": {
     "auto_commit": true,
     "commit_per": "task",
     "commit_prefix": "gmsd"
   },
   "model_overrides": {},
   "design": {
     "adapter": "tailwind",
     "dark_mode": true
   }
 }
```

**If guided mode:** Ask "Any questions about project initialization, or shall we continue to phase discussion?"

**If balanced mode:** Brief pause, then continue.

### Step 2: Phase Discussion

**Explain:**

```
 STEP 2 of 6: Phase Discussion (/gmsd:discuss-phase {N})
 ─────────────────────────────────────────────────────────────

 Before planning a phase, GMSD gathers YOUR decisions on key topics.
 This prevents the AI from making assumptions you disagree with.

 The discussion covers:
 - Architecture decisions (patterns, folder structure, conventions)
 - Technology choices (libraries, tools, versions)
 - UX approach (interaction patterns, navigation, states)
 - Scope boundaries (what is included vs explicitly excluded)
 - Priority trade-offs (speed vs quality, features vs stability)

 Your decisions are locked into a CONTEXT.md file that becomes
 a binding constraint for all subsequent planning and execution.
```

**Show example CONTEXT.md excerpt:**

```
 Example decisions from a discussion:

 Decision #1: State Management
   Question: How should we handle client state?
   Answer: Use Zustand for client state, React Query for server state.
   Rationale: Simpler than Redux, built-in devtools, small bundle.

 Decision #2: Authentication
   Question: What auth approach?
   Answer: NextAuth.js with GitHub and Google providers.
   Rationale: Proven library, supports our needed providers.

 Decision #3: Database
   Question: What database?
   Answer: PostgreSQL via Prisma ORM.
   Rationale: Type-safe queries, easy migrations.

 These decisions are NON-NEGOTIABLE during planning and execution.
 Agents cannot override them without your explicit approval.
```

**If guided mode:** Ask "This is a key concept -- your decisions drive everything downstream. Questions?"

### Step 3: Phase Planning

**Explain:**

```
 STEP 3 of 6: Phase Planning (/gmsd:plan-phase {N})
 ─────────────────────────────────────────────────────────────

 Planning spawns a small team (planner + plan-checker) that creates
 a detailed PLAN.md with:

 - Numbered tasks with descriptions and acceptance criteria
 - Task dependencies (which tasks block others)
 - File ownership map (which tasks own which files)
 - Complexity ratings (simple/medium/complex)
 - Verification spec (how to confirm the phase goal is met)

 The plan-checker reviews the plan for:
 - Missing edge cases
 - Dependency gaps
 - File conflicts
 - Unrealistic scope
```

**Show example PLAN.md excerpt:**

```
 Example task from a PLAN.md:

 ## Task 3: Create authentication API routes

 Complexity: medium
 Dependencies: Task 1 (project setup), Task 2 (database schema)

 Files to Create or Modify:
 - src/app/api/auth/[...nextauth]/route.ts  (create)
 - src/lib/auth.ts                           (create)
 - .env.example                              (modify)

 Acceptance Criteria:
 - [ ] NextAuth.js configured with GitHub + Google providers
 - [ ] Session callback includes user ID
 - [ ] Protected API routes return 401 without valid session
 - [ ] Environment variables documented in .env.example

 This level of detail means executors know EXACTLY what to build.
 No ambiguity, no guessing, no conflicting file modifications.
```

**If guided mode:** Ask "The plan is where quality is front-loaded. Want to know more about how the plan-checker works?"

### Step 4: Team Execution

**Explain:**

```
 STEP 4 of 6: Team Execution (/gmsd:execute-phase {N})
 ─────────────────────────────────────────────────────────────

 This is the core of GMSD. A team of executor agents works in
 parallel using a shared task list with continuous flow:

 1. The lead (you/GMSD) creates a shared task list from PLAN.md
 2. Executor agents are spawned (default: 3, max: 5)
 3. Each executor autonomously:
    a. Claims an unblocked task from the shared list
    b. Reads the full self-contained task description
    c. Implements the code, following all constraints
    d. Self-checks against acceptance criteria
    e. Commits with a conventional format
    f. Reports completion and claims the next task
 4. The lead monitors progress, handles deviations, and coordinates

 Key features:
 - Continuous flow: agents grab the next task as soon as they finish
 - Dynamic scaling: more agents spawn if many tasks become unblocked
 - File ownership: no two agents modify the same file simultaneously
 - Deviation protocol: agents ask permission before deviating from spec

 Execution Modes:
 GMSD supports two execution modes (configurable via /gmsd:settings):

 - Agent Teams mode: The full coordinated experience described above.
   Requires the experimental Agent Teams flag in Claude Code
   (CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1).

 - Classic GSD mode: The original GSD approach using independent
   fire-and-forget agents with wave-based execution. No shared task
   list or inter-agent messaging. Works on any Claude Code installation
   without experimental flags.

 You will be prompted to choose your mode the first time you run a
 team-creating command.
```

**Show mock execution timeline:**

```
 Mock Execution Timeline (Phase 2: Core UI Components, 8 tasks):

 Time  executor-0          executor-1          executor-2
 ────  ──────────────────  ──────────────────  ──────────────────
 0:00  Claim Task 1        Claim Task 2        Claim Task 3
       (Layout component)  (Navigation bar)    (Theme provider)

 0:03  Working...          Working...          Complete Task 3
                                               Commit: gmsd(phase-2): add theme provider
                                               Claim Task 4 (Button component)

 0:05  Complete Task 1     Working...          Working...
       Commit: gmsd(phase-2): add layout component
       Claim Task 5 (Card component)

 0:07  Working...          Complete Task 2     Complete Task 4
                           Commit: gmsd(phase-2): add navigation bar
                           Claim Task 6        Claim Task 7
                           (Form components)   (Modal component)

 0:10  Complete Task 5     Working...          Complete Task 7
       Commit: gmsd(phase-2): add card component
       Claim Task 8                            [No more tasks]
       (Page templates)                        Standing by.

 0:12  Working...          Complete Task 6     [idle]
                           Commit: gmsd(phase-2): add form components
                           [No more tasks]
                           Standing by.

 0:14  Complete Task 8
       Commit: gmsd(phase-2): add page templates

 ---- ALL TASKS COMPLETE ----

 Duration: ~14 minutes
 Tasks: 8/8 completed
 Commits: 8
 Deviations: 0
```

**If guided mode:** Ask "This is where the real work happens. The key insight is that task descriptions are SELF-CONTAINED -- each executor has everything it needs without asking. Questions about execution?"

### Step 5: Verification

**Explain:**

```
 STEP 5 of 6: Verification (/gmsd:verify-work {N})
 ─────────────────────────────────────────────────────────────

 After execution, GMSD runs goal-backward verification:

 Instead of just checking "did each task complete?", it asks:
 "Does the PHASE GOAL actually work?"

 The verifier:
 1. Re-reads the phase goal and acceptance criteria
 2. Examines the actual code that was written
 3. Tests functionality end-to-end where possible
 4. Checks for gaps between what was planned and what exists
 5. Generates a VERIFICATION.md with:
    - Pass/fail status for each criterion
    - Gap list with severity ratings
    - Suggested fix tasks for any gaps

 If gaps are found, you can:
 - Run /gmsd:execute-phase {N} again (only gap tasks are created)
 - Run /gmsd:debug {N} for investigation-heavy issues
 - Accept minor gaps and move to the next phase
```

**Show example verification output:**

```
 Example VERIFICATION.md summary:

 Phase Goal: "Users can sign up, log in, and access protected routes"

 Criterion                                    Status
 ───────────────────────────────────────────   ──────
 Sign-up form submits and creates user         PASS
 Login with GitHub OAuth works                 PASS
 Login with Google OAuth works                 PASS
 Protected routes redirect unauthenticated     PASS
 Session persists across page refresh          PASS
 Logout clears session                         GAP (minor)
 Error states shown for failed auth            GAP (minor)

 Gaps Found: 2
 - Logout button exists but does not clear server session (minor)
 - Auth error states show generic message, not specific error (minor)

 Overall: PASS with minor gaps
 Recommendation: Fix gaps in a quick re-execution (~5 min)
```

**If guided mode:** Ask "Goal-backward verification catches things that task-level checking misses. Any questions?"

### Step 6: The Bigger Picture

**Explain:**

```
 STEP 6 of 6: The Full Lifecycle
 ─────────────────────────────────────────────────────────────

 A typical project flows through milestones, each with phases:

 Milestone 1 (v0.1.0):
   Phase 1: Setup      -->  discuss -> plan -> execute -> verify
   Phase 2: Core UI    -->  discuss -> plan -> execute -> verify
   Phase 3: API        -->  discuss -> plan -> execute -> verify
   Phase 4: Auth       -->  discuss -> plan -> execute -> verify
   Phase 5: Testing    -->  discuss -> plan -> execute -> verify
   /gmsd:audit-milestone --> check quality gates
   /gmsd:milestone       --> archive and advance to v0.2.0

 Other commands you should know:

 Navigation:
   /gmsd:progress        Your GPS. Shows where you are, suggests next step.
   /gmsd:pause-work      Save state mid-phase for later resumption.
   /gmsd:resume-work     Pick up where you left off.

 Quick Actions:
   /gmsd:quick           Small task without full ceremony (bug fix, tweak).
   /gmsd:map-codebase    Analyze an existing codebase with agent team.

 Management:
   /gmsd:add-todo        Capture ideas and tasks for later.
   /gmsd:check-todos     Review and manage pending todos.
   /gmsd:settings        Adjust team sizes, mode, models, git settings.
   /gmsd:estimate-cost   Preview token usage and dollar cost before running.

 Roadmap:
   /gmsd:add-phase       Add a phase to the roadmap.
   /gmsd:insert-phase    Insert urgent work between phases.
   /gmsd:remove-phase    Remove a pending phase.

 Lifecycle:
   /gmsd:retrospective   Post-milestone analysis and lessons learned.
   /gmsd:new-milestone    Start the next version cycle.
```

**If guided mode:** Ask "That covers the full GMSD workflow. Any final questions before we wrap up?"

### Step 7: Quick Summary (Yolo Mode Only)

If the mode is `yolo`, skip steps 1-6 and show this condensed reference instead:

```
 GMSD Quick Reference
 ─────────────────────────────────────────────────────────────

 WORKFLOW (for each phase):
   /gmsd:new-project              Init project, research, milestones
   /gmsd:discuss-phase {N}        Lock decisions -> CONTEXT.md
   /gmsd:plan-phase {N}           Generate PLAN.md with task list
   /gmsd:design-phase {N}         UI specs (optional, if visual)
   /gmsd:execute-phase {N}        Parallel team execution
   /gmsd:verify-work {N}          Goal-backward verification

 NAVIGATION:
   /gmsd:progress                 Status + next step suggestion
   /gmsd:pause-work / resume-work Session management

 QUICK:
   /gmsd:quick                    Small task, no ceremony
   /gmsd:map-codebase             Analyze existing code

 MANAGEMENT:
   /gmsd:settings                 Config (mode, teams, git, models)
   /gmsd:estimate-cost {cmd}      Token/cost preview
   /gmsd:add-todo / check-todos   Task capture

 ROADMAP:
   /gmsd:add-phase / insert-phase / remove-phase

 LIFECYCLE:
   /gmsd:audit-milestone          Quality gate
   /gmsd:milestone                Archive + advance version
   /gmsd:retrospective            Lessons learned
   /gmsd:new-milestone            Start next version

 MODES:
   guided   = explain everything, confirm before actions
   balanced = pause at boundaries, skip routine confirms
   yolo     = maximum autonomy, minimal interruption

 Run /gmsd:new-project to start.
```

### Step 8: Wrap Up

```
 ─────────────────────────────────────────────────────────────

 You are ready to start building with GMSD.

 Key things to remember:
 1. /gmsd:progress is your GPS -- use it when unsure what to do next
 2. Decisions in discuss-phase are binding -- invest time there
 3. Plans are detailed by design -- this is where quality is front-loaded
 4. Execution is parallel and autonomous -- trust the process
 5. Verification catches what task-checking misses

 ─────────────────────────────────────────────────────────────
```

```
---
## What's Next

**Recommended next step:**
--> /gmsd:new-project -- Start your first real project

**Other options:**
- /gmsd:settings -- Pre-configure GMSD before starting
- /gmsd:help -- View the full command reference
- /gmsd:estimate-cost new-project -- See what it will cost
```

**Do NOT update state.json.** The tour is informational only and does not affect project state.
