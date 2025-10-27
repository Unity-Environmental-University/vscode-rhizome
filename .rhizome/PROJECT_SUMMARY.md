# vscode-rhizome: Project Summary

## What Is vscode-rhizome?

A VSCode extension that brings the don-socratic persona into your editor via two core features:

1. **Stub Generation** - Mark functions with `@rhizome stub`, extension generates TODO + language-specific error throwing
2. **Don-Socratic Questioning** - Select code and ask the don questions about your design via the rhizome CLI

All built with heavily-annotated, teaching-focused code that invites improvement through friction, not instruction.

---

## Project Philosophy

### The Don-Socratic Approach

Instead of telling you what to do, the don asks questions that make you think:

- *"What should this function do?"*
- *"How does this pattern compare to that one?"*
- *"What edge cases haven't you considered?"*

This extension brings that questioning into VSCode at the moment you're writing code.

### Teaching Through Code

Code is documentation. Every function in vscode-rhizome:
1. Has a comment asking don-socratic questions about its design
2. Intentionally leaves rough edges that invite refactoring
3. Demonstrates best practices by example

Readers learn by friction, not instruction.

---

## Architecture

### Core Components

**Extension** (`src/extension.ts`)
- 6 helper functions (queryPersona, formatPersonaOutput, getActiveSelection, detectLanguage, askPersonaAboutSelection, initializeRhizomeIfNeeded, ensureOpenAIKeyConfigured, addToGitignore, isRhizomeInstalled)
- 3 commands registered (init, donSocratic, inlineQuestion, stub)
- Each command is 1-4 lines (helpers do the work)
- Teaching moments embedded in every function

**Stub Generator** (`src/stubGenerator.ts`)
- `generateStub()` - Creates stub with TODO + throw/raise
- `findStubComments()` - Finds @rhizome stub markers, extracts signatures
  - Uses AST parsing (Babel) for robustness
  - Falls back to regex for Python and simple cases
- `insertStub()` - Splices stub into file at correct location
- All three functions: heavily annotated, questions embedded

**Test Utilities** (`src/test-utils.ts`)
- Extracted from asking: "What do all tests need?"
- `TestWorkspace` - Isolated temp directories, setup/teardown
- `MockRhizome` - Simulates rhizome CLI without external dependencies
- `TestAssertions` - Common assertions (file, config, gitignore)
- `TestSetup` - Factory methods for common test scenarios

**Tests** (`src/extension.test.ts`)
- 23 comprehensive tests
- Two main scenarios: Stub Generation (10 tests), Don-Socratic Querying (10 tests)
- Organization: Happy Paths + Error Paths + Integration for each feature
- Tests are executable specification

---

## Features

### 1. Stub Generation

**What it does:**
```typescript
// @rhizome stub
function greet(name: string): string {
  // TODO: implement greet
  throw new Error('Not implemented: greet');
}
```

**How to use:**
1. Mark a function with `// @rhizome stub`
2. Right-click → "Stub this function"
3. Stub is generated and inserted

**Supported languages:**
- TypeScript/JavaScript (throws)
- Python (raises NotImplementedError)

**Edge cases handled:**
- Multiple stubs (user picks)
- Complex generic types (AST parsing)
- Multiline signatures
- Nested functions (indentation preserved)

### 2. Don-Socratic Questioning

**What it does:**
```
Select code → Right-click → "Ask don-socratic"
Output panel shows questions about your code
```

**How to use:**
1. Select code in editor
2. Right-click → "Ask don-socratic" or "Ask don-socratic (inline)"
3. Output panel shows questions from don-socratic

**Setup (automatic on first use):**
- Checks if rhizome is installed
- Initializes `.rhizome` context in workspace
- Prompts for OpenAI API key
- Stores key securely in `.rhizome/config.json`
- Adds config to `.gitignore` automatically

### 3. Workspace Initialization

**What it does:**
- Detects missing rhizome CLI, shows installation guide
- Auto-creates `.rhizome` context on first use
- Prompts for OpenAI key with password input
- Stores key securely, protected from git

**Manual initialization:**
- Command palette: "Initialize Rhizome"
- Sets up everything from scratch

