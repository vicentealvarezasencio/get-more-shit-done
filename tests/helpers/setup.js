/**
 * Shared test utilities for GMSD tests.
 *
 * Provides temp directory creation, mock state generation,
 * child process execution helpers, and cleanup utilities.
 */

import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { execSync, execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const PROJECT_ROOT = join(__dirname, '..', '..');

/**
 * Create a unique temp directory for a test.
 * Returns the path to the temp directory.
 */
export function createTempDir(prefix = 'gmsd-test') {
  const id = randomBytes(6).toString('hex');
  const dir = join(tmpdir(), `${prefix}-${id}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Clean up a temp directory.
 */
export function cleanupTempDir(dir) {
  if (dir && existsSync(dir) && dir.startsWith(tmpdir())) {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Create a mock .planning/state.json in a temp directory.
 */
export function createMockState(dir, stateOverrides = {}) {
  const planningDir = join(dir, '.planning');
  mkdirSync(planningDir, { recursive: true });

  const state = {
    phase_status: 'executing',
    current_phase: 1,
    project_name: 'test-project',
    ...stateOverrides,
  };

  writeFileSync(join(planningDir, 'state.json'), JSON.stringify(state, null, 2));
  return state;
}

/**
 * Create a mock package.json in a temp directory.
 */
export function createMockPackageJson(dir, overrides = {}) {
  const pkg = {
    name: 'test-project',
    version: '1.0.0',
    scripts: {},
    ...overrides,
  };

  writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg, null, 2));
  return pkg;
}

/**
 * Create a mock PLAN.md with file ownership in a temp directory.
 */
export function createMockPlan(dir, phase, content) {
  const phaseDir = join(dir, '.planning', 'phases', `${phase}-test-phase`);
  mkdirSync(phaseDir, { recursive: true });
  writeFileSync(join(phaseDir, 'PLAN.md'), content);
  return phaseDir;
}

/**
 * Write an arbitrary file relative to a temp directory.
 */
export function writeFile(dir, relativePath, content) {
  const fullPath = join(dir, relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content);
  return fullPath;
}

/**
 * Read a JSON file, returning null on failure.
 */
export function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Run a hook script as a child process with a controlled CWD and optional stdin.
 * Returns { exitCode, stdout, stderr }.
 */
export function runHook(hookFile, options = {}) {
  const { cwd = process.cwd(), stdin = '', env = {} } = options;
  const hookPath = join(PROJECT_ROOT, 'hooks', hookFile);

  try {
    const stdout = execFileSync('node', [hookPath], {
      cwd,
      input: stdin,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10_000,
      env: { ...process.env, ...env },
    });
    return { exitCode: 0, stdout, stderr: '' };
  } catch (err) {
    return {
      exitCode: err.status ?? 1,
      stdout: err.stdout || '',
      stderr: err.stderr || '',
    };
  }
}

/**
 * Run a bin script as a child process.
 * Returns { exitCode, stdout, stderr }.
 */
export function runBin(binFile, args = [], options = {}) {
  const { cwd = PROJECT_ROOT, env = {} } = options;
  const binPath = join(PROJECT_ROOT, 'bin', binFile);

  try {
    const stdout = execFileSync('node', [binPath, ...args], {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 15_000,
      env: { ...process.env, ...env },
    });
    return { exitCode: 0, stdout, stderr: '' };
  } catch (err) {
    return {
      exitCode: err.status ?? 1,
      stdout: err.stdout || '',
      stderr: err.stderr || '',
    };
  }
}
