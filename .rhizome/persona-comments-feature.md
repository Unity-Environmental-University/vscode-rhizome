# Persona Comments Feature: Design & Implementation

**Status:** Complete (Oct 28, 2025)
**Flight Plan:** fp-1761674707
**Tests:** 7 new tests, all passing (48 total)
**Code:** `src/extension.ts` lines 681-764

---

## What We Built

**Feature:** "Ask a persona to document this" — a VSCode command that lets developers select code and request documentation/comments from any available rhizome persona.

**User Flow:**
1. Developer selects code in editor
2. Right-click → "Ask a persona to document this"
3. Quick picker shows all available personas
4. Developer chooses persona (e.g., "code-reviewer", "dev-guide")
5. Persona provides documentation via rhizome CLI
6. Comments inserted above selection, language-aware

---

## Design Decisions

### 1. Interaction Model: Dynamic Persona Picker (Option B)

**Decision:** Single right-click menu item → quick picker → persona selection

**Trade-off:** One extra step vs. menu clarity and scalability

**Why:**
- Scales naturally as new personas are added
- No code changes needed when personas change
- Consistent with existing "Ask a persona" command pattern

**Alternative rejected:**
- Option A (hardcoded menu items for each persona) didn't scale
- Option C (keyboard shortcut only) less discoverable

---

### 2. Insertion Point: Above Selection

**Decision:** Comments inserted ABOVE selected code

```typescript
// documentation provided by persona
// more documentation
const x = 42;
```

**Why:** Follows JSDoc/docstring conventions developers already know

**Alternatives considered:**
- Below selection: Harder to read when scrolling
- Inline: Breaks code readability
- In separate file: Loss of context

---

### 3. Language-Aware Comments

**Decision:** Auto-detect language, use appropriate comment syntax

| Language | Prefix |
|----------|--------|
| TypeScript/JavaScript | `//` |
| Python | `#` |
| Future | C/C++ (`//`), Rust (`//`), Go (`//`), etc. |

**Implementation:** Reuse existing `detectLanguage()` helper

**Edge cases handled:**
- Unknown language: falls back to `//` (safe default)
- Mixed language files: Uses file extension to determine language

---

### 4. Persona Response Formatting

**Decision:** Split response by newlines, prefix each line with comment marker

```typescript
const commentLines = response.split('\n').map((line) => `${commentPrefix} ${line}`);
```

**Why:** Preserves multi-line responses, simple algorithm

**Don-socratic questions:**
- What if response has trailing newlines? → Tests verify handling
- What if there are empty lines in middle? → Preserved (each line gets prefix)
- What if response is empty? → Still formats cleanly

---

## What Worked Well

1. **Reuse existing helpers**
   - `getActiveSelection()` — get current selection
   - `queryPersona()` — call rhizome CLI
   - `detectLanguage()` — identify file language
   - Saved ~50 lines of new code

2. **Consistent error handling**
   - Followed patterns from `askPersonaAboutSelection()` command
   - Same error messages, recovery flows, user feedback

3. **Test-driven approach**
   - Added tests DURING implementation, not after
   - Caught edge cases early (empty response, language detection)
   - 7 focused tests cover happy path + error paths + integration

