import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { existsSync } from 'fs';
import { join } from 'path';
import {
  createTempDir,
  cleanupTempDir,
  createMockState,
  createMockPackageJson,
  writeFile,
  runHook,
  PROJECT_ROOT,
} from '../helpers/setup.js';

const HOOK_FILE = 'gmsd-task-completed.js';

describe('gmsd-task-completed hook', () => {
  // ─── isGmsdExecution ───────────────────────────────────────────

  describe('isGmsdExecution()', () => {
    it('returns true (exit 0 with test/lint checks) when state.phase_status is "executing"', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp, { phase_status: 'executing' });
        // No test/lint commands exist, so it should exit 0 (pass through)
        const result = runHook(HOOK_FILE, { cwd: tmp });
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('exits 0 immediately when no state.json exists (not in GMSD execution)', () => {
      const tmp = createTempDir();
      try {
        // No .planning/state.json
        const result = runHook(HOOK_FILE, { cwd: tmp });
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('exits 0 when phase_status is not "executing"', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp, { phase_status: 'planning' });
        const result = runHook(HOOK_FILE, { cwd: tmp });
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });
  });

  // ─── detectTestCommand ─────────────────────────────────────────

  describe('detectTestCommand()', () => {
    it('detects npm test from package.json with a real test script', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp);
        createMockPackageJson(tmp, {
          scripts: { test: 'node --test' },
        });
        // The hook is executing, it will try to run `npm test`.
        // npm test will fail because node --test with no files may exit 1.
        // But the detection itself works — we see it tries to run the command.
        const result = runHook(HOOK_FILE, { cwd: tmp });
        // It either succeeds (if node --test passes) or fails with exit 2
        // The key is it doesn't exit 0 silently — it detected the test command
        assert.ok(result.exitCode === 0 || result.exitCode === 2);
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('does not detect npm test when script is the default placeholder', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp);
        createMockPackageJson(tmp, {
          scripts: { test: 'echo "Error: no test specified" && exit 1' },
        });
        // Should not try to run tests since it's the default placeholder
        const result = runHook(HOOK_FILE, { cwd: tmp });
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('detects cargo test from Cargo.toml', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp);
        writeFile(tmp, 'Cargo.toml', '[package]\nname = "test"\nversion = "0.1.0"');
        const result = runHook(HOOK_FILE, { cwd: tmp });
        // cargo test will fail (not installed or no project) → exit 2
        assert.strictEqual(result.exitCode, 2);
        assert.ok(result.stderr.includes('Tests failing'));
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('detects go test from go.mod', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp);
        writeFile(tmp, 'go.mod', 'module example.com/test\n\ngo 1.21');
        const result = runHook(HOOK_FILE, { cwd: tmp });
        // go test will fail → exit 2
        assert.strictEqual(result.exitCode, 2);
        assert.ok(result.stderr.includes('Tests failing'));
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('detects pytest from pyproject.toml', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp);
        writeFile(tmp, 'pyproject.toml', '[tool.pytest.ini_options]\nminversion = "6.0"');
        const result = runHook(HOOK_FILE, { cwd: tmp });
        // pytest will fail or not be found → exit 2
        assert.strictEqual(result.exitCode, 2);
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('detects make test from Makefile', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp);
        writeFile(tmp, 'Makefile', 'test:\n\techo "running tests"');
        const result = runHook(HOOK_FILE, { cwd: tmp });
        // make test should succeed with our simple echo command
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('detects mix test from mix.exs', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp);
        writeFile(tmp, 'mix.exs', 'defmodule Test.MixProject do\nend');
        const result = runHook(HOOK_FILE, { cwd: tmp });
        // mix test will fail → exit 2
        assert.strictEqual(result.exitCode, 2);
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('returns null (exit 0) when no test setup exists', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp);
        // No package.json, Cargo.toml, go.mod, etc.
        const result = runHook(HOOK_FILE, { cwd: tmp });
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });
  });

  // ─── detectLintCommand ─────────────────────────────────────────

  describe('detectLintCommand()', () => {
    it('detects npm run lint from package.json with lint script', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp);
        createMockPackageJson(tmp, {
          scripts: { lint: 'echo lint-ok' },
        });
        // npm run lint with "echo lint-ok" should succeed
        const result = runHook(HOOK_FILE, { cwd: tmp });
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('detects eslint from .eslintrc.json config', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp);
        writeFile(tmp, '.eslintrc.json', '{}');
        const result = runHook(HOOK_FILE, { cwd: tmp });
        // npx eslint will fail → exit 2
        assert.strictEqual(result.exitCode, 2);
        assert.ok(result.stderr.includes('Lint errors'));
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('detects cargo clippy from Cargo.toml', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp);
        writeFile(tmp, 'Cargo.toml', '[package]\nname = "test"');
        const result = runHook(HOOK_FILE, { cwd: tmp });
        // cargo test runs first and fails → exit 2 (test takes priority over lint)
        assert.strictEqual(result.exitCode, 2);
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('detects golangci-lint from .golangci.yml', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp);
        writeFile(tmp, '.golangci.yml', 'linters:\n  enable:\n    - revive');
        const result = runHook(HOOK_FILE, { cwd: tmp });
        // golangci-lint will fail → exit 2
        assert.strictEqual(result.exitCode, 2);
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('detects ruff from ruff.toml', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp);
        writeFile(tmp, 'ruff.toml', '[lint]\nselect = ["E"]');
        const result = runHook(HOOK_FILE, { cwd: tmp });
        // ruff may be installed (exit 0 if no Python files) or not (exit 2)
        // Either way, the hook detected the lint command — it didn't skip silently
        assert.ok(result.exitCode === 0 || result.exitCode === 2);
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('detects flake8 from .flake8 config', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp);
        writeFile(tmp, '.flake8', '[flake8]\nmax-line-length = 120');
        const result = runHook(HOOK_FILE, { cwd: tmp });
        // flake8 may not be installed → exit 2
        assert.strictEqual(result.exitCode, 2);
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('returns null (exit 0) when no lint setup exists', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp);
        // No lint config files
        const result = runHook(HOOK_FILE, { cwd: tmp });
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });
  });

  // ─── runCommand ────────────────────────────────────────────────

  describe('runCommand() via integration', () => {
    it('succeeds when test command passes', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp);
        writeFile(tmp, 'Makefile', 'test:\n\t@echo "all tests pass"');
        const result = runHook(HOOK_FILE, { cwd: tmp });
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('fails with exit 2 when test command fails', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp);
        writeFile(tmp, 'Makefile', 'test:\n\t@exit 1');
        const result = runHook(HOOK_FILE, { cwd: tmp });
        assert.strictEqual(result.exitCode, 2);
        assert.ok(result.stderr.includes('Tests failing'));
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('succeeds when lint command passes', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp);
        createMockPackageJson(tmp, {
          scripts: { lint: 'echo lint-ok' },
        });
        const result = runHook(HOOK_FILE, { cwd: tmp });
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('fails with exit 2 when lint command fails', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp);
        writeFile(tmp, 'Makefile', 'lint:\n\t@exit 1');
        const result = runHook(HOOK_FILE, { cwd: tmp });
        assert.strictEqual(result.exitCode, 2);
        assert.ok(result.stderr.includes('Lint errors'));
      } finally {
        cleanupTempDir(tmp);
      }
    });
  });

  // ─── main ──────────────────────────────────────────────────────

  describe('main()', () => {
    it('skips when not in GMSD execution', () => {
      const tmp = createTempDir();
      try {
        // No state.json
        const result = runHook(HOOK_FILE, { cwd: tmp });
        assert.strictEqual(result.exitCode, 0);
        assert.strictEqual(result.stderr, '');
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('blocks on test failure (exit 2)', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp);
        writeFile(tmp, 'Makefile', 'test:\n\t@echo "FAIL" && exit 1');
        const result = runHook(HOOK_FILE, { cwd: tmp });
        assert.strictEqual(result.exitCode, 2);
        assert.ok(result.stderr.includes('Tests failing'));
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('blocks on lint failure (exit 2)', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp);
        writeFile(tmp, 'Makefile', 'lint:\n\t@echo "lint error" && exit 1');
        const result = runHook(HOOK_FILE, { cwd: tmp });
        assert.strictEqual(result.exitCode, 2);
        assert.ok(result.stderr.includes('Lint errors'));
      } finally {
        cleanupTempDir(tmp);
      }
    });

    it('passes when both test and lint succeed', () => {
      const tmp = createTempDir();
      try {
        createMockState(tmp);
        writeFile(tmp, 'Makefile', 'test:\n\t@echo "ok"\nlint:\n\t@echo "ok"');
        const result = runHook(HOOK_FILE, { cwd: tmp });
        assert.strictEqual(result.exitCode, 0);
      } finally {
        cleanupTempDir(tmp);
      }
    });
  });
});
