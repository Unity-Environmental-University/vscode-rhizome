# Don-Socratic in Practice: Using Questioning as a Design Tool

**Author Context**: This document captures how don-socratic was used as the guiding principle while building vscode-rhizome, including architectural decisions, code organization, and test design.

## What is Don-Socratic as a Design Tool?

Don-socratic doesn't tell you what to build. Instead, he asks questions that make you think:

- "What should this do?"
- "What could go wrong?"
- "Is there a pattern here?"
- "Why would you do it that way instead of this way?"

**Core Principle**: Questions invite thinking. Answers close thinking.

By embedding questions in code, in documentation, in test organization, you create an environment where readers think rather than just follow instructions.

## Three Ways Don-Socratic Guides Development

### 1. Guiding Architecture (Helper Functions)

**Problem**: Command handlers became monolithic. Code repeated. Where should things live?

**Don's Question**: "When you have a command handler calling external code, what should be in the handler and what should be extracted?"

**The Question Invites Thinking**:
- What's the handler's responsibility? Coordinate? Orchestrate? Call?
- What's pure I/O vs pure logic?
- What can be tested independently?
- What can be reused by other handlers?

**The Answer Emerges**: Extract the workflow into helpers
- `queryPersona()` - Pure I/O, can be tested separately
- `askPersonaAboutSelection()` - Workflow orchestration
- Commands become 1-4 lines (just call the helpers)

**What This Teaches Readers**:
- Commands are thin coordination layers
- Workflows live in helpers
- Extraction happens where I/O and logic meet

### 2. Guiding Code Comments (Intentional Rough Edges)

**Problem**: Code has rough edges. Do we fix them or document them?

**Don's Question**: "What if instead of hiding rough edges with TODO comments, you asked why they exist?"

**Example: Repetitive outputChannel Calls**

```typescript
// Old (hiding the problem):
// TODO: Extract repetitive appendLine calls
outputChannel.appendLine('='.repeat(60));
outputChannel.appendLine('don-socratic');
outputChannel.appendLine('='.repeat(60));
// ... 5 more times

// New (asking about the pattern):
/**
 * Helper: Format output channel for persona responses
 *
 * don-socratic asks:
 * Those eight appendLine() calls... what pattern do you see?
 * Are they structural (header, content, footer)?
 * Could you name that pattern?
 * What would happen if you extracted it?
 */
function formatPersonaOutput(channel, personaName, selectedCode, response) {
  // ... implementation
}
```

**What This Teaches Readers**:
- Rough edges aren't bugs, they're teachers
- The pattern (header-content-footer) is now visible
- Readers understand WHY extraction might happen (not just that it "should")
- Readers can decide: extract it or leave it?

### 3. Guiding Test Organization (Happy + Error + Integration)

**Problem**: How should tests be organized? By function? By feature? By user story?

**Don's Question**: "How would a user think about this feature? What should happen? What could go wrong? Do components work together?"

**The Answer Emerges**: Three categories per feature

```
Feature: Stub Generation
├─ Happy Path: What happens when everything works?
│  ├─ Find marker ✓
│  ├─ Parse signature ✓
│  ├─ Generate stub ✓
│  └─ Insert into file ✓
├─ Error Paths: What happens when something breaks?
│  ├─ No marker found ✓
│  ├─ Complex signature ✓
│  ├─ Wrong language ✓
│  └─ ...
└─ Integration: Do components work together?
   └─ Full workflow end-to-end ✓
```

**What This Teaches Readers**:
- Tests mirror user thinking, not implementation
- Every feature has predictable shape (happy + error + integration)
- Error handling is first-class, not an afterthought
- Integration tests verify the whole system

## Embedding Questions in Code

### Pattern: Function Documentation

Instead of: "Does X"
Use: "What should X do? (with don-socratic questions)"

**Example**:
```typescript
/**
 * Helper: Query a persona via rhizome CLI
 *
 * don-socratic asks:
 * When you call out to an external service (rhizome CLI), what should
 * you encapsulate? What belongs in a helper, and what stays in the command?
 *
 * ANSWER:
 * The rhizome call itself is pure I/O. It takes text, sends it to rhizome,
 * gets back text. That's a perfect candidate for extraction.
 * The command handler stays focused: get selection, call helper, show result.
 * The helper stays focused: I/O with rhizome, error handling, nothing else.
 */
async function queryPersona(
  text: string,
  persona: string,
  timeoutMs: number = 30000
): Promise<string> {
  // ...
}
```

**What This Does**:
1. Names the question being answered
2. Shows the question first (invites thinking)
3. Provides the answer (but reader already thought about it)
4. Teaches by making reasoning visible

### Pattern: Test Names as Specifications

Instead of: `testFindStubComments()`
Use: "should find @rhizome stub marker and extract function signature"

```typescript
it('should find @rhizome stub marker and extract function signature', () => {
  // Test body
});
```

**What This Does**:
- Test name IS the specification
- Reader understands expected behavior before reading code
- Questions like "what should happen?" are answered in the name

### Pattern: Documentation as Questions

Instead of: "Here's how to use this"
Use: "What would you want from this? How would you use it?"