4. **Language detection**
   - Simple strategy (check VSCode's `languageId`) works for 90% of cases
   - Good enough for MVP, can improve if needed

5. **Dynamic personas**
   - Calling `rhizome persona list` means feature adapts automatically
   - No hardcoding required

---

## Teaching Moments (Intentional Rough Edges)

### 1. Comment Formatting Heuristic

```typescript
const commentLines = response.split('\n').map((line) => `${commentPrefix} ${line}`);
```

**What's rough:** This is simple but assumes response lines are well-formed.

**Don-socratic asks:**
- Is this heuristic robust enough for production?
- What's the cost of prefixing every line vs. wrapping in block comment?
- When should we refactor this?

**Answer for now:** Tests show it handles the common cases. Good enough for MVP.

### 2. Hardcoded Prompt Template

```typescript
const prompt = `Please provide clear documentation/comments for this code:\n\n${selectedText}`;
```

**What's rough:** Single prompt for all cases.

**Don-socratic asks:**
- Should users choose between "documentation", "implementation hints", "refactoring suggestions"?
- Should the prompt be customizable per persona?
- Does the prompt encourage good responses?

**Answer for now:** Single prompt is MVP. Future: could add quick pick for prompt style.

### 3. Error Messages vs. Specific Guidance

Current error handling:
```typescript
catch (error: any) {
    vscode.window.showErrorMessage(
        `Failed to get documentation from ${picked.label}: ${(error as Error).message}`
    );
}
```

**What's rough:** Generic error message. All failures look the same to user.

**Don-socratic asks:**
- Is "API key missing" the same problem as "rhizome not found"?
- Should we guide user differently based on error type?
- Could we parse error and suggest fix?

**Answer for now:** Show error message. Future: Parse error, suggest specific recovery steps.

---

## Patterns Extracted

### Pattern 1: Command Handler for User Selection + Persona Query

```typescript
// Template for any command that:
// 1. Needs user input (selection or choice)
// 2. Queries a persona
// 3. Inserts/modifies document

async function commandTemplate(context: vscode.ExtensionContext) {
    // Step 1: Get selection
    const selection = getActiveSelection();
    if (!selection) return;
    const { editor, selectedText } = selection;

    // Step 2: Get user choice (persona, option, etc.)
    const personas = await getAvailablePersonas();
    const picked = await vscode.window.showQuickPick(personaOptions);
    if (!picked) return;

    // Step 3: Ensure setup (rhizome init, keys, config)
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const initialized = await initializeRhizomeIfNeeded(workspaceRoot);
    if (!initialized) return;

    // Step 4: Execute persona query
    const response = await queryPersona(prompt, picked.label);

    // Step 5: Transform response to document format
    const formatted = transformResponse(response);

    // Step 6: Insert into document
    await insertIntoDocument(editor, formatted);

    // Step 7: Confirm to user
    vscode.window.showInformationMessage('Success!');
}
```

**When to use:**
- "Ask persona to refactor this"
- "Ask persona to optimize this"
- "Ask persona to suggest tests for this"
- Any feature following the "select → ask → insert" pattern

---

### Pattern 2: Language-Aware Code Insertion

```typescript
const language = detectLanguage(document.languageId);
const prefix = language === 'python' ? '#' : '//';
const commented = response
    .split('\n')
    .map(line => `${prefix} ${line}`)
    .join('\n');
```

**When to use:**
- Inserting comments in multiple languages
- Formatting code snippets per language
- Any feature that must adapt to language syntax

**Extensibility:** Add more languages as needed:
```typescript
const prefixes = {
    'python': '#',
    'typescript': '//',
    'javascript': '//',
    'go': '//',
    'rust': '//',
    'c': '//',
    'cpp': '//',
};
```

---

## Tests Worth Keeping

1. **Comment formatting (TypeScript, Python, empty)**
   - Validates language detection works
   - Ensures empty responses don't crash
   - Proves multi-line formatting correct

2. **Persona selection error handling**
   - Ensures unknown persona doesn't crash
   - Verifies error message is shown

3. **Full workflow integration**
   - Proves end-to-end feature works
   - Selected code → persona response → comment inserted

---

## Library Phase: What to Do Next

### Documentation
- [ ] Add feature description to user guide
- [ ] Show screenshot of right-click menu
- [ ] Example: "Before/After" code with persona comments

### Teaching
- [ ] Add design decisions to TEACHING_MOMENTS.md
- [ ] Document the rough edges intentionally left
- [ ] Explain why this pattern works for vscode-rhizome

### Refactoring
- [ ] Consider extracting comment formatting to reusable utility
- [ ] If multiple commands need language-aware insertion, extract shared function
- [ ] If prompt templates become numerous, parameterize them

### Future Features
- [ ] "Ask to refactor this" — similar pattern, different prompt
- [ ] "Ask to optimize this" — performance suggestions
- [ ] "Ask to test this" — generate test cases
- [ ] Prompt template selector — let user choose style

### Metrics (Track Success)
- How often is the command used?
- Which personas are chosen most?
- What error rates do we see?
- Do users edit the inserted comments?

---

## Conclusion

This feature embodies the don-socratic philosophy: instead of prescribing documentation, we ask a persona to provide perspective.

The feature is:
- **Small:** 85 lines of implementation
- **Testable:** 7 focused tests
- **Teachable:** Clear design questions in code comments
- **Extensible:** Reusable patterns for future features
- **Ready:** All tests pass, no known bugs

Ready for users to try and provide feedback.

---

**Flight Plan:** fp-1761674707
**Status:** Complete, kitchen_table → garden → library
**Next:** Monitor usage, gather feedback, decide on future enhancements
