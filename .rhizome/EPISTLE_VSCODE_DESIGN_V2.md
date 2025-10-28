# Design: Epistle Integration for vscode-rhizome (v2)

**Flight Plan:** fp-epistle-vscode-integration
**Date:** Oct 28, 2025
**Status:** Kitchen Table Phase (Design)
**Version:** 2 — With Inline Epistles & Dynamic Personas

## Overview: Three Epistle Formats

vscode-rhizome now supports **three ways to record epistles** (multi-persona dialogs about code decisions):

| Format | Where | When | Example |
|--------|-------|------|---------|
| **Letter** | File: `.rhizome/plugins/epistles/` | Design decisions, architecture questions | "Why do we handle errors this way?" |
| **Inline** | Comment block in source file | Quick team discussion, local context | `// dev-guide: This function needs clarity` |
| **Dynamic** | Synthesized from source file | File advocacy, code review from file's perspective | `parser.ts-advocate: "Grammar clarity matters here"` |

---

## What Are Epistles? (Quick Recap)

**Epistles** are **letters between personas** — recorded dialogs where:
- Persona A asks a question or proposes something
- Persona B responds, challenges, or builds on it
- Full context is included (linked docs, code, flight plans)
- Result: Audit trail of design reasoning + teaching tool

**Key insight:** Epistles capture *why* we made decisions, not just *what* we did.

---

## The Three Epistle Formats

### Format 1: Letter Epistles (File-Based)

**What they are:** Markdown files stored in `.rhizome/plugins/epistles/` containing a recorded multi-persona dialog.

**When to use:**
- Documenting architecture decisions
- Recording design reviews
- Creating teaching moments for team
- Linking to flight plans
- Formal audit trail

**Example file:** `epistle-001-error-handling-strategy.md`

```markdown
# Epistle: dev-guide ↔ code-reviewer

**Date**: 2025-10-28
**Topic**: Error handling strategy for API calls
**Code context**: src/extension.ts:145-214 (checkApiKeyAvailable)
**Linked flight plan**: fp-1761682847
**Status**: resolved

## Dialog

**dev-guide:**
Why do we catch all exceptions in checkApiKeyAvailable() instead of letting them bubble up?

**code-reviewer:**
Good question. Let me think about the edge cases:
1. Environment variable doesn't exist → want graceful fallback
2. Config file is malformed JSON → want to log, not crash
3. CLI command times out → want timeout, not hang

Should we let these bubble or handle them?

**dev-guide:**
I see. So we're trading "fail fast" for "fail gracefully". What's the confidence level?

**code-reviewer:**
High (0.9) for environment variables and file parsing. Medium (0.6) for CLI timeouts—might need retry logic later.

**dev-guide:**
Perfect. This shows the trade-off clearly. Future maintainers will understand why we chose this approach.
```

**Structure:**
- Metadata header (date, topic, code context, linked flight plan, status)
- Dialog section with persona names in bold
- Back-and-forth exchange

**Registry entry:**
```json
{"id": "epistle-001", "date": "2025-10-28", "type": "letter", "personas": ["dev-guide", "code-reviewer"], "topic": "Error handling", "file": "extension.ts", "status": "resolved", "flight_plan": "fp-1761682847"}
```

---

### Format 2: Inline Epistles (Comment-Embedded)

**What they are:** Multi-persona comment blocks embedded directly in source code, showing a dialog about that specific code.

**When to use:**
- Quick team discussion (without leaving editor)
- Local context reasoning ("Why is this here?")
- Code review comments
- Teaching moments within functions
- Lightweight documentation

**Example in code:**

```typescript
// src/extension.ts (lines 145-150)

function checkApiKeyAvailable(): boolean {
  // EPISTLE: Why we don't throw on missing API key
  // dev-guide: This function returns boolean instead of throwing. Why?
  // code-reviewer: Because callers need to decide: fail fast or offer fallback UI?
  // dev-guide: Got it. So the responsibility shifts to the caller.

  try {
    const envKey = process.env.OPENAI_API_KEY;
    if (!envKey) {
      console.log('No API key in environment; checking config...');
      return false;
    }
    return true;
  } catch (e) {
    console.error('Error checking API key:', e);
    return false;
  }
}
```

