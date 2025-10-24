# vscode-rhizome Implementation Status

**As of:** 2025-10-24
**Status:** Core functionality implemented and tested

## What's Working

### 1. Stub Generation (3 functions, fully implemented)

**generateStub(name, params, returnType, language, options)**
- Builds TODO comment with optional timestamp and user story reference
- Language-aware: TypeScript throws `Error`, Python raises `NotImplementedError`
- Returns formatted string: TODO comment + body
- ✅ Tested and working

**findStubComments(code, language)**
- Scans code for `@rhizome stub` markers (language-agnostic regex)
- Extracts function signatures with language-specific regexes (TS/JS and Python)
- Returns array of: line number, function name, full signature, params, return type
- Handles single-line blanks between marker and signature
- ✅ Tested and working

**insertStub(code, line, stub, language)**
- Splices stub into file at correct indentation level
- Detects line ending style (\n vs \r\n)
- Handles both empty function stubs and existing code
- Preserves indentation (both tabs and spaces)
- ✅ Mostly working; rough edge on closing brace logic (see TODOs below)

### 2. Extension Commands (both wired and live)

**donSocratic command**
- Select code → right-click → "Ask don-socratic"
- Calls `rhizome query --persona don-socratic` with selected text as stdin
- Shows response in output channel
- Error handling: catches rhizome errors and shows helpful message
- ⚠️ Rough edges:
  - No timeout wrapper
  - Assumes rhizome in PATH
  - No response parsing (shows raw output)
  - Uses `require('child_process')` inline (should extract to helper)

**stub command**
- Detects language from file extension (typescript, javascript, python)
- Finds all @rhizome stub comments in file
- If multiple: user selects which one via quick pick
- Generates stub, inserts into file, applies workspace edit
- Shows success message
- ✅ Fully working end-to-end

## What's Not Yet Done

### High Priority (blocking real use)

- [ ] **insertStub closing brace logic** — Rough edge when adding stub to function with existing code. Currently only adds closing brace for empty functions.
- [ ] **donSocratic response parsing** — Raw output shown; should format/parse rhizome response nicely
- [ ] **Error handling in donSocratic** — Timeout, missing rhizome, stderr handling
- [ ] **Unit tests** — No tests yet for stubGenerator functions
- [ ] **Integration tests** — No E2E tests for extension commands

### Medium Priority (nice to have)

- [ ] **Webview for rich responses** — Currently uses output channel; should build webview for personas, chat history
- [ ] **Keyboard shortcuts** — Register keybindings for both commands
- [ ] **TODO backlog tracking** — Parse TODO comments and display in sidebar
- [ ] **Persona-aware output formatting** — Style responses by persona (don uses different voice than dev-guide)
- [ ] **Multi-language stubs** — Currently supports TS/JS/Python signatures, but detection could be more robust

### Future (not blocking)

- [ ] **Webview framework** — Choose Svelte, Solid, or HTMX (framework examples exist in .rhizome/)
- [ ] **Property-based test generation** — Extract properties from function signature, generate test templates
- [ ] **User story tagging** — Link functions to user stories in code
- [ ] **MCP integration** — Move from CLI to MCP server for better distribution
- [ ] **Async LLM queries** — Background inference while user continues coding

## Code Quality Notes

### Strengths
- **Heavily annotated** — Every function has inline comments explaining each step, assumptions, edge cases
- **Self-documenting** — Comments in code answer "what" and "why", not just "how"
- **Rough edges labeled** — TODO comments clearly mark unfinished logic
- **Tested core logic** — Main functions verified to produce correct output

### Rough Edges (Intentional)
- **execSync blocking** — donSocratic uses blocking call; should use spawn + streams
- **Error handling sparse** — Many error cases documented but not yet handled
- **Line ending detection naive** — Simple regex; could miss edge cases
- **Type checking loose** — Some `as any` casts and loose error typing

## Architecture Notes

### How commands flow

1. **donSocratic:**
   - User selects code + right-clicks
   - extension.ts captures selection
   - Calls `rhizome query --persona don-socratic` with code as stdin
   - Shows response in output channel

2. **stub:**
   - User has file with `// @rhizome stub` comment
   - Runs stub command
   - findStubComments() finds all markers
   - For each stub: generateStub() creates code, insertStub() splices it in
   - VSCode workspace edit applies changes
   - Success message shown

### What rhizome CLI provides

- `rhizome query --persona <name>` — Reads stdin, passes to LLM with persona context, outputs response
- Assumes OpenAI API key in env, or falls back to Ollama
- Returns plain text (or JSON with `--json` flag)

### Extension activation

- `onStartupFinished` — Extension loads on VSCode startup
- Two commands registered: `vscode-rhizome.donSocratic` and `vscode-rhizome.stub`
- Cleanup on deactivate (currently empty)

## Next Session: Where to Start

1. **If fixing insertStub:** Look at the closing brace logic in insertStub() around line 378-405. Need to parse the entire function scope to know where it ends, not just guess based on next line.

2. **If improving donSocratic:** Extract execSync call to separate helper function, add proper error handling + timeout, parse response JSON, format for output channel.

3. **If testing:** Write unit tests for each stubGenerator function using simple input/output pairs. Test file is test-generator.ts (not checked in, use as reference).

4. **If building webview:** Start with vscode-startrek-code as reference pattern. See .rhizome/webview-architecture-notes.md for design notes.

## Commits in This Session

1. `271c8ac` — Build extension.ts: Answer don-socratic questions, wire both commands
2. `dc8c9d0` — Implement stubGenerator: three functions, heavily annotated, now executable
3. `e2e689f` — Fix insertStub: handle edge case of extra closing brace in empty functions

---

**Philosophy underlying this code:** Heavy annotation, rough edges labeled, self-documenting. Executable first, perfect second. Every TODO answered inline so future devs know exactly what broke and why.
