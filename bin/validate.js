#!/usr/bin/env node

/**
 * Get More Shit Done (GMSD) for Claude Code - Pre-publish Validation
 *
 * Validates that all required files exist before publishing to npm.
 * Run via: npm run prepublishOnly
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = dirname(__dirname);

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Required files and directories
const requiredFiles = [
  'package.json',
  'README.md',
  'LICENSE',
  'bin/install.js',
  'bin/validate.js',
  'bin/gmsd-state.js',
  'bin/gmsd-history-digest.js'
];

const requiredCommands = [
  'new-project.md',
  'plan-phase.md',
  'execute-phase.md',
  'verify-work.md',
  'progress.md',
  'help.md',
  'quick.md',
  'update.md',
  'map-codebase.md',
  'retrospective.md',
  'add-todo.md',
  'check-todos.md',
  'add-phase.md',
  'insert-phase.md',
  'remove-phase.md',
  'audit-milestone.md',
  'plan-milestone-gaps.md',
  'list-phase-assumptions.md',
  'research-phase.md',
  'new-milestone.md',
  'sync.md',
  'preflight.md',
  'create-pr.md',
  'check-design-drift.md',
  'replay.md',
  'estimate-cost.md',
  'tour.md',
  'init.md',
  'setup-tokens.md',
  'design-screens.md',
  'define-components.md',
  'patterns.md',
  'pencil.md',
  'export.md',
  'scan.md',
  'generate-specs.md',
  'reverse-engineer.md',
  'import-tokens.md',
  'import-design.md',
  'realize.md',
  'logo.md',
  'decisions.md',
  'ui-sync.md',
  'ui-status.md'
];

const requiredAgents = [
  'gmsd-researcher.md',
  'gmsd-planner.md',
  'gmsd-executor.md',
  'gmsd-verifier.md',
  'gmsd-codebase-mapper.md',
  'gmsd-ui-designer.md',
  'gmsd-ui-researcher.md',
  'gmsd-ui-specifier.md',
  'gmsd-ui-prompter.md',
  'gmsd-ui-brander.md',
  'gmsd-ui-scanner.md'
];

let errors = [];
let warnings = [];

function checkFile(path, description) {
  const fullPath = join(packageRoot, path);
  if (!existsSync(fullPath)) {
    errors.push(`Missing ${description}: ${path}`);
    return false;
  }
  return true;
}

function checkDirectory(dir, files, description) {
  const dirPath = join(packageRoot, dir);

  if (!existsSync(dirPath)) {
    errors.push(`Missing directory: ${dir}`);
    return;
  }

  for (const file of files) {
    const fullPath = join(dirPath, file);
    if (!existsSync(fullPath)) {
      errors.push(`Missing ${description}: ${dir}/${file}`);
    }
  }
}

function validatePackageJson() {
  const pkgPath = join(packageRoot, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

  // Check required fields
  const requiredFields = ['name', 'version', 'description', 'bin', 'files', 'license'];
  for (const field of requiredFields) {
    if (!pkg[field]) {
      errors.push(`package.json missing required field: ${field}`);
    }
  }

  // Check version format
  if (pkg.version && !/^\d+\.\d+\.\d+$/.test(pkg.version)) {
    warnings.push(`Version "${pkg.version}" should follow semver format (x.y.z)`);
  }

  // Check files array includes required directories
  const requiredInFiles = ['bin/', 'commands/', 'agents/', 'ui-design/'];
  for (const item of requiredInFiles) {
    if (!pkg.files || !pkg.files.includes(item)) {
      errors.push(`package.json "files" should include: ${item}`);
    }
  }

  return pkg;
}

function countFiles(dir) {
  let count = 0;
  const fullPath = join(packageRoot, dir);

  if (!existsSync(fullPath)) return 0;

  const items = readdirSync(fullPath);
  for (const item of items) {
    const itemPath = join(fullPath, item);
    const stat = statSync(itemPath);
    if (stat.isDirectory()) {
      count += countFiles(join(dir, item));
    } else {
      count++;
    }
  }
  return count;
}

// Run validation
log('\nValidating Get More Shit Done (GMSD) for Claude Code...\n', 'bright');

// Check root files
log('Checking root files...', 'bright');
for (const file of requiredFiles) {
  checkFile(file, 'root file');
}

// Check package.json
log('Validating package.json...', 'bright');
const pkg = validatePackageJson();

// Check commands
log('Checking commands/gmsd/...', 'bright');
checkDirectory('commands/gmsd', requiredCommands, 'command');

// Check agents
log('Checking agents/...', 'bright');
checkDirectory('agents', requiredAgents, 'agent');

// Check ui-design subdirectories
log('Checking ui-design/...', 'bright');
for (const subdir of ['adapters', 'templates', 'references']) {
  const subdirPath = join(packageRoot, 'ui-design', subdir);
  if (!existsSync(subdirPath)) {
    errors.push(`Missing ui-design subdirectory: ui-design/${subdir}`);
  }
}

// Summary
console.log('\n' + '─'.repeat(50));

const commandCount = countFiles('commands/gmsd');
const agentCount = countFiles('agents');
const workflowCount = countFiles('workflows');
const templateCount = countFiles('templates');
const uiDesignCount = countFiles('ui-design');

log(`\nPackage: ${pkg.name}@${pkg.version}`, 'bright');
log(`Commands: ${commandCount} files`, 'bright');
log(`Agents: ${agentCount} files`, 'bright');
log(`Workflows: ${workflowCount} files`, 'bright');
log(`Templates: ${templateCount} files`, 'bright');
log(`UI Design: ${uiDesignCount} files`, 'bright');

if (warnings.length > 0) {
  log(`\nWarnings (${warnings.length}):`, 'yellow');
  for (const warning of warnings) {
    log(`  ⚠ ${warning}`, 'yellow');
  }
}

if (errors.length > 0) {
  log(`\nErrors (${errors.length}):`, 'red');
  for (const error of errors) {
    log(`  ✗ ${error}`, 'red');
  }
  log('\nValidation failed. Please fix errors before publishing.\n', 'red');
  process.exit(1);
} else {
  log('\n✓ Validation passed! Ready to publish.\n', 'green');
  process.exit(0);
}
