# Testing Philosophy: Extracting Patterns Through Socratic Questioning

**Author Context**: This document was created while implementing comprehensive testing for the vscode-rhizome extension. It captures the design philosophy of test extraction using don-socratic questioning as the guide.

## The Core Question

When you write tests for multiple features, what do they all need?

- Setup (creating test environments)
- Teardown (cleaning up after tests)
- Mocking (simulating external dependencies)
- Assertions (verifying expected behavior)
- Configuration (managing test state)

**Don-socratic asks**: Why would you repeat this code across every test? What if you extracted it? What would you call it?

## Pattern Recognition

### Pattern 1: Workspace Management

**The Problem**: Tests need isolated, temporary directories. Each test creates its own environment, but cleanup is error-prone and often forgotten.

**The Pattern**:
```typescript
// What every test needs:
beforeEach(async () => {
  workspace = createTempDir();
  initializeStructure(workspace);
});

afterEach(async () => {
  cleanupTempDir(workspace); // This gets forgotten
});
```

**The Extraction**: `TestWorkspace` class
- Encapsulates directory creation, setup, cleanup
- Provides `createFile()` and `readFile()` helpers
- Guarantees cleanup (via destructor or explicit method)

**Socratic Teaching**: Why is cleanup error-prone? Because it's hidden in teardown. What if the responsibility was explicit?

### Pattern 2: External Dependency Mocking

