# Workflow: Test Runner

**Purpose:** Auto-detect and run a project's test suite
**Used by:** `verify-work`, executor micro-verification, TaskCompleted hooks

---

## Overview

A reusable workflow for detecting the project's test framework, running tests (full or related-only), and returning structured results. This is not a standalone slash command -- it is invoked by other workflows and agents.

---

## Step 1: Auto-Detect Test Framework

Scan the project root for test framework indicators in this order. Stop at the first match (but note all detected frameworks if multiple exist):

```
// JavaScript / TypeScript
IF package.json exists:
  pkg = Read(package.json)
  IF pkg.scripts.test exists:
    framework = "npm-test"
    command = "npm test"
  IF pkg.scripts["test:unit"] exists:
    commands.unit = pkg.scripts["test:unit"]
  IF pkg.scripts["test:e2e"] exists:
    commands.e2e = pkg.scripts["test:e2e"]

  // Detect specific runner from devDependencies or scripts
  IF "vitest" in pkg.devDependencies or "vitest" in pkg.scripts.test:
    framework = "vitest"
    command = "npx vitest run"
    related_command = "npx vitest run --reporter=verbose {test_files}"
  ELSE IF "jest" in pkg.devDependencies or "jest" in pkg.scripts.test:
    framework = "jest"
    command = "npx jest"
    related_command = "npx jest --findRelatedTests {modified_files}"
  ELSE IF "mocha" in pkg.devDependencies:
    framework = "mocha"
    command = "npx mocha"
  ELSE IF "playwright" in pkg.devDependencies:
    framework = "playwright"
    command = "npx playwright test"

// Python
IF pyproject.toml exists:
  IF [tool.pytest] section exists:
    framework = "pytest"
    command = "python -m pytest"
    related_command = "python -m pytest {test_files} -v"
ELSE IF pytest.ini exists:
  framework = "pytest"
  command = "python -m pytest"
  related_command = "python -m pytest {test_files} -v"
ELSE IF setup.cfg exists AND [tool:pytest] section exists:
  framework = "pytest"
  command = "python -m pytest"
  related_command = "python -m pytest {test_files} -v"

// Rust
IF Cargo.toml exists:
  framework = "cargo-test"
  command = "cargo test"
  related_command = "cargo test --lib {module_name}"

// Go
IF go.mod exists:
  framework = "go-test"
  command = "go test ./..."
  related_command = "go test {modified_packages}"

// Ruby
IF Gemfile exists:
  IF Gemfile contains "rspec":
    framework = "rspec"
    command = "bundle exec rspec"
    related_command = "bundle exec rspec {test_files}"
  ELSE:
    framework = "rake-test"
    command = "bundle exec rake test"

// Makefile
IF Makefile exists AND contains "test" target:
  framework = "make-test"
  command = "make test"

// iOS / macOS
IF Podfile exists OR *.xcodeproj exists:
  framework = "xcodebuild"
  command = "xcodebuild test -scheme {scheme} -destination 'platform=iOS Simulator,name=iPhone 15'"
  // Note: scheme must be detected from *.xcodeproj or *.xcworkspace

// Fallback: scan for test file patterns
IF no framework detected:
  IF files matching *.test.* or *.spec.* or __tests__/ exist:
    framework = "unknown"
    note = "Test files found but no runner detected. Install the appropriate test runner."
  ELSE:
    framework = "none"
    note = "No test framework or test files detected."
```

---

## Step 2: Find Related Tests (for --related-only mode)

Given a list of modified files, find the tests that are most relevant:

```
modified_files = list of files changed by the current task or phase

FOR each modified_file in modified_files:

  // JavaScript / TypeScript
  IF framework in ["jest", "vitest", "mocha"]:
    // Strategy 1: Co-located test files
    test_file = modified_file.replace(".ts", ".test.ts")
                             .replace(".tsx", ".test.tsx")
                             .replace(".js", ".test.js")
                             .replace(".jsx", ".test.jsx")
    IF test_file exists: related_tests.add(test_file)

    // Strategy 2: __tests__ directory
    test_dir = dirname(modified_file) + "/__tests__/"
    IF test_dir exists:
      tests_in_dir = glob(test_dir + "*.test.*")
      related_tests.add_all(tests_in_dir)

    // Strategy 3: spec files
    spec_file = modified_file.replace(".ts", ".spec.ts")
                             .replace(".tsx", ".spec.tsx")
                             .replace(".js", ".spec.js")
    IF spec_file exists: related_tests.add(spec_file)

    // Strategy 4: jest --findRelatedTests (if jest)
    IF framework == "jest":
      related_command = "npx jest --findRelatedTests {modified_file} --listTests"

  // Python
  IF framework == "pytest":
    // Strategy 1: test_ prefix in same directory
    test_file = dirname(modified_file) + "/test_" + basename(modified_file)
    IF test_file exists: related_tests.add(test_file)

    // Strategy 2: tests/ subdirectory
    test_dir = dirname(modified_file) + "/tests/"
    IF test_dir exists:
      tests_in_dir = glob(test_dir + "test_*.py")
      related_tests.add_all(tests_in_dir)

    // Strategy 3: parallel tests/ directory structure
    // e.g., src/foo/bar.py -> tests/foo/test_bar.py
    IF modified_file starts with "src/":
      test_path = modified_file.replace("src/", "tests/")
      test_path = dirname(test_path) + "/test_" + basename(test_path)
      IF test_path exists: related_tests.add(test_path)

  // Go
  IF framework == "go-test":
    // Go tests are always in the same package
    package_dir = dirname(modified_file)
    related_packages.add(package_dir)

  // Rust
  IF framework == "cargo-test":
    // Module-level tests
    module_name = basename(modified_file).replace(".rs", "")
    related_modules.add(module_name)

  // Ruby
  IF framework == "rspec":
    spec_file = modified_file.replace("lib/", "spec/").replace(".rb", "_spec.rb")
    IF spec_file exists: related_tests.add(spec_file)
```

