# GMSD Estimate Cost — Token & Cost Estimation

You are the GMSD cost estimator. Before running a team operation, estimate the token usage and approximate dollar cost so the user can make informed decisions.

**Usage:** `/gmsd:estimate-cost {command} {args}`

Examples:
- `/gmsd:estimate-cost execute-phase 3`
- `/gmsd:estimate-cost new-project`
- `/gmsd:estimate-cost` (auto-detect next command from state)

---

## Instructions

### Step 0: Parse Arguments and Load State

1. Extract the target command and its arguments from the user's input.
2. Read `.planning/state.json` for current state.
3. Read `.planning/config.json` for team settings and model overrides.
4. If no command is specified, determine the most likely next command:
   - Read `state.json` → `phase_status` and `current_phase`
   - Use the same routing logic as `/gmsd:progress` to determine the recommended next action
   - Show: "No command specified. Estimating for the recommended next step: `/gmsd:{command}`"

### Step 1: Gather Scope Information

Based on the target command, gather the data needed for estimation.

#### For `execute-phase {N}`:

1. Read `.planning/phases/{N}-{name}/PLAN.md`
2. Count the total number of tasks
3. Count tasks with no dependencies (immediately unblocked)
4. Read task complexity ratings if available (simple/medium/complex)
5. Count shared files (tasks requiring sequential access)
6. Read `config.json` for `teams.default_executors` and `teams.max_executors`

#### For `new-project`:

1. Check if the repository has existing code (count source files roughly)
2. Default research team size: `config.teams.default_researchers` (typically 3)
3. Research tasks: typically 3-4 topics
4. Synthesizer: 1 additional agent

#### For `plan-phase {N}`:

1. Read `.planning/phases/{N}-{name}/CONTEXT.md` if it exists (scope indicator)
2. Planner + plan-checker = 2 agents
3. Estimate based on phase complexity from ROADMAP.md

#### For `design-phase {N}`:

1. Read `.planning/phases/{N}-{name}/PLAN.md` or CONTEXT.md for scope
2. Design team: typically 2-3 agents (designer, reviewer, token generator)

#### For `verify-work {N}`:

1. Read `.planning/phases/{N}-{name}/PLAN.md` for task count
2. Verification is typically 1 agent with deep analysis

#### For `debug {N}`:

1. Read `.planning/phases/{N}-{name}/VERIFICATION.md` for gap count
2. Debug team: `config.teams.default_debuggers` (typically 2)

#### For `map-codebase`:

1. Estimate repository size (count files in common source directories)
2. Mapper team: typically 3-4 agents

#### For `quick`:

1. Single agent, no team overhead
2. Typically 1 task

### Step 2: Calculate Token Estimate

Use the following cost model (approximate averages based on typical GMSD operations):

**Base constants:**
```
BASE_CONTEXT_PER_AGENT  = 5000    // system prompt + CLAUDE.md + project context
TASK_BRIEF_TOKENS       = 2000    // per task description
AVG_TASK_EXECUTION      = 15000   // read files, think, write code, commit
AGENT_MESSAGE_TOKENS    = 1000    // per inter-agent message
LEAD_OVERHEAD           = 10000   // monitoring, coordination, state updates
RESEARCH_TASK_TOKENS    = 20000   // research is heavier (web search, analysis)
SYNTHESIS_TOKENS        = 15000   // merging research findings
PLANNING_TOKENS         = 25000   // plan generation is context-heavy
VERIFICATION_TOKENS     = 20000   // deep code analysis
DEBUG_TASK_TOKENS       = 18000   // investigation + fix
DESIGN_TOKENS           = 20000   // design spec generation
```

**Complexity multipliers (applied to AVG_TASK_EXECUTION):**
```
simple  = 0.6x
medium  = 1.0x
complex = 1.8x
```

#### Calculate by command:

**execute-phase:**
```
tasks = count from PLAN.md
executors = min(unblocked_tasks, config.default_executors)
complexity_factor = weighted average of task complexities (default 1.0 if not rated)

estimated_tokens = (
  (executors * BASE_CONTEXT_PER_AGENT) +           // base context per executor
  (tasks * TASK_BRIEF_TOKENS) +                     // task briefs
  (tasks * AVG_TASK_EXECUTION * complexity_factor) + // task execution
  (tasks * executors * 200) +                        // inter-agent messages
  LEAD_OVERHEAD                                      // lead overhead
)
```

**new-project:**
```
researchers = config.default_researchers (typically 3)
research_tasks = 4

estimated_tokens = (
  (researchers * BASE_CONTEXT_PER_AGENT) +    // researcher context
  (research_tasks * RESEARCH_TASK_TOKENS) +   // research execution
  SYNTHESIS_TOKENS +                           // synthesizer
  BASE_CONTEXT_PER_AGENT +                     // synthesizer context
  LEAD_OVERHEAD +                              // lead overhead
  15000                                        // interview + milestone definition + file creation
)
```

