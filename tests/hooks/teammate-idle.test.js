import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  createTempDir,
  cleanupTempDir,
  createMockState,
  runHook,
} from '../helpers/setup.js';

const HOOK_FILE = 'gmsd-teammate-idle.js';

describe('gmsd-teammate-idle hook', () => {
  // ─── isGmsdExecution ───────────────────────────────────────────

  describe('isGmsdExecution()', () => {
    it('recognizes valid executing state', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp, { phase_status: 'executing' });
        // With executing state but no stdin → allows idle (no task data)
        const result = runHook(HOOK_FILE, { cwd: tmp });
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('exits 0 when state is invalid (not executing)', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp, { phase_status: 'planning' });
        const result = runHook(HOOK_FILE, { cwd: tmp });
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('exits 0 when no state.json exists', () => {
      const tmp = createTempDir();
      try {
        const result = runHook(HOOK_FILE, { cwd: tmp });
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });
  });

  // ─── main — allows idle when not in execution ──────────────────

  describe('main()', () => {
    it('allows idle when not in execution', () => {
      const tmp = createTempDir();
      try {
        // No state.json at all
        const stdinData = JSON.stringify({
          teammate_name: 'executor-0',
          tasks: [
            { owner: 'executor-0', status: 'in_progress', subject: 'Task 1' },
          ],
        });

        const result = runHook(HOOK_FILE, { cwd: tmp, stdin: stdinData });
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('allows idle when no tasks exist', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp, { phase_status: 'executing' });
        const stdinData = JSON.stringify({
          teammate_name: 'executor-0',
          tasks: [],
        });

        const result = runHook(HOOK_FILE, { cwd: tmp, stdin: stdinData });
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('allows idle when no teammate name provided', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp, { phase_status: 'executing' });
        const stdinData = JSON.stringify({
          tasks: [
            { owner: 'executor-0', status: 'in_progress', subject: 'Task 1' },
          ],
        });

        const result = runHook(HOOK_FILE, { cwd: tmp, stdin: stdinData });
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('blocks idle when in_progress tasks exist for the teammate', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp, { phase_status: 'executing' });
        const stdinData = JSON.stringify({
          teammate_name: 'executor-0',
          tasks: [
            { owner: 'executor-0', status: 'in_progress', subject: 'Task 1: Foundation' },
            { owner: 'executor-1', status: 'completed', subject: 'Task 2: UI' },
          ],
        });

        const result = runHook(HOOK_FILE, { cwd: tmp, stdin: stdinData });
        assert.strictEqual(result.exitCode, 2);
        assert.ok(result.stderr.includes('incomplete task'));
        assert.ok(result.stderr.includes('Task 1: Foundation'));
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('allows idle when all tasks are completed', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp, { phase_status: 'executing' });
        const stdinData = JSON.stringify({
          teammate_name: 'executor-0',
          tasks: [
            { owner: 'executor-0', status: 'completed', subject: 'Task 1: Foundation' },
            { owner: 'executor-1', status: 'completed', subject: 'Task 2: UI' },
          ],
        });

        const result = runHook(HOOK_FILE, { cwd: tmp, stdin: stdinData });
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('allows idle when tasks exist but none owned by this teammate', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp, { phase_status: 'executing' });
        const stdinData = JSON.stringify({
          teammate_name: 'executor-0',
          tasks: [
            { owner: 'executor-1', status: 'in_progress', subject: 'Task 1: Foundation' },
          ],
        });

        const result = runHook(HOOK_FILE, { cwd: tmp, stdin: stdinData });
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('blocks when multiple in_progress tasks exist', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp, { phase_status: 'executing' });
        const stdinData = JSON.stringify({
          teammate_name: 'executor-0',
          tasks: [
            { owner: 'executor-0', status: 'in_progress', subject: 'Task A' },
            { owner: 'executor-0', status: 'in_progress', subject: 'Task B' },
          ],
        });

        const result = runHook(HOOK_FILE, { cwd: tmp, stdin: stdinData });
        assert.strictEqual(result.exitCode, 2);
        assert.ok(result.stderr.includes('Task A'));
        assert.ok(result.stderr.includes('Task B'));
      } finally {
        cleanupTempDir(tmp);
      }
    });
  });
});
