# Rubber Duck Debugging: Implementation Guide

**Status:** Feature branch checkpoint. Architecture and test suite ready. Awaiting StateManager implementation.
**Branch:** `feature/rubber-duck-state-ui`
**Flight Plan:** `fp-1761820189`
**Last Updated:** 2025-10-30

---

## What This Feature Is

A VSCode extension command that lets developers walk through code **line-by-line with a supportive persona** (the rubber duck). Instead of interrupting your flow with the don-socratic's hard questions, the rubber duck offers **gentle reflection and collaborative thinking**.

**User flow:**
1. Select code in editor
2. Run "Rubber Duck Debugging" command
3. See line-by-line conversation in Output Panel
4. Use keyboard commands: `next` / `deeper` / `previous` / `summary` / `stop`
5. Sessions are stored and reloadable

---

## Current State (Oct 30, 2025)

### ✅ Completed (Steps 1-4)

- **Design phase** — Voice, schema, interaction model decided
- **Architecture** — Clean MVC pattern (Model/Controller/View)
- **Implementation spec** — 4 modules, JSONL storage, content hashing
- **Module stubs** — All 4 files have method signatures + teaching questions
- **Storage layer** — `RubberDuckStorage` fully implemented and tested (16 passing tests)
- **Directory structure** — Organized under `src/rubberDuck/`
- **SessionState model** — Type definitions complete, 1 function implemented, 28 tests written (3 passing, 24 waiting)

### ⏸️ Paused (Steps 5-10)

- StateManager implementation (7 methods to implement)
- Query integration (persona voice hookup)
- Session orchestration (command dispatch, UI flow)
- Extension command integration
- Comprehensive testing
- Manual VSCode testing

---

## What You Need to Know

### Architecture: MVC Pattern

```
SessionState (Model)
  ↓ pure immutable functions
  ↓ no side effects, no VSCode awareness

session (Controller)
  ↓ consumes SessionState API
  ↓ dispatches commands (next/previous/deeper/stop)
  ↓ handles errors, decides UX strategy

UI (View)
  ↓ VSCode Output Channel
  ↓ Input Box + buttons
  ↓ managed by session controller
```

**Key principle:** Model knows nothing about VSCode. Controller knows nothing about UI. View orchestrates both.

### SessionState: The Immutable Core

**Location:** `src/rubberDuck/SessionState.ts`

**Type:**
```typescript
type SessionState = {
  readonly currentLineIndex: number;
  readonly lineHistory: readonly LineEntry[];
  readonly metadata: SessionMetadata;
  readonly contentHash: string;
  // ... others
};
```

**Implemented function:**
```typescript
export function createSessionState(
  filepath: string,
  selectedCode: string,
  language: string
): SessionState
```

**Stubbed functions (READY TO IMPLEMENT):**
```typescript
// Navigation
export function nextLine(state: SessionState): SessionState
export function previousLine(state: SessionState): SessionState
export function jumpToLine(state: SessionState, lineIndex: number): SessionState

// History
export function addEntry(state: SessionState, entry: LineEntry): SessionState
export function hasLineBeenCovered(state: SessionState, lineIndex: number): boolean

// Lifecycle
export function getSummary(state: SessionState): string
export function endSession(state: SessionState, reason: string): SessionState
export function loadHistory(state: SessionState): SessionState
```

**Design principle:** Every function is a **pure function**. Input state → new state. No mutations. No side effects.

### Tests: The Specification

**Location:** `src/rubberDuck/SessionState.test.ts`

**Pattern:**
```typescript
describe('Feature: Rubber Duck Session State', () => {
  describe('Happy Path: Create session', () => {
    it('should initialize with correct metadata', () => { /* ... */ });
    it('should hash content correctly', () => { /* ... */ });
  });

  describe('Navigation: nextLine', () => {
    it('should advance to next line', () => { /* ... */ });
    it('should NOT mutate original state', () => { /* ... */ });
    it('should throw if at end of code', () => { /* ... */ });
  });
});
```

**Each test is an executable specification.** Read the test, understand the requirement, implement the function. The test passes when you've got it right.

---

## How to Finish This Feature

### Step 1: Switch to the Branch
```bash
git checkout feature/rubber-duck-state-ui
npm install  # if needed
```

### Step 2: Run the Tests
```bash
npm test -- src/rubberDuck/SessionState.test.ts
```

**Expected:** 3 passing, 24 failing.

### Step 3: Pick One Failing Test
```typescript
// Example from test file:
it('should advance current line on nextLine()', () => {
  const state = createSessionState(...);
  const next = nextLine(state);

  expect(next.currentLineIndex).toBe(state.currentLineIndex + 1);
  expect(next).not.toBe(state);  // immutability check
});
```

### Step 4: Implement the Function
```typescript
export function nextLine(state: SessionState): SessionState {
  if (state.currentLineIndex >= state.lineHistory.length - 1) {
    throw new Error('Already at last line');
  }

  return {
    ...state,
    currentLineIndex: state.currentLineIndex + 1,
  };
}
```

**Keep the don-socratic questions in the stubs as comments while you work.** They're teaching moments, not distractions.

### Step 5: Watch the Test Pass
```bash
npm test -- src/rubberDuck/SessionState.test.ts --grep "nextLine"
```

### Step 6: Move to the Next Function
Repeat for:
- `previousLine`
- `jumpToLine`
- `addEntry`
- `hasLineBeenCovered`
- `getSummary`
- `endSession`
- `loadHistory`

### Step 7: After All 8 Functions Pass

Run full test suite:
```bash
npm test
npm run typecheck
```

