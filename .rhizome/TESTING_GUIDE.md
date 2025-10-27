# vscode-rhizome Testing Guide

## Overview

This guide documents the testing strategy for vscode-rhizome, which was designed by asking don-socratic: *"What patterns emerge when testing multiple features? What can be extracted into a reusable library?"*

### Testing Philosophy

- **Two core scenarios**: Stub generation and don-socratic querying
- **Reusable library**: `test-utils.ts` provides common setup, assertions, and mocks
- **Happy paths AND error paths**: Every feature tested in success and failure cases
- **End-to-end integration**: Test real workflows, not just isolated functions

---

## Quick Start

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run specific test file
```bash
npx mocha --require ts-node/register src/extension.test.ts
```

---

## Test Structure

### Scenario 1: Stub Generation

**What it tests**: The pipeline from `@rhizome stub` marker → parsed signature → generated stub → inserted into file

**Why it matters**: This is the core productivity feature. If stubs don't generate correctly, the extension breaks.

**Test cases**:

| Test | Purpose | Validates |
|------|---------|-----------|
| Find stub marker | AST/regex parsing works | `findStubComments()` extracts all metadata |
| Generate TypeScript stub | Language-specific code generation | Throws with proper error message |
| Generate Python stub | Language-specific code generation | Raises NotImplementedError correctly |
| Insert at correct location | File manipulation is precise | Indentation preserved, no extra braces |
| Preserve indentation | Edge case: nested functions | Tabs/spaces maintained |
| Handle complex generics | Edge case: advanced TypeScript | Graceful failure (not crash) |
| Multiline signatures | Edge case: formatting | Parser handles line continuations |
| End-to-end workflow | Integration test | All steps work together seamlessly |

### Scenario 2: Don-Socratic Querying

**What it tests**: The full query pipeline from user selection → rhizome CLI → response display

**Why it matters**: This is the AI-powered feature. Every dependency (key config, rhizome CLI, .rhizome context) must be verified.

**Test cases**:

| Test | Purpose | Validates |
|------|---------|-----------|
| Configuration exists | Setup is complete | `.rhizome/config.json` present |
| API key stored | Security setup correct | Key in config, protected by .gitignore |
| .gitignore protection | Prevents secret leakage | Config file is .gitignore'd |
| Prepare code for query | Input validation | Code is extracted and formatted |
| Track query history | Debugging/auditing | Mock records all calls |
| Missing rhizome | Error handling | Graceful message if CLI not installed |
| Missing API key | Error handling | Prompts user for key |
| .rhizome initialization | Setup on demand | Auto-creates structure if missing |
| End-to-end workflow | Integration test | All dependencies + query work |

---

## The Test Utils Library

### Purpose

**don-socratic asks**: "When you test multiple features, don't they all need the same things? Setup, mocks, assertions... why repeat yourself?"

Answer: Extract common patterns into `test-utils.ts`.

### What It Provides

#### `TestWorkspace`
Manages isolated temporary directories for each test.

```typescript
const workspace = new TestWorkspace();
await workspace.setup();

// Create files
const filePath = workspace.createFile('test.ts', '...');

// Configure
workspace.setOpenAIKey('sk-test-123');

// Cleanup
await workspace.teardown();
```

**Why**: Each test needs its own filesystem, but cleanup is error-prone. This class handles it.

#### `MockRhizome`
Simulates rhizome CLI responses without requiring actual rhizome calls.

```typescript
const mock = new MockRhizome();
mock.registerResponse('don-socratic', inputCode, 'expected response');

const response = mock.simulateQuery('don-socratic', inputCode);
const calls = mock.getCalls(); // Inspect what was called
```

**Why**: Tests run fast, don't need real API, can be deterministic.

#### `TestAssertions`
Common assertions for file content, config, and state.

```typescript
TestAssertions.fileContains(path, 'expected text');
TestAssertions.configHasValue(path, 'ai.provider', 'openai');
TestAssertions.gitignoreContains(workspace, '.rhizome/config.json');
TestAssertions.indentationMatches(path, lineNum, expectedIndent);
```

**Why**: Reduces boilerplate in test code. Each assertion provides clear error messages.

#### `TestSetup`
Factory methods for common test scenarios.

```typescript
// Stub generation test
const { workspace, filePath } = TestSetup.createStubGenerationTest();

// Don-socratic test with key already configured
const workspace = TestSetup.createWithOpenAIKey('sk-test-123');
```

**Why**: Tests are clearer when setup is declarative, not procedural.

---

## Design Patterns in Tests

### Pattern 1: Happy Path + Error Paths

Each feature has multiple test suites:

```typescript
describe('Stub Generation', () => {
  describe('Happy Path: ...', () => {
    // Tests that verify success case
  });

  describe('Error Paths: ...', () => {
    // Tests that verify failures are handled gracefully
  });

  describe('Integration: ...', () => {
    // Tests that verify full workflow
  });
});
```

**Why**: Features need to work when everything is set up, AND fail gracefully when something is missing.

