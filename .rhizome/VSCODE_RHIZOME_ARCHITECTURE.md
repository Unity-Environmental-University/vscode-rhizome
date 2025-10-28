# vscode-rhizome Architecture & Knowledge Graph

Visual representation of the extension architecture, testing philosophy, and don-socratic design principles.

---

## Architecture Diagram: Command Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     VSCode Editor                               │
│  User selects code → Right-click → Choose command               │
└────────────────────┬─────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   [Command 1]              [Command 2]
  donSocratic          inlineQuestion
        │                         │
        └────────────┬────────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │ askPersonaAboutSelection│
        │  (Extracted Workflow)   │
        └────────────┬────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   getActiveSelection        isRhizomeInstalled?
   (Extracted Helper)        (Check dependency)
        │                         │
        ├─────────┬──────────┐    │
        │         │          │    │
   Selection   Selection  Validation Error handling
   validated   + text                 │
                                      ▼
                    ┌─────────────────────────────┐
                    │ initializeRhizomeIfNeeded   │
                    │  (Auto-init on first use)   │
                    └────────────┬────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
            .rhizome exists?      ensureOpenAIKeyConfigured
            (Check)                (Prompt if needed)
                    │                         │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────────┐
                    │     queryPersona()          │
                    │  (Pure I/O with rhizome)    │
                    └────────────┬────────────────┘
                                 │
                          rhizome CLI call
                    (rhizome query --persona X)
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
              Response from             Error from
              rhizome/OpenAI            rhizome/network
                    │                         │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────────┐
                    │   formatPersonaOutput()     │
                    │  (Extract repetitive setup) │
                    └────────────┬────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────────┐
                    │     Output Channel          │
                    │  (Show response to user)    │
                    └─────────────────────────────┘
```

---

## Stub Generation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              User marks function with @rhizome stub              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
                  [stub Command]
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
  detectLanguage()                Get document text
  (Extracted helper)              │
        │                         │
        │                         ▼
        │            findStubComments(code, lang)
        │            ┌──────────────────────────┐
        │            │  AST-based parsing       │
        │            │  (if TS/JS available)    │
        │            │    Falls back to         │
        │            │  Regex (Python, simple)  │
        │            └──────────────┬───────────┘
        │                           │
        │                    Found stub markers?
        │                    ┌──────┴──────┐
        │                    │             │
        │               Yes  │        No   │
        │                    ▼             ▼
        │            Extract:         Show warning
        │            • Function name   No stubs found
        │            • Parameters
        │            • Return type
        │            • Line number
        │                    │
        └────────────────────┤
                             ▼
                 generateStub(name, params, type, lang)
                 ┌──────────────────────────────────┐
                 │  TypeScript/JavaScript           │
                 │  → TODO comment + throw Error    │
                 │                                  │
                 │  Python                          │
                 │  → TODO comment + raise NotImpl   │
                 └──────────────┬───────────────────┘
                                │
                                ▼
                 insertStub(code, line, stub, lang)
                 ┌──────────────────────────────────┐
                 │  Find insertion point            │
                 │  Preserve indentation            │
                 │  Add opening/closing braces      │
                 │  Handle edge cases               │
                 └──────────────┬───────────────────┘
                                │
                                ▼
                 Apply workspace edit
                 File modified with stub
                                │
                                ▼
                 Show success message
```

---

