# Test Design Philosophy: Extracting a Library through Socratic Questioning

## How We Got Here

We used **Rhizome flight planning** to sketch two test scenarios, then asked **don-socratic** to identify what could be extracted into a reusable library. This document captures that design journey.

---

## Step 1: Sketch Two Test Scenarios

### Scenario 1: Stub Generation

User action: Marks a function with `@rhizome stub`, invokes command
Expected: TODO comment + language-specific throw/raise inserted at correct location

Edge cases:
- Multiple stub markers (user picks)
- No markers (show warning)
- Complex signatures (graceful failure)
- Different indentation levels

### Scenario 2: Don-Socratic Querying

User action: Selects code, invokes don-socratic command
Expected: Questions appear in output panel

Dependencies:
- Rhizome CLI installed
- `.rhizome` context initialized
- OpenAI API key configured

Edge cases:
- Missing rhizome (helpful error)
- Missing key (prompt for it)
- `.rhizome` not initialized (auto-create)

---

## Step 2: Ask don-socratic the Key Question

**don-socratic asks:**

> When you write tests for multiple features, what do they all need?
>
> Both need:
> - A clean workspace to run in
> - Setup and teardown
> - Mocking (fake rhizome responses, fake file I/O)
> - Common assertions (file contains X, config has Y, gitignore protects Z)
>
> So why would you repeat that setup code across every test?
>
> What if you extracted it? What would you call it?

---

## Step 3: Design the Testing Library

### Observation

Looking at both scenarios, we see patterns:

| Pattern | Stub Tests | Query Tests |
|---------|-----------|-------------|
| Need temp workspace | ✓ | ✓ |
| Need .rhizome context | ✓ | ✓ |
| Need to create files | ✓ | ✓ |
| Need to configure API key | | ✓ |
| Need to mock rhizome CLI | ✓ | ✓ |
| Need file assertions | ✓ | ✓ |
| Need config assertions | | ✓ |
| Need .gitignore assertions | | ✓ |

**Insight**: These patterns are sufficiently common that they deserve to be extracted into a library.

### The Library: `test-utils.ts`

Four main classes, each answering a design question:

#### 1. `TestWorkspace`

**Question**: How do you create isolated, temporary workspaces for testing without polluting the filesystem?

**Answer**: A class that:
- Creates a unique temp directory on setup
- Provides `createFile()` and `readFile()` helpers
- Automatically cleans up on teardown
- Initializes .rhizome and .gitignore automatically

```typescript
const workspace = new TestWorkspace();
await workspace.setup();
workspace.createFile('test.ts', code);
await workspace.teardown(); // Cleans up
```

**Teaching moment**: Cleanup is error-prone. Encapsulate it.

#### 2. `MockRhizome`

**Question**: When testing code that calls external tools (rhizome CLI), how do you test fast without needing the real tool?

**Answer**: A mock that:
- Registers predetermined responses
- Simulates `rhizome query` calls
- Records what was called (for inspection)
- Allows deterministic testing

```typescript
const mock = new MockRhizome();
mock.registerResponse('don-socratic', code, 'expected response');
const response = mock.simulateQuery('don-socratic', code);
const calls = mock.getCalls(); // What was called?
```

**Teaching moment**: Separate I/O from logic. Test logic without I/O dependencies.

#### 3. `TestAssertions`

**Question**: Every test checks similar things: "file contains X", "config has Y", "gitignore protects Z". Why repeat?

**Answer**: Static methods for common checks:
- `fileContains(path, content)` - Does file have expected content?
- `configHasValue(path, key, value)` - Config correct?
- `gitignoreContains(workspace, entry)` - Protected from git?
- `indentationMatches()` - Whitespace preserved?

```typescript
TestAssertions.fileContains(path, 'TODO');
TestAssertions.configHasValue(configPath, 'ai.provider', 'openai');
TestAssertions.gitignoreContains(workspace, '.rhizome/config.json');
```

**Teaching moment**: Assertions should be semantic, not syntactic. `fileContains()` is clearer than manual string searching.

#### 4. `TestSetup`

**Question**: When setting up a test, do you want to write procedural setup code, or declare what you need?

**Answer**: Factory methods for common scenarios:
- `createStubGenerationTest()` - Ready-to-test stub scenario
- `createQuestioningTest()` - Ready-to-test query scenario
- `createWithOpenAIKey()` - Workspace with key pre-configured

```typescript
const { workspace, filePath } = TestSetup.createStubGenerationTest();
// Workspace is ready: .rhizome exists, files created
```

**Teaching moment**: Declarative setup is clearer than imperative. Readers understand: "I need this scenario" not "create this, then that, then the other thing."