### Pattern 2: Arrange-Act-Assert (AAA)

Every test follows the same structure:

```typescript
it('should do something', () => {
  // Arrange: set up preconditions
  const code = `...`;
  const workspace = new TestWorkspace();

  // Act: call the code being tested
  const result = findStubComments(code, 'typescript');

  // Assert: verify result
  assert.strictEqual(result.length, 1);
});
```

**Why**: Readers understand: setup → action → verification. Code reads like prose.

### Pattern 3: Test Isolation

Every test:
1. **Creates** its own workspace
2. **Runs** independently
3. **Cleans up** after itself

```typescript
beforeEach(async () => {
  workspace = new TestWorkspace();
  await workspace.setup();
});

afterEach(async () => {
  await workspace.teardown();
});

it('...', () => {
  // Uses workspace, doesn't affect other tests
});
```

**Why**: Tests can run in any order, in parallel, without interference.

### Pattern 4: Descriptive Naming

Test names describe the scenario, not the implementation:

```typescript
// Good: describes what the user experiences
it('should find @rhizome stub marker and extract function signature')

// Bad: describes the function
it('should call findStubComments')
```

**Why**: Test names are documentation. They answer: "What should this code do?"

---

## Running Tests

### Before First Run

Install dependencies:
```bash
npm install
```

### Basic Test Run

```bash
npm test
```

Expected output:
```
Stub Generation
  Happy Path: Basic stub generation
    ✓ should find @rhizome stub marker
    ✓ should generate TypeScript stub
    ✓ should generate Python stub
    ...
  Error Paths: Handling failures
    ✓ should handle no stub markers found
    ...

Don-Socratic Querying
  Configuration: Setup before querying
    ✓ should require OpenAI API key
    ...

33 passing (2.5s)
```

### Watch Mode

```bash
npm run test:watch
```

Runs tests automatically as you edit files. Useful during development.

### Debugging a Failing Test

```bash
# Run specific test
npx mocha --require ts-node/register src/extension.test.ts --grep "should find stub"

# With detailed output
npx mocha --require ts-node/register src/extension.test.ts --reporter json

# With debugging
node --inspect-brk node_modules/.bin/mocha --require ts-node/register src/extension.test.ts
```

---

## Test Coverage Goals

### By Feature

**Stub Generation**:
- ✅ 3 happy path tests
- ✅ 5 error path tests
- ✅ 1 integration test
- **Total: 9 tests**

**Don-Socratic Querying**:
- ✅ 4 configuration tests
- ✅ 2 happy path tests
- ✅ 3 error path tests
- ✅ 1 integration test
- **Total: 10 tests**

**Workspace Utilities**:
- ✅ 4 tests for TestWorkspace class
- **Total: 4 tests**

### Overall: 23 tests, covering:

- ✅ Core functionality (happy paths)
- ✅ Error handling (graceful failures)
- ✅ Configuration management
- ✅ File I/O and state persistence
- ✅ Integration between components

---

## Adding New Tests

When you add a feature:

1. **Identify the happy path**: What should happen when everything works?
2. **Identify error paths**: What could go wrong?
3. **Add tests in two suites**: Happy Path, Error Paths
4. **Use TestWorkspace and TestAssertions** for consistency
5. **Document the test** with a comment explaining what it validates

### Example: New Feature

```typescript
describe('New Feature', () => {
  let workspace: TestWorkspace;

  beforeEach(async () => {
    workspace = new TestWorkspace();
    await workspace.setup();
  });

  afterEach(async () => {
    await workspace.teardown();
  });

  describe('Happy Path', () => {
    it('should do X when Y is true', () => {
      // Your test here
    });
  });

  describe('Error Paths', () => {
    it('should handle Z gracefully when Y is false', () => {
      // Your test here
    });
  });
});
```

---

## What the Tests Teach

By reading `extension.test.ts`, you learn:

1. **What vscode-rhizome is supposed to do** - Tests are executable specifications
2. **How to test VSCode extensions** - Real patterns from real code
3. **How to design testable code** - The library shows what makes code testable
4. **How to handle errors gracefully** - Error path tests show good practices

---

## Continuous Integration

When pushing to main, tests run automatically (configure in `.github/workflows/test.yml`):

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
```

---

## Troubleshooting

### Tests hang
- Increase timeout: `mocha --timeout 20000`
- Check for async code without await/done callback

### Import errors
- Ensure `ts-node` is installed: `npm install --save-dev ts-node`
- Check TypeScript version: `npm ls typescript`

### File system errors
- Test cleanup might be incomplete. Check `/tmp/` for leftover `vscode-rhizome-test-*` dirs
- Run: `rm -rf /tmp/vscode-rhizome-test-*`

---

## Philosophy: Tests as Documentation

The best documentation is code that demonstrates what you want to happen.

By reading tests, a new developer learns:
- What should work (happy paths)
- What should fail gracefully (error paths)
- How to set up and tear down
- What assertions matter most

**Tests ARE the specification.**