## Testing Library Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              Test Library (src/test-utils.ts)                    │
│                  4 Classes Extracted from Patterns               │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ TestWorkspace                                                │
├──────────────────────────────────────────────────────────────┤
│ Problem: Tests need isolated, temporary workspaces           │
│ Solution: Class managing lifecycle + file I/O                │
│                                                               │
│ Methods:                                                      │
│  • setup() - Create temp dir, init .rhizome, .gitignore     │
│  • createFile(path, content) - Create test file             │
│  • readFile(path) - Read from workspace                      │
│  • teardown() - Clean up (guaranteed)                        │
│  • setOpenAIKey() - Configure for testing                    │
│                                                               │
│ Why it exists: Cleanup is error-prone                        │
│ Teaching moment: Encapsulation makes correct usage easiest  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ MockRhizome                                                  │
├──────────────────────────────────────────────────────────────┤
│ Problem: Tests call real CLI (slow, fragile, hard to test)   │
│ Solution: Mock simulating responses without calling CLI      │
│                                                               │
│ Methods:                                                      │
│  • registerResponse(persona, input, output) - Preset answers │
│  • simulateQuery(persona, input) - Fake CLI call            │
│  • getCalls() - Inspect what was "called"                    │
│  • clear() - Reset for next test                             │
│                                                               │
│ Why it exists: I/O dependencies are slow & fragile          │
│ Teaching moment: Pure I/O belongs in helpers, not tests      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ TestAssertions                                               │
├──────────────────────────────────────────────────────────────┤
│ Problem: Low-level assertions don't document intent          │
│ Solution: Semantic methods by domain (not mechanism)         │
│                                                               │
│ Methods:                                                      │
│  • fileContains(path, content) - Check file has content      │
│  • fileEquals(path, expected) - Exact match                  │
│  • gitignoreContains(workspace, entry) - Protected secrets   │
│  • configHasValue(path, key, value) - Config validation      │
│  • indentationMatches(path, line, indent) - Preserve spaces  │
│                                                               │
│ Why it exists: Names document what's tested                  │
│ Teaching moment: Semantic assertions > generic assertions    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ TestSetup                                                    │
├──────────────────────────────────────────────────────────────┤
│ Problem: Setup code is repetitive and procedural             │
│ Solution: Factory methods declaring what's needed            │
│                                                               │
│ Methods:                                                      │
│  • createStubGenerationTest() - Ready-to-test stub scenario  │
│  • createQuestioningTest() - Ready-to-test query scenario    │
│  • createWithOpenAIKey(key) - Pre-configured workspace       │
│                                                               │
│ Why it exists: Setup is scaffolding, not interesting         │
│ Teaching moment: Factories vs procedural setup               │
└──────────────────────────────────────────────────────────────┘
```

---

## Test Organization: User Experience Centered

```
┌─────────────────────────────────────────────────────────────┐
│              Feature: Stub Generation (10 tests)             │
└─────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────┐
    │  Category 1: Happy Path (4 tests)               │
    │  "What happens when everything works?"          │
    ├─────────────────────────────────────────────────┤
    │  ✓ Find marker & extract signature              │
    │  ✓ Generate TypeScript stub (throw)             │
    │  ✓ Generate Python stub (raise)                 │
    │  ✓ Insert at correct location                   │
    └─────────────────────────────────────────────────┘
            ↓ (each passes → next category)
    ┌─────────────────────────────────────────────────┐
    │  Category 2: Error Paths (5 tests)              │
    │  "What happens when something breaks?"          │
    ├─────────────────────────────────────────────────┤
    │  ✓ Handle no markers found                      │
    │  ✓ Handle complex generic types                 │
    │  ✓ Handle multiline signatures                  │
    │  ✓ Support Python syntax                        │
    │  ✓ Fail gracefully on unsupported language      │
    └─────────────────────────────────────────────────┘
            ↓ (each failure handled → next category)
    ┌─────────────────────────────────────────────────┐
    │  Category 3: Integration (1 test)               │
    │  "Do all pieces work together?"                 │
    ├─────────────────────────────────────────────────┤
    │  ✓ Full workflow: Find → Parse → Generate → Insert
    │    (real file, real modifications, verify result)
    └─────────────────────────────────────────────────┘
```

---

## Don-Socratic Design Principles

```
┌─────────────────────────────────────────────────────────────┐
│           Don-Socratic as Design Guiding Light               │
└─────────────────────────────────────────────────────────────┘

How It Works:
    Question Asked
           ↓
    Invites Thinking
           ↓
    Reader Forms Answer
           ↓
    Answer Provided (confirms thinking)
           ↓
    Learning Deepens


Three Ways It Guides Development:

1. ARCHITECTURE DECISIONS
   Q: "What should be encapsulated vs in the handler?"
   Answer: Pure I/O in helpers, orchestration in commands
   Result: Commands 1-4 lines, helpers focused

2. CODE COMMENTS
   Q: "Those repetitive calls... what pattern do you see?"
   Answer: Leave visible so readers discover it
   Result: Pattern is teacher, friction invites refactoring

3. TEST ORGANIZATION
   Q: "How would a user think about this feature?"
   Answer: Happy paths + Error paths + Integration
   Result: Tests mirror user thinking, not code structure


Code Teaching Pattern:

    Instead of: "Here's what this does"

    Ask: "Why does this exist?"

    Then readers think about:
    - Purpose (not mechanism)
    - Design decisions (not implementation)
    - When to use (not how to use)

    Result: Code teaches by friction, discovery, thinking
