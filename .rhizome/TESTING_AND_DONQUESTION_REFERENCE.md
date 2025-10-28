# Testing and Don-Socratic Reference: Real Examples from vscode-rhizome

**Purpose**: This document serves as a reference to actual implementations in the vscode-rhizome extension that demonstrate:
1. The testing philosophy and test library patterns
2. Don-socratic as a guiding principle for code and design
3. How to embed questions instead of instructions

All examples are from vscode-rhizome repository. Future Claude instances can look there to see these concepts in action.

## Directory: /Users/hallie/Documents/repos/vscode-rhizome

---

## Part 1: Testing Philosophy in Action

### The Test Library (src/test-utils.ts)

**What**: 4 reusable test utility classes extracted from repeating patterns

**Location**: `src/test-utils.ts`

**Classes**:
1. **TestWorkspace** - Isolated temporary workspaces
   - Line 16-85: Class definition
   - Why it exists: Workspace management is error-prone (cleanup!)
   - Question embedded: "What state must exist before a tool works?"

2. **MockRhizome** - Simulate external tool without calling it
   - Line 90-140: Class definition
   - Why it exists: I/O dependencies make tests slow and fragile
   - Question embedded: "How do you test code with external dependencies?"

3. **TestAssertions** - Semantic assertions instead of generic ones
   - Line 144-200: Static methods
   - Why it exists: Low-level assertions don't document intent
   - Question embedded: "What makes an assertion semantic vs generic?"

4. **TestSetup** - Factory methods for common scenarios
   - Line 204-240: Factory methods
   - Why it exists: Setup code is procedural and boring
   - Question embedded: "Is setup code interesting? Should readers care?"

**How It Teaches**:
- Each class has a comment explaining the question it answers
- Each method has a comment explaining why it exists
- No explanation of HOW it works, only WHY

**How to Use as Reference**:
- Look at TestWorkspace for how to encapsulate cleanup
- Look at MockRhizome for how to simulate I/O
- Look at TestAssertions for semantic naming
- Look at TestSetup for factory patterns

---

### The Test Suite (src/extension.test.ts)

**What**: 23 comprehensive tests organized by user experience

**Location**: `src/extension.test.ts`

**Structure**:
- Stub Generation Tests (10 tests)
  - Happy Path: Lines 60-120 (4 tests: find marker, parse, generate, insert)
  - Error Paths: Lines 125-180 (5 tests: edge cases and failures)
  - Integration: Lines 183-220 (1 test: full workflow)

- Don-Socratic Querying Tests (10 tests)
  - Configuration: Lines 260-310 (4 tests: key setup, .gitignore)
  - Happy Path: Lines 313-360 (2 tests: successful queries)
  - Error Paths: Lines 363-420 (3 tests: missing tool, key, init)
  - Integration: Lines 423-480 (1 test: full workflow)

- Workspace Configuration Tests (3 tests)
  - TestWorkspace utilities: Lines 490-550

**Organization Pattern**:
```typescript
describe('Feature Name', () => {
  // Setup/teardown here

  describe('Happy Path: ...', () => {
    // Tests that verify success
    it('should do X when Y', () => { ... });
    it('should do Z when W', () => { ... });
  });

  describe('Error Paths: ...', () => {
    // Tests that verify failure handling
    it('should handle missing X gracefully', () => { ... });
  });

  describe('Integration: ...', () => {
    // Tests that verify components work together
    it('should setup → configure → query end-to-end', () => { ... });
  });
});
```

**Key Insight**: Tests are organized by user experience ("What should happen?"), not by implementation ("Which function does this test?").

**Example from Lines 60-80**:
```typescript
it('should find @rhizome stub marker and extract function signature', () => {
  // Test name IS the specification
  // Body is just arrange-act-assert
  const code = `...`;
  const stubs = findStubComments(code, 'typescript');
  assert.strictEqual(stubs.length, 1);
});
```

**How to Use as Reference**:
- Look at test organization to see how to structure multiple related tests
- Look at test names to see how names document expected behavior
- Look at happy vs error vs integration to understand the three categories
- Look at use of TestSetup, TestAssertions, TestWorkspace to see the library in action

---

## Part 2: Don-Socratic in Code

### Comments as Questions (src/extension.ts)

**What**: Every function has a don-socratic question explaining why it exists

**Location**: `src/extension.ts`

**Examples**:

1. **queryPersona() - Lines 16-28**
   ```
   Question: "When you call out to an external service, what should
   you encapsulate? What belongs in a helper, what stays in the handler?"
   Answer: Pure I/O belongs in helper, handler focuses on flow
   ```

2. **formatPersonaOutput() - Lines 32-42**
   ```
   Question: "Those eight appendLine() calls... what pattern do you see?
   Could you name that pattern? What would happen if you extracted it?"
   Answer: (Deliberately left for reader to discover)
   ```