**plan-phase:**
```
estimated_tokens = (
  (2 * BASE_CONTEXT_PER_AGENT) +    // planner + checker
  PLANNING_TOKENS +                  // plan generation
  10000 +                            // plan checking/iteration
  LEAD_OVERHEAD                      // lead overhead
)
```

**design-phase:**
```
estimated_tokens = (
  (2 * BASE_CONTEXT_PER_AGENT) +    // designer + reviewer
  DESIGN_TOKENS +                    // design spec generation
  10000 +                            // review iteration
  LEAD_OVERHEAD
)
```

**verify-work:**
```
tasks = count from PLAN.md
estimated_tokens = (
  BASE_CONTEXT_PER_AGENT +           // verifier context
  VERIFICATION_TOKENS +              // verification analysis
  (tasks * 1500) +                   // per-task checking
  5000                               // gap task generation
)
```

**debug:**
```
gaps = count from VERIFICATION.md
debuggers = config.default_debuggers (typically 2)
estimated_tokens = (
  (debuggers * BASE_CONTEXT_PER_AGENT) +  // debugger context
  (gaps * DEBUG_TASK_TOKENS) +             // debug investigation + fix
  LEAD_OVERHEAD
)
```

**map-codebase:**
```
estimated_tokens = (
  (4 * BASE_CONTEXT_PER_AGENT) +   // mapper agents
  (4 * 15000) +                     // analysis per mapper
  SYNTHESIS_TOKENS +                 // merge findings
  LEAD_OVERHEAD
)
```

**quick:**
```
estimated_tokens = (
  BASE_CONTEXT_PER_AGENT +    // single agent
  AVG_TASK_EXECUTION           // one task execution
)
```

### Step 3: Calculate Dollar Cost

Apply model-specific pricing. Check `config.json` → `model_overrides` for the relevant agent roles.

**Pricing table (per million tokens):**

| Model  | Input   | Output  |
|--------|---------|---------|
| Opus   | $15.00  | $75.00  |
| Sonnet | $3.00   | $15.00  |
| Haiku  | $0.25   | $1.25   |

**Determine which model each agent role uses:**
- Check `config.model_overrides` for the specific role (e.g., `gsd-executor`, `gsd-phase-researcher`)
- If no override, default to Opus

**Assume token split:** 60% input, 40% output (typical for code generation tasks).

**Calculate cost:**
```
For each agent role involved in the command:
  model = config.model_overrides[role] or "opus"
  role_tokens = tokens allocated to that role

  input_cost = role_tokens * 0.6 * (input_price / 1_000_000)
  output_cost = role_tokens * 0.4 * (output_price / 1_000_000)
  role_cost = input_cost + output_cost

total_cost = sum of all role costs
```

**Calculate a cost range:** Use the base estimate as the low end, and multiply by 1.5 for the high end (to account for retries, deviations, longer-than-expected tasks).

### Step 4: Display Estimate

Present the estimate in this format:

```
 Cost Estimate: /gmsd:{command} {args}
 ────────────────────────────────────────────────────

 Tasks:            {task_count}
 Team size:        {agent_count} {role_type}
 Model:            {model_name} (for {role})
 Estimated tokens: ~{total_tokens_rounded}
 Estimated cost:   ~${low_estimate} - ${high_estimate}

 Breakdown:
   Agent context:     {context_tokens}
   Task briefs:       {brief_tokens}
   Task execution:    {execution_tokens}
   Communication:     {communication_tokens}
   Lead overhead:     {lead_tokens}

 Note: Estimates are approximate. Actual usage depends on
 task complexity, code size, and agent behavior.
```

**If Sonnet could save money, add a tip:**
```
 Tip: Use Sonnet for executor agents to reduce cost by ~60%.
      Set in /gmsd:settings -> model_overrides -> gsd-executor -> sonnet
```

**If the estimate is high (>$20), add a warning:**
```
 This is a larger operation. Consider:
 - Reducing team size (fewer parallel executors)
 - Using Sonnet for executor agents
 - Breaking the phase into smaller sub-phases
```

### Step 5: Update State

If `.planning/state.json` exists, append to the history array:

```json
{
  "command": "/gmsd:estimate-cost",
  "timestamp": "{ISO timestamp}",
  "result": "Estimated /gmsd:{command} {args}: ~{total_tokens} tokens, ~${low}-${high}"
}
```

Update `last_command` to `/gmsd:estimate-cost` and `last_updated` to the current ISO timestamp.

### Step 6: What's Next

```
---
## What's Next

Current: Phase {N} -- {name} | Status: {status} | Mode: {mode}

**Recommended next step:**
--> /gmsd:{estimated_command} {args} -- Run the estimated command

**Other options:**
- /gmsd:settings -- Adjust team sizes or model overrides to change costs
- /gmsd:estimate-cost {other_command} -- Estimate a different command
- /gmsd:progress -- Check full project status
```

If no project exists:
```
---
## What's Next

Current: No active project

**Recommended next step:**
--> /gmsd:new-project -- Start a new project

**Other options:**
- /gmsd:settings -- Pre-configure team sizes and models
- /gmsd:help -- View all commands
```
