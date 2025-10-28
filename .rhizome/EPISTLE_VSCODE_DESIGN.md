# Design: Epistle Integration for vscode-rhizome

**Flight Plan:** fp-epistle-vscode-integration
**Step:** 1 (Research & Design)
**Date:** Oct 28, 2025
**Status:** In Progress

## What Are Epistles? (Quick Recap)

**Epistles** are **letters between personas** — recorded dialogs where:
- Persona A asks a question or proposes something
- Persona B responds, challenges, or builds on it
- Full context is included (linked docs, code, flight plans)
- Result: Audit trail of design reasoning + teaching tool

**Key insight:** Epistles capture *why* we made decisions, not just *what* we did.

## Current Extension Workflow

### What developers do NOW:
1. Write code
2. Right-click → "Ask persona" or "Document this"
3. Get back a persona response (logged in output panel)
4. Read response, incorporate feedback
5. **No record of the dialog** — it disappears when they close the panel

### The Gap:
- No record of multi-persona thinking
- Can't audit "why did we design it this way?"
- No way to show junior devs the reasoning behind decisions
- Dialogs are ephemeral, not documented

## Epistle Integration Design

### Core Idea

**Record multi-persona dialogs as epistles directly from the editor.**

Instead of:
```
Right-click → Ask persona → Get response → Lost
```

We want:
```
Right-click → Record epistle → Choose personas → Dialog is saved → Found in registry
```

### Integration Points

#### 1. **Right-Click Context Menu**

**New option:** "Record epistle about this code"

```typescript
// When user right-clicks on code selection:
- Show dialog: "Record an epistle"
- Ask: "Which personas should discuss this?"
- Pre-fill with suggested personas (don-socratic, code-reviewer, etc.)
- Ask: "What's the topic? (e.g., 'Design pattern for error handling')"
- Ask: "Link to flight plan? (optional)"
- Generate epistle template
- Open in editor
- User fills in dialog manually OR uses persona queries to populate
```

#### 2. **Epistle Registry Sidebar**

**New VSCode sidebar view:** "Epistles"

Shows:
- List of all epistles in project
- Sortable by: date, personas, topic
- Search/filter by keywords
- Click to open epistle file in editor

```
📄 Epistles (12)
├── 2025-10-28: dev-guide ↔ code-reviewer — Error handling
├── 2025-10-28: don-socratic ↔ flight-commander — Workflow phases
├── 2025-10-27: dev-advocate — Testing strategy
└── ... (more)
```

#### 3. **Dialog Recording Mode**

When recording an epistle from code selection:

1. **Auto-populate context:**
   - Selection text
   - File name & line numbers
   - Active flight plan (if any)

2. **Generate epistle template:**
   ```markdown
   # Epistle: [Persona A] ↔ [Persona B]

   **Date**: 2025-10-28
   **Topic**: [user input]
   **Code context**: [filename:lines]
   **Linked flight plan**: [if selected]
   **Status**: draft

   ## Dialog

   **[Persona A]:**
   [User fills in or uses persona query]

   **[Persona B]:**
   [User fills in or uses persona query]
   ```

3. **User options:**
   - Manual dialog: Type persona responses manually
   - Query-assisted: Click "Query [persona]" to auto-populate response
   - Edit & refine: Adjust responses after persona query

#### 4. **Epistle as Audit Trail**

Epistles linked to flight plans:

```markdown
# Flight Plan: Add telemetry logging

**Related epistles:**
- epistle-001: dev-guide ↔ code-reviewer — Telemetry verbosity
- epistle-002: don-socratic ↔ dev-advocate — Balance: detail vs noise

When you read these epistles, you understand:
- What trade-offs we made
- Why we chose this balance
- What we learned
```

#### 5. **Persona Advocates for Files**

**Advanced feature:** Personas can "advocate" for extension files.

```typescript
// File: src/extension.ts
// PERSONA ADVOCATE: dev-guide
// Mission: Ensure extension code is clear, intentional, teaching-focused
// Last synced: 2025-10-28
```

When you refactor a file with an advocate:

1. Run: "Code-review: Generate advocate epistle for this file"
2. Generates epistle template:
   ```markdown
   # Epistle: [Persona] advocates for [file]

   **Advocated by**: code-reviewer
   **File**: src/extension.ts
   **Changes**: [git diff summary]

   ## Advocate's Observations

   **Code-Reviewer**: I notice the following changes...
   [user fills in what they changed and why]
   ```
3. Epistle captures: *why* the file evolved + reasoning

## User Workflows

### Workflow 1: Design Decision Recording

```
Scenario: You're designing error handling strategy

1. Select code block that handles errors
2. Right-click → "Record epistle about this code"
3. Choose personas: dev-guide, code-reviewer
4. Topic: "Error handling strategy"
5. Fill in dialog:
   - dev-guide: "Why do we handle errors this way?"
   - code-reviewer: "What are the edge cases?"
6. Save epistle → appears in registry
7. Next time someone touches error handling, they see:
   "This was designed intentionally—see epistle-xyz for reasoning"
```

