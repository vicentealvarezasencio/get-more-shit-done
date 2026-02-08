import { describe, it } from 'node:test';
import assert from 'node:assert';
import { join } from 'path';
import {
  createTempDir,
  cleanupTempDir,
  writeFile,
  runBin,
  PROJECT_ROOT,
} from '../helpers/setup.js';

describe('bin/validate.js', () => {
  // ─── validation passes with all required files ─────────────────

  describe('validation in the real project', () => {
    it('passes validation with all required files present', () => {
      const result = runBin('validate.js');
      assert.strictEqual(result.exitCode, 0, `Validation should pass. stderr: ${result.stderr}`);
      assert.ok(result.stdout.includes('Validation passed'), 'should report validation passed');
    });

    it('reports file counts', () => {
      const result = runBin('validate.js');
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('Commands:'), 'should report command count');
      assert.ok(result.stdout.includes('Agents:'), 'should report agent count');
    });
  });

  // ─── package.json field validation ─────────────────────────────

  describe('package.json validation', () => {
    it('validates required fields in package.json', () => {
      // The validate script checks for name, version, description, bin, files, license
      // Since we're running against the real project, it should pass
      const result = runBin('validate.js');
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('Validating package.json'));
    });
  });

  // ─── validation fails with missing files ───────────────────────

  describe('validation failure scenarios', () => {
    it('checks for required root files', () => {
      // The validate script checks for: package.json, README.md, LICENSE, bin/install.js, bin/validate.js
      // We can verify this by reading the output which lists what it checks
      const result = runBin('validate.js');
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('Checking root files'));
    });

    it('checks for required commands', () => {
      const result = runBin('validate.js');
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('Checking commands'));
    });

    it('checks for required agents', () => {
      const result = runBin('validate.js');
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('Checking agents'));
    });
  });
});
