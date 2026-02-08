#!/usr/bin/env bash

# ─────────────────────────────────────────────────────────────────────────────
# GMSD tmux Auto-Layout Helper
#
# Sets up a tmux window with split panes for GMSD team visibility.
# Creates a layout with:
#   - Top-left: Lead agent (largest pane)
#   - Right/bottom: One pane per executor/teammate
#   - Bottom strip: A small pane for monitoring/status
#
# Usage:
#   bin/tmux-layout.sh [OPTIONS]
#
# Options:
#   -n, --agents NUM       Number of executor agents (default: 3)
#   -s, --session NAME     tmux session name (default: "gmsd")
#   --cleanup              Restore single-pane layout (kill all splits)
#   -h, --help             Show this help message
#
# Part of Get More Shit Done (GMSD) for Claude Code
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# Defaults
NUM_AGENTS=3
SESSION_NAME="gmsd"
CLEANUP=false

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

usage() {
  cat <<EOF
${BOLD}GMSD tmux Auto-Layout Helper${RESET}

Sets up split panes for GMSD team visibility during execution.

${BOLD}Usage:${RESET}
  $(basename "$0") [OPTIONS]

${BOLD}Options:${RESET}
  -n, --agents NUM       Number of executor agents (default: 3)
  -s, --session NAME     tmux session name (default: "gmsd")
  --cleanup              Restore single-pane layout (kill all extra panes)
  -h, --help             Show this help message

${BOLD}Layout:${RESET}
  ┌──────────────────┬──────────────┐
  │                  │  executor-0  │
  │   Lead Agent     ├──────────────┤
  │   (largest)      │  executor-1  │
  │                  ├──────────────┤
  │                  │  executor-2  │
  ├──────────────────┴──────────────┤
  │  Status / Monitoring            │
  └─────────────────────────────────┘

${BOLD}Examples:${RESET}
  $(basename "$0")                    # Default: 3 agents, session "gmsd"
  $(basename "$0") -n 5 -s myproject  # 5 agents, session "myproject"
  $(basename "$0") --cleanup          # Remove all split panes
EOF
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -n|--agents)
      NUM_AGENTS="$2"
      shift 2
      ;;
    -s|--session)
      SESSION_NAME="$2"
      shift 2
      ;;
    --cleanup)
      CLEANUP=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo -e "${RED}Error: Unknown option '$1'${RESET}" >&2
      echo "Use --help for usage information." >&2
      exit 1
      ;;
  esac
done

# Validate we are inside tmux
if [[ -z "${TMUX:-}" ]]; then
  echo -e "${RED}Error: Not running inside a tmux session.${RESET}" >&2
  echo "" >&2
  echo "Start a tmux session first:" >&2
  echo "  tmux new-session -s ${SESSION_NAME}" >&2
  echo "" >&2
  echo "Or attach to an existing one:" >&2
  echo "  tmux attach-session -t ${SESSION_NAME}" >&2
  exit 1
fi

# Validate agent count
if ! [[ "$NUM_AGENTS" =~ ^[1-9][0-9]*$ ]]; then
  echo -e "${RED}Error: --agents must be a positive integer (got '${NUM_AGENTS}').${RESET}" >&2
  exit 1
fi

if [[ "$NUM_AGENTS" -gt 10 ]]; then
  echo -e "${YELLOW}Warning: ${NUM_AGENTS} agents is a lot of panes. Layout may be cramped.${RESET}"
fi

# Get the current window
CURRENT_WINDOW=$(tmux display-message -p '#{window_id}')

# ─── Cleanup Mode ────────────────────────────────────────────────────────────

if [[ "$CLEANUP" == true ]]; then
  echo -e "${CYAN}Cleaning up GMSD tmux layout...${RESET}"

  # Get all pane IDs in the current window, keep only the first one
  PANE_IDS=$(tmux list-panes -t "$CURRENT_WINDOW" -F '#{pane_id}')
  FIRST_PANE=""
  for pane_id in $PANE_IDS; do
    if [[ -z "$FIRST_PANE" ]]; then
      FIRST_PANE="$pane_id"
    else
      tmux kill-pane -t "$pane_id" 2>/dev/null || true
    fi
  done

  echo -e "${GREEN}Layout restored to single pane.${RESET}"
  exit 0
fi

# ─── Create Layout ───────────────────────────────────────────────────────────

echo -e "${BOLD}Setting up GMSD team layout...${RESET}"
echo -e "${DIM}Session: ${SESSION_NAME} | Agents: ${NUM_AGENTS}${RESET}"
echo ""

# Get the base pane (this will become the lead agent pane)
LEAD_PANE=$(tmux display-message -p '#{pane_id}')

# Label the lead pane
tmux select-pane -t "$LEAD_PANE" -T "Lead Agent"
tmux send-keys -t "$LEAD_PANE" "echo -e '${BOLD}${CYAN}=== GMSD Lead Agent ===${RESET}'" Enter

# Calculate split percentages
# The lead pane gets ~60% width, executor panes share the right ~40%
# Bottom status strip gets ~15% of total height

# First: create the bottom status strip (horizontal split from bottom)
STATUS_PANE=$(tmux split-window -t "$LEAD_PANE" -v -l 4 -P -F '#{pane_id}')
tmux select-pane -t "$STATUS_PANE" -T "Status / Monitoring"
tmux send-keys -t "$STATUS_PANE" "echo -e '${BOLD}${YELLOW}=== GMSD Status Monitor ===${RESET}'" Enter

# Now split the top area (lead pane) vertically to create the right column
# The lead pane keeps 60%, right column gets 40%
RIGHT_PANE=$(tmux split-window -t "$LEAD_PANE" -h -l "40%" -P -F '#{pane_id}')

# Label and initialize the first executor pane (right_pane is executor-0)
tmux select-pane -t "$RIGHT_PANE" -T "executor-0"
tmux send-keys -t "$RIGHT_PANE" "echo -e '${BOLD}${GREEN}=== executor-0 ===${RESET}'" Enter

# Create additional executor panes by splitting the right column vertically
PREV_PANE="$RIGHT_PANE"
for ((i = 1; i < NUM_AGENTS; i++)); do
  # Calculate the percentage for this split
  # Each subsequent split divides the remaining space
  REMAINING=$((NUM_AGENTS - i))
  if [[ $REMAINING -gt 0 ]]; then
    SPLIT_PCT=$(( 100 - (100 / (REMAINING + 1)) ))
  else
    SPLIT_PCT=50
  fi

  EXEC_PANE=$(tmux split-window -t "$PREV_PANE" -v -l "${SPLIT_PCT}%" -P -F '#{pane_id}')
  tmux select-pane -t "$EXEC_PANE" -T "executor-${i}"
  tmux send-keys -t "$EXEC_PANE" "echo -e '${BOLD}${GREEN}=== executor-${i} ===${RESET}'" Enter
  PREV_PANE="$EXEC_PANE"
done

# Focus back on the lead pane
tmux select-pane -t "$LEAD_PANE"

# Enable pane border status to show titles
tmux set-option -w pane-border-status top 2>/dev/null || true
tmux set-option -w pane-border-format " #{pane_title} " 2>/dev/null || true

echo ""
echo -e "${GREEN}${BOLD}GMSD layout ready!${RESET}"
echo -e "${DIM}  Lead pane:    top-left (largest)${RESET}"
echo -e "${DIM}  Executors:    ${NUM_AGENTS} panes on the right${RESET}"
echo -e "${DIM}  Status bar:   bottom strip${RESET}"
echo ""
echo -e "${DIM}Use '$(basename "$0") --cleanup' to restore single-pane layout.${RESET}"