**Example from TESTING_GUIDE.md**:
```
# Quick Start

When you want to run tests, what are you trying to do?
- Run all tests once (development)
- Watch mode during active development
- Debug a specific test

npm test              # What does this do? Runs all tests once
npm run test:watch   # And this? Watches files, reruns on change
```

## Real Example: The Test Library

How did the test library emerge? Through questions:

### Question 1: "What do all tests need?"

Observation: Both stub tests and query tests repeat:
- Creating temp workspaces
- Setting up .rhizome context
- Mocking external calls
- Common assertions

**Answer**: Extract these into a library

### Question 2: "What should be extracted?"

Patterns that:
- Repeat across multiple tests
- Are error-prone (especially cleanup)
- Have semantic meaning

**Answer**:
- `TestWorkspace` - workspace management with guaranteed cleanup
- `MockRhizome` - external dependency mocking
- `TestAssertions` - semantic assertions
- `TestSetup` - scenario factories

### Question 3: "How should assertions be named?"

Low-level approach:
```typescript
const content = fs.readFileSync(path, 'utf-8');
assert(content.includes('TODO'));
```

High-level approach:
```typescript
TestAssertions.fileContains(path, 'TODO');
```

**Answer**: Semantic names document intent. `fileContains` tells you what's being tested (file content), not how (fs.readFileSync).

### Question 4: "How should tests be organized?"

By implementation:
```
✗ Tests for findStubComments()
✗ Tests for generateStub()
✗ Tests for insertStub()
```

By user experience:
```
✓ Stub Generation
  ✓ Happy Path (4 tests)
  ✓ Error Paths (5 tests)
  ✓ Integration (1 test)
```

**Answer**: User experience. Tests mirror how users think about features.

## How This Guides Future Development

When a new Claude instance works on rhizome or vscode-rhizome, these questions should guide them:

### Before Writing Code
- "What is the user trying to do?"
- "What could go wrong?"
- "What patterns will repeat?"

### Before Extracting
- "Is this error-prone?"
- "Does it have semantic meaning?"
- "Will it be reused?"

### Before Naming
- "Does this name explain why it exists?"
- "Would a reader understand the purpose?"
- "Does it mirror user thinking?"

### Before Organizing
- "How does the user think about this?"
- "What are the happy paths, error paths, integration points?"
- "Are tests grouped by implementation or user experience?"

## The Teaching Moment

Don-socratic is ultimately about learning. By asking questions instead of giving answers:

1. **Readers think** instead of just follow
2. **Patterns become visible** instead of hidden
3. **Trade-offs are clear** instead of implicit
4. **Decisions are explainable** instead of arbitrary

## Examples in vscode-rhizome

### Example 1: Rough Edge as Teaching

```typescript
// This repetition is INTENTIONAL
outputChannel.appendLine('='.repeat(60));
outputChannel.appendLine('don-socratic');
outputChannel.appendLine('='.repeat(60));
outputChannel.appendLine('Selected code:');
outputChannel.appendLine('');
outputChannel.appendLine(selectedText);
outputChannel.appendLine('');
outputChannel.appendLine('--- Waiting for persona response ---');
outputChannel.appendLine('');
```

**Why keep it?** Because the pattern is visible. Readers feel the repetition and ask: "Could this be extracted?" Then they extract it. That's learning.

### Example 2: Comments as Socratic Questions

```typescript
/**
 * Helper: Detect language from VSCode languageId
 *
 * Both stub generation and inline questioning need this.
 * Extract it once, use it everywhere.
 *
 * don-socratic asks: Where is language detection duplicated?
 */
function detectLanguage(languageId: string): 'typescript' | 'javascript' | 'python' | null {
  // ...
}
```

**Why ask?** Because the next developer should understand: this helper exists because language detection was repeated. That's a pattern. That's worth learning.

### Example 3: Tests Organized by User Experience

```typescript
describe('Stub Generation', () => {
  describe('Happy Path: Basic stub generation', () => {
    // Tests: find marker, parse, generate, insert
  });

  describe('Error Paths: Handling failures gracefully', () => {
    // Tests: no marker, complex types, multiline signatures
  });

  describe('Integration: Full stub generation workflow', () => {
    // Tests: end-to-end workflow
  });
});
```

**Why organize this way?** Because users don't think "test the insertStub function." They think "does stub generation work?" Tests should mirror that thinking.

## For Rhizome Maintainers and Contributors

When reviewing code or designing features, ask:

1. **Are there questions embedded in the code?** If not, should there be?
2. **Are rough edges documented as teaching moments?** Or hidden?
3. **Are tests organized by user experience?** Or by implementation?
4. **Do function names explain why they exist?** Or just what they do?
5. **Would a new contributor understand the thinking?** Or just the code?

The extension itself is a teaching tool. The code teaches. The tests teach. The documentation teaches.

---

## See Also

- vscode-rhizome/.rhizome/TESTING_GUIDE.md - Practical testing guide
- vscode-rhizome/.rhizome/TEACHING_MOMENTS.md - Rough edges as questions
- vscode-rhizome/src/extension.ts - Code with embedded don-socratic questions
- vscode-rhizome/src/extension.test.ts - Tests organized by user experience
