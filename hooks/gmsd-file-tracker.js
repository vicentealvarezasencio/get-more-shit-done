#!/usr/bin/env node

/**
 * GMSD File Tracker Hook
 *
 * Claude Code hook type: PostToolUse
 * Runs after Write/Edit tool uses during GMSD execution.
 *
 * Responsibilities:
 * 1. Only activates for Write/Edit tool uses during execution phase
 * 2. Logs the file path and agent name to .planning/file-touches.json
 * 3. Checks file ownership from PLAN.md's file ownership map
 * 4. If a file is being modified by an agent that doesn't own it, blocks with exit 2
 * 5. If no file ownership data exists, allows the modification
 *
 * Exit codes:
 * - 0: Allow modification
 * - 2: Block modification (file owned by another task)
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';

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
 * Claude Code passes tool use context as JSON on stdin.
 */
function readStdin() {
  try {
    const input = readFileSync(0, 'utf8');
    return JSON.parse(input);
  } catch {
    return null;
  }
}

/**
 * Parse file ownership from PLAN.md.
 * Looks for a file ownership section and extracts file-to-task mappings.
 *
 * Expected format in PLAN.md:
 * ### File Ownership
 * | File | Owner Task |
 * |------|-----------|
 * | src/foo.ts | Task 1: Setup |
 * | src/bar.ts | Task 2: Feature |
 *
 * Or a simpler format:
 * - `src/foo.ts` -> Task 1
 * - `src/bar.ts` -> Task 2
 */