3. **getActiveSelection() - Lines 71-77**
   ```
   Question: "Both don-socratic and inline-question handlers need the same thing.
   What if you extracted that validation into a helper? What would you call it?"
   Answer: getActiveSelection() - because both commands need it
   ```

4. **detectLanguage() - Lines 95-100**
   ```
   Statement: "Both stub generation and inline questioning need this.
   Extract it once, use it everywhere."
   Answer: Single source of truth for language detection
   ```

5. **initializeRhizomeIfNeeded() - Lines 111-120**
   ```
   Question: "What does it mean for a tool to be initialized?
   What state needs to exist before it can work?
   How should the tool handle missing initialization?"
   Answer: Check → Create → Verify pattern
   ```

6. **ensureOpenAIKeyConfigured() - Lines 128-135**
   ```
   Question: "Where should secrets live? In code? In env? In config?
   How do you keep them secure while making them accessible?
   What happens the first time a tool needs a secret?"
   Answer: Local config, protected by .gitignore, prompted on first use
   ```

**Pattern**:
- Question first (invites thinking)
- Answer second (confirms thinking)
- Code shows implementation (reader already understands why)

**How to Use as Reference**:
- Model your own function comments after these
- Ask questions about the design decision, not the implementation
- Show the thinking, not just the code

---

### Rough Edges as Teaching (src/extension.ts)

**What**: Intentionally leaving rough edges visible so readers understand patterns

**Location**: `src/extension.ts`, lines 180-195

**The Rough Edge**:
```typescript
// Eight repetitive appendLine() calls in formatPersonaOutput()
outputChannel.appendLine('='.repeat(60));
outputChannel.appendLine(personaName);
outputChannel.appendLine('='.repeat(60));
outputChannel.appendLine('Selected code:');
outputChannel.appendLine('');
outputChannel.appendLine(selectedCode);
outputChannel.appendLine('');
outputChannel.appendLine('--- Waiting for persona response ---');
outputChannel.appendLine('');
```

**Why Leave It**:
- The pattern (header-divider-content-footer) is VISIBLE
- Readers feel the repetition
- Readers ask: "Should this be extracted?"
- Readers make the decision themselves (learning!)

**Alternative** (extracting it):
```typescript
function logPersonaResponse(channel, title, code, response) {
  // Implementation hidden, pattern invisible
}
```

**Teaching Moment**:
If you extract the pattern, readers don't learn it exists. By leaving it visible, readers discover it themselves. That's deeper learning.

**How to Use as Reference**:
- Don't automatically extract every repetition
- Leave some patterns visible as teaching moments
- Document the rough edge with a don-socratic question
- Let readers discover when extraction is valuable

---

## Part 3: Test Organization by User Experience

### Happy Path Example (src/extension.test.ts, lines 60-120)

**Question Being Answered**: "What should happen when everything works?"

```typescript
describe('Happy Path: Basic stub generation', () => {
  it('should find @rhizome stub marker and extract function signature', () => {
    // Test: marker detection
  });

  it('should generate TypeScript stub with throw statement', () => {
    // Test: code generation
  });

  it('should generate Python stub with raise statement', () => {
    // Test: language-specific generation
  });

  it('should insert stub at correct location in file', () => {
    // Test: file modification
  });
});
```

**What This Teaches**:
- Each step of the happy path is tested
- Tests follow the user journey (find → parse → generate → insert)
- Names describe expected behavior, not test mechanics

---

### Error Path Example (src/extension.test.ts, lines 125-180)

**Question Being Answered**: "What happens when something breaks? How does the system fail gracefully?"

```typescript
describe('Error Paths: Handling failures gracefully', () => {
  it('should handle no stub markers found', () => {
    // Test: graceful failure
  });

  it('should handle complex generic types in signatures', () => {
    // Test: parser robustness
  });

  it('should handle multiline function signatures', () => {
    // Test: multi-line support
  });

  it('should support Python stub markers', () => {
    // Test: language support
  });
});
```

**What This Teaches**:
- Error handling is not an afterthought
- Each error path is tested explicitly
- Tests verify "graceful failure", not "success anyway"

---

### Integration Example (src/extension.test.ts, lines 183-220)

**Question Being Answered**: "Do all the pieces work together?"

```typescript
describe('Integration: Full stub generation workflow', () => {
  it('should generate and insert stub, updating the file', () => {
    // 1. Create workspace
    // 2. Read original code
    // 3. Find stubs
    // 4. Generate stub
    // 5. Insert stub
    // 6. Write back
    // 7. Verify result
  });
});
```

**What This Teaches**:
- Integration tests show real workflows
- They exercise the whole system
- They catch failures at the seams between components

---

## Part 4: Semantic Assertions