**Format rules:**
- Comment syntax matches language (`//` for JS/TS, `#` for Python, etc.)
- Persona name prefixed: `// [persona-name]:`
- Can be single exchange or multi-turn
- Marked with `EPISTLE:` header to distinguish from regular comments

**Registry entry:**
```json
{"id": "inline-epistle-001", "date": "2025-10-28", "type": "inline", "personas": ["dev-guide", "code-reviewer"], "file": "src/extension.ts", "lines": "148-151", "topic": "API key handling"}
```

**Advantages:**
- No extra file navigation
- Context right where the code is
- Lightweight (comments don't affect compilation)
- Good for teaching within functions

**Trade-offs:**
- Gets buried as code evolves (but discoverable via sidebar)
- Less formal than letter epistles
- Not linked to flight plans (optional future feature)

---

### Format 3: Dynamic Personas from Source Files

**What they are:** Synthesized personas that represent a source file's "voice"—its architectural philosophy, coding patterns, concerns, and design principles.

**When to use:**
- Code review: "What would this file say about the changes?"
- Architecture discussion: "Does this align with the parser's philosophy?"
- File advocacy: "Who speaks for this module?"
- Teaching: "What patterns does this file care about?"

**The Process:**

```
1. User selects a source file (e.g., src/parser.ts)
2. Extension analyzes:
   - Imports (what dependencies does it use?)
   - Error handling patterns (how does it fail?)
   - Type safety (strict or lenient?)
   - Naming conventions (semantic or brief?)
   - Code structure (monolithic or modular?)
3. Extension sends analysis to rhizome CLI:
   "Synthesize a persona that represents this file"
4. Rhizome generates persona with:
   - Name: parser-advocate (file name + suffix)
   - Philosophy: "I care about grammar clarity, edge cases, error recovery"
   - Concerns: "Tokenization correctness, input validation, recovery strategies"
5. Persona cached and available in persona picker
```

**Example dynamic persona:**

```yaml
# Generated for: src/parser.ts

name: parser-advocate
philosophy: |
  I represent the concerns of the parser module.
  I care deeply about:
  - Grammar correctness and edge case handling
  - Clear error messages for invalid input
  - Recovery strategies when parsing fails
  - Type safety (no implicit coercions)
  - Explicit contracts (what is valid input?)

concerns:
  - Tokenization correctness
  - Infinite loop prevention
  - Null/undefined safety
  - Error message clarity
  - Performance for large inputs

When code touches the parser, ask:
- Does this maintain grammar invariants?
- How does this handle malformed input?
- What error message does the user see?
```

**Using the dynamic persona in an epistle:**

```typescript
// In inline epistle:
// parser-advocate: This change adds a new token type. Will our grammar still be deterministic?
// dev-guide: Good question. Let me think about the grammar rules...

// Or in a letter epistle:
// File analysis: src/parser.ts
// Dynamic persona: parser-advocate
// Question: Does this refactor maintain the grammar invariants we care about?
```

**Registry entry:**
```json
{"id": "persona-parser-advocate", "type": "dynamic_persona", "source_file": "src/parser.ts", "name": "parser-advocate", "created_at": "2025-10-28", "cached": true}
```

**Implementation approach:**

```typescript
// Analyze a source file
async function analyzeSourceFile(filepath: string): Promise<FileAnalysis> {
  const content = readFileSync(filepath, 'utf-8');

  return {
    imports: extractImports(content),              // What does it depend on?
    errorPatterns: findErrorHandling(content),     // How does it fail?
    typeSafety: analyzeTypeAnnotations(content),   // Strict or lenient?
    namingPatterns: extractNamingConventions(content), // Semantic names?
    structure: analyzeCodeStructure(content),      // Monolithic or modular?
    keyFunctions: findMainFunctions(content),      // What's the API?
  };
}

// Send analysis to rhizome to synthesize persona
async function synthesizePersonaFromFile(filepath: string): Promise<Persona> {
  const analysis = await analyzeSourceFile(filepath);

  const prompt = `
    Analyze this source file and generate a persona that represents its perspective:

    File: ${filepath}
    Analysis: ${JSON.stringify(analysis, null, 2)}

    Create a persona with:
    - Name: [filename]-advocate
    - Philosophy: What does this file care about?
    - Concerns: What patterns should be preserved?
    - Questions: What should code ask when touching this file?
  `;

  const persona = await execSync(`rhizome persona synthesize --context '${prompt}'`);

  // Cache the persona
  cachePersona(persona);

  return persona;
}
```

**Advantages:**
- Captures file's "voice" automatically
- Great for architecture discussions
- Personifies modules (teaching tool)
- Prevents important concerns from being overlooked

**Trade-offs:**
- Synthesis might miss subtle concerns
- Temporary (could be regenerated if file changes)
- Requires rhizome CLI installed
- Names could be confusing if many files analyzed

---

## User Workflows

### Workflow 1: Recording a Letter Epistle

```
Scenario: Designing error handling strategy

1. Select the error handling code block
2. Right-click → "Record epistle..." → "Letter epistle"
3. Dialog: "Which personas should discuss this?"
   - Picker shows: don-socratic, dev-guide, code-reviewer, + All Personas
4. Choose: dev-guide, code-reviewer
5. Dialog: "What's the topic?"
   - Input: "Error handling strategy for API calls"
6. Dialog: "Link to flight plan?"
   - Shows active flight plan (fp-1761682847)
   - Select it
7. Extension generates template and opens in editor:
   ```
   # Epistle: dev-guide ↔ code-reviewer
   **Date**: 2025-10-28
   **Topic**: Error handling strategy for API calls
   **Code context**: src/extension.ts:145-214
   **Linked flight plan**: fp-1761682847
   **Status**: draft

   ## Dialog
   **dev-guide:**
   [user fills in question]

   **code-reviewer:**
   [user fills in or uses persona query to auto-populate]
   ```
8. User fills in dialog manually or:
   - Clicks "Query dev-guide" button → auto-populates response
   - Clicks "Query code-reviewer" button → auto-populates response
9. User saves file
10. Extension updates registry
11. Epistle appears in sidebar registry

Result: Design reasoning is documented and discoverable.
```

**Time investment:** 5-10 minutes
**Value:** Audit trail, team learning, future reference

---

### Workflow 2: Creating an Inline Epistle

```
Scenario: Quick team discussion about a function's design

1. Select the function or code snippet
2. Right-click → "Record epistle..." → "Inline epistle"
3. Dialog: "Which personas should discuss this?"
   - Pick: dev-guide (quick picker)
4. Dialog: "What's the header?"
   - Input: "Why doesn't this function throw?"
5. Extension generates comment block above selection:
   ```typescript
   // EPISTLE: Why doesn't this function throw?
   // dev-guide: This returns boolean instead of throwing. Why the design choice?
   // code-reviewer: [waiting for response...]

   function checkApiKeyAvailable(): boolean {
     // ... actual code ...
   }
   ```
6. User fills in the dialog (or uses persona queries)
7. User saves file
8. Extension registers the inline epistle (tracks file + line numbers)
9. Epistle appears in sidebar, filterable as "inline"

Result: Local context reasoning, no extra files, discoverable.
```

**Time investment:** 2-5 minutes
**Value:** Quick documentation, teaching moments in context

---

### Workflow 3: Code Review Using Dynamic Personas

```
Scenario: Reviewing a change to src/parser.ts

1. Make changes to parser.ts
2. Right-click → "Code review from file's perspective"
3. Extension:
   - Analyzes parser.ts
   - Checks if parser-advocate persona exists (cached)
   - If not, synthesizes it
4. Opens dialog:
   "Ask parser-advocate about your changes to parser.ts"
5. Pre-fills context:
   - File: parser.ts
   - Changes: git diff
   - Persona: parser-advocate
6. User can:
   - Ask a question: "Does this maintain our grammar invariants?"
   - See persona's response
   - Record as inline or letter epistle
7. Result: Code changes reviewed through the file's perspective

Result: Ensures changes align with file's philosophy.
```

**Time investment:** 2-5 minutes
**Value:** Architecture alignment, prevents surprises

---

### Workflow 4: Persona Advocacy for Extension Files

```
Scenario: Refactoring src/extension.ts with dev-guide as advocate

1. (Implicit) dev-guide advocates for src/extension.ts
   - File header shows:
     ```typescript
     // PERSONA ADVOCATE: dev-guide
     // Mission: Ensure extension code is clear, intentional, teaching-focused
     // Last synced: 2025-10-28
     ```

2. Refactor extension.ts (e.g., extracting utility functions)

3. Right-click → "Generate advocate epistle"

4. Extension:
   - Diffs the file against previous version
   - Generates epistle template:
     ```markdown
     # Epistle: dev-guide advocates for extension.ts

     **Advocated by**: dev-guide
     **File**: src/extension.ts
     **Changes**: [extracted 3 functions, renamed 1, updated 2 comments]

     ## Advocate's Observations

     **dev-guide:**
     I notice you've extracted queryPersona, formatPersonaOutput, and detectLanguage into helpers.
     This improves clarity. Have you considered:
     - Are the helper names semantic?
     - Do they hide complexity or expose it clearly?
     - Is the extracted code testable?
     ```

5. User fills in responses
6. Epistle saved, linked to flight plan, appears in registry

Result: Refactoring rationale documented with file's advocate.
```

---

## Integration Points

### 1. Right-Click Context Menu

**New top-level entry:** "Record epistle..."
- Submenu options:
  - Letter epistle (file-based)
  - Inline epistle (comment-embedded)
  - Dynamic persona (file analysis)

```typescript
const menu = vscode.commands.registerCommand('vscode-rhizome.recordEpistle', async () => {
  const selected = await vscode.window.showQuickPick([
    { label: 'Letter epistle', description: 'File in .rhizome/plugins/epistles/' },
    { label: 'Inline epistle', description: 'Comment block in this file' },
    { label: 'Dynamic persona', description: 'Synthesize from source file' },
  ]);

  if (selected.label === 'Letter epistle') {
    recordLetterEpistle();
  } else if (selected.label === 'Inline epistle') {
    recordInlineEpistle();
  } else if (selected.label === 'Dynamic persona') {
    synthesizeAndUsePersona();
  }
});
```

### 2. Epistle Registry Sidebar

**New view:** "Epistles" (in Explorer or custom panel)

Shows:
- Count: "Epistles (15)"
- Grouped by type:
  - Letters (10)
  - Inline (4)
  - Dynamic personas (1)
- Sortable by: date, persona, topic, status
- Searchable by keywords
- Click to open file/view

```
📄 Epistles (15)

📋 Letters (10)
├── 2025-10-28 dev-guide ↔ code-reviewer — Error handling
├── 2025-10-28 don-socratic ↔ dev-advocate — Telemetry logging
└── ...

💬 Inline (4)
├── extension.ts:148 — API key handling
├── stubGenerator.ts:85 — AST vs regex fallback
└── ...

🤖 Dynamic Personas (1)
├── parser-advocate (src/parser.ts)
```

### 3. Inline Epistle Comment Insertion

**Feature:** Smart comment insertion with language awareness

```typescript
function insertInlineEpistle(selection: vscode.Selection, personas: string[], header: string) {
  const lang = detectLanguage(activeEditor.document.languageId);
  const commentChar = {
    typescript: '//',
    python: '#',
    java: '//',
    // ...
  }[lang];

  const epistle = personas.map(p => `${commentChar} ${p}: [response]`).join('\n');
  const comment = `${commentChar} EPISTLE: ${header}\n${epistle}`;

  activeEditor.edit(edit => {
    edit.insert(selection.start, comment + '\n');
  });
}
```

### 4. Dynamic Persona Synthesis

**Feature:** Analyze file, synthesize persona via rhizome CLI

```typescript
async function synthesizePersonaFromFile(filepath: string) {
  const analysis = await analyzeSourceFile(filepath);
  const persona = await queryRhizomeForPersona(analysis);

  // Cache locally
  cachePersona(persona);

  // Add to persona picker
  return persona;
}
```

### 5. Registry Management

**Registry file:** `.rhizome/plugins/epistles/registry.ndjson`

Each line is a JSON object:
```json
{"type": "letter", "id": "epistle-001", "date": "2025-10-28", "personas": ["dev-guide", "code-reviewer"], "topic": "Error handling", "status": "resolved"}
{"type": "inline", "id": "inline-001", "file": "extension.ts", "lines": "148-151", "personas": ["dev-guide"], "topic": "API key handling"}
{"type": "dynamic_persona", "id": "parser-advocate", "source_file": "src/parser.ts", "name": "parser-advocate", "created_at": "2025-10-28"}
```

---

## Architecture Decisions

### Storage Locations

| Epistle Type | Storage | Notes |
|--------------|---------|-------|
| **Letter** | `.rhizome/plugins/epistles/epistle-NNN.md` | Shared with rhizome CLI |
| **Inline** | Embedded in source file as comments | No separate storage |
| **Dynamic Persona** | Cached in extension state / `.rhizome/personas.d/dynamic/` | Temporary or persistent cache |

### Registry Format

```
.rhizome/plugins/epistles/registry.ndjson
```

One JSON object per line. Schema:
```typescript
interface RegistryEntry {
  type: 'letter' | 'inline' | 'dynamic_persona';
  id: string;
  date: string;
  personas: string[];

  // Letter-specific
  topic?: string;
  status?: 'draft' | 'resolved' | 'archived';
  flight_plan?: string;

  // Inline-specific
  file?: string;
  lines?: string; // "148-151"

  // Dynamic persona-specific
  source_file?: string;
  name?: string;
  created_at?: string;
}
```

### CLI Integration

**When rhizome is installed:**
- Letter epistles use `rhizome epistle new` command
- Dynamic personas use `rhizome persona synthesize` command

**Fallback (when rhizome not available):**
- Generate files directly
- Update registry manually

```typescript
async function recordLetterEpistle(context: EpisodContext) {
  try {
    // Try rhizome CLI
    await execSync(`rhizome epistle new --with "${personas}" --topic "${topic}" ...`);
  } catch {
    // Fallback: generate directly
    const epistle = generateLetterEpistle(context);
    writeFile(epistlePath, epistle.content);
    updateRegistry(epistle.metadata);
  }
}
```

### Persona Selection in Pickers

**Curated default list:**
- don-socratic
- dev-guide
- code-reviewer
- dev-advocate

**Special options:**
- "All Personas..." → autocomplete to full list
- "Create from file..." → synthesize dynamic persona
- "Recent Personas" → frequently used ones

---

## Implementation Roadmap

### Step 1: Research & Design ✓ (DONE)
- Understand epistles
- Design three formats
- Finalize architecture decisions

### Step 2: Scaffold Epistle Plugin Directory
- Create `.rhizome/plugins/epistles/` (if not exists)
- Create empty registry.ndjson
- Wire up registry helpers (load, update, query)
- Prepare for CLI integration tests

### Step 3: Feature - Letter Epistle Right-Click Command
- Add "Record epistle..." menu item
- Dialog: choose personas, topic, flight plan
- Generate letter template
- Open in editor
- Register in registry

### Step 3b: Feature - Inline Epistle Insertion
- Add "Inline epistle" submenu option
- Dialog: choose personas, header
- Generate comment block (language-aware)
- Insert above selection
- Register in registry

### Step 3c: Feature - Dynamic Persona Synthesis
- Add file analysis function (imports, error patterns, naming)
- Implement rhizome persona synthesis call
- Cache personals locally
- Add "Create from file..." picker option
- Use in epistles and code review

### Step 4: Feature - Epistle Registry Sidebar
- Create tree view provider
- Load epistles from registry
- Display grouped by type
- Implement search/filter
- Click to open epistle

### Step 5: Feature - Flight Plan Linking
- When recording letter epistle, show active flight plan
- Store flight_plan field in registry
- When viewing flight plan, show related epistles
- Create back-links

### Step 6: Integration - Persona Advocates for Files
- Add file header comments with advocate info
- Implement "Generate advocate epistle" command
- Track file hash to detect changes
- Show advocate menu for marked files

### Step 7: Test - End-to-End Workflows
- Test all three epistle creation paths
- Test registry updates
- Test sidebar view
- Test persona synthesis
- Test flight plan linking

### Step 8: Document - User Guide
- When to use letter vs. inline vs. dynamic
- How to record epistles
- How to search and filter
- Teaching moments about epistles

---

## Key Design Questions (Don-Socratic)

**Q1: When should developers use letter epistles vs. inline epistles?**

*A:* Use **letter epistles** for formal design decisions, architecture reviews, and audit trails (something worth finding later). Use **inline epistles** for quick team discussion and local context reasoning (something helpful while reading the code).

**Q2: How do we prevent inline epistle comment clutter?**

*A:* They're optional. Guide developers: "Use inline epistles sparingly—when the dialog adds clarity, not noise." Over time, refactor inline epistles into letter epistles if they become important.

**Q3: What if dynamic persona synthesis is inaccurate?**

*A:* It's a starting point. Users refine the persona before using it. The synthesis captures style + patterns; the developer adds nuance. Think of it as "skeleton persona that understands the code."

**Q4: How do we track dynamic personas—temporary or persistent?**

*A:* Start with **cache** (ephemeral, regenerated as needed). If a file changes, re-synthesize. Future: Could make persistent if useful.

**Q5: Should inline epistles auto-update when code changes?**

*A:* No. Keep them static. If the dialog becomes stale, either:
- Delete the epistole
- Update it manually
- Refactor it into a letter epistle (more formal)

**Q6: How do dynamic personas differ from static personas like dev-guide?**

*A:* **Static personas** (dev-guide, code-reviewer) represent philosophies and principles. **Dynamic personas** represent a *specific file's perspective* (parser.ts cares about grammar; extension.ts cares about clarity). Both valuable, different purpose.

---

## Success Metrics

- ✓ Can record letter epistle from right-click in <10 seconds
- ✓ Can insert inline epistle comment in <5 seconds
- ✓ Can synthesize dynamic persona from file in <3 seconds
- ✓ All three epistle types created with correct structure
- ✓ Registry updated automatically for all types
- ✓ Can find and filter epistles in sidebar
- ✓ Linked flight plans show related epistles
- ✓ Dynamic personas appear in persona picker
- ✓ Team uses epistles to document design decisions
- ✓ Inline epistles teach junior devs about design reasoning

---

## Next Steps

→ **Step 2:** Scaffold epistle plugin directory & registry helpers
→ **Step 3:** Implement letter epistle right-click command
→ **Step 3b:** Implement inline epistle comment insertion
→ **Step 3c:** Implement dynamic persona synthesis

---

*This design balances three formats: formal (letters), lightweight (inline), and dynamic (personas from files).*
*Together, they create a comprehensive knowledge capture system for design decisions and architectural reasoning.*
