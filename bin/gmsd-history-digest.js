#!/usr/bin/env node

/**
 * Get More Shit Done (GMSD) — History Digest Generator
 *
 * Compiles phase execution history into a structured JSON digest file
 * for faster context loading by the planner and other agents.
 *
 * Reads:
 *   - .planning/state.json       (completed_phases, history, metrics)
 *   - .planning/config.json      (project_name, version, git settings)
 *   - .planning/ROADMAP.md       (phase goals, names)
 *   - .planning/phases/{N}-{name}/SUMMARY.md      (phase summary text)
 *   - .planning/phases/{N}-{name}/VERIFICATION.md  (verification results)
 *   - git log                     (commit counts, files changed per phase)
 *
 * Outputs:
 *   - .planning/HISTORY-DIGEST.json
 *
 * Usage:
 *   node bin/gmsd-history-digest.js                  # Run from project root
 *   node bin/gmsd-history-digest.js --project-dir /path/to/project
 *
 * HISTORY-DIGEST.json Structure:
 * {
 *   "generated_at": "ISO timestamp",
 *   "project": "project_name",
 *   "version": "version string",
 *   "milestone": 1,
 *   "phases": [
 *     {
 *       "number": 1,
 *       "name": "phase-name",
 *       "goal": "phase goal from ROADMAP",
 *       "status": "completed",
 *       "completed_at": "ISO timestamp",
 *       "duration_minutes": 45,
 *       "tasks_completed": 5,
 *       "tasks_total": 5,
 *       "tasks_failed": 0,
 *       "commits": 5,
 *       "files_changed": ["src/foo.ts", "src/bar.ts"],
 *       "verification_result": "PROCEED",
 *       "key_decisions": ["Used X library", "Chose Y pattern"],
 *       "deviations": 0,
 *       "summary": "Brief 2-3 sentence summary"
 *     }
 *   ],
 *   "cumulative": {
 *     "total_phases_completed": 3,
 *     "total_tasks_completed": 15,
 *     "total_commits": 15,
 *     "total_files_changed": 42,
 *     "phases_passed_first_try": 2,
 *     "phases_needed_debug": 1
 *   }
 * }
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Parse arguments
const args = process.argv.slice(2);
const projectDirFlag = args.find(a => a.startsWith('--project-dir'));
const projectDir = projectDirFlag
  ? (projectDirFlag.includes('=') ? projectDirFlag.split('=')[1] : args[args.indexOf(projectDirFlag) + 1])
  : process.cwd();

const planningDir = join(projectDir, '.planning');

/**
 * Safely read and parse a JSON file. Returns null on failure.
 */