### Example: FileContains vs fs.readFileSync (src/test-utils.ts, lines 147-150)

**Low-level (generic)**:
```typescript
const content = fs.readFileSync(filePath, 'utf-8');
assert(content.includes('TODO'));
```

**High-level (semantic)**:
```typescript
TestAssertions.fileContains(filePath, 'TODO', 'File should contain TODO');
```

**Difference**:
- Generic: Shows HOW to check
- Semantic: Shows WHAT is being checked and WHY it matters

**In Tests**:
```typescript
TestAssertions.fileContains(testFile, 'TODO');
TestAssertions.fileContains(testFile, 'throw new Error');
TestAssertions.gitignoreContains(workspace, '.rhizome/config.json');
TestAssertions.configHasValue(configPath, 'ai.provider', 'openai');
```

**What This Teaches**:
- Assertions are domain-specific
- Names document intent
- Error messages are clear and actionable

---

## Part 5: Factory Methods for Setup

### Example: TestSetup.createStubGenerationTest() (src/test-utils.ts, lines 207-230)

**Procedural** (what NOT to do):
```typescript
it('should...', () => {
  const workspace = new TestWorkspace();
  await workspace.setup();
  const filePath = workspace.createFile('test.ts', `
// @rhizome stub
export function greet(name: string): string {
  throw new Error('Not implemented');
}
  `);
  // ... now test can run
});
```

**Declarative** (what to do):
```typescript
it('should...', () => {
  const { workspace, filePath } = TestSetup.createStubGenerationTest();
  // ... test runs immediately
});
```

**Difference**:
- Procedural: Readers see setup details (boring)
- Declarative: Readers see intent (clear)

**What This Teaches**:
- Setup is scaffolding, not the interesting part
- Factories let readers focus on what's being tested
- Scenarios are named, making tests self-documenting

---

## Documentation Reference

### In vscode-rhizome/.rhizome/:

1. **TESTING_GUIDE.md** (2,000 words)
   - How to run tests
   - How to write tests
   - Test library documentation
   - Design patterns in tests

2. **TEST_DESIGN_PHILOSOPHY.md** (1,500 words)
   - How scenarios → questions → library design emerged
   - Design questions answered
   - The Socratic method in action

3. **TEACHING_MOMENTS.md** (150 words)
   - Four intentional rough edges documented as questions
   - Why they were left

4. **PROJECT_SUMMARY.md** (400+ words)
   - Architecture overview
   - Features deep-dive
   - Design decisions
   - Teaching moments

---

## How to Use This Reference

### For Test Design
1. Read TESTING_PHILOSOPHY.md (this directory)
2. Look at src/test-utils.ts in vscode-rhizome
3. Look at src/extension.test.ts organization
4. Read TESTING_GUIDE.md in vscode-rhizome

### For Don-Socratic Development
1. Read DON_SOCRATIC_IN_PRACTICE.md (this directory)
2. Look at src/extension.ts comments
3. Look at TEACHING_MOMENTS.md in vscode-rhizome
4. Look at rough edges intentionally left

### For Code Organization
1. Read TESTING_PHILOSOPHY.md section on "Test Organization"
2. Look at src/extension.test.ts structure
3. Notice: Happy Path + Error Paths + Integration for each feature
4. Note: Tests organized by user experience, not implementation

### For Future Development
1. When adding a feature: How should it be tested?
2. When extracting code: What patterns repeat and are error-prone?
3. When naming: Does the name explain why it exists?
4. When documenting: Can you ask a question instead of giving an answer?

---

## Commands

```bash
# In /Users/hallie/Documents/repos/vscode-rhizome/

# Run all tests
npm test

# Watch mode (for development)
npm run test:watch

# Build extension
npm run esbuild

# Debug extension (F5 in VSCode)
# Opens new VSCode window with test-workspace loaded
```

---

## Key Takeaways

### Testing
- Patterns that repeat deserve extraction (TestWorkspace, MockRhizome, TestAssertions, TestSetup)
- Tests organized by user experience are clearer than tests organized by function
- Each feature gets three test categories: Happy Path, Error Paths, Integration
- Semantic assertions document intent better than low-level assertions

### Don-Socratic
- Questions invite thinking, answers close thinking
- Rough edges can be teaching moments (not bugs)
- Comments should ask why code exists, not what it does
- Code teaches by example, not instruction

### Code Organization
- Extract when something is error-prone, repeats, or has semantic meaning
- Leave some patterns visible so readers discover them
- Functions should be thin (orchestrate) or pure (compute), rarely both
- Commands should be 1-4 lines (coordination, not implementation)

---

**All code examples are from vscode-rhizome. Clone and explore.**

For questions about this reference, see TESTING_PHILOSOPHY.md or DON_SOCRATIC_IN_PRACTICE.md in this directory.
