#!/usr/bin/env node

/**
 * Get More Shit Done (GMSD) for Claude Code - Atomic State Operations
 *
 * CLI tool for atomic get/patch/append/increment operations on .planning/state.json.
 * Uses write-to-temp-then-rename pattern to prevent partial writes.
 *
 * Usage:
 *   gmsd-state get <field>              # Read a field (dot notation)
 *   gmsd-state patch <field> <value>    # Update a field atomically
 *   gmsd-state append <field> <value>   # Append to an array field
 *   gmsd-state increment <field>        # Increment a numeric field
 */

import { readFileSync, writeFileSync, renameSync, existsSync } from 'fs';
import { join } from 'path';

const STATE_PATH = join(process.cwd(), '.planning', 'state.json');
const TMP_PATH = join(process.cwd(), '.planning', 'state.json.tmp');

// --- Helpers ---

function getNestedValue(obj, path) {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[key];
  }
  return current;
}

function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (current[key] == null || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
}

function readState() {
  if (!existsSync(STATE_PATH)) {
    process.stderr.write(`Error: State file not found: ${STATE_PATH}\n`);
    process.exit(1);
  }
  try {
    return JSON.parse(readFileSync(STATE_PATH, 'utf-8'));
  } catch (e) {
    process.stderr.write(`Error: Invalid JSON in state file: ${e.message}\n`);
    process.exit(1);
  }
}

function writeStateAtomic(state) {
  state.last_updated = new Date().toISOString();
  writeFileSync(TMP_PATH, JSON.stringify(state, null, 2) + '\n', 'utf-8');
  renameSync(TMP_PATH, STATE_PATH);
}

function parseValue(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function usage() {
  process.stderr.write(`Usage:
  gmsd-state get <field>              Read a field (dot notation)
  gmsd-state patch <field> <value>    Update a field atomically
  gmsd-state append <field> <value>   Append to an array field
  gmsd-state increment <field>        Increment a numeric field

Examples:
  gmsd-state get phase_status
  gmsd-state get metrics.total_tasks_completed
  gmsd-state patch phase_status "executing"
  gmsd-state append completed_phases 1
  gmsd-state increment metrics.total_tasks_completed
`);
  process.exit(1);
}

// --- Commands ---

function cmdGet(field) {
  const state = readState();
  const value = getNestedValue(state, field);
  if (value === undefined) {
    process.stderr.write(`Error: Field not found: ${field}\n`);
    process.exit(1);
  }
  process.stdout.write(JSON.stringify(value, null, 2) + '\n');
}

function cmdPatch(field, rawValue) {
  const state = readState();
  const value = parseValue(rawValue);
  setNestedValue(state, field, value);
  writeStateAtomic(state);
}

function cmdAppend(field, rawValue) {
  const state = readState();
  const arr = getNestedValue(state, field);
  if (!Array.isArray(arr)) {
    process.stderr.write(`Error: Field "${field}" is not an array\n`);
    process.exit(1);
  }
  const value = parseValue(rawValue);
  arr.push(value);
  writeStateAtomic(state);
}

function cmdIncrement(field) {
  const state = readState();
  const current = getNestedValue(state, field);
  if (typeof current !== 'number') {
    process.stderr.write(`Error: Field "${field}" is not a number (got ${typeof current})\n`);
    process.exit(1);
  }
  setNestedValue(state, field, current + 1);
  writeStateAtomic(state);
}

// --- Main ---

const [command, ...rest] = process.argv.slice(2);

if (!command) {
  usage();
}

switch (command) {
  case 'get':
    if (!rest[0]) usage();
    cmdGet(rest[0]);
    break;
  case 'patch':
    if (!rest[0] || rest[1] === undefined) usage();
    cmdPatch(rest[0], rest[1]);
    break;
  case 'append':
    if (!rest[0] || rest[1] === undefined) usage();
    cmdAppend(rest[0], rest[1]);
    break;
  case 'increment':
    if (!rest[0]) usage();
    cmdIncrement(rest[0]);
    break;
  default:
    process.stderr.write(`Error: Unknown command "${command}"\n`);
    usage();
}