function readJSON(filePath) {
  try {
    if (!existsSync(filePath)) return null;
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * Safely read a text file. Returns empty string on failure.
 */
function readText(filePath) {
  try {
    if (!existsSync(filePath)) return '';
    return readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

/**
 * Run a git command and return stdout. Returns empty string on failure.
 */
function git(command) {
  try {
    return execSync(`git ${command}`, { cwd: projectDir, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

/**
 * Find the phase directory matching a phase number.
 * Phase dirs are named like: {N}-{name} (e.g. "1-setup", "2-api-routes")
 */
function findPhaseDir(phaseNumber) {
  const phasesDir = join(planningDir, 'phases');
  if (!existsSync(phasesDir)) return null;

  const entries = readdirSync(phasesDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.match(new RegExp(`^${phaseNumber}-`))) {
      return join(phasesDir, entry.name);
    }
  }
  return null;
}

/**
 * Parse phase names and goals from ROADMAP.md.
 * Returns a map: phaseNumber -> { name, goal, description }
 */
function parseRoadmap(roadmapText) {
  const phases = {};

  // Parse the phase table: | # | Phase Name | Description | Status | Depends On |
  const tableRegex = /\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/g;
  let match;
  while ((match = tableRegex.exec(roadmapText)) !== null) {
    const num = parseInt(match[1], 10);
    if (isNaN(num)) continue;
    phases[num] = {
      name: match[2].trim(),
      description: match[3].trim(),
      goal: ''
    };
  }

  // Parse phase detail sections for goals:
  // ### Phase N — Name
  // | Goal | value |
  const detailRegex = /### Phase (\d+)[^\n]*\n([\s\S]*?)(?=### Phase \d+|\n---\n|\n## |$)/g;
  while ((match = detailRegex.exec(roadmapText)) !== null) {
    const num = parseInt(match[1], 10);
    const section = match[2];
    const goalMatch = section.match(/\|\s*Goal\s*\|\s*([^|]+?)\s*\|/);
    if (goalMatch && phases[num]) {
      phases[num].goal = goalMatch[1].trim();
    }
  }

  return phases;
}

/**
 * Extract verification recommendation from VERIFICATION.md content.
 * Looks for: **Recommendation:** PROCEED | FIX_GAPS | REPLAN
 */
function parseVerificationResult(verificationText) {
  if (!verificationText) return null;
  const match = verificationText.match(/\*\*Recommendation:\*\*\s*(PROCEED|FIX_GAPS|REPLAN)/i);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Extract a brief summary from SUMMARY.md content.
 * Takes the first paragraph after the "## Result" or "## Goal" heading,
 * or falls back to the first substantial paragraph.
 */
function parseSummaryText(summaryText) {
  if (!summaryText) return '';

  // Try to find text after "## Result" line
  const resultMatch = summaryText.match(/## Result[^\n]*\n+([^\n#]+(?:\n[^\n#]+)*)/);
  if (resultMatch) {
    return resultMatch[1].trim().replace(/\n/g, ' ').slice(0, 300);
  }

  // Fallback: find first substantial paragraph (skip headings, tables, front matter, metadata lines)
  const lines = summaryText.split('\n');
  const paragraphs = [];
  let current = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (line.startsWith('#') || line.startsWith('|') || line.startsWith('---') || line.startsWith('<!--') ||
        trimmed.startsWith('**Recommendation:') || trimmed.startsWith('**Rationale:') ||
        trimmed.startsWith('**Approach:') || trimmed.startsWith('**Verification') || trimmed.startsWith('**Verifier:')) {
      if (current.length > 0) {
        paragraphs.push(current.join(' ').trim());
        current = [];
      }
      continue;
    }
    if (line.trim()) {
      current.push(line.trim());
    } else if (current.length > 0) {
      paragraphs.push(current.join(' ').trim());
      current = [];
    }
  }
  if (current.length > 0) {
    paragraphs.push(current.join(' ').trim());
  }

  // Return first paragraph with at least 20 chars
  for (const p of paragraphs) {
    if (p.length >= 20) return p.slice(0, 300);
  }
  return '';
}

/**
 * Extract key decisions from CONTEXT.md if it exists.
 * Looks for decision entries like: Decision #N: answer
 */
function parseKeyDecisions(contextText) {
  if (!contextText) return [];
  const decisions = [];
  const regex = /(?:Decision|Answer|Decided|Choice)[^:]*:\s*(.+)/gi;
  let match;
  while ((match = regex.exec(contextText)) !== null) {
    const decision = match[1].trim().replace(/\*\*/g, '');
    if (decision.length > 5 && decision.length < 200) {
      decisions.push(decision);
    }
  }
  return decisions.slice(0, 10);
}

/**
 * Get git commit data for a specific phase.
 * Tries multiple commit message patterns.
 */
function getPhaseCommits(phaseNumber, commitPrefix) {
  const patterns = [
    `${commitPrefix}(phase-${phaseNumber})`,
    `${commitPrefix}(T-`,
    `phase-${phaseNumber}`,
    `(phase-${phaseNumber})`
  ];

  let commits = [];

  // Try primary pattern first (exact phase prefix)
  const primaryOutput = git(`log --format="%H %ai %s" --grep="${patterns[0]}"`);
  if (primaryOutput) {
    commits = primaryOutput.split('\n').filter(Boolean);
  }

  // If no commits found with primary, try task-level commits within phase context
  if (commits.length === 0) {
    for (let i = 1; i < patterns.length; i++) {
      const output = git(`log --format="%H %ai %s" --grep="${patterns[i]}"`);
      if (output) {
        commits = output.split('\n').filter(Boolean);
        break;
      }
    }
  }

  return commits;
}

/**
 * Get files changed for a specific commit hash.
 */
function getFilesForCommit(hash) {
  const output = git(`diff-tree --no-commit-id --name-only -r ${hash}`);
  return output ? output.split('\n').filter(Boolean) : [];
}

/**
 * Find execution history entry for a phase from state.json metrics.
 */
function findExecutionMetrics(state, phaseNumber) {
  if (!state?.metrics?.execution_history) return null;
  return state.metrics.execution_history.find(e => e.phase === phaseNumber) || null;
}

/**
 * Find completed phase entry from state.json completed_phases array.
 */
function findCompletedPhase(state, phaseNumber) {
  if (!state?.completed_phases) return null;
  return state.completed_phases.find(p => p.phase === phaseNumber || p.number === phaseNumber) || null;
}

/**
 * Calculate duration in minutes between two ISO timestamps.
 */
function durationMinutes(startISO, endISO) {
  if (!startISO || !endISO) return null;
  try {
    const start = new Date(startISO);
    const end = new Date(endISO);
    const diffMs = end - start;
    if (diffMs < 0 || isNaN(diffMs)) return null;
    return Math.round(diffMs / 60000);
  } catch {
    return null;
  }
}

/**
 * Count history entries matching a command pattern for a phase.
 */
function countHistoryEntries(state, phaseNumber, commandPattern) {
  if (!state?.history) return 0;
  return state.history.filter(h =>
    h.command && h.command.includes(commandPattern) && h.command.includes(String(phaseNumber))
  ).length;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  log('GMSD History Digest Generator\n', 'bright');

  // Validate .planning directory exists
  if (!existsSync(planningDir)) {
    log('Error: .planning/ directory not found.', 'red');
    log(`Looked in: ${planningDir}`, 'dim');
    log('Run /gmsd:new-project to initialize a project first.', 'dim');
    process.exit(1);
  }

  // Read state.json
  const state = readJSON(join(planningDir, 'state.json'));
  if (!state) {
    log('Error: .planning/state.json not found or invalid.', 'red');
    process.exit(1);
  }

  // Read config.json
  const config = readJSON(join(planningDir, 'config.json'));
  const projectName = config?.project_name || state?.project || 'unknown';
  const version = config?.version || state?.version || 'unknown';
  const milestone = state?.current_milestone || 1;
  const commitPrefix = config?.git?.commit_prefix || 'gmsd';

  // Read ROADMAP.md
  const roadmapText = readText(join(planningDir, 'ROADMAP.md'));
  const roadmapPhases = parseRoadmap(roadmapText);

  // Determine which phases to include (completed phases from state)
  const completedPhases = state.completed_phases || [];
  const phaseNumbers = completedPhases
    .map(p => p.phase || p.number)
    .filter(n => typeof n === 'number')
    .sort((a, b) => a - b);

  // Also check for phases with execution history but not yet in completed_phases
  if (state?.metrics?.execution_history) {
    for (const entry of state.metrics.execution_history) {
      if (typeof entry.phase === 'number' && !phaseNumbers.includes(entry.phase)) {
        phaseNumbers.push(entry.phase);
      }
    }
    phaseNumbers.sort((a, b) => a - b);
  }

  log(`Project: ${projectName} v${version}`, 'cyan');
  log(`Milestone: ${milestone}`, 'cyan');
  log(`Phases to process: ${phaseNumbers.length > 0 ? phaseNumbers.join(', ') : 'none'}\n`, 'cyan');

  if (phaseNumbers.length === 0) {
    log('No completed phases found. Generating empty digest.', 'yellow');
  }

  // Build phase digest entries
  const phaseDigests = [];
  let totalCommits = 0;
  let totalTasksCompleted = 0;
  const allFilesChanged = new Set();

  for (const phaseNum of phaseNumbers) {
    log(`Processing phase ${phaseNum}...`, 'dim');

    const phaseDir = findPhaseDir(phaseNum);
    const roadmapEntry = roadmapPhases[phaseNum] || {};
    const completedEntry = findCompletedPhase(state, phaseNum);
    const execMetrics = findExecutionMetrics(state, phaseNum);

    // Read SUMMARY.md or VERIFICATION.md for summary text
    const summaryText = phaseDir ? readText(join(phaseDir, 'SUMMARY.md')) : '';
    const verificationText = phaseDir ? readText(join(phaseDir, 'VERIFICATION.md')) : '';
    const contextText = phaseDir ? readText(join(phaseDir, 'CONTEXT.md')) : '';

    // Phase name and goal
    const phaseName = roadmapEntry.name || completedEntry?.name || `phase-${phaseNum}`;
    const phaseGoal = roadmapEntry.goal || roadmapEntry.description || '';

    // Status
    const phaseStatus = completedEntry ? 'completed' : (execMetrics ? 'executed' : 'unknown');

    // Timestamps and duration
    const completedAt = completedEntry?.verified_at || completedEntry?.completed_at || execMetrics?.end_time || null;
    const startTime = execMetrics?.start_time || null;
    const duration = durationMinutes(startTime, completedAt);

    // Task counts
    const tasksCompleted = execMetrics?.tasks_completed ?? completedEntry?.tasks_completed ?? 0;
    const tasksTotal = execMetrics?.tasks_total ?? completedEntry?.tasks_total ?? tasksCompleted;
    const tasksFailed = execMetrics?.tasks_failed ?? 0;

    // Git commit data
    const commitLines = getPhaseCommits(phaseNum, commitPrefix);
    const commitCount = commitLines.length;
    const filesChanged = new Set();

    for (const line of commitLines) {
      const hash = line.split(' ')[0];
      if (hash && hash.length >= 7) {
        const files = getFilesForCommit(hash);
        for (const f of files) {
          filesChanged.add(f);
          allFilesChanged.add(f);
        }
      }
    }

    // Verification result
    const verificationResult = parseVerificationResult(verificationText);

    // Key decisions
    const keyDecisions = parseKeyDecisions(contextText);

    // Deviations
    const deviations = execMetrics?.deviations_approved != null
      ? (execMetrics.deviations_approved + (execMetrics.deviations_rejected || 0))
      : countHistoryEntries(state, phaseNum, 'deviation');

    // Summary text
    const summary = parseSummaryText(summaryText) || parseSummaryText(verificationText) || '';

    totalCommits += commitCount;
    totalTasksCompleted += tasksCompleted;

    phaseDigests.push({
      number: phaseNum,
      name: phaseName,
      goal: phaseGoal,
      status: phaseStatus,
      completed_at: completedAt,
      duration_minutes: duration,
      tasks_completed: tasksCompleted,
      tasks_total: tasksTotal,
      tasks_failed: tasksFailed,
      commits: commitCount,
      files_changed: [...filesChanged].sort(),
      verification_result: verificationResult,
      key_decisions: keyDecisions,
      deviations: deviations,
      summary: summary
    });

    log(`  Phase ${phaseNum}: ${phaseName} — ${commitCount} commits, ${tasksCompleted} tasks`, 'dim');
  }

  // Build cumulative stats
  const cumulative = {
    total_phases_completed: completedPhases.length,
    total_tasks_completed: totalTasksCompleted,
    total_commits: totalCommits,
    total_files_changed: allFilesChanged.size,
    phases_passed_first_try: state?.metrics?.phases_passed_first_try ?? 0,
    phases_needed_debug: state?.metrics?.phases_needed_debug ?? 0
  };

  // Build final digest
  const digest = {
    generated_at: new Date().toISOString(),
    project: projectName,
    version: version,
    milestone: milestone,
    phases: phaseDigests,
    cumulative: cumulative
  };

  // Write output
  const outputPath = join(planningDir, 'HISTORY-DIGEST.json');
  writeFileSync(outputPath, JSON.stringify(digest, null, 2) + '\n');

  log(`\nDigest written to: .planning/HISTORY-DIGEST.json`, 'green');
  log(`  Phases: ${phaseDigests.length}`, 'dim');
  log(`  Total commits: ${totalCommits}`, 'dim');
  log(`  Total tasks: ${totalTasksCompleted}`, 'dim');
  log(`  Total files: ${allFilesChanged.size}`, 'dim');
}

main();