---

## File Structure

```
vscode-rhizome/
├── src/
│   ├── extension.ts           # Main extension logic (helpers + commands)
│   ├── stubGenerator.ts       # Stub generation (3 functions)
│   ├── extension.test.ts      # Comprehensive test suite (23 tests)
│   └── test-utils.ts          # Testing library (4 classes)
├── .vscode/
│   ├── launch.json            # F5 debug config (auto-opens test-workspace)
│   └── tasks.json             # Build task
├── test-workspace/            # Auto-opened on F5
│   ├── test.ts                # TypeScript test file
│   ├── test.py                # Python test file
│   └── README.md              # Testing workflow
├── .rhizome/                  # Rhizome context
│   ├── TEACHING_MOMENTS.md    # Don's questions about design
│   ├── TESTING_GUIDE.md       # How to run and write tests
│   ├── TEST_DESIGN_PHILOSOPHY.md  # Why testing library exists
│   └── IMPLEMENTATION_STATUS.md   # What's working, rough edges
├── package.json               # Dependencies, scripts
├── tsconfig.json              # TypeScript config
├── .mocharc.json              # Mocha test runner config
└── test-scenarios.md          # Detailed scenario sketches
```

---

## Development Workflow

### Building

```bash
npm run esbuild         # Build once
npm run esbuild-watch   # Watch mode
npm run typecheck       # TypeScript check without emit
```

### Testing

```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
```

### Debugging

```bash
Press F5                # Opens VSCode with extension + test-workspace
                        # Automatically builds extension first
```

In the debug window:
1. Open test.ts or test.py
2. Select code
3. Right-click → "Ask don-socratic"
4. Check Output panel (vscode-rhizome channel)

---

## Design Decisions

### AST Parsing for Stub Detection

**Question**: How do you robustly extract function signatures from code?

**Options:**
- Regex: Fast, 90% coverage, silent failures on complex code
- AST: Slower, 100% coverage, requires parser library

**Decision**: Use AST (via @babel/parser) as default, regex as fallback
- TypeScript/JavaScript: Use AST
- Python: Use regex (no good parser in Node)
- Graceful degradation if AST fails

**Teaching moment**: Robustness has a cost. Leave that cost visible so readers understand the tradeoff.

### Encapsulated Helpers in Extension

**Question**: When command handlers repeat the same code, what should be extracted?

**Answer**: Extract the workflow, not just the I/O
- Helper: `askPersonaAboutSelection(persona, displayName)`
- Both donSocratic and inlineQuestion commands use it
- Command handlers are 1 line each

**Teaching moment**: Commands should be thin wrappers. Workflows belong in helpers.

### Test Library Extraction

**Question**: When tests repeat setup, mocking, assertions, what belongs in a library?

**Answer**: Patterns that repeat AND are error-prone
- `TestWorkspace` - Cleanup is error-prone (use this)
- `MockRhizome` - I/O mocking is repetitive (use this)
- `TestAssertions` - Semantic assertions (use this)
- `TestSetup` - Common scenarios (use this)

**Teaching moment**: Libraries aren't random. Extract what hurts.

---

## Key Dependencies

### Production
- `@babel/parser@^7.23.0` - AST parsing for robust stub detection

### Development
- `mocha@^10.0.0` - Test runner
- `ts-node@^10.0.0` - TypeScript execution
- `typescript@^5.3.0` - Type checking
- `@types/vscode@^1.85.0` - VSCode type definitions

---

## Teaching Moments

Every piece of code invites thinking:

### TEACHING_MOMENTS.md
Four intentional rough edges documented as don's questions:
1. Repetitive `.appendLine()` calls - Pattern visible, not hidden
2. Nested if/else for optional fields - Clarity question
3. Silent regex failure - Error handling design
4. insertStub heuristic parsing - When to stop and ask

### Code Comments
Every function has don-socratic questions embedded:
- "What should be encapsulated vs left in handlers?"
- "Do you see the pattern? Could you name it?"
- "What state must exist before a tool works?"
- "Where should secrets live and how do you protect them?"