```

---

## Knowledge Transfer Flow

```
Session 2: vscode-rhizome
│
├─ Build features
│  ├─ 2 features (stubs + don-socratic)
│  ├─ 4 commands
│  └─ 23 tests
│
├─ Extract patterns
│  ├─ 5 helpers (extension.ts)
│  ├─ 4 test classes (test-utils.ts)
│  └─ 3 test categories (happy+error+integration)
│
├─ Document philosophy
│  ├─ TESTING_GUIDE.md
│  ├─ TEST_DESIGN_PHILOSOPHY.md
│  ├─ TEACHING_MOMENTS.md
│  └─ PROJECT_SUMMARY.md
│
└─ Transfer to Rhizome
   │
   ├─ TESTING_PHILOSOPHY.md
   │  └─ "What patterns deserve extraction?"
   │
   ├─ DON_SOCRATIC_IN_PRACTICE.md
   │  └─ "How do questions guide design?"
   │
   ├─ TESTING_AND_DONQUESTION_REFERENCE.md
   │  └─ "Where are the implementations?"
   │
   └─ Journal Entry
      └─ "What did we learn?"
         │
         └─ Available to Future Claude Instances
            │
            ├─ When testing: Read TESTING_PHILOSOPHY
            ├─ When designing: Read DON_SOCRATIC_IN_PRACTICE
            ├─ When confused: Check REFERENCE guide
            └─ When exploring: Clone vscode-rhizome


Future Sessions:
    New Claude Instance
          ↓
    "I need to test this feature"
          ↓
    Discovers TESTING_PHILOSOPHY.md in rhizome
          ↓
    Learns about TestWorkspace, MockRhizome, TestAssertions
          ↓
    Reads TESTING_AND_DONQUESTION_REFERENCE.md
          ↓
    Clones vscode-rhizome to see working example
          ↓
    Runs: npm test (23 tests)
          ↓
    Applies patterns to new feature
          ↓
    Knowledge compounds over time
```

---

## Key Metrics & Impact

```
Code Delivered:
  • 5 helper functions
  • 4 test utility classes
  • 23 comprehensive tests
  • 3 new commands
  • Build + typecheck passing ✅

Documentation Created:
  • TESTING_PHILOSOPHY.md (9.4 KB)
  • DON_SOCRATIC_IN_PRACTICE.md (11 KB)
  • TESTING_AND_DONQUESTION_REFERENCE.md (15 KB)
  • Journal entry (comprehensive record)
  Total: 35+ KB, 5,500+ words

Knowledge Transfer:
  • Copied to rhizome/.rhizome/
  • 3 reference documents
  • Working implementation available
  • Discoverable by future Claude instances

Test Coverage:
  • Stub Generation: 10 tests
    - Happy: 4
    - Error: 5
    - Integration: 1

  • Don-Socratic Querying: 10 tests
    - Configuration: 4
    - Happy: 2
    - Error: 3
    - Integration: 1

  • Utilities: 3 tests

Organization: 100% (happy + error + integration)
Reusability: 4 classes extracted (TestWorkspace, MockRhizome, TestAssertions, TestSetup)
```

---

## Continuity for Future Sessions

```
If Next Claude Needs to Test:
  Entry Point: rhizome/.rhizome/TESTING_PHILOSOPHY.md
  Questions Answered:
    • What patterns deserve extraction?
    • How should tests be organized?
    • What makes tests readable?
  Action: Read → Apply → Succeed

If Next Claude Needs to Design:
  Entry Point: rhizome/.rhizome/DON_SOCRATIC_IN_PRACTICE.md
  Questions Answered:
    • How do questions guide design?
    • Why leave rough edges visible?
    • How should code teach?
  Action: Read → Think → Design

If Next Claude Needs Examples:
  Entry Point: rhizome/.rhizome/TESTING_AND_DONQUESTION_REFERENCE.md
  Then: Clone vscode-rhizome and explore
  Files:
    • src/test-utils.ts (4 classes)
    • src/extension.test.ts (23 tests)
    • src/extension.ts (helpers + questions)
  Action: Study → Understand → Apply

If Next Claude Needs Full Context:
  Entry Point: rhizome/.rhizome/journal/2025-10-27-vscode-rhizome-testing-philosophy.md
  Contains: Everything about this session
  Questions: All answered
  Action: Read → Understand → Continue
```

---

## Conclusion

**What was achieved**:
- ✅ Production-ready vscode-rhizome
- ✅ Reusable test library (4 classes, 0 boilerplate in tests)
- ✅ Comprehensive documentation
- ✅ Knowledge transfer to rhizome
- ✅ Pattern for future Claude continuity

**What was learned**:
- Questions are more powerful than instructions
- Rough edges teach if left visible
- Test organization mirrors user thinking
- Extraction makes correct usage easiest
- Code can teach by example and friction

**What was preserved**:
- All documentation in rhizome
- Working examples in vscode-rhizome
- Design principles for future use
- Patterns for knowledge transfer

**What's possible now**:
- Future Claude instances inherit testing wisdom
- Future extensions can reuse patterns
- Future work compounds on this foundation
- Knowledge persists across sessions
