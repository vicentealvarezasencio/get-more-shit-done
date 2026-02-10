# Workflow: Execution Mode Check

**Reusable prerequisite check for team-creating commands.**

Embed this check before any step that uses `TeamCreate`, `SendMessage`, or shared `TaskList` coordination. It determines whether to use the Agent Teams path or the Classic GSD path.

---

## Execution Mode Detection

```
1. Read .planning/config.json -> execution_mode

2. IF execution_mode == "team":
   - Proceed with team workflow (TeamCreate, SendMessage, shared TaskList)
   - If TeamCreate fails with an experimental flag error:
     WARN: "Agent Teams requires the experimental flag.
       Add to ~/.claude/settings.json under 'env':
         CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1'
       Or run: export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

       Switch to classic mode for now? (yes / no)"
     IF yes: update config.json execution_mode to "classic", proceed with classic path
     IF no: STOP and let user enable the flag

3. IF execution_mode == "classic":
   - Proceed with classic workflow path (fire-and-forget Task() subagents)
   - No TeamCreate, no SendMessage, no shared TaskList
   - Wave-based execution with parallel Task() calls

4. IF execution_mode == null (not yet chosen):
   - Present the user with AskUserQuestion:

     Question: "Which execution mode would you like to use?"
     Header: "Exec Mode"

     Option A: "Agent Teams (Recommended)"
       Description: "Coordinated agent teams with shared task lists.
         Agents claim tasks, communicate in real-time, and scale
         dynamically. Requires the experimental Agent Teams flag
         in Claude Code (CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1)."

     Option B: "Classic GSD Workflow"
       Description: "The original GSD approach using independent
         fire-and-forget agents. Wave-based execution, no inter-agent
         communication. Works on any Claude Code installation without
         experimental flags."

   - IF user picks "Agent Teams":
     a. Attempt to verify the experimental flag is available
     b. IF flag is NOT available:
        Show: "Agent Teams requires the experimental flag. To enable it:

          Option 1 (persistent): Add to ~/.claude/settings.json:
            {
              \"env\": {
                \"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS\": \"1\"
              }
            }

          Option 2 (session only): Run in your terminal:
            export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

          Would you like me to write it to ~/.claude/settings.json for you?
          (yes / no / switch to classic instead)"

        IF yes: read ~/.claude/settings.json, merge the env key, write it back
        IF no: STOP and let user enable manually
        IF switch: save "classic" to config.json, proceed with classic path

     c. IF flag IS available (or was just enabled):
        Save "team" to config.json execution_mode
        Proceed with team workflow

   - IF user picks "Classic GSD Workflow":
     Save "classic" to config.json execution_mode
     Proceed with classic workflow path
```

---

## Key Differences Between Modes

| Feature | Team Mode | Classic Mode |
|---|---|---|
| Dispatch | Shared task list, dynamic claiming | Pre-computed waves, fire-and-forget |
| Communication | Real-time messaging between agents | None -- agents work independently |
| Scaling | Dynamic (spawn more agents on demand) | Fixed (set at wave start) |
| File conflicts | Detected and resolved via messaging | Prevented by wave ordering |
| Root cause sharing | Broadcasts to all peers | Not available |
| Task format | Same self-contained briefs | Same self-contained briefs |
| Requires | CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 | Nothing -- works everywhere |

---

## Usage in Commands

Commands that create teams should embed this check before their team-creating step:

```
### Step {N}: Execution Mode Check

Reference: workflows/execution-mode-check.md

Read .planning/config.json -> execution_mode.
Follow the execution mode detection logic above.

IF execution_mode == "team": proceed to Step {team_step}
IF execution_mode == "classic": proceed to Step {classic_step}
```