### Workflow 2: Teaching Moment Recording

```
Scenario: You fixed a subtle bug and want to teach why

1. Select the fix
2. Right-click → "Record epistle"
3. Personas: don-socratic
4. Topic: "Why this bug happened + how we prevent it"
5. Dialog: don-socratic asks clarifying questions, user answers
6. Result: Future team members read the epistle and learn
```

### Workflow 3: Refactor with Advocate Commentary

```
Scenario: You're refactoring extension.ts (advocated by dev-guide)

1. Before refactor: see advocate header showing dev-guide's mission
2. Make changes
3. After refactor: right-click → "Generate advocate epistle"
4. Epistle captures: what changed + why + philosophy
5. Next developer understands: design reasoning for the refactor
```

## Architecture Decisions

### Storage Location
**Where do epistles live?** `.rhizome/plugins/epistles/`

Same location as rhizome's epistle system → shareable, portable

### Registry
**Format:** `registry.ndjson` (line-delimited JSON)

Each line is one epistle metadata:
```json
{"id":"epistle-001","date":"2025-10-28","personas":["dev-guide","code-reviewer"],"topic":"Error handling","file":"extension.ts","status":"draft"}
```

### CLI Integration
**How does extension talk to rhizome?**

Option 1: Call `rhizome epistle new ...` command (preferred if rhizome installed)
Option 2: Generate epistle files directly + update registry (fallback)

```typescript
async function recordEpistle(context: EpisodeContext) {
  try {
    // Try rhizome CLI (requires rhizome installed)
    execSync(`rhizome epistle new --with "${personas}" --topic "${topic}" ...`);
  } catch {
    // Fallback: generate files directly
    const epistle = generateEpistle(context);
    writeFile(path.join(rhizomePath, 'plugins/epistles', epistle.filename), epistle.content);
    updateRegistry(epistle.metadata);
  }
}
```

### UI Location
**Where are epistle features?**

1. **Right-click menu** — Record epistle (primary entry point)
2. **Sidebar view** — Browse epistles (discovery, search)
3. **File header** — Show advocate info if persona advocates for file
4. **Flight plan view** — Show related epistles

### Persona Selection
Use the **curated personas** we're implementing in parallel:
- don-socratic
- dev-guide
- code-reviewer
- + "All Personas..." for full autocomplete

## Implementation Roadmap

### Step 1: Design ✓ (This document)
- Understand epistles
- Design integration points
- Finalize architecture decisions

### Step 2: Scaffolding
- Create `.rhizome/plugins/epistles/` directory (if not exists)
- Copy epistle templates
- Create empty registry
- Wire up CLI integration

### Step 3: Right-Click Command
- Add "Record epistle" option
- Dialog: choose personas, topic, link to flight plan
- Generate epistle template

### Step 4: Registry Sidebar
- Create tree view provider
- Load & display epistles
- Filter/search functionality
- Click to open

### Step 5: Flight Plan Linking
- When recording epistle, show active flight plan as option
- When viewing flight plan, show related epistles
- Create back-links

### Step 6: Persona Advocates
- Add file header with advocate info
- Implement "Generate advocate epistle" command
- Track file hash to detect changes

### Step 7: End-to-End Testing
- Test full workflow
- Verify registry updates
- Test sidebar view
- Test flight plan linking

### Step 8: Documentation
- User guide: When to record epistles
- Teaching moments: Why epistles matter
- Examples: Good epistle templates

## Key Questions (Don-Socratic)

**1. When should developers record epistles vs just asking a persona?**

*Answer:* Ask persona when you want quick feedback.
Record epistle when you want to **document reasoning** (design decisions, architecture choices, refactors).

**2. How do we prevent epistle overload?**

*Answer:* Epistles are optional. Not every interaction needs one.
Guide developers: "Record epistle if future you/team will need to understand *why*."

**3. What if the epistle system isn't available (no rhizome)?**

*Answer:* Fallback to direct file generation + registry update.
Extension can work standalone; integration with rhizome is bonus.

**4. How are epistles different from just comments in code?**

*Answer:*
- **Comments:** Explain *what* the code does
- **Epistles:** Explain *why* we designed it this way (from multiple perspectives)
- Epistles link personas, flight plans, context
- Epistles are searchable audit trail

**5. Should we auto-generate epistles from queries?**

*Answer (defer):* Not yet. Manual dialog is more intentional.
Future: Could auto-populate with persona responses, user refines.

## Success Metrics

- ✓ Can record epistle from right-click in <10 seconds
- ✓ Epistle file created with correct structure
- ✓ Registry updates automatically
- ✓ Can find epistle in sidebar
- ✓ Linked flight plans show related epistles
- ✓ Team uses epistles to document design decisions

## Next Steps

→ **Step 2:** Scaffold epistle plugin directory & CLI integration
→ **Step 3:** Implement "Record epistle" right-click command

---

*This design balances teaching (understand epistles) with pragmatism (make it easy to use).*