**The Problem**: Tests call real external tools (rhizome CLI, APIs, file I/O). This is:
- Slow (real network calls, real processes)
- Fragile (depends on external state)
- Hard to test (can't easily trigger error conditions)

**The Pattern**:
```typescript
// What tests do now:
try {
  const response = execSync('rhizome query --persona X', { input: code });
  assertContains(response, 'expected text');
} catch (e) {
  // Hard to test error paths without breaking rhizome
}
```

**The Extraction**: `MockRhizome` class
- Simulates external tool without calling it
- Lets you register predetermined responses
- Records all calls (for inspection/audit)
- Makes error testing deterministic

**Socratic Teaching**: What if you could test without external dependencies? How would your tests change? Would they be clearer?

### Pattern 3: Semantic Assertions

**The Problem**: Tests repeat low-level assertions that don't document intent:
```typescript
// Low-level:
const content = fs.readFileSync(path, 'utf-8');
assert(content.includes('TODO'));
assert(!content.includes('undefined'));

// What's being tested? Readability suffers.
```

**The Pattern**:
```typescript
// Semantic:
TestAssertions.fileContains(path, 'TODO');
TestAssertions.configHasValue(configPath, 'ai.provider', 'openai');
TestAssertions.gitignoreContains(workspace, '.rhizome/config.json');
TestAssertions.indentationMatches(path, lineNum, '  ');
```

**The Extraction**: `TestAssertions` static methods
- Each method documents what it validates
- Names are domain-specific (not generic assertions)
- Error messages are detailed and actionable

**Socratic Teaching**: What does "assert file contains" mean in domain terms? Is it about security (protecting secrets)? Functionality (stub generated correctly)? The name should tell you.

### Pattern 4: Scenario Setup

**The Problem**: Every test repeats the same setup:
```typescript
// Repeated in every stub generation test:
const workspace = new TestWorkspace();
await workspace.setup();
const filePath = workspace.createFile('test.ts', `
// @rhizome stub
export function greet(name: string): string {
  // TODO
}
`);
```

**The Pattern**:
```typescript
// Declarative:
const { workspace, filePath } = TestSetup.createStubGenerationTest();
```

**The Extraction**: `TestSetup` factory methods
- Declare what you need, not how to set it up
- Scenarios are named after user workflows
- Setup is hidden complexity

**Socratic Teaching**: Is setup code interesting? Should readers care about the details, or just understand the scenario?

## Test Organization

Don-socratic asks: How should tests be organized?

**Option A**: By implementation (functions tested)
```
✗ testFindStubComments()
✗ testGenerateStub()
✗ testInsertStub()
```

**Option B**: By user experience (what should happen)
```
✓ Stub Generation
  ✓ Happy Path: Find marker, parse, generate, insert
  ✓ Error Paths: Handle edge cases gracefully
  ✓ Integration: Full workflow end-to-end
```

**Why Option B**: Users don't think "let me test the insertStub function." They think "does stub generation work end-to-end?" Tests should mirror that thinking.

## Three Test Categories

### Category 1: Happy Paths

**Question**: What should happen when everything works?

**What to test**:
- Basic functionality (no edge cases)
- All dependencies present and configured
- Success flows and happy endings

**Example**:
```typescript
it('should find @rhizome stub marker and extract signature', () => {
  const code = `// @rhizome stub\nexport function greet(name: string) {}`;
  const stubs = findStubComments(code, 'typescript');
  assert.strictEqual(stubs.length, 1);
  assert.strictEqual(stubs[0].functionName, 'greet');
});
```

**What it teaches**: Basic behavior is crystal clear.

### Category 2: Error Paths

**Question**: What should happen when something breaks? How does the code fail gracefully?

**What to test**:
- Missing dependencies (rhizome not installed)
- Missing configuration (API key not set)
- Invalid input (malformed code, complex signatures)
- Boundary conditions (empty files, deeply nested functions)

**Example**:
```typescript
it('should handle missing rhizome gracefully', () => {
  // If rhizome isn't installed, extension shows error with install guide
  const result = initializeRhizomeIfNeeded(workspace);
  assert.ok(result.error.includes('installation'));
  assert.ok(result.helpUrl);
});
```

**What it teaches**: Failures aren't hidden. They're explicit, documented, handled.

### Category 3: Integration

**Question**: Do all the pieces work together?

**What to test**:
- Full workflows end-to-end
- Multiple components interacting
- State persistence across steps

**Example**:
```typescript
it('should setup → configure → query end-to-end', () => {
  const workspace = TestSetup.createWithOpenAIKey('sk-test-123');
  const code = workspace.createFile('test.ts', '...');

  const response = mockRhizome.simulateQuery('don-socratic', code);

  assert.ok(response.length > 0);
  TestAssertions.gitignoreContains(workspace, '.rhizome/config.json');
});
```

**What it teaches**: Real workflows work. No hidden failures at the seams.

## Design Questions Answered

### "What deserves to be extracted into a library?"

Patterns that:
1. **Repeat** across multiple tests
2. **Are error-prone** (cleanup, state management)
3. **Have semantic meaning** (not generic)
4. **Enable other code** by simplifying it

### "How should helpers be named?"

By their semantic purpose, not their mechanism:
- `TestWorkspace` - I need isolated workspaces
- `MockRhizome` - I need to simulate rhizome without calling it
- `TestAssertions.fileContains()` - I need to verify file content
- `TestSetup.createWithOpenAIKey()` - I need a workspace with key already configured

### "What makes a test readable?"

1. **Name documents intent** - "should find marker and extract signature"
2. **Setup is declarative** - `TestSetup.createStubGenerationTest()`
3. **Arrange-Act-Assert is clear** - Three distinct sections
4. **Assertions are semantic** - `fileContains()` not `fs.readFile().includes()`

### "When should tests fail?"

When actual behavior differs from expected. Not when:
- Setup code is verbose (use TestWorkspace)
- Mocking is tedious (use MockRhizome)
- Assertions are hard to understand (use TestAssertions)

## The Socratic Method in Practice

This entire testing library emerged from asking questions, not from instructions:

1. **"What do all tests need?"**
   → Workspace, mocks, assertions, setup
   → These deserve extraction

2. **"What makes code testable?"**
   → Separation of concerns, pure functions, mockable dependencies
   → Design the library to encourage these

3. **"What makes tests readable?"**
   → Semantic assertions, clear names, organized structure
   → Let the library guide developers toward readability

4. **"How do you prevent mistakes?"**
   → Encapsulate error-prone patterns (cleanup, state management)
   → Make correct usage the easiest usage

## For Future Claude Instances

When working on rhizome or any extension using this philosophy:

1. **Before writing tests**, ask: What patterns will repeat?
2. **Before extracting**, ask: What's error-prone? What has semantic meaning?
3. **Before naming**, ask: Does this name explain why it exists?
4. **Before organizing**, ask: How would a user think about this feature?

The testing library isn't static. It evolves as you add features:

- New feature? Likely needs new TestSetup factory method
- Testing pain point? Extract it into TestAssertions or a new helper
- Repeated setup? Add to TestWorkspace

**The library is a record of testing wisdom.** It teaches by example, not instruction.

---

## See Also

- vscode-rhizome/.rhizome/TESTING_GUIDE.md - Practical guide to running and writing tests
- vscode-rhizome/.rhizome/TEST_DESIGN_PHILOSOPHY.md - Design journey that led to the library
- vscode-rhizome/src/test-utils.ts - The actual library code with embedded questions
- vscode-rhizome/src/extension.test.ts - 23 comprehensive tests using the library
