#!/usr/bin/env node

/**
 * Get More Shit Done (GMSD) for Claude Code - Installer
 *
 * Installs commands, agents, workflows, and templates to ~/.claude/ (global)
 * or ./.claude/ (local) for use with Claude Code.
 *
 * Usage:
 *   npx get-more-shit-done-cc          # Global install (recommended)
 *   npx get-more-shit-done-cc --local  # Local install (project-specific)
 *   npx get-more-shit-done-cc --dry-run # Preview without installing
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = dirname(__dirname);

// Parse arguments
const args = process.argv.slice(2);
const isLocal = args.includes('--local');
const isGlobal = args.includes('--global');
const isDryRun = args.includes('--dry-run');
const isHelp = args.includes('--help') || args.includes('-h');

// Version from package.json
const packageJson = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf-8'));
const VERSION = packageJson.version;

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function showBanner() {
  console.log(`
${colors.magenta}┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ${colors.bright}Get More Shit Done${colors.reset}${colors.magenta}  — Team-Based Orchestration for Claude Code  │
│   ${colors.dim}v${VERSION}${colors.reset}${colors.magenta}                                                         │
│                                                                 │
│   Research  ──►  Design  ──►  Plan  ──►  Execute  ──►  Verify  │
│                    ${colors.dim}Coordinated Agent Teams${colors.reset}${colors.magenta}                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘${colors.reset}
`);
}

function showHelp() {
  showBanner();
  console.log(`${colors.bright}Usage:${colors.reset}
  npx get-more-shit-done-cc [options]

${colors.bright}Options:${colors.reset}
  --global      Install to ~/.claude/ (default)
  --local       Install to ./.claude/ (project-specific)
  --dry-run     Preview installation without making changes
  --help, -h    Show this help message

${colors.bright}What gets installed:${colors.reset}
  commands/gmsd/    Slash commands (/gmsd:new-project, /gmsd:execute-phase, etc.)
  agents/           Specialized agents (researcher, planner, executor, verifier, etc.)
  workflows/        Orchestrator workflow definitions
  templates/        Project and phase templates

${colors.bright}Default location:${colors.reset}
  ~/.claude/        Global installation (works across all projects)

${colors.bright}After installation:${colors.reset}
  1. Open Claude Code in any project
  2. Run /gmsd:new-project to get started
  3. Run /gmsd:help for command reference

${colors.bright}Requirements:${colors.reset}
  Claude Code with Agent Teams enabled:
  Set CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 in ~/.claude/settings.json
`);
}

// Determine install location
async function getInstallDir() {
  if (isLocal) {
    return join(process.cwd(), '.claude');
  }
  if (isGlobal) {
    return join(homedir(), '.claude');
  }

  // Interactive mode - ask user
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('\nWhere would you like to install GMSD?\n');
    console.log('  1. Global (~/.claude/) - Available for all projects');
    console.log('  2. Local (./.claude/)  - Only for current project\n');

    rl.question('Select [1/2] (default: 1): ', (answer) => {
      rl.close();
      if (answer === '2') {
        resolve(join(process.cwd(), '.claude'));
      } else {
        resolve(join(homedir(), '.claude'));
      }
    });
  });
}

function countFiles(dir) {
  let count = 0;
  if (!existsSync(dir)) return 0;

  const items = readdirSync(dir);
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      count += countFiles(fullPath);
    } else {
      count++;
    }
  }
  return count;
}

// Copy directory recursively with path replacements
function copyDir(src, dest, options = {}) {
  const { pathReplacements = {}, dryRun = false } = options;

  if (!existsSync(src)) {
    return 0;
  }

  if (!dryRun) {
    mkdirSync(dest, { recursive: true });
  }

  let copied = 0;
  const entries = readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      copied += copyDir(srcPath, destPath, options);
    } else {
      if (!dryRun) {
        let content = readFileSync(srcPath, 'utf8');

        // Apply path replacements for .md files
        if (entry.name.endsWith('.md')) {
          for (const [search, replace] of Object.entries(pathReplacements)) {
            content = content.replace(new RegExp(search, 'g'), replace);
          }
        }

        writeFileSync(destPath, content);
      }
      copied++;
    }
  }

  return copied;
}

// Remove directory if it exists
function removeDir(dir) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
}

// Check and enable Agent Teams setting
function checkAgentTeams(configDir) {
  const settingsPath = join(configDir, 'settings.json');

  if (existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
      const env = settings.env || {};
      if (env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS === '1') {
        return true; // Already enabled
      }
    } catch (e) {
      // Invalid JSON, will suggest manual setup
    }
  }

  return false;
}

// Main installation
async function install() {
  showBanner();

  const configDir = await getInstallDir();
  const isLocalInstall = configDir.includes(process.cwd());
  const pathPrefix = isLocalInstall ? './.claude' : '~/.claude';
  const installType = isLocalInstall ? 'local (./.claude/)' : 'global (~/.claude/)';

  if (isDryRun) {
    log(`Dry run - previewing ${installType} installation\n`, 'yellow');
  } else {
    log(`Installing to: ${configDir}\n`, 'blue');
  }

  const pathReplacements = {
    '~/.claude': pathPrefix
  };

  // Ensure base directory exists
  if (!isDryRun) {
    mkdirSync(configDir, { recursive: true });
  }

  let totalCopied = 0;

  // 1. Install commands
  const commandsSrc = join(packageRoot, 'commands', 'gmsd');
  const commandsDest = join(configDir, 'commands', 'gmsd');
  const commandCount = countFiles(commandsSrc);

  log(`${colors.bright}Commands${colors.reset} (${commandCount} files)`, 'cyan');
  if (existsSync(commandsSrc)) {
    if (!isDryRun) {
      removeDir(commandsDest);
    }
    const copied = copyDir(commandsSrc, commandsDest, { pathReplacements, dryRun: isDryRun });
    totalCopied += copied;
    if (!isDryRun) {
      log(`  ✓ Installed to commands/gmsd/`, 'green');
    } else {
      log(`  Would install to commands/gmsd/`, 'dim');
    }
  } else {
    log(`  - No commands yet (will be added in future versions)`, 'dim');
  }
  console.log();

  // 2. Install agents (only gmsd-* prefixed, preserve others)
  const agentsSrc = join(packageRoot, 'agents');
  const agentsDest = join(configDir, 'agents');

  let agentCount = 0;
  if (existsSync(agentsSrc)) {
    for (const file of readdirSync(agentsSrc)) {
      if (file.startsWith('gmsd-')) agentCount++;
    }
  }

  log(`${colors.bright}Agents${colors.reset} (${agentCount} files)`, 'cyan');
  if (existsSync(agentsSrc) && agentCount > 0) {
    if (!isDryRun) {
      mkdirSync(agentsDest, { recursive: true });

      // Remove existing gmsd-* agents
      if (existsSync(agentsDest)) {
        for (const file of readdirSync(agentsDest)) {
          if (file.startsWith('gmsd-')) {
            rmSync(join(agentsDest, file));
          }
        }
      }

      // Copy new gmsd-* agents
      for (const file of readdirSync(agentsSrc)) {
        if (file.startsWith('gmsd-')) {
          let content = readFileSync(join(agentsSrc, file), 'utf8');
          for (const [search, replace] of Object.entries(pathReplacements)) {
            content = content.replace(new RegExp(search, 'g'), replace);
          }
          writeFileSync(join(agentsDest, file), content);
          totalCopied++;
        }
      }
      log(`  ✓ Installed to agents/gmsd-*`, 'green');
    } else {
      totalCopied += agentCount;
      log(`  Would install to agents/gmsd-*`, 'dim');
    }
  } else {
    log(`  - No agents yet (will be added in future versions)`, 'dim');
  }
  console.log();

  // 3. Install workflows
  const workflowsSrc = join(packageRoot, 'workflows');
  const workflowsDest = join(configDir, 'get-more-shit-done', 'workflows');
  const workflowCount = countFiles(workflowsSrc);

  log(`${colors.bright}Workflows${colors.reset} (${workflowCount} files)`, 'cyan');
  if (existsSync(workflowsSrc)) {
    if (!isDryRun) {
      removeDir(workflowsDest);
    }
    const copied = copyDir(workflowsSrc, workflowsDest, { pathReplacements, dryRun: isDryRun });
    totalCopied += copied;
    if (!isDryRun) {
      log(`  ✓ Installed to get-more-shit-done/workflows/`, 'green');
    } else {
      log(`  Would install to get-more-shit-done/workflows/`, 'dim');
    }
  } else {
    log(`  - No workflows yet (will be added in future versions)`, 'dim');
  }
  console.log();

  // 4. Install templates
  const templatesSrc = join(packageRoot, 'templates');
  const templatesDest = join(configDir, 'get-more-shit-done', 'templates');
  const templateCount = countFiles(templatesSrc);

  log(`${colors.bright}Templates${colors.reset} (${templateCount} files)`, 'cyan');
  if (existsSync(templatesSrc)) {
    if (!isDryRun) {
      removeDir(templatesDest);
    }
    const copied = copyDir(templatesSrc, templatesDest, { pathReplacements, dryRun: isDryRun });
    totalCopied += copied;
    if (!isDryRun) {
      log(`  ✓ Installed to get-more-shit-done/templates/`, 'green');
    } else {
      log(`  Would install to get-more-shit-done/templates/`, 'dim');
    }
  } else {
    log(`  - No templates yet (will be added in future versions)`, 'dim');
  }
  console.log();

  // 5. Write version file
  if (!isDryRun) {
    const versionDir = join(configDir, 'get-more-shit-done');
    mkdirSync(versionDir, { recursive: true });
    writeFileSync(join(versionDir, 'VERSION'), VERSION);
    log(`Version file written (${VERSION})`, 'green');
  }

  // 6. Check Agent Teams setting
  const agentTeamsEnabled = checkAgentTeams(configDir);

  // Summary
  console.log(colors.bright + '─'.repeat(50) + colors.reset);

  if (isDryRun) {
    log(`\nDry run complete. Would install ${totalCopied} files.`, 'yellow');
    log(`\nRun without --dry-run to install.`, 'dim');
  } else {
    log(`\n✓ Installation complete! (${totalCopied} files)`, 'green');

    if (!agentTeamsEnabled) {
      log(`\n⚠ Agent Teams not enabled. Add to ~/.claude/settings.json:`, 'yellow');
      log(`  { "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" } }`, 'dim');
    }

    log(`\nNext steps:`, 'bright');
    log(`  1. Open Claude Code in your project`, 'dim');
    log(`  2. Run ${colors.cyan}/gmsd:new-project${colors.reset}${colors.dim} to get started`);
    log(`  3. Run ${colors.cyan}/gmsd:help${colors.reset}${colors.dim} for all commands`);
    log(`\nWorks alongside ui-design-cc for UI/UX workflows`, 'dim');
  }

  console.log();
}

// Main
if (isHelp) {
  showHelp();
} else {
  install().catch((err) => {
    console.error('Installation failed:', err.message);
    process.exit(1);
  });
}
