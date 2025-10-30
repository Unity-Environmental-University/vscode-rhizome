# Protocol Execution Example: Rubber Duck Debugging Feature

This document shows how the VSCode Rhizome Development Protocol was applied to the Rubber Duck Debugging feature (Oct 30, 2025).

## Phase 1: Bootstrap ✅

**Goal**: Understand current state, get strategic direction

```bash
# Check what's active
rhizome flight list
→ Found 29 flight plans, multiple active

# Get direction from dev-guide
rhizome query --persona dev-guide "What should I focus on?"
→ "Modularization validation, CLI separation, testing prioritization"

# Record session start
rhizome record --action begin --object "vscode-rhizome-session" \
  --what "Bootstrap session: focus on modularization and CLI docs" \
  --confidence 0.85
→ Session recorded in .rhizome/actions.ndjson
```

**Outcome**: Session context established, strategic priorities understood

## Phase 2: Kitchen Table (Design) ✅

**Goal**: Design through questioning before any code

### Step 1: Frame the Work
```bash
rhizome flight init \
  --title "Rubber Duck Debugging: Interactive Line-by-Line Personas" \
  --requester "Claude Code" \
  --story-as "developer" \
  --story-want "walk through code line-by-line with a supportive persona" \
  --story-so "deepen understanding without flow interruption"
→ Flight plan: fp-1761820189 (active, kitchen_table phase)
```

### Step 2: Add Design Steps
```bash
rhizome flight add --title "Design rubber duck persona: gentler than don-socratic"
rhizome flight add --title "Define interaction model: next/deeper/summary/stop commands"
rhizome flight add --title "Schema design: JSONL storage with content hashing"
→ 3 design steps added
```

### Step 3: Validate Design with Personas

**Code-Reviewer**: Schema soundness
```bash
rhizome query --persona code-reviewer <<'EOF'
STORAGE SCHEMA:
.rhizome/vscodestate/rubber/src-extension-ts.rubber.json
{
  "file": "src/extension.ts",
  "conversation": [{
    "line": 5,
    "content": "code",
    "duck": "observation",
    "userResponse": "next"
  }]
}

Is this schema sound? Edge cases?
EOF
```

**Response**: Code-reviewer flagged edge cases (long lines, invalid commands, error handling)

**UX-Advocate**: User experience validation
```bash
rhizome query --persona ux-advocate <<'EOF'
FLOW:
1. Right-click → "Start Rubber Duck Session"
2. Duck loads previous conversation (if exists)
3. Shows line + observation + question
4. User types: next/deeper/summary/stop
5. Loop or exit

Should input be inline or output panel? How clear are commands?
EOF
```

**Response**: UX-advocate recommended output panel + visual mode indicator + buttons

**Dev-Advocate**: Synthesis
```bash
rhizome query --persona dev-advocate "[full design summary]"
```

**Response**: Synthesized perspectives, clarified architecture patterns

### Step 4: Make Architectural Decisions

**Decision 1: Storage Format**
```bash
rhizome record --action decide \
  --object "rubber-duck-storage-format" \
  --what "JSONL vs JSON Array for conversation storage" \
  --note "Chose JSONL: append-only, streaming, efficient for long interactive sessions" \
  --confidence 0.9
```

**Decision 2: Overall Architecture**
```bash
rhizome record --action decide \
  --object "rubber-duck-architecture" \
  --what "Four modules: Storage, StateManager, Query, Session" \
  --note "Modular, testable, clear responsibility boundaries. Content hash for line tracking." \
  --confidence 0.9
```

### Step 5: Mark Design Complete
```bash
rhizome flight start --step 1
rhizome flight done --step 1
# ... repeat for steps 2, 3

rhizome flight phase --move-to garden
→ Phase transitioned to garden (execution), conductor shifts to root (skeptic)
```

**Outcome**: Design validated, decisions recorded, architecture clear, ready to build

---

## Phase 3: Garden (Implementation) ✅

**Goal**: Build implementation skeleton that teaches through friction