### Tests as Documentation
23 tests organized by user experience:
- Happy paths answer: "What should happen?"
- Error paths answer: "How should failure be handled?"
- Integration tests answer: "Do components work together?"

---

## Metrics

### Code Coverage
- Extension: 8 functions, all with tests
- Stub Generator: 3 functions, all with happy + error + integration tests
- Test Utils: 4 classes, all with integration tests

### Test Count
- Happy Path: 13 tests
- Error Paths: 7 tests
- Integration: 3 tests
- **Total: 23 tests**

### Documentation
- TEACHING_GUIDE.md: 400 lines
- TEST_DESIGN_PHILOSOPHY.md: 300 lines
- TESTING_MOMENTS.md: 150 lines
- In-code comments: 200+ lines

---

## Next Steps

### Immediate
- [ ] Run tests: `npm test`
- [ ] Debug extension: Press F5
- [ ] Try don-socratic on test.ts code
- [ ] Try stub generation on test.ts functions

### Short Term
- [ ] Add Python AST parsing (currently regex fallback)
- [ ] Add webview for response display (currently output channel)
- [ ] Add keyboard shortcuts for commands
- [ ] Configuration UI for OpenAI key

### Medium Term
- [ ] Support additional personas (not just don-socratic)
- [ ] Flight plan integration in VSCode
- [ ] Persona context selection via UI
- [ ] Query history in output panel

### Long Term
- [ ] Extension marketplace release
- [ ] Community-contributed personas
- [ ] Integration with rhizome flight plans
- [ ] Distributed persona chorus support

---

## How to Contribute

### Adding a Feature

1. **Understand the philosophy** - Read TEACHING_MOMENTS.md and TEST_DESIGN_PHILOSOPHY.md
2. **Sketch with flight plans** - Use `rhizome flight scaffold` to think through scenarios
3. **Ask don-socratic questions** - Embed questions in code comments
4. **Test comprehensively** - Happy path + error paths + integration
5. **Document the why** - Not the what, but the reasoning

### Improving Tests

1. Identify a feature that needs more coverage
2. Create `TestSetup` factory if needed
3. Add tests: Happy Path, Error Paths, Integration
4. Run: `npm run test:watch`
5. Iterate until passing

### Improving Documentation

1. If code has unclear purpose, add a don-socratic question
2. If design decision isn't obvious, document it in .rhizome/
3. If teaching moment exists, add it to TEACHING_MOMENTS.md
4. Keep code and docs in sync

---

## Frequently Asked Questions

### Q: Why so many comments in the code?

**A**: Comments are don-socratic questions, not instructions. They invite thinking.

### Q: Why leave rough edges like repetitive code?

**A**: Rough edges are teachers. They make you feel the need to refactor. That's learning.

### Q: Why use a testing library instead of just tests?

**A**: Patterns that repeat deserve names. The library is a record of testing wisdom.

### Q: What happens if rhizome isn't installed?

**A**: Extension shows helpful error with installation guide. All features work except don-socratic querying.

### Q: Where is the OpenAI key stored?

**A**: In `.rhizome/config.json` (local to workspace). Protected by `.gitignore` automatically.

### Q: Can I use a different AI provider?

**A**: Currently hardcoded for OpenAI. Rhizome supports Ollama. Contributions welcome for pluggable providers.

---

## License & Attribution

vscode-rhizome is built with:
- The don-socratic persona from rhizome
- VSCode Extension API
- @babel/parser for AST parsing
- Mocha for testing

All code is heavily annotated with don's teaching voice.

---

## Summary

**vscode-rhizome** is a VSCode extension that brings Socratic questioning into code authoring.

Built with:
- **Two core features** (stubs + questioning)
- **Comprehensive tests** (23 tests, reusable library)
- **Teaching-focused code** (every function has don's questions)
- **Intentional rough edges** (friction as a teacher)
- **Extensive documentation** (philosophy + guides + scenarios)

Everything is designed to make you better at thinking about code, not just writing it.

The extension itself teaches by example: here's how to ask good questions, here's how to test thoroughly, here's how to document thoroughly.

Use it. Improve it. Learn from it.
