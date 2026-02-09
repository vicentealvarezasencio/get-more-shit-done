#!/usr/bin/env node

/**
 * Get More Shit Done (GMSD) for Claude Code - Installer
 *
 * Installs commands, agents, workflows, and templates to ~/.claude/ (global)
 * or ./.claude/ (local) for use with Claude Code.
 *
 * Usage:
 *   npx get-more-shit-done-cc              # Global install (recommended)
 *   npx get-more-shit-done-cc --local      # Local install (project-specific)
 *   npx get-more-shit-done-cc --dry-run    # Preview without installing
 *   npx get-more-shit-done-cc --uninstall  # Remove GMSD files
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { createInterface } from 'readline';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = dirname(__dirname);

// Parse arguments
const args = process.argv.slice(2);
const isLocal = args.includes('--local');
const isGlobal = args.includes('--global');
const isDryRun = args.includes('--dry-run');
const isHelp = args.includes('--help') || args.includes('-h');
const isUninstall = args.includes('--uninstall');
const isForce = args.includes('--force');
const presetFlag = args.find(a => a.startsWith('--preset'));
const presetValue = presetFlag
  ? (presetFlag.includes('=') ? presetFlag.split('=')[1] : args[args.indexOf(presetFlag) + 1])
  : null;
const validPresets = ['nextjs', 'ios', 'react-native', 'api', 'cli', 'chrome-extension', 'monorepo'];

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
${colors.magenta} ██████╗ ███╗   ███╗███████╗██████╗
██╔════╝ ████╗ ████║██╔════╝██╔══██╗
██║  ███╗██╔████╔██║███████╗██║  ██║
██║   ██║██║╚██╔╝██║╚════██║██║  ██║
╚██████╔╝██║ ╚═╝ ██║███████║██████╔╝
 ╚═════╝ ╚═╝     ╚═╝╚══════╝╚═════╝${colors.reset}
  ${colors.dim}Team-Based Orchestration for Claude Code  v${VERSION}${colors.reset}
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
  --uninstall   Remove GMSD files (use with --global or --local to skip prompt)
  --preset {type}  Apply a project-type preset during install
                   Types: nextjs, ios, react-native, api, cli,
                          chrome-extension, monorepo
  --force       Skip confirmation prompt during uninstall
  --help, -h    Show this help message

${colors.bright}What gets installed:${colors.reset}
  commands/gmsd/    Slash commands (/gmsd:new-project, /gmsd:execute-phase, etc.)
  agents/           Specialized agents (researcher, planner, executor, verifier, etc.)
  workflows/        Orchestrator workflow definitions
  templates/        Project and phase templates
  ui-design/        UI design adapters, templates, and references
  references/       Verification patterns, checkpoint handling, and CLI references

${colors.bright}Default location:${colors.reset}
  ~/.claude/        Global installation (works across all projects)

${colors.bright}Preset install:${colors.reset}
  npx get-more-shit-done-cc --preset nextjs
  npx get-more-shit-done-cc --preset api --local

${colors.bright}After installation:${colors.reset}
  1. Open Claude Code in any project
  2. Run /gmsd:new-project to get started
  3. Run /gmsd:help for command reference
  4. Run /gmsd:tour for an interactive walkthrough

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

// ─────────────────────────────────────────────────────────────────────────────
// Local Patch Preservation
// ─────────────────────────────────────────────────────────────────────────────

function hashFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    return createHash('sha256').update(content).digest('hex');
  } catch {
    return null;
  }
}

function collectFilesRecursive(dir, baseDir = dir) {
  const files = [];
  if (!existsSync(dir)) return files;

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFilesRecursive(fullPath, baseDir));
    } else {
      files.push(relative(baseDir, fullPath));
    }
  }
  return files;
}

function generateFileManifest(configDir) {
  const manifest = {};
  const dirs = [
    { base: join(configDir, 'commands', 'gmsd'), prefix: 'commands/gmsd' },
    { base: join(configDir, 'get-more-shit-done', 'workflows'), prefix: 'get-more-shit-done/workflows' },
    { base: join(configDir, 'get-more-shit-done', 'templates'), prefix: 'get-more-shit-done/templates' },
    { base: join(configDir, 'get-more-shit-done', 'ui-design'), prefix: 'get-more-shit-done/ui-design' },
    { base: join(configDir, 'get-more-shit-done', 'references'), prefix: 'get-more-shit-done/references' },
  ];

  for (const { base, prefix } of dirs) {
    const files = collectFilesRecursive(base);
    for (const file of files) {
      const fullPath = join(base, file);
      const hash = hashFile(fullPath);
      if (hash) {
        manifest[`${prefix}/${file}`] = hash;
      }
    }
  }

  // Agents
  const agentsDir = join(configDir, 'agents');
  if (existsSync(agentsDir)) {
    for (const file of readdirSync(agentsDir)) {
      if (file.startsWith('gmsd-')) {
        const hash = hashFile(join(agentsDir, file));
        if (hash) {
          manifest[`agents/${file}`] = hash;
        }
      }
    }
  }

  // Hooks
  const hooksDir = join(configDir, 'hooks');
  if (existsSync(hooksDir)) {
    for (const file of readdirSync(hooksDir)) {
      if (file.startsWith('gmsd-')) {
        const hash = hashFile(join(hooksDir, file));
        if (hash) {
          manifest[`hooks/${file}`] = hash;
        }
      }
    }
  }

  return manifest;
}

function detectLocalPatches(configDir) {
  const manifestPath = join(configDir, 'get-more-shit-done', 'gmsd-file-manifest.json');
  if (!existsSync(manifestPath)) return [];

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    return [];
  }

  const modified = [];
  for (const [relPath, originalHash] of Object.entries(manifest)) {
    const fullPath = join(configDir, relPath);
    if (!existsSync(fullPath)) continue; // File was deleted, not a patch

    const currentHash = hashFile(fullPath);
    if (currentHash && currentHash !== originalHash) {
      modified.push({
        relativePath: relPath,
        fullPath,
        originalHash,
        currentHash
      });
    }
  }

  return modified;
}

function backupLocalPatches(configDir, modifiedFiles) {
  if (modifiedFiles.length === 0) return null;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = join(configDir, 'gmsd-local-patches', timestamp);
  mkdirSync(backupDir, { recursive: true });

  const backupMeta = {
    timestamp: new Date().toISOString(),
    version_before: null,
    files: []
  };

  // Read previous version
  const versionPath = join(configDir, 'get-more-shit-done', 'VERSION');
  if (existsSync(versionPath)) {
    backupMeta.version_before = readFileSync(versionPath, 'utf8').trim();
  }

  for (const mod of modifiedFiles) {
    // Preserve directory structure in backup
    const destPath = join(backupDir, mod.relativePath);
    mkdirSync(dirname(destPath), { recursive: true });
    writeFileSync(destPath, readFileSync(mod.fullPath, 'utf8'));

    backupMeta.files.push({
      path: mod.relativePath,
      original_hash: mod.originalHash,
      modified_hash: mod.currentHash
    });
  }

  writeFileSync(join(backupDir, 'backup-meta.json'), JSON.stringify(backupMeta, null, 2));

  return {
    backupDir,
    count: modifiedFiles.length,
    timestamp
  };
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
    '~/.claude/ui-design/': `${pathPrefix}/get-more-shit-done/ui-design/`,
    '~/.claude': pathPrefix
  };

  // Ensure base directory exists
  if (!isDryRun) {
    mkdirSync(configDir, { recursive: true });
  }

  // Detect and back up locally modified files before wiping
  let patchBackup = null;
  if (!isDryRun) {
    const modifiedFiles = detectLocalPatches(configDir);
    if (modifiedFiles.length > 0) {
      patchBackup = backupLocalPatches(configDir, modifiedFiles);
      log(`  Backed up ${patchBackup.count} locally modified file(s)`, 'yellow');
      log(`  Backup: gmsd-local-patches/${patchBackup.timestamp}/`, 'dim');
      console.log();
    }
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

  // 5. Install ui-design
  const uiDesignSrc = join(packageRoot, 'ui-design');
  const uiDesignDest = join(configDir, 'get-more-shit-done', 'ui-design');
  const uiDesignCount = countFiles(uiDesignSrc);

  log(`${colors.bright}UI Design${colors.reset} (${uiDesignCount} files)`, 'cyan');
  if (existsSync(uiDesignSrc)) {
    if (!isDryRun) {
      removeDir(uiDesignDest);
    }
    const copied = copyDir(uiDesignSrc, uiDesignDest, { pathReplacements, dryRun: isDryRun });
    totalCopied += copied;
    if (!isDryRun) {
      log(`  ✓ Installed to get-more-shit-done/ui-design/`, 'green');
    } else {
      log(`  Would install to get-more-shit-done/ui-design/`, 'dim');
    }
  } else {
    log(`  - No ui-design files found`, 'dim');
  }
  console.log();

  // 6. Install references
  const referencesSrc = join(packageRoot, 'references');
  const referencesDest = join(configDir, 'get-more-shit-done', 'references');
  const referencesCount = countFiles(referencesSrc);

  log(`${colors.bright}References${colors.reset} (${referencesCount} files)`, 'cyan');
  if (existsSync(referencesSrc)) {
    if (!isDryRun) {
      removeDir(referencesDest);
    }
    const copied = copyDir(referencesSrc, referencesDest, { pathReplacements, dryRun: isDryRun });
    totalCopied += copied;
    if (!isDryRun) {
      log(`  ✓ Installed to get-more-shit-done/references/`, 'green');
    } else {
      log(`  Would install to get-more-shit-done/references/`, 'dim');
    }
  } else {
    log(`  - No reference files found`, 'dim');
  }
  console.log();

  // 7. Install hooks (renumbered from 6)
  const hooksSrc = join(packageRoot, 'hooks');
  const hooksDest = join(configDir, 'hooks');
  const hookFiles = ['gmsd-task-completed.js', 'gmsd-teammate-idle.js', 'gmsd-file-tracker.js'];

  let hookCount = 0;
  if (existsSync(hooksSrc)) {
    for (const file of hookFiles) {
      if (existsSync(join(hooksSrc, file))) hookCount++;
    }
  }

  log(`${colors.bright}Hooks${colors.reset} (${hookCount} files)`, 'cyan');
  if (existsSync(hooksSrc) && hookCount > 0) {
    if (!isDryRun) {
      mkdirSync(hooksDest, { recursive: true });

      // Remove existing gmsd-* hooks
      if (existsSync(hooksDest)) {
        for (const file of readdirSync(hooksDest)) {
          if (file.startsWith('gmsd-')) {
            rmSync(join(hooksDest, file));
          }
        }
      }

      // Copy hook files
      for (const file of hookFiles) {
        const srcFile = join(hooksSrc, file);
        if (existsSync(srcFile)) {
          writeFileSync(join(hooksDest, file), readFileSync(srcFile, 'utf8'));
          totalCopied++;
        }
      }
      log(`  ✓ Installed to hooks/gmsd-*`, 'green');
    } else {
      totalCopied += hookCount;
      log(`  Would install to hooks/gmsd-*`, 'dim');
    }
  } else {
    log(`  - No hooks found`, 'dim');
  }
  console.log();

  // 8. Write version file and file manifest
  if (!isDryRun) {
    const versionDir = join(configDir, 'get-more-shit-done');
    mkdirSync(versionDir, { recursive: true });
    writeFileSync(join(versionDir, 'VERSION'), VERSION);
    log(`Version file written (${VERSION})`, 'green');

    // Generate file manifest for future patch detection
    const manifest = generateFileManifest(configDir);
    writeFileSync(
      join(versionDir, 'gmsd-file-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    log(`File manifest written (${Object.keys(manifest).length} files tracked)`, 'green');
  }

  // 9. Apply preset if specified
  if (presetValue && !isDryRun) {
    if (!validPresets.includes(presetValue)) {
      log(`\n⚠ Unknown preset: "${presetValue}"`, 'yellow');
      log(`  Valid presets: ${validPresets.join(', ')}`, 'dim');
      log(`  Skipping preset application. You can apply one later via /gmsd:new-project.\n`, 'dim');
    } else {
      const presetSrc = join(packageRoot, 'templates', 'presets', `${presetValue}.json`);
      if (existsSync(presetSrc)) {
        const preset = JSON.parse(readFileSync(presetSrc, 'utf8'));
        const presetMarkerDir = join(configDir, 'get-more-shit-done');
        mkdirSync(presetMarkerDir, { recursive: true });
        writeFileSync(join(presetMarkerDir, 'PRESET'), presetValue);
        log(`\n✓ Preset "${presetValue}" selected: ${preset.description}`, 'green');
        log(`  Will be applied when you run /gmsd:new-project`, 'dim');
        log(`  Config overrides: executors=${preset.config_overrides?.teams?.default_executors || 3}, ` +
          `max=${preset.config_overrides?.teams?.max_executors || 5}`, 'dim');
        if (preset.suggested_phases) {
          log(`  Suggested phases: ${preset.suggested_phases.length} phases ready`, 'dim');
        }
      } else {
        log(`\n⚠ Preset file not found for "${presetValue}". Skipping.`, 'yellow');
      }
    }
  } else if (presetValue && isDryRun) {
    if (validPresets.includes(presetValue)) {
      log(`\nWould apply preset: "${presetValue}"`, 'dim');
    } else {
      log(`\n⚠ Unknown preset: "${presetValue}" (would be skipped)`, 'yellow');
    }
  }

  // 10. Check Agent Teams setting
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

    // Show hooks configuration instructions
    log(`\n${colors.bright}Optional: Enable GMSD quality hooks${colors.reset}`, 'yellow');
    log(`To enable automated quality checks, add to your settings.json:`, 'dim');
    console.log(`${colors.dim}  {
    "hooks": {
      "TaskCompleted": [{ "hooks": [{ "type": "command", "command": "node ${pathPrefix}/hooks/gmsd-task-completed.js" }] }],
      "TeammateIdle": [{ "hooks": [{ "type": "command", "command": "node ${pathPrefix}/hooks/gmsd-teammate-idle.js" }] }],
      "PostToolUse": [{ "hooks": [{ "type": "command", "command": "node ${pathPrefix}/hooks/gmsd-file-tracker.js" }] }]
    }
  }${colors.reset}`);

    // Notify about backed-up patches
    if (patchBackup) {
      log(`\n${colors.bright}Local patches backed up:${colors.reset}`, 'yellow');
      log(`  ${patchBackup.count} file(s) had local modifications that were preserved.`, 'dim');
      log(`  Backup location: ${pathPrefix}/gmsd-local-patches/${patchBackup.timestamp}/`, 'dim');
      log(`  To review and reapply: ${colors.cyan}/gmsd:reapply-patches${colors.reset}`, 'dim');
    }

    log(`\nNext steps:`, 'bright');
    log(`  1. Open Claude Code in your project`, 'dim');
    if (presetValue && validPresets.includes(presetValue)) {
      log(`  2. Run ${colors.cyan}/gmsd:new-project${colors.reset}${colors.dim} to get started (${presetValue} preset will be auto-applied)`);
    } else {
      log(`  2. Run ${colors.cyan}/gmsd:new-project${colors.reset}${colors.dim} to get started`);
    }
    log(`  3. Run ${colors.cyan}/gmsd:tour${colors.reset}${colors.dim} for an interactive walkthrough`);
    log(`  4. Run ${colors.cyan}/gmsd:help${colors.reset}${colors.dim} for all commands`);
  }

  console.log();
}

// Uninstall GMSD files
async function uninstall() {
  showBanner();

  const configDir = await getInstallDir();
  const isLocalInstall = configDir.includes(process.cwd());
  const installType = isLocalInstall ? 'local (./.claude/)' : 'global (~/.claude/)';

  log(`Uninstalling GMSD from: ${configDir} (${installType})\n`, 'blue');

  // Collect items to remove
  const toRemove = [];

  // 1. commands/gmsd/ directory
  const commandsDir = join(configDir, 'commands', 'gmsd');
  if (existsSync(commandsDir)) {
    const count = countFiles(commandsDir);
    toRemove.push({ path: commandsDir, type: 'directory', label: `commands/gmsd/ (${count} files)` });
  }

  // 2. agents/gmsd-*.md files (preserve non-gmsd agents)
  const agentsDir = join(configDir, 'agents');
  if (existsSync(agentsDir)) {
    for (const file of readdirSync(agentsDir)) {
      if (file.startsWith('gmsd-')) {
        toRemove.push({ path: join(agentsDir, file), type: 'file', label: `agents/${file}` });
      }
    }
  }

  // 3. hooks/gmsd-*.js files (preserve non-gmsd hooks)
  const hooksDir = join(configDir, 'hooks');
  if (existsSync(hooksDir)) {
    for (const file of readdirSync(hooksDir)) {
      if (file.startsWith('gmsd-')) {
        toRemove.push({ path: join(hooksDir, file), type: 'file', label: `hooks/${file}` });
      }
    }
  }

  // 4. get-more-shit-done/ directory (workflows, templates, VERSION)
  const gmsdDir = join(configDir, 'get-more-shit-done');
  if (existsSync(gmsdDir)) {
    const count = countFiles(gmsdDir);
    toRemove.push({ path: gmsdDir, type: 'directory', label: `get-more-shit-done/ (${count} files)` });
  }

  if (toRemove.length === 0) {
    log('No GMSD files found. Nothing to uninstall.', 'yellow');
    console.log();
    return;
  }

  // Show what will be removed
  log(`${colors.bright}The following will be removed:${colors.reset}`, 'yellow');
  for (const item of toRemove) {
    log(`  - ${item.label}`, 'dim');
  }
  console.log();

  // Confirmation prompt (skip with --force)
  if (!isForce) {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const confirmed = await new Promise((resolve) => {
      rl.question(`${colors.yellow}Proceed with uninstall? [y/N]: ${colors.reset}`, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });

    if (!confirmed) {
      log('\nUninstall cancelled.', 'dim');
      return;
    }
  }

  // Remove items
  for (const item of toRemove) {
    if (item.type === 'directory') {
      rmSync(item.path, { recursive: true, force: true });
    } else {
      rmSync(item.path, { force: true });
    }
    log(`  Removed ${item.label}`, 'red');
  }

  console.log(colors.bright + '─'.repeat(50) + colors.reset);
  log(`\nGMSD has been uninstalled from ${installType}.`, 'green');
  log('Other Claude Code configs, settings, and non-GMSD agents were preserved.', 'dim');
  console.log();
}

// Main
if (isHelp) {
  showHelp();
} else if (isUninstall) {
  uninstall().catch((err) => {
    console.error('Uninstall failed:', err.message);
    process.exit(1);
  });
} else {
  install().catch((err) => {
    console.error('Installation failed:', err.message);
    process.exit(1);
  });
}