function parseFileOwnership() {
  const state = loadJson(join(CWD, '.planning', 'state.json'));
  if (!state?.current_phase) return null;

  // Find the phase directory
  const phasesDir = join(CWD, '.planning', 'phases');
  if (!existsSync(phasesDir)) return null;

  // Scan for phase directories matching current phase number
  let planContent = null;
  let phaseDirName = null;

  try {
    const dirs = readdirSync(phasesDir);
    for (const dir of dirs) {
      if (dir.startsWith(`${state.current_phase}-`)) {
        phaseDirName = dir;
        break;
      }
    }
  } catch {
    return null;
  }

  if (!phaseDirName) return null;

  const planPath = join(phasesDir, phaseDirName, 'PLAN.md');
  if (!existsSync(planPath)) return null;

  try {
    planContent = readFileSync(planPath, 'utf8');
  } catch {
    return null;
  }

  // Parse file ownership from the plan
  const ownership = {};

  // Pattern 1: Table format — | `file` | Task N: Name |
  const tableRegex = /\|\s*`?([^`|]+?)`?\s*\|\s*(Task\s+\d+[^|]*?)\s*\|/g;
  let match;
  while ((match = tableRegex.exec(planContent)) !== null) {
    const filePath = match[1].trim();
    const taskName = match[2].trim();
    if (filePath && taskName && !filePath.includes('---') && !filePath.toLowerCase().includes('file')) {
      ownership[filePath] = taskName;
    }
  }

  // Pattern 2: Bullet format — - `file` -> Task N or - `file` — Task N
  const bulletRegex = /[-*]\s*`([^`]+)`\s*(?:->|-->|—|:)\s*(Task\s+\d+[^\n]*)/g;
  while ((match = bulletRegex.exec(planContent)) !== null) {
    const filePath = match[1].trim();
    const taskName = match[2].trim();
    if (filePath && taskName) {
      ownership[filePath] = taskName;
    }
  }

  // Pattern 3: Files to Create or Modify sections under each task
  const taskSectionRegex = /##\s*(Task\s+\d+[^\n]*)\n[\s\S]*?(?:Files to (?:Create|Modify)[^\n]*\n)([\s\S]*?)(?=\n##|\n---|$)/g;
  while ((match = taskSectionRegex.exec(planContent)) !== null) {
    const taskName = match[1].trim();
    const filesSection = match[2];
    const fileLineRegex = /[-*]\s*`([^`]+)`/g;
    let fileMatch;
    while ((fileMatch = fileLineRegex.exec(filesSection)) !== null) {
      const filePath = fileMatch[1].trim();
      if (filePath && !ownership[filePath]) {
        ownership[filePath] = taskName;
      }
    }
  }

  return Object.keys(ownership).length > 0 ? ownership : null;
}

/**
 * Log a file touch event to .planning/file-touches.json
 */
function logFileTouch(filePath, agentName, toolName) {
  const touchesPath = join(CWD, '.planning', 'file-touches.json');

  let touches = loadJson(touchesPath);
  if (!touches || !Array.isArray(touches)) {
    touches = [];
  }

  touches.push({
    file: filePath,
    agent: agentName,
    tool: toolName,
    timestamp: new Date().toISOString()
  });

  try {
    mkdirSync(dirname(touchesPath), { recursive: true });
    writeFileSync(touchesPath, JSON.stringify(touches, null, 2));
  } catch {
    // Non-critical — don't block on logging failure
  }
}

/**
 * Normalize a file path for comparison.
 * Strips leading ./ and makes relative to CWD.
 */
function normalizePath(filePath) {
  let normalized = filePath;

  // Make relative to CWD if absolute
  if (normalized.startsWith(CWD)) {
    normalized = normalized.slice(CWD.length);
  }

  // Strip leading slashes and ./
  normalized = normalized.replace(/^[./\\]+/, '');

  return normalized;
}

/**
 * Check if a file path matches any ownership entry.
 * Returns the owner task name or null.
 */
function findOwner(filePath, ownership) {
  const normalized = normalizePath(filePath);

  // Direct match
  if (ownership[normalized]) {
    return ownership[normalized];
  }

  // Try matching with and without leading paths
  for (const [ownedPath, owner] of Object.entries(ownership)) {
    const normalizedOwned = normalizePath(ownedPath);
    if (normalizedOwned === normalized) {
      return owner;
    }
    // Check if one is a suffix of the other
    if (normalized.endsWith(normalizedOwned) || normalizedOwned.endsWith(normalized)) {
      return owner;
    }
  }

  return null;
}

// --- Main ---

function main() {
  // Only run during GMSD execution
  if (!isGmsdExecution()) {
    process.exit(0);
  }

  const hookInput = readStdin();
  if (!hookInput) {
    process.exit(0);
  }

  // Only activate for Write/Edit tool uses
  const toolName = hookInput.tool_name || hookInput.toolName || '';
  if (toolName !== 'Write' && toolName !== 'Edit') {
    process.exit(0);
  }

  // Extract the file path from the tool input
  const toolInput = hookInput.tool_input || hookInput.input || {};
  const filePath = toolInput.file_path || toolInput.filePath || toolInput.path || '';

  if (!filePath) {
    process.exit(0);
  }

  // Extract agent name
  const agentName = hookInput.agent_name || hookInput.agentName || hookInput.teammate_name || 'unknown';

  // Log the file touch
  logFileTouch(filePath, agentName, toolName);

  // Check file ownership
  const ownership = parseFileOwnership();
  if (!ownership) {
    // No ownership data — allow modification
    process.exit(0);
  }

  const owner = findOwner(filePath, ownership);
  if (!owner) {
    // File not in ownership map — allow modification
    process.exit(0);
  }

  // Check if the current agent's task owns this file
  // The agent name is like "executor-0" and the owner is like "Task 1: Setup"
  // We need to check if the executor's current task matches the file owner.
  // Since we can't directly map executor to task from the hook context,
  // we check if the hook input includes task information.
  const currentTask = hookInput.current_task || hookInput.taskSubject || '';

  if (currentTask) {
    // Extract task number from current task and owner
    const currentTaskNum = currentTask.match(/Task\s+(\d+)/i)?.[1];
    const ownerTaskNum = owner.match(/Task\s+(\d+)/i)?.[1];

    if (currentTaskNum && ownerTaskNum && currentTaskNum === ownerTaskNum) {
      // This executor owns this file — allow
      process.exit(0);
    }

    if (currentTaskNum && ownerTaskNum && currentTaskNum !== ownerTaskNum) {
      const normalizedFile = normalizePath(filePath);
      console.error(
        `File ${normalizedFile} is owned by ${owner}. Coordinate before modifying.`
      );
      process.exit(2);
    }
  }

  // If we can't determine the current task, allow the modification
  // (better to allow than to false-positive block)
  process.exit(0);
}

// Allow importing for testing
export { loadJson, isGmsdExecution, readStdin, parseFileOwnership, logFileTouch, normalizePath, findOwner, main };

// Only run main when executed directly
const isMainModule = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main();
}
