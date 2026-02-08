import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runBin, PROJECT_ROOT } from '../helpers/setup.js';

describe('bin/install.js', () => {
  // ─── dry-run mode ──────────────────────────────────────────────

  describe('--dry-run', () => {
    it('produces expected output without making changes', () => {
      const result = runBin('install.js', ['--dry-run', '--global']);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('Dry run'), 'should mention dry run');
      assert.ok(result.stdout.includes('Would install'), 'should preview installations');
    });

    it('reports file counts in dry-run', () => {
      const result = runBin('install.js', ['--dry-run', '--global']);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('files'), 'should report file counts');
    });
  });

  // ─── help ──────────────────────────────────────────────────────

  describe('--help', () => {
    it('shows usage information', () => {
      const result = runBin('install.js', ['--help']);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('Usage'));
      assert.ok(result.stdout.includes('--global'));
      assert.ok(result.stdout.includes('--local'));
      assert.ok(result.stdout.includes('--dry-run'));
      assert.ok(result.stdout.includes('--preset'));
    });
  });

  // ─── preset detection ─────────────────────────────────────────

  describe('preset detection', () => {
    it('accepts valid preset in dry-run', () => {
      const result = runBin('install.js', ['--dry-run', '--global', '--preset', 'nextjs']);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(
        result.stdout.includes('nextjs') || result.stdout.includes('preset'),
        'should acknowledge the preset'
      );
    });

    it('warns about unknown preset in dry-run', () => {
      const result = runBin('install.js', ['--dry-run', '--global', '--preset', 'invalid-preset']);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(
        result.stdout.includes('Unknown preset') || result.stdout.includes('invalid-preset'),
        'should warn about unknown preset'
      );
    });

    it('handles --preset=value format', () => {
      const result = runBin('install.js', ['--dry-run', '--global', '--preset=ios']);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(
        result.stdout.includes('ios') || result.stdout.includes('preset'),
        'should handle --preset=value format'
      );
    });
  });

  // ─── banner ────────────────────────────────────────────────────

  describe('banner output', () => {
    it('displays the GMSD banner', () => {
      const result = runBin('install.js', ['--dry-run', '--global']);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('Get More Shit Done'), 'should display banner');
    });
  });
});
