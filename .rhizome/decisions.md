# Architecture Decisions

**Format:** Decision → Why → User Stories it serves → Open questions

---

## Decision 1: Extension Activation

**What:** vscode-rhizome activates on VSCode startup (not lazy-loaded)

**Why:**
- Ready whenever you need mindfulness scaffolding
- Minimal startup cost for always-on presence
- Future: course template editing also needs startup access

**User Stories Served:**
- "Stay Grounded in Code" — extension present when you need it
- "TODO Backlog Tracking" — backlog available immediately

**Questions:**
- [ ] Performance impact acceptable on large workspaces?
- [ ] Should it lazy-load specific features on first use?

---

## Decision 2: First Command = Pseudocode Stub Generation

**What:** First feature is generating `NotImplementedError` + TODO comment for undefined functions

**Why:**
- Directly addresses "Understand Before Commit" — forces intentional thinking
- Entry point to "Pseudocode Without Friction" — linter won't complain
- Starts the TODO backlog tracking workflow
- Tests the core scaffolding we need to build everything else

**User Stories Served:**
- "Pseudocode Without Friction" — write function names without linter errors
- "Test-Driven Top-Down Development" — stub before implementation
- "TODO Backlog Tracking" — TODO comments register on backlog
- "User Story Workflow Integration" — function can be tagged with why it exists

**Questions:**
- [ ] How to prevent false positives (typos, mid-edit)?
- [ ] Should stub generation be language-aware (TS/JS/Python syntax)?
- [ ] What does the stub actually contain? Just `throw NotImplementedError()`?

---

## Decision 3: Pseudocode Stub Trigger Mechanism (OPEN)

**What:** How should user invoke stub generation?

**Options Being Explored:**
1. **Naming Pattern** — Function names like `TODO_functionName()` trigger autocomplete
2. **Docstring Detection** — `// TODO: description` above function triggers suggestion
3. **Keyboard Shortcut** — Tab or Ctrl+Alt+S on undefined function triggers context menu
4. **Combination** — Multiple patterns, user chooses via Tab confirmation

**Why This Matters:**
- Balances discoverability (easy to find) vs false positives (avoid accidents)
- Shapes the mental model: "how do I signal to the extension?"

**User Stories Served:**
- "Pseudocode Without Friction" — easy to trigger, hard to accidentally trigger
- "Stay Grounded in Code" — low cognitive load to use

**Questions:**
- [ ] Which pattern prevents typo-triggered stubs?
- [ ] Which is most intuitive for your workflow?
- [ ] Should multiple patterns work simultaneously?
- [ ] Does Tab context menu feel right or clunky?

---

## Next Decisions Ahead

Once pseudocode stub is working:
- [ ] TODO comment parsing and backlog registration
- [ ] Sidebar Kanban board display
- [ ] User story tagging on functions
- [ ] Property extraction from user stories
- [ ] Property-based test template generation
- [ ] Multi-language support (TS/JS/Python)
