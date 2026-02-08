#!/usr/bin/env node

/**
 * GMSD Task Completed Hook
 *
 * Claude Code hook type: TaskCompleted
 * Runs when a task is marked complete during GMSD execution.
 *
 * Checks:
 * 1. Only activates during GMSD execution (phase_status === "executing")
 * 2. Runs the project's test command if one is detected
 * 3. Runs the project's lint command if one is detected
 * 4. Exits with code 2 if tests or lint fail (blocks completion)
 * 5. Exits 0 if no test/lint commands found or all pass
 *
 * Designed to be lightweight — 30 second timeout maximum.
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const CWD = process.cwd();
const TIMEOUT_MS = 30_000;

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
 * Detect the project's test command by checking common conventions.
 * Returns the command string or null if none found.
 */
function detectTestCommand() {
  // 1. package.json scripts.test
  const pkgPath = join(CWD, 'package.json');
  const pkg = loadJson(pkgPath);
  if (pkg?.scripts?.test && pkg.scripts.test !== 'echo "Error: no test specified" && exit 1') {
    return `npm test`;
  }

  // 2. Makefile with test target
  const makefilePath = join(CWD, 'Makefile');
  if (existsSync(makefilePath)) {
    try {
      const makefile = readFileSync(makefilePath, 'utf8');
      if (/^test\s*:/m.test(makefile)) {
        return `make test`;
      }
    } catch { /* ignore */ }
  }

  // 3. Cargo.toml (Rust)
  if (existsSync(join(CWD, 'Cargo.toml'))) {
    return `cargo test`;
  }

  // 4. go.mod (Go)
  if (existsSync(join(CWD, 'go.mod'))) {
    return `go test ./...`;
  }

  // 5. pytest (Python)
  if (existsSync(join(CWD, 'pytest.ini')) ||
      existsSync(join(CWD, 'setup.cfg')) ||
      existsSync(join(CWD, 'pyproject.toml'))) {
    return `python -m pytest --tb=short -q`;
  }

  // 6. mix.exs (Elixir)
  if (existsSync(join(CWD, 'mix.exs'))) {
    return `mix test`;
  }

  return null;
}

/**
 * Detect the project's lint command by checking common conventions.
 * Returns the command string or null if none found.
 */
function detectLintCommand() {
  // 1. package.json scripts.lint
  const pkgPath = join(CWD, 'package.json');
  const pkg = loadJson(pkgPath);
  if (pkg?.scripts?.lint) {
    return `npm run lint`;
  }

  // 2. .eslintrc* or eslint.config.*
  const eslintConfigs = [
    '.eslintrc', '.eslintrc.js', '.eslintrc.cjs', '.eslintrc.json', '.eslintrc.yml',
    'eslint.config.js', 'eslint.config.cjs', 'eslint.config.mjs'
  ];
  for (const config of eslintConfigs) {
    if (existsSync(join(CWD, config))) {
      return `npx eslint .`;
    }
  }

  // 3. Makefile with lint target
  const makefilePath = join(CWD, 'Makefile');
  if (existsSync(makefilePath)) {
    try {
      const makefile = readFileSync(makefilePath, 'utf8');
      if (/^lint\s*:/m.test(makefile)) {
        return `make lint`;
      }
    } catch { /* ignore */ }
  }

  // 4. cargo clippy (Rust)
  if (existsSync(join(CWD, 'Cargo.toml'))) {
    return `cargo clippy -- -D warnings`;
  }

  // 5. golangci-lint (Go)
  if (existsSync(join(CWD, '.golangci.yml')) || existsSync(join(CWD, '.golangci.yaml'))) {
    return `golangci-lint run`;
  }

  // 6. ruff / flake8 / pylint (Python)
  if (existsSync(join(CWD, 'ruff.toml')) || existsSync(join(CWD, '.ruff.toml'))) {
    return `ruff check .`;
  }
  if (existsSync(join(CWD, '.flake8'))) {
    return `flake8 .`;
  }

  return null;
}

/**
 * Run a command with a timeout. Returns { success, output }.
 */
function runCommand(cmd) {
  try {
    const output = execSync(cmd, {
      cwd: CWD,
      timeout: TIMEOUT_MS,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf8'
    });
    return { success: true, output };
  } catch (err) {
    return { success: false, output: err.stderr || err.stdout || err.message };
  }
}

// --- Main ---

function main() {
  // Only run during GMSD execution
  if (!isGmsdExecution()) {
    process.exit(0);
  }

  // Run tests
  const testCmd = detectTestCommand();
  if (testCmd) {
    const result = runCommand(testCmd);
    if (!result.success) {
      console.error(`Tests failing after task completion. Fix before marking done.`);
      console.error(`Command: ${testCmd}`);
      console.error(result.output.slice(0, 500));
      process.exit(2);
    }
  }

  // Run lint
  const lintCmd = detectLintCommand();
  if (lintCmd) {
    const result = runCommand(lintCmd);
    if (!result.success) {
      console.error(`Lint errors found. Fix before marking done.`);
      console.error(`Command: ${lintCmd}`);
      console.error(result.output.slice(0, 500));
      process.exit(2);
    }
  }

  // All good (or no commands detected)
  process.exit(0);
}

// Allow importing for testing
export { loadJson, isGmsdExecution, detectTestCommand, detectLintCommand, runCommand, main };

// Only run main when executed directly
const isMainModule = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main();
}
