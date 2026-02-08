import { describe, it } from 'node:test';
import assert from 'node:assert';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  createTempDir,
  cleanupTempDir,
  createMockState,
  createMockPlan,
  writeFile,
  readJson,
  runHook,
} from '../helpers/setup.js';

const HOOK_FILE = 'gmsd-file-tracker.js';

describe('gmsd-file-tracker hook', () => {
  // ─── parseFileOwnership — table format ─────────────────────────

  describe('parseFileOwnership() — table format', () => {
    it('parses table format ownership from PLAN.md', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp, { phase_status: 'executing', current_phase: 1 });
        createMockPlan(tmp, 1, `
# Plan

### File Ownership
| File | Owner Task |
|------|-----------|
| src/foo.ts | Task 1: Setup |
| src/bar.ts | Task 2: Feature |
`);
        const stdinData = JSON.stringify({
          tool_name: 'Write',
          tool_input: { file_path: join(tmp, 'src/foo.ts') },
          agent_name: 'executor-0',
          current_task: 'Task 1: Setup',
        });

        const result = runHook(HOOK_FILE, { cwd: tmp, stdin: stdinData });
        // Should allow — executor's task matches the file owner
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });
  });

  // ─── parseFileOwnership — bullet format ────────────────────────

  describe('parseFileOwnership() — bullet format', () => {
    it('parses bullet format ownership from PLAN.md', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp, { phase_status: 'executing', current_phase: 1 });
        createMockPlan(tmp, 1, `
# Plan

### File Ownership
- \`src/alpha.ts\` -> Task 1: Alpha
- \`src/beta.ts\` -> Task 2: Beta
`);
        const stdinData = JSON.stringify({
          tool_name: 'Edit',
          tool_input: { file_path: join(tmp, 'src/beta.ts') },
          agent_name: 'executor-1',
          current_task: 'Task 2: Beta',
        });

        const result = runHook(HOOK_FILE, { cwd: tmp, stdin: stdinData });
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });
  });

  // ─── parseFileOwnership — task section format ──────────────────

  describe('parseFileOwnership() — task section format', () => {
    it('parses task section format ownership from PLAN.md', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp, { phase_status: 'executing', current_phase: 1 });
        createMockPlan(tmp, 1, `
# Plan

## Task 1: Foundation

Files to Create:
- \`src/core.ts\`
- \`src/utils.ts\`

## Task 2: UI

Files to Create:
- \`src/components/App.tsx\`
`);
        const stdinData = JSON.stringify({
          tool_name: 'Write',
          tool_input: { file_path: join(tmp, 'src/core.ts') },
          agent_name: 'executor-0',
          current_task: 'Task 1: Foundation',
        });

        const result = runHook(HOOK_FILE, { cwd: tmp, stdin: stdinData });
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });
  });

  // ─── parseFileOwnership — no plan ──────────────────────────────

  describe('parseFileOwnership() — returns null when no plan exists', () => {
    it('allows modification when no PLAN.md exists', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp, { phase_status: 'executing', current_phase: 1 });
        // No phases directory at all
        const stdinData = JSON.stringify({
          tool_name: 'Write',
          tool_input: { file_path: join(tmp, 'src/foo.ts') },
          agent_name: 'executor-0',
        });

        const result = runHook(HOOK_FILE, { cwd: tmp, stdin: stdinData });
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });
  });

  // ─── normalizePath ─────────────────────────────────────────────

  describe('normalizePath()', () => {
    it('strips leading ./ and makes relative via integration', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp, { phase_status: 'executing', current_phase: 1 });
        createMockPlan(tmp, 1, `
### File Ownership
| File | Owner Task |
|------|-----------|
| src/app.ts | Task 1: Setup |
`);
        // Use absolute path as input — normalizePath should strip CWD prefix
        const stdinData = JSON.stringify({
          tool_name: 'Write',
          tool_input: { file_path: join(tmp, 'src/app.ts') },
          agent_name: 'executor-0',
          current_task: 'Task 1: Setup',
        });

        const result = runHook(HOOK_FILE, { cwd: tmp, stdin: stdinData });
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });
  });

  // ─── findOwner — direct match ──────────────────────────────────

  describe('findOwner()', () => {
    it('finds owner via direct match', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp, { phase_status: 'executing', current_phase: 1 });
        createMockPlan(tmp, 1, `
### File Ownership
| File | Owner Task |
|------|-----------|
| src/index.ts | Task 1: Init |
`);
        const stdinData = JSON.stringify({
          tool_name: 'Write',
          tool_input: { file_path: 'src/index.ts' },
          agent_name: 'executor-0',
          current_task: 'Task 1: Init',
        });

        const result = runHook(HOOK_FILE, { cwd: tmp, stdin: stdinData });
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('finds owner via suffix match', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp, { phase_status: 'executing', current_phase: 1 });
        createMockPlan(tmp, 1, `
### File Ownership
| File | Owner Task |
|------|-----------|
| index.ts | Task 1: Init |
`);
        // Input path has more prefix than the ownership entry
        const stdinData = JSON.stringify({
          tool_name: 'Write',
          tool_input: { file_path: join(tmp, 'src', 'index.ts') },
          agent_name: 'executor-0',
          current_task: 'Task 1: Init',
        });

        const result = runHook(HOOK_FILE, { cwd: tmp, stdin: stdinData });
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('returns null for unowned files (allows modification)', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp, { phase_status: 'executing', current_phase: 1 });
        createMockPlan(tmp, 1, `
### File Ownership
| File | Owner Task |
|------|-----------|
| src/owned.ts | Task 1: Setup |
`);
        const stdinData = JSON.stringify({
          tool_name: 'Write',
          tool_input: { file_path: 'src/unowned.ts' },
          agent_name: 'executor-0',
        });

        const result = runHook(HOOK_FILE, { cwd: tmp, stdin: stdinData });
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });
  });

  // ─── logFileTouch ──────────────────────────────────────────────

  describe('logFileTouch()', () => {
    it('creates and appends to file-touches.json', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp, { phase_status: 'executing', current_phase: 1 });
        // No PLAN.md → no ownership check, but logFileTouch still runs
        const stdinData = JSON.stringify({
          tool_name: 'Write',
          tool_input: { file_path: 'src/new-file.ts' },
          agent_name: 'executor-0',
        });

        const result = runHook(HOOK_FILE, { cwd: tmp, stdin: stdinData });
        assert.strictEqual(result.exitCode, 0);

        // Check file-touches.json was created
        const touchesPath = join(tmp, '.planning', 'file-touches.json');
        assert.ok(existsSync(touchesPath), 'file-touches.json should be created');

        const touches = readJson(touchesPath);
        assert.ok(Array.isArray(touches), 'touches should be an array');
        assert.strictEqual(touches.length, 1);
        assert.strictEqual(touches[0].file, 'src/new-file.ts');
        assert.strictEqual(touches[0].agent, 'executor-0');
        assert.strictEqual(touches[0].tool, 'Write');
        assert.ok(touches[0].timestamp, 'should have a timestamp');
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('appends to existing file-touches.json', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp, { phase_status: 'executing', current_phase: 1 });

        // First touch
        runHook(HOOK_FILE, {
          cwd: tmp,
          stdin: JSON.stringify({
            tool_name: 'Write',
            tool_input: { file_path: 'src/a.ts' },
            agent_name: 'executor-0',
          }),
        });

        // Second touch
        runHook(HOOK_FILE, {
          cwd: tmp,
          stdin: JSON.stringify({
            tool_name: 'Edit',
            tool_input: { file_path: 'src/b.ts' },
            agent_name: 'executor-1',
          }),
        });

        const touchesPath = join(tmp, '.planning', 'file-touches.json');
        const touches = readJson(touchesPath);
        assert.strictEqual(touches.length, 2);
        assert.strictEqual(touches[0].file, 'src/a.ts');
        assert.strictEqual(touches[1].file, 'src/b.ts');
      } finally {
        cleanupTempDir(tmp);
      }
    });
  });

  // ─── main — allows when not in execution ───────────────────────

  describe('main()', () => {
    it('allows modification when not in execution', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp, { phase_status: 'planning' });
        const stdinData = JSON.stringify({
          tool_name: 'Write',
          tool_input: { file_path: 'src/any.ts' },
          agent_name: 'executor-0',
        });

        const result = runHook(HOOK_FILE, { cwd: tmp, stdin: stdinData });
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('allows when no ownership data exists', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp, { phase_status: 'executing', current_phase: 1 });
        const stdinData = JSON.stringify({
          tool_name: 'Write',
          tool_input: { file_path: 'src/any.ts' },
          agent_name: 'executor-0',
        });

        const result = runHook(HOOK_FILE, { cwd: tmp, stdin: stdinData });
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('blocks unauthorized file modification', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp, { phase_status: 'executing', current_phase: 1 });
        createMockPlan(tmp, 1, `
### File Ownership
| File | Owner Task |
|------|-----------|
| src/protected.ts | Task 1: Foundation |
`);
        const stdinData = JSON.stringify({
          tool_name: 'Write',
          tool_input: { file_path: 'src/protected.ts' },
          agent_name: 'executor-1',
          current_task: 'Task 2: UI',
        });

        const result = runHook(HOOK_FILE, { cwd: tmp, stdin: stdinData });
        assert.strictEqual(result.exitCode, 2);
        assert.ok(result.stderr.includes('owned by'));
        assert.ok(result.stderr.includes('Task 1'));
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('allows when tool is not Write or Edit', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp, { phase_status: 'executing', current_phase: 1 });
        const stdinData = JSON.stringify({
          tool_name: 'Read',
          tool_input: { file_path: 'src/any.ts' },
          agent_name: 'executor-0',
        });

        const result = runHook(HOOK_FILE, { cwd: tmp, stdin: stdinData });
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('allows when no stdin provided', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp, { phase_status: 'executing', current_phase: 1 });
        const result = runHook(HOOK_FILE, { cwd: tmp });
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });
  });
});
