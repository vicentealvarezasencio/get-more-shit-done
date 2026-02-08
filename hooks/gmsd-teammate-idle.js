#!/usr/bin/env node

/**
 * GMSD Teammate Idle Hook
 *
 * Claude Code hook type: TeammateIdle
 * Runs when a teammate becomes idle.
 *
 * Checks:
 * 1. Reads the shared task list from stdin (Claude Code provides hook context)
 * 2. If the teammate has an in_progress task that isn't completed, blocks idle
 * 3. If all tasks are done or no tasks are claimed, allows idle
 *
 * Exit codes:
 * - 0: Allow idle (no incomplete tasks)
 * - 2: Block idle (incomplete task found)
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const CWD = process.cwd();

function loadJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function isGmsdExecution() {
  const statePath = join(CWD, '.planning', 'state.json');
  const state = loadJson(statePath);
  return state && state.phase_status === 'executing';
}

/**
 * Read hook input from stdin.
 * Claude Code passes context as JSON on stdin for hook scripts.
 */
function readStdin() {
  try {
    const input = readFileSync(0, 'utf8');
    return JSON.parse(input);
  } catch {
    return null;
  }
}

// --- Main ---

function main() {
  // Only run during GMSD execution
  if (!isGmsdExecution()) {
    process.exit(0);
  }

  const hookInput = readStdin();
  if (!hookInput) {
    // No input available — can't determine task status, allow idle
    process.exit(0);
  }

  const teammateName = hookInput.teammate_name || hookInput.agentName || null;
  const tasks = hookInput.tasks || hookInput.taskList || [];

  if (!teammateName || !Array.isArray(tasks) || tasks.length === 0) {
    // No task data available — allow idle
    process.exit(0);
  }

  // Check if this teammate has an in_progress task
  const incompleteTasks = tasks.filter(task =>
    task.owner === teammateName &&
    task.status === 'in_progress'
  );

  if (incompleteTasks.length > 0) {
    const taskNames = incompleteTasks.map(t => t.subject || t.name || t.id).join(', ');
    console.error(
      `You have an incomplete task. Please finish or report a blocker before going idle.\n` +
      `In-progress tasks: ${taskNames}`
    );
    process.exit(2);
  }

  // All tasks are done or no tasks claimed by this teammate
  process.exit(0);
}

main();
