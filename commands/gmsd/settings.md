# GMSD Settings — Configuration Management

You are the GMSD settings manager. Display current configuration and allow the user to modify settings interactively.

## Instructions

### 1. Read Current Configuration

Attempt to read `.planning/config.json` from the current working directory.

**If it does NOT exist**, use these defaults (from the GMSD template):

```json
{
  "project_name": "(not set)",
  "version": "0.1.0",
  "mode": "guided",
  "teams": {
    "default_executors": 3,
    "max_executors": 5,
    "default_researchers": 3,
    "default_debuggers": 2,
    "scale_up_threshold": 5
  },
  "git": {
    "auto_commit": true,
    "commit_per": "task",
    "commit_prefix": "gmsd"
  },
  "model_overrides": {},
  "design": {
    "enabled": true,
    "auto_detect": true,
    "default_adapter": "v0"
  }
}
```

**If it exists**, read and parse it.

### 2. Display Current Settings

Show all settings in a readable format:

```
 ┌─────────────────────────────────────────────────────────────────┐
 │  GMSD Settings                                                 │
 └─────────────────────────────────────────────────────────────────┘

 PROJECT
 ─────────────────────────────────────────────────────────────
 Project Name:    {project_name}
 Version:         {version}

 MODE
 ─────────────────────────────────────────────────────────────
 Current Mode:    {mode}

   guided   — Pauses for confirmation before major actions.
              Detailed explanations at every step. Best for
              learning or critical projects.

   balanced — Pauses at phase boundaries and major decisions.
              Skips routine confirmations. Good default.

   yolo     — Runs autonomously. Only pauses when genuinely
              stuck or at user-defined checkpoints. Maximum
              speed for experienced users.

 TEAM SIZES
 ─────────────────────────────────────────────────────────────
 Default Executors:    {teams.default_executors}
 Max Executors:        {teams.max_executors}
 Default Researchers:  {teams.default_researchers}
 Default Debuggers:    {teams.default_debuggers}
 Scale Up Threshold:   {teams.scale_up_threshold} tasks

 GIT SETTINGS
 ─────────────────────────────────────────────────────────────
 Auto Commit:     {git.auto_commit}
 Commit Per:      {git.commit_per}  (task | plan)
 Commit Prefix:   {git.commit_prefix}

 MODEL OVERRIDES
 ─────────────────────────────────────────────────────────────
 {Show each override as: role: model}
 {If empty, show: "No overrides set. Using defaults."}

 Available roles: researcher, planner, plan-checker, executor,
                  verifier, debugger

 DESIGN SETTINGS
 ─────────────────────────────────────────────────────────────
 Enabled:           {design.enabled}
 Auto Detect UI:    {design.auto_detect}
 Default Adapter:   {design.default_adapter}
```

### 3. Ask What to Change

Use conversational interaction to ask the user what they want to modify:

Ask: **"What would you like to change? You can say things like:"**
- "Set mode to yolo"
- "Change default executors to 5"
- "Add model override for executor: opus"
- "Disable auto commit"
- "Turn off design phase"
- "Nothing — looks good"

If the user says "nothing" or similar, skip to step 5.

### 4. Apply Changes

Based on the user's response, update the appropriate fields in config.json.

**Mode changes:**
- Validate that the value is one of: `guided`, `balanced`, `yolo`
- Also update `state.json` mode field to keep them in sync

**Team size changes:**
- Validate numbers are positive integers
- Warn if `max_executors` is set above 5 (token cost warning)
- Warn if `default_executors` exceeds `max_executors`

**Git settings:**
- `auto_commit`: must be true or false
- `commit_per`: must be "task" or "plan"
- `commit_prefix`: any string, but suggest keeping it short

**Model overrides:**
- Valid roles: `researcher`, `planner`, `plan-checker`, `executor`, `verifier`, `debugger`
- Valid model values: Any string (common values: `opus`, `sonnet`, `haiku`)
- Show the current override table after changes

**Design settings:**
- `enabled`: true or false
- `auto_detect`: true or false
- `default_adapter`: string (common values: `v0`, `lovable`, `bolt`)

After applying changes, write the updated config.json. Show a confirmation:

```
 Settings updated:
   {field}: {old_value} --> {new_value}
```

Ask if the user wants to change anything else. Repeat until they are done.

### 5. What's Next Section

Read `.planning/state.json` if it exists to determine current project status.

**If no project exists:**
```
---
## What's Next

Current: No active project | Mode: {mode}

**Recommended next step:**
--> /gmsd:new-project — Initialize your project with your configured settings

**Other options:**
- /gmsd:help — View the full command reference
```

**If a project exists:**
```
---
## What's Next

Current: Phase {N} — {name} | Status: {status} | Mode: {mode}

**Recommended next step:**
--> /gmsd:{next-command} — {why this is the right next step}

**Other options:**
- /gmsd:progress — Check full project status
- /gmsd:help — View full command reference
```

Determine the recommended next command using the same routing logic as `/gmsd:progress`.

### 6. Update State (if project exists)

If `.planning/state.json` exists, append to the history array:
```json
{ "command": "/gmsd:settings", "timestamp": "{ISO timestamp}", "result": "Updated settings: {list of changed fields}" }
```

If no changes were made, use: `"result": "Viewed settings, no changes"`

Update `last_command` to `/gmsd:settings` and `last_updated` to the current ISO timestamp.

### 7. Sync CLAUDE.md

Regenerate the project's `.claude/CLAUDE.md` to reflect current state:
1. Read all project artifacts (.planning/state.json, config.json, PROJECT.md, ROADMAP.md, current phase CONTEXT.md, PLAN.md, design tokens, todos, tech debt)
2. Generate a concise, actionable CLAUDE.md summary following the template in workflows/claude-md-sync.md
3. Write to `.claude/CLAUDE.md` (create .claude/ directory if needed)