---

## Step 3: Execute Tests

```
// Determine run strategy based on flags and context
IF flag == "--related-only":
  run_mode = "related"
  timeout = 30  // seconds
ELSE IF flag == "--full":
  run_mode = "full"
  timeout = 120  // seconds
ELSE:
  // Default: run related first, then full if fast
  run_mode = "auto"
  timeout = 120  // seconds

// Handle no framework detected
IF framework == "none":
  RETURN {
    status: "SKIP",
    note: "No test framework or test files detected.",
    framework: "none",
    command: null,
    duration: 0
  }

IF framework == "unknown":
  RETURN {
    status: "SKIP",
    note: "Test files found but no runner detected. Install the appropriate test runner.",
    framework: "unknown",
    command: null,
    duration: 0
  }

// Run tests
start_time = now()

IF run_mode == "related" OR run_mode == "auto":
  IF related_tests is empty AND related_packages is empty:
    IF run_mode == "related":
      RETURN {
        status: "SKIP",
        note: "No related tests found for modified files.",
        framework: framework,
        command: null,
        duration: 0
      }
    ELSE:
      // auto mode: fall through to full suite
      run_mode = "full"
  ELSE:
    // Run related tests
    IF framework == "jest":
      result = run("npx jest --findRelatedTests {modified_files} --verbose", timeout=30)
    ELSE IF framework == "vitest":
      result = run("npx vitest run {related_test_files} --reporter=verbose", timeout=30)
    ELSE IF framework == "pytest":
      result = run("python -m pytest {related_test_files} -v", timeout=30)
    ELSE IF framework == "go-test":
      result = run("go test {related_packages} -v", timeout=30)
    ELSE IF framework == "cargo-test":
      result = run("cargo test {related_modules}", timeout=30)
    ELSE IF framework == "rspec":
      result = run("bundle exec rspec {related_test_files}", timeout=30)
    ELSE:
      result = run(related_command, timeout=30)

    // In auto mode, also run full suite if it is fast
    IF run_mode == "auto" AND result.exit_code == 0:
      // Try full suite with a short timeout to check if it is fast
      full_result = run(command, timeout=60)
      IF full_result completed:
        result = full_result  // Use full suite results instead

IF run_mode == "full":
  result = run(command, timeout=120)

duration = now() - start_time
```

---

## Step 4: Parse and Return Results

```
// Parse test output to extract counts
// This is framework-specific but follows common patterns

IF result.exit_code == 0:
  status = "PASS"
ELSE IF result.timed_out:
  status = "FAIL"
  note = "Test suite timed out after {timeout} seconds"
ELSE:
  status = "FAIL"

// Attempt to parse counts from output
passed = parse_passed_count(result.output)
failed = parse_failed_count(result.output)
skipped = parse_skipped_count(result.output)

// Extract failed test names if any
IF failed > 0:
  failed_tests = parse_failed_test_names(result.output)

RETURN {
  status: status,
  framework: framework,
  command: command_that_was_run,
  duration: duration,
  passed: passed,
  failed: failed,
  skipped: skipped,
  failed_tests: failed_tests,
  raw_output: result.output  // truncated to last 200 lines if needed
}
```

---

## Output Format

The calling workflow should display test results in this format:

```
Test Results:
  Framework: {detected framework}
  Command: {actual command run}
  Status: PASS | FAIL | SKIP (no tests found)
  Duration: {time}s
  Passed: {X} | Failed: {Y} | Skipped: {Z}
  Failed tests: {list if any}
```

---

## Error Handling

```
IF command not found (e.g., npx not installed, cargo not in PATH):
  RETURN {
    status: "SKIP",
    note: "Test command not found: {command}. Ensure {framework} is installed.",
    suggestion: "{install command, e.g., 'npm install' or 'pip install pytest'}"
  }

IF timeout exceeded:
  RETURN {
    status: "FAIL",
    note: "Test suite timed out after {timeout}s. Consider using --related-only for faster feedback.",
    raw_output: result.partial_output
  }

IF test framework detected but no test files exist:
  RETURN {
    status: "SKIP",
    note: "Test framework '{framework}' detected but no test files found."
  }
```

---

## Usage Examples

### From executor micro-verification (Step 6.5)
```
// Run related tests only for fast feedback
test_result = TestRunner(
  modified_files=[files from current task],
  flag="--related-only"
)

IF test_result.status == "FAIL":
  // Assess: are failures from my changes or pre-existing?
  // Fix if mine, note if pre-existing
IF test_result.status == "PASS":
  include "micro-verification: PASS" in completion message
IF test_result.status == "SKIP":
  proceed (no tests to run is not a failure)
```

### From verify-work (Step 1.5)
```
// Run full test suite before spawning verifier
test_result = TestRunner(flag="--full")

// Include results in verifier context
verifier_context.test_results = test_result
```

### From standalone invocation
```
// Auto mode: related first, then full if fast
test_result = TestRunner(
  modified_files=[files from phase],
  flag=default
)
```