### Step 1: Stub All Modules
```bash
# Created 4 files with full method signatures:
# - src/rubberDuckStorage.ts (7 methods)
# - src/rubberDuckStateManager.ts (9 methods)
# - src/rubberDuckQuery.ts (3 functions)
# - src/rubberDuckSession.ts (13 methods)

# Each method:
constructor() {
  throw new Error('methodName: What should this do? ' +
    'Why would a user want this? What trade-offs exist?')
}
```

**Example Question** (from `rubberDuckStorage.getStoragePath()`):
```typescript
/**
 * Given a file path, where should we store its rubber duck session?
 * What's a good naming convention that survives path separators?
 */
private getStoragePath(filePath: string): string {
  throw new Error(
    'getStoragePath: How do you normalize a file path to a safe storage name?'
  );
}
```

### Step 2: Commit Stubs
```bash
git add src/rubberDuck*.ts
git commit -m "scaffold: Add rubber duck debugging module stubs

Created 4 modules with full method signatures and interfaces:
- rubberDuckStorage: JSONL persistence, content hashing
- rubberDuckStateManager: Session state, line navigation
- rubberDuckQuery: Persona integration, duck observations
- rubberDuckSession: Main orchestrator, command dispatch

Each method contains don-socratic questions instead of implementation.
This follows the teaching-through-friction philosophy..."

rhizome link-commit --note "Created 4 rubber duck module stubs with teaching questions"
```

### Step 3: Add Implementation Steps
```bash
rhizome flight add --title "Implement rubberDuckStorage: JSONL read/write"
rhizome flight add --title "Implement rubberDuckStateManager: session state"
rhizome flight add --title "Implement rubberDuckQuery: persona integration"
rhizome flight add --title "Implement rubberDuckSession: orchestration"
rhizome flight add --title "Integrate rubber duck command"
rhizome flight add --title "Write comprehensive tests"
rhizome flight add --title "Manual testing in VSCode"
→ 7 implementation steps ready
```

### Step 4-10: Implement Each Module
(In progress - following the pattern below for each module)

```typescript
// For EACH method in the stub:

// 1. Read the don-socratic question
// 2. Ask a persona if needed
// 3. Make explicit design decision
// 4. Implement the method
// 5. Write tests
// 6. Commit with reasoning
```

**Example Implementation Flow** (for `hashLine()`):

```bash
# 1. Read the question from stub
"hashLine: Should we use SHA256? First 50 chars + line number? What survives refactoring?"

# 2. Ask code-reviewer for guidance
rhizome query --persona code-reviewer "
How should we hash a line so it survives small code edits?
SHA256 of full content? First N chars? Line number + content hash?
"

# 3. Decide based on guidance
# Decision: SHA256 of first 80 chars + line number
# Survives small edits, handles long lines, persists across session

# 4. Implement
private hashLine(content: string): string {
  const trimmed = content.substring(0, 80);
  return crypto.createHash('sha256').update(trimmed).digest('hex');
}

# 5. Write tests
test('should generate consistent hash for same content', () => {
  const hash1 = storage.hashLine('const x = 5');
  const hash2 = storage.hashLine('const x = 5');
  expect(hash1).toBe(hash2);
});

# 6. Commit with reasoning
git commit -m "feat: Implement hashLine with SHA256 truncation

SHA256 of first 80 characters. Survives minor edits while being
deterministic. Handles long lines gracefully.

Decided: SHA256 > simple substring because it's collision-resistant.
Decided: 80 chars > full content because it survives small refactors.
"

rhizome link-commit --note "Implemented hashLine: SHA256 truncation pattern"
```

**Outcome**: Each module implemented intentionally, tests verify behavior, decisions documented

---

## Phase 4: Integration & Testing

**Goal**: Wire modules together, validate end-to-end

```bash
# Write integration tests
# - Happy path: Full session flow works
# - Error paths: Hash mismatch, missing file, invalid commands
# - Module interactions: Storage ↔ StateManager ↔ Query ↔ Session

# Register command in extension.ts
vscode.commands.registerCommand('vscode-rhizome.rubberDuck', async () => {
  const session = new RubberDuckSession(editor.document.uri.fsPath);
  await session.start();
});

# Manual testing in VSCode debug
npm run build
F5  // Launch debug VSCode
# Test real user interaction
# - Right-click file → "Start Rubber Duck Session"
# - See line displayed, duck observation
# - Type "next", "deeper", etc.
# - Verify JSONL file is created
# - Reopen to test resume

# Validate UX
rhizome query --persona ux-advocate "
I tested rubber duck. Here's what I found:
- Commands are: [list actual commands from testing]
- Pain points: [what was confusing?]
- Surprises: [what was delightful?]
"
```