---

## Step 4: Write Tests Using the Library

With the library in place, tests become concise and readable:

### Example: Stub Generation Test

```typescript
it('should find stub marker and extract signature', () => {
  const code = `
// @rhizome stub
export function greet(name: string): string {
  throw new Error('Not implemented');
}`;

  const stubs = findStubComments(code, 'typescript');

  assert.strictEqual(stubs.length, 1);
  assert.strictEqual(stubs[0].functionName, 'greet');
});
```

Notice: No workspace setup, no mocking, no assertion boilerplate. Just the interesting part.

### Example: Configuration Test

```typescript
it('should store API key in workspace config', () => {
  const workspace = TestSetup.createWithOpenAIKey('sk-test-123');

  const configPath = path.join(workspace.rhizomePath, 'config.json');
  TestAssertions.configHasValue(configPath, 'ai.openai_key', 'sk-test-123');
});
```

Again: Declarative setup, semantic assertion. Reader understands immediately what's being tested.

---

## Step 5: Organize Tests in Three Categories

Following don-socratic's guidance, every feature is tested three ways:

### Category 1: Happy Path
What happens when everything works?

```typescript
describe('Happy Path: Basic stub generation', () => {
  it('should find @rhizome stub marker', () => { ... });
  it('should generate TypeScript stub', () => { ... });
  it('should insert at correct location', () => { ... });
});
```

### Category 2: Error Paths
What happens when something breaks? How does the code fail gracefully?

```typescript
describe('Error Paths: Handling failures', () => {
  it('should handle no stub markers found', () => { ... });
  it('should handle complex generic types', () => { ... });
  it('should handle missing rhizome gracefully', () => { ... });
});
```

### Category 3: Integration
Do all the pieces work together?

```typescript
describe('Integration: Full workflow', () => {
  it('should setup → configure → query end-to-end', () => { ... });
});
```

**Teaching moment**: Organize tests by user experience, not implementation.

---

## What This Library Teaches

By reading and using `test-utils.ts`, a developer learns:

1. **What makes code testable**
   - Separation of concerns
   - Pure functions vs I/O
   - Mockable dependencies

2. **Testing design patterns**
   - Arrange-Act-Assert structure
   - Test isolation and cleanup
   - Deterministic vs non-deterministic tests

3. **How to design reusable code**
   - What deserves extraction?
   - How to name abstractions?
   - When to create helpers vs inline code?

4. **How to think about testing**
   - Happy path: "What should happen?"
   - Error path: "How should failure be handled?"
   - Integration: "Do components work together?"

---

## Design Questions Answered

### Q: What patterns emerge when testing multiple features?

**A**: Setup, mocking, assertions, cleanup. These appear in every test.

### Q: What should be extracted into a library?

**A**: Patterns that:
1. Repeat across multiple tests
2. Are error-prone (like cleanup)
3. Have semantic meaning (like "does file contain X?")
4. Enable other code by simplifying it

### Q: How should the library be structured?

**A**: By concern:
- Workspace management (TestWorkspace)
- External I/O mocking (MockRhizome)
- Assertions (TestAssertions)
- Scenario setup (TestSetup)

### Q: What should tests look like?

**A**:
- Focused: Each test verifies one thing
- Clear: Reader understands without comments
- Isolated: No dependencies between tests
- Organized: Grouped by user experience (happy/error/integration)

---

## The Socratic Method in Action

don-socratic didn't tell us what to build. Instead, it asked:

1. **What do your tests have in common?** → We noticed patterns
2. **Could you name those patterns?** → We identified TestWorkspace, MockRhizome, etc.
3. **What would make tests easier to read?** → We added TestAssertions, TestSetup
4. **How should you organize your test code?** → We created three categories per feature

Each question invited thinking, not instruction. The library emerged from that thinking.

---

## Future: Extending the Library

As new features are added, the library evolves. New developers can ask:

- "Does this pattern belong in TestUtils?"
- "What scenario should TestSetup support?"
- "What assertion would make this test clearer?"

The library is not static. It's a living record of the codebase's testing wisdom.

---

## Conclusion

By using Rhizome's flight planning to sketch scenarios, then asking don-socratic to identify patterns, we created a testing library that:

1. **Reduces boilerplate**: Setup, mocks, cleanup → handled by library
2. **Improves readability**: Tests focus on the interesting part
3. **Teaches good practices**: By example, not instruction
4. **Enables comprehensive testing**: 23 tests across two major features
5. **Documents the codebase**: Tests ARE the specification

The library is a gift to future maintainers: "Here's how we test this code. Here's how you can too."
