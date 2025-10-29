# vscode-rhizome Test Plan

## Current Session: Comment Syntax Formatting

**Goal**: Verify that persona feedback is formatted with the correct comment syntax for each file type.

**Latest Changes**:
- Updated selection-based review prompt to show examples with `${commentPrefix}` (// or #)
- Updated file-level review prompt similarly
- Built extension successfully
- All tests passing (113 pass, 1 pre-existing failure, 1 pending)

---

## Manual Test Flow

### Setup
1. Open the extension (F5 debug)
2. Open test-workspace in VSCode (it auto-opens in debug mode)
3. Both `test.ts` and `test.py` are available for testing

---

## Test 1: Selection-Based Review (TypeScript)

**File**: `test-workspace/test.ts`

**Steps**:
1. Select lines 11-14 (the `greet` function):
   ```typescript
   export function greet(name: string): string {
       // What should this do?
       throw new Error('Not implemented');
   }
   ```

2. Right-click → "Red Pen Review (don-socratic)"

3. Wait for response (progress dialog shows "Analyzing code...")

4. Dialog appears: "Found N suggested comments. Insert them?"
   - Options: "Show Preview", "Insert All", "Cancel"

**Expected Behavior**:

✅ **Comments use // syntax** (TypeScript/JavaScript standard)
- Example: `// Line 12: Missing implementation. What should greet() actually return?`
- NOT: `# Line 12: ...` (Python syntax would be wrong here)

✅ **Line numbers are accurate**
- Should reference lines 11-14 range
- Comments should appear above the selected lines in the preview

✅ **Preview shows formatted insertions**
- Each comment prefixed with // and red circle emoji: `// 🔴 Line X: ...`
- Context code snippet shown
- Line numbers displayed: [1] Line 12, [2] Line 13, etc.

✅ **Insertion is interlinear, not accumulated**
- Comments inserted at specific line numbers
- No line number drift as each comment is applied
- Comments appear above the relevant code

**Approval Flow**:
- Click "Show Preview" → See proposed comments in separate doc
- Click "Insert All" → Comments injected into file
- Click "Cancel" → Discard suggestions

---

## Test 2: Selection-Based Review (Python)

**File**: `test-workspace/test.py`

**Steps**:
1. Select lines 10-15 (the `greet` function):
   ```python
   def greet(name: str) -> str:
       """
       What should this function do?
       What does a greeting mean?
       """
       raise NotImplementedError("greet")
   ```

2. Right-click → "Red Pen Review (don-socratic)"

3. Wait for response

4. Approve insertion

**Expected Behavior**:

✅ **Comments use # syntax** (Python standard)
- Example: `# Line 11: Missing implementation. What should this return?`
- NOT: `// Line 11: ...` (TypeScript syntax would be wrong here)

✅ **Docstring handling**
- Should recognize Python docstrings and still provide feedback
- Comments about docstring placement: "Consider adding type hints to docstring"

---

## Test 3: File-Level Review

**File**: `test-workspace/test.ts`

**Steps**:
1. Right-click on `test.ts` in Explorer panel
2. "Red Pen Review (entire file)"
3. Wait for analysis (progress shows "Analyzing entire file...")
4. Approve insertion

**Expected Behavior**:

✅ **Reviews entire file structure**
- Comments about organization, imports, exports
- Identifies patterns across all functions
- Suggests improvements for consistency

✅ **Correct comment syntax for .ts files**
- All comments use // syntax
- Line numbers reference actual file lines

✅ **Multiple issues handled**
- Several comments inserted at different line numbers
- No drift, all line numbers accurate after insertion

---

## Test 4: Ask Any Persona

**File**: `test-workspace/test.py`

**Steps**:
1. Select lines 27-33 (the `calculate_total` function)
2. Right-click → "Ask a persona"
3. Choose persona from dropdown (e.g., "dev-guide", "code-reviewer", "don-socratic")
4. Enter question: "What are the main responsibilities of this function?"
5. Wait for response

**Expected Behavior**:

✅ **Dynamic persona picker**
- Shows all available personas from rhizome
- Current selection: don-socratic, dev-guide, code-reviewer, ux-advocate, dev-advocate

✅ **Comment inserted above selection**
- Uses language-appropriate syntax (# for Python)
- Format: `# === [persona name] says:` header
- Each response line becomes `# [response line]`

✅ **Response quality**
- Persona responds in their voice (socratic questions for dev-guide)
- Acknowledges the selected code

---

## Debugging Checklist

If something isn't working:

### Build issues?
```bash
npm run esbuild          # Rebuild
npm run typecheck        # Check types
npm test                 # Verify tests still pass
```

### Extension not loading?
- Check VSCode debug console (F5 opens debug window)
- Look for `[vscode-rhizome] ACTIVATION START` message
- Check for errors in the Debug Console panel

### Comments not appearing?
1. Check persona response format in Debug Console
2. Verify line numbers are being parsed correctly
3. Check if preview dialog appeared (Show Preview to see suggestions)

### Wrong comment syntax?
1. Verify detectLanguage() returns correct language ID
   - TypeScript files: `typescript` or `typescriptreact`
   - Python files: `python`
2. Check commentPrefix calculation in redPenReviewCommand()
   - Should be `//` for TypeScript
   - Should be `#` for Python
3. Check personaCommands.ts prompts include `${commentPrefix}` in examples

### Line number drift?
1. Check parseCommentInsertion() is finding line numbers
2. Verify insertions are sorted in reverse order: `[...insertions].sort((a, b) => b.lineNumber - a.lineNumber)`
3. Check edits are applied correctly with TextEdit positions

---

## Success Criteria

✅ **All three commands work**:
- askPersona: Select code → choose persona → comment inserted above
- redPenReview: Select code → don-socratic review → interlinear comments
- redPenReviewFile: Right-click file → don-socratic review → interlinear comments

✅ **Comment syntax is correct**
- TypeScript/JavaScript files use `//`
- Python files use `#`
- Examples in prompts show correct syntax

✅ **Comments are accurately placed**
- Line numbers parsed from response
- No drift as comments are inserted
- Inserted top-to-bottom (reverse order)

✅ **Preview and approval flow works**
- User can "Show Preview" to see suggestions
- User can "Insert All" to apply
- User can "Cancel" to discard

✅ **Extension stability**
- No errors in debug console
- Tests still passing (113+)
- TypeScript compiles cleanly

---

## Next Steps After Manual Testing

1. **If successful**:
   - Create a commit documenting the test results
   - Mark the feature as production-ready
   - Document any UX improvements discovered

2. **If issues found**:
   - Debug using checklist above
   - Fix in code
   - Re-run tests
   - Repeat manual test

3. **Future improvements**:
   - Support custom personas
   - Batch review multiple selections
   - Configurable insertion position (above vs. below)
   - Undo support for inserted comments