**Outcome**: Feature works end-to-end, all personas validated, ready for documentation

---

## Phase 5: Library (Reflection) ✅

**Goal**: Document, reflect, extract patterns

```bash
rhizome flight phase --move-to library

# Update TEACHING_MOMENTS.md with rough edges preserved
UPDATE: "Why do we ask 'What survives refactoring?' - teaches thinking about code stability"

# Record reflection
rhizome record --action document \
  --object "rubber-duck-completion" \
  --what "Rubber duck feature implementation complete" \
  --note "Learned: Content hashing is crucial for resume. JSONL append-only avoids rewrites." \
  --confidence 0.95

# Ask dev-advocate for patterns
rhizome query --persona dev-advocate "
Feature complete. What worked? What should we do differently next time?
"

# Update CLAUDE.md
APPEND: "Pattern: Stream-friendly JSONL storage for interactive features"
APPEND: "Decision: Output channel + input box for VSCode prompting"
APPEND: "Teaching moment: Don-socratic questions in stubs forces intentional design"

# Mark complete
rhizome flight finish
```

**Outcome**: Patterns documented, lessons captured, next feature benefits from this learning

---

## Key Outcomes from Protocol Application

### Decisions Recorded
1. **rubber-duck-design** (confidence: 0.8) - Voice, interaction, storage format
2. **rubber-duck-architecture** (confidence: 0.9) - Modules, data model, error handling
3. **rubber-duck-implementation-spec** (confidence: 0.9) - Detailed implementation guide
4. **rubber-duck-module-stubs** (confidence: 1.0) - Scaffolding complete

### Personas Consulted
- **code-reviewer**: Schema soundness, edge cases, hashing strategy
- **ux-advocate**: UI/UX validation, command clarity, affordances
- **dev-advocate**: Synthesis, pattern extraction, architectural guidance
- **dev-guide**: Initial direction, priorities

### Teaching Artifacts Created
- 32 don-socratic questions in method stubs
- Design decisions documented in commit messages
- CLAUDE.md updated with new patterns
- Flight plan with full decision trail

### Git History Shows Intent
- `docs: Add HOW_TO_USE_RHIZOME.md` - Foundation
- `scaffold: Add rubber duck module stubs` - Architecture teaching
- `feat: Implement [module]` - Intentional implementations
- `feat: Integrate rubber duck` - Feature accessible
- Each commit linked to rhizome decision log

### Process Benefits
1. **Thoughtful design** - Questions answered before code
2. **Visible decisions** - Why chosen, not just what chosen
3. **Persona guidance** - Expert perspectives at each decision point
4. **Teaching for next dev** - Stubs ask questions, not provide answers
5. **Incremental progress** - Each step verified before moving forward
6. **Traceable reasoning** - `.rhizome/actions.ndjson` shows decision trail

---

## What the Next Developer Will See

When they open the rubber duck module to extend it:

```typescript
// In rubberDuckSession.ts
async start(): Promise<void> {
  throw new Error(
    `start: What's the session lifecycle? ` +
    `How do you show the output channel? How do you get user input?`
  );
}
```

They'll also find:
1. Commit messages explaining each decision
2. `.rhizome/actions.ndjson` with full decision log
3. This document showing how protocol was applied
4. CLAUDE.md with architectural patterns
5. Tests showing expected behavior
6. Comments asking why, not just what

**Result**: Next developer doesn't just read code - they understand the thinking behind it.

---

## Replicating This Protocol

To use this protocol for a new feature:

1. **Copy this document** to your new feature folder
2. **Follow Phase 1-5** in order
3. **Call personas** at decision points
4. **Record decisions** in rhizome
5. **Keep questions visible** in stubs
6. **Test and reflect**

The protocol is self-documenting. Each feature creates a precedent for the next.