Then move to Step 5 of the flight plan: StateManager implementation.

---

## Design Decisions (Already Made)

### Storage: JSONL (Not JSON)
- **Why:** Append-only, streaming-friendly, handles long interactive sessions
- **Path:** `.rhizome/vscodestate/rubber/[[filename]].rubber.jsonl`
- **Content:** Each line is a JSON object (conversation entry)
- **Error handling:** Throw hard, let caller decide UX

### Line Tracking: Content Hash
- **Why:** Code changes, line numbers shift. Hash survives small edits.
- **Method:** SHA256 of first 80 chars + line number (deterministic)
- **Fallback:** If hash changes significantly, prompt user to refresh

### State Model: Pure Functions
- **Why:** Testable, composable, predictable
- **No classes:** Avoid state mutations
- **No VSCode dependencies:** Keep model pure
- **Error strategy:** Throw errors, let controller handle recovery

### Voice: Gentle Reflection (Not Interrogation)
- **Don-socratic:** Hard questions, precision, evidence-based
- **Rubber duck:** "Tell me what this line does?" / "Have you considered edge cases here?"
- **Tone:** Collaborative, not critical

---

## Common Patterns & Mistakes

### ✅ DO: Return New Objects
```typescript
// Correct: new object with spread
return { ...state, currentLineIndex: newIndex };
```

### ❌ DON'T: Mutate the Input
```typescript
// Wrong: mutates input state
state.currentLineIndex = newIndex;
return state;
```

### ✅ DO: Hard Throw on Error
```typescript
if (lineIndex < 0 || lineIndex >= state.lineHistory.length) {
  throw new Error(`Invalid line index: ${lineIndex}`);
}
```

### ❌ DON'T: Silent Failures
```typescript
// Wrong: returns undefined, crashes later
if (invalid) return;
```

### ✅ DO: Let Tests Guide You
```typescript
// Read the test first, understand what it expects
// Then implement to match the test's expectation
```

---

## Testing Strategy

**3-part pattern:**

1. **Happy Path:** Normal case, expected behavior
2. **Error Paths:** Edge cases, invalid inputs, boundary conditions
3. **Integration:** Multiple functions working together

**Key assertions:**
- State immutability (`next !== state`)
- Correct field updates
- Error conditions throw (not return undefined)
- History tracking is accurate

---

## Architecture Context from Flight Plan

**From the decision log (Oct 30):**

> "SessionState is pure immutable state type + pure functions. No classes, no mutations, composition-based. Hard throw errors, let caller (Session) decide UX. Tests are executable specification before code."

**MVC breakdown:**
- **Model (SessionState):** Knows about lines, history, content hashing. Doesn't know about VSCode or UI.
- **Controller (session):** Knows about SessionState API. Doesn't know about VSCode specifics.
- **View:** Knows about VSCode Output Channel, Input Box, buttons. Orchestrates controller.

---

## Future Work (Post-StateManager)

### Phase 2: Session Orchestration
- Implement `session.ts` (orchestration, command dispatch)
- Hook up persona query (gentle rubber duck voice)
- VSCode UI integration (Output Channel + Input Box)

### Phase 3: VSCode Integration
- Register `vscode-rhizome.rubberDuck` command
- Right-click menu entry
- Output panel UI
- Command button dispatch

### Phase 4: Advanced Features
- Multi-file sessions
- Editor line highlighting (jump to line context)
- Session statistics (lines covered, patterns identified)
- Export sessions as markdown

### Decohere Integration (Future Vision)
- Use `decohereFuzzGenerator` for property-based test data
- Replace hand-written test samples with 100 fuzzed variants
- Cross-link: `ts-decohere/src/decohereFuzzGenerator.ts`
- Mark this as a stub in comments for now

---

## Questions to Ask Yourself

As you implement, ask the don-socratic questions that are still in the stubs:

- **For navigation:** "What happens if user jumps beyond end of code? Should we clamp or throw?"
- **For history:** "Is a simple array the right structure? What queries will we need later?"
- **For error handling:** "When should we throw vs. return a default? Who's the caller?"
- **For state:** "Is immutability clear in the function signature? Could someone accidentally mutate?"

Keep these questions. They're better than perfect code that nobody understands.

---

## Links

- **Flight Plan:** `rhizome flight show fp-1761820189`
- **Architecture Decision:** `.rhizome/actions.ndjson` (lines about rubber-duck-architecture)
- **Storage Implementation:** `src/rubberDuck/storage.ts` (fully implemented, reference pattern)
- **Test Library:** `src/test-utils.ts` (reusable testing helpers)
- **Decohere Integration Point:** `src/rubberDuck/SessionState.ts:TODO decohereFuzzGenerator`

---

## Quick Git Commands

```bash
# Switch to feature branch
git checkout feature/rubber-duck-state-ui

# See all rubber duck files
find src/rubberDuck -type f

# Run rubber duck tests only
npm test -- src/rubberDuck/SessionState.test.ts

# See what changed since main
git diff main...feature/rubber-duck-state-ui

# When done, merge back to main
git checkout main
git merge feature/rubber-duck-state-ui
```

---

## Getting Help

If you get stuck:

1. **Read the test** — It's the specification
2. **Look at storage.ts** — It's a fully-worked example of the same pattern
3. **Check the don-socratic questions** in the stubs — They're hints
4. **Ask a persona:**
   ```bash
   rhizome query --persona dev-guide "I'm stuck on nextLine(). What should I think about?"
   ```

---

**Made with intention for future developers. Finish this feature with care.** 🦆

