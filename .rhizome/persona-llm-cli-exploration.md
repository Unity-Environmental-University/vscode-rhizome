# vscode-rhizome CLI Repository Exploration

## Repository Overview

**Location:** `/Users/hallie/Documents/repos/vscode-rhizome`
**Type:** VSCode Extension (TypeScript)
**Status:** Early-stage MVP with persona infrastructure, no LLM integration yet
**Key Tool:** Uses `rhizome` CLI from tools/rhizome repo for persona management and decision logging

---

## 1. Persona-Related Commands and Capabilities

### Current Persona System (CLI-based)
The rhizome CLI (from tools/rhizome) provides these commands:
- `rhizome persona-list` — List all available personas
- `rhizome persona-show <name>` — Display persona details
- `rhizome persona-adopt <name>` — Adopt a persona (recorded in .rhizome/actions.ndjson)

### Defined Personas in vscode-rhizome
Five personas defined in `.rhizome/personas.d/custom/*.yml`:

1. **don-socratic** (parent: root)
   - Wizened Oxford don; Socratic questioning, challenges assumptions
   - Modes: reasoner, skeptic, advocate, synthesis
   - Philosophy: Precision, evidence, first principles, sustainable rigor
   - Signature: "Let's be clear about what we're doing here"
   - File: `.rhizome/don-socratic_persona.md` (54 lines)

2. **dev-guide** (parent: rhizome)
   - Mindful development mentor; reflection over commands
   - Modes: kitchen_table, garden, library
   - Philosophy: Intentionality, patience, growth through questions
   - Signature: "What were you trying to accomplish here?"
   - File: `.rhizome/dev-guide_persona.md`

3. **code-reviewer** (parent: bro)
   - Evidence-based executor; skeptic who demands guardrails
   - Modes: executor, challenger, balance
   - Philosophy: Evidence or nothing, guardrails matter, outcome-focused
   - Signature: "What's your confidence level here?"
   - File: `.rhizome/code-reviewer_persona.md`

4. **ux-advocate** (parent: una)
   - Experience curator; obsessed with human workflow
   - Modes: guide, documentarian, curator
   - Philosophy: Human-centered design, clarity over cleverness
   - Signature: "Have we actually watched someone use this?"
   - File: `.rhizome/ux-advocate_persona.md`

5. **dev-advocate** (parent: rhizome)
   - Synthesis strategist; bridges rigor with heart
   - Modes: executor, mentor, strategist
   - Philosophy: Rigor + compassion, sustainable excellence
   - Signature: "Let's look at this together—what's working here?"
   - File: `.rhizome/dev-advocate_persona.md`

### Persona Chorus Guide
Stored in `.rhizome/chorus_guide.md` — documents how the four voices work together:
- Design phase: dev-advocate + ux-advocate
- Implementation: code-reviewer + dev-guide
- Review: dev-advocate leads; others chime in
- Retrospectives: all four perspectives

---

## 2. Existing LLM Integration and "Ask" Capability

### Current State: NOT IMPLEMENTED
- **TODO in extension.ts (line 97):** `// TODO: Call rhizome CLI: rhizome ask --persona don-socratic <selected code>`
- The infrastructure is scaffolded but the actual LLM integration is missing
- Both commands (don-socratic + stub) are registered but responses are placeholders

### Planned Architecture (from rhizome_memories.md)
Architecture decisions show the intended design:

1. **RhizomeBackend abstraction** (interface-based)
   - CLIBackend: Call rhizome CLI directly (bootstrap path)
   - MCPBackend: Call via Model Context Protocol server (future distribution)
   - Methods needed: `personaList()`, `personaShow()`, `ask()`, `record()`

2. **LLM Integration Layer**
   - llmClient.ts — Abstract over LLM provider (Claude, local, configurable)
   - rhizomeContext.ts — Build context from persona + code + decision phase
   - Passes persona identity + voice to LLM for awareness

3. **Message Passing**
   - Extension ↔ Webview communication (not yet wired)
   - Webview needs async loading states for LLM responses

### Key Gap
**No "ask persona with context" command exists in rhizome CLI yet.**

The user notes from 2025-10-23 conversation:
- "We're desperately going to want to have the ability to ask a persona something directly and have THE PERSONA generate the response via LLM"
- This is BLOCKING for the extension being useful at all
- Currently using Claude Code CLI manually for persona guidance while developing

---

## 3. How CLI Currently Invokes Personas

### Current (Broken) Flow
1. User selects code in VSCode
2. Right-click → "Ask don-socratic"
3. Command registered in extension.ts
4. TODO comment says: call `rhizome ask --persona don-socratic <code>`
5. Response should appear in output channel
6. **Status:** Placeholder only, no actual invocation

### Intended Architecture (from memories)
```
VSCode Extension
  ↓
vscode-rhizome (command handler)
  ↓
RhizomeBackend (interface)
  ├─ CLIBackend (spawn child process)
  │  ↓
  │  rhizome ask --persona don-socratic --context <file> <question>
  │  ↓
  │  rhizome CLI (Python)
  │
  └─ MCPBackend (JSON-RPC over localhost)
     ↓
     MCP Server
     ↓
     rhizome CLI
```

### Missing Methods
The rhizome CLI needs:
- `rhizome ask --persona <name> [--context <path>] <question>`
- Load persona definition from `.rhizome/personas.d/custom/<name>.yml`
- Invoke LLM with persona prompt + question
- Return response (JSON or plain text)

---

## 4. Where OpenAI Integration Should Hook In

### Not OpenAI—Claude
The codebase references Claude/Anthropic, not OpenAI:
- `.env.example` mentions `RHIZOME_CONTEXT_DIR` but no explicit API key setup yet
- rhizome_memories.md: "Layer to talk to LLM (Claude, local, configurable)"

### Hook Points

**1. rhizome CLI (Python, tools/rhizome repo)**
```
scripts/rhizome.py
  ├─ @click.command("ask")
  ├─ Parameters: --persona, --context, <question>
  ├─ Load persona definition
  ├─ Build LLM prompt
  ├─ Call Claude API
  └─ Return response
```

**2. LLM Config**
- Need to add API key handling (Claude API key)
- Could live in:
  - `.env` file (read by rhizome CLI)
  - VSCode extension settings
  - `~/.rhizome/config` or similar

**3. Persona Prompt Template**
```
System: {persona definition from .md file}
{persona mode if specified}
{local context if provided}

User: {question from vscode-rhizome}
```

**4. Context Building**
- File being edited (code selection)
- File language/type
- Related imports/dependencies (optional)
- User story tags (future)

---

## 5. Design Documents About Persona-LLM Interaction

### Found: YES
Location: `.rhizome/rhizome_memories.md` (action records)

Key decisions recorded (2025-10-20 to 2025-10-23):

**Decision: llm-integration-layer**
- Note: "Layer to talk to LLM (Claude, local, configurable) with @rhizome persona context"
- Allows: property inference, code review via personas, decision logging
- Serves: Understand Before Commit, Test-Driven Top-Down
- Status: Proposed, not implemented

**Decision: rhizome-backend-abstraction**
- Design: RhizomeBackend interface with CLIBackend (bootstrap) + MCPBackend (future)
- Strategy: Start with CLI, swap to MCP later without refactoring extension
- Status: Proposed (file structure exists but not functional)

**Decision: don-socratic-core-feature** (2025-10-20T20:51:55Z)
- Feature: Users select code, right-click "Ask don-socratic", receive Socratic questioning
- Status: Command registered; response logic is placeholder
- Gap: "Implementation: persona loading, question generation, output display?"

### Recent Commits Showing Architecture
```
271c8ac Build extension.ts: Answer don-socratic questions, wire both commands
6d69f12 Answer @rhizome questions inline: stub generation, comment finding, insertion
171bdfe Refactor don-socratic: rootsong energy—competent, not bemused
63e31a8 Code-reviewer conducts: Webview architecture essentials
14436f9 Add UI framework examples for webview development
bd0d3bf Register don-socratic as core feature
```

### No explicit design file
There is NO `.rhizome/persona-llm-cli-design.md` file yet, though the architecture is documented in:
- `rhizome_memories.md` (NDJSON action log)
- `decisions.md` (decision rationale)
- `.rhizome/chorus_guide.md` (how personas interact)

---

## 6. Current vscode-rhizome Structure

### Files
```
src/
├── extension.ts (7091 bytes) — Main entry point, command registration
├── stubGenerator.ts (10157 bytes) — Function stub generation logic
└── rhizome.code-workspace — Workspace settings

.rhizome/
├── personas.d/custom/
│   ├── don-socratic.yml
│   ├── dev-guide.yml
│   ├── code-reviewer.yml
│   ├── ux-advocate.yml
│   └── dev-advocate.yml
├── <persona>_persona.md (5 files) — Full personality definitions
├── chorus_guide.md — Persona interaction guide
├── decisions.md — Architecture decisions
├── rhizome_memories.md — Action log (NDJSON entries)
└── actions.ndjson — Decision records

package.json — VSCode extension manifest
tsconfig.json — TypeScript config
dist/ — Compiled output (esbuild)
```

### Commands Registered
1. `vscode-rhizome.donSocratic` — "Ask don-socratic" (context menu on selection)
2. `vscode-rhizome.stub` — "Stub this function"
3. `vscode-rhizome.stubInfer` — "Stub this function (with LLM inference)"

### Activation
- Event: `onStartupFinished` — Extension loads on VSCode startup
- Reason: Need scaffolding always available for mindful development

---

## 7. Minimal Version Requirements

### What MUST Exist First
1. **rhizome CLI `ask` command**
   ```bash
   rhizome ask --persona don-socratic "How should I name this variable?"
   ```
   - Load persona from `.rhizome/personas.d/custom/<name>.yml`
   - Build system prompt with persona voice
   - Call Claude API with prompt + question
   - Return JSON or plain text response

2. **cliBackend.ts bridge**
   - Spawn rhizome process with ask command
   - Parse JSON response
   - Handle errors (timeout, API failure, persona not found)

3. **extension.ts command handler**
   - Get selected code
   - Build question context
   - Call cliBackend.ask()
   - Display response in output channel or webview

4. **API Key Configuration**
   - Read Claude API key from environment
   - Fallback strategy (warn user if not configured)

### Nice-to-Have (V2)
- Async loading UI in webview
- Chat history / conversation context
- Persona mode selection (reasoner vs skeptic)
- Local code context (file path, language, imports)
- Decision logging (record Q&A in actions.ndjson)

---

## 8. Where "Ask Persona with Context" Should Live

### Architecture Layers

**Layer 1: rhizome CLI (Python)**
- Location: `tools/rhizome/scripts/rhizome.py`
- Command: `rhizome ask <question> --persona <name> [--mode <mode>] [--context <path>]`
- Responsibilities:
  - Load persona YAML from `.rhizome/personas.d/custom/`
  - Load persona markdown from `.rhizome/`
  - Optionally read file context if --context provided
  - Build LLM prompt
  - Call Claude API
  - Return response

**Layer 2: Extension Backend (TypeScript)**
- Location: `src/rhizomeBackend.ts` (interface) + `src/cliBackend.ts` (implementation)
- Methods: `ask(persona: string, question: string, context?: string): Promise<string>`
- Responsibilities:
  - Spawn rhizome CLI process
  - Marshal question/persona/context as arguments
  - Parse response
  - Error handling

**Layer 3: VSCode Extension**
- Location: `src/extension.ts`
- Command handler: `vscode-rhizome.donSocratic` etc.
- Responsibilities:
  - Capture user input (selected code, input box)
  - Call backend.ask()
  - Display response in output channel/webview
  - Show loading/error states

**Layer 4: VSCode Webview (Optional, Future)**
- Rich UI for persona interaction
- Async message passing
- Chat interface
- Persona selection dropdown

---

## 9. Code Snippets from Current Implementation

### Key TODO (extension.ts, line 97)
```typescript
// TODO: Call rhizome CLI: rhizome ask --persona don-socratic <selected code>
// TODO: Parse JSON response
// TODO: Display in output channel
// For now, placeholder:
outputChannel.appendLine('(Persona-LLM integration coming soon)');
```

### Stub Generation (Not Yet Implemented)
```typescript
export function generateStub(
	functionName: string,
	params: string,
	returnType: string | null,
	language: 'typescript' | 'javascript' | 'python',
	options?: {
		timestamp?: string;
		userStory?: string;
	}
): string {
	throw new Error('Not implemented');
}
```

### Current Placeholder Call
```typescript
let donSocraticDisposable = vscode.commands.registerCommand(
	'vscode-rhizome.donSocratic',
	async () => {
		const editor = vscode.window.activeTextEditor;
		const selectedText = editor.document.getText(selection);
		
		const outputChannel = vscode.window.createOutputChannel('vscode-rhizome');
		outputChannel.appendLine('='.repeat(60));
		outputChannel.appendLine('don-socratic');
		outputChannel.appendLine('='.repeat(60));
		outputChannel.appendLine('Selected code:');
		outputChannel.appendLine(selectedText);
		outputChannel.appendLine('');
		outputChannel.appendLine('--- Waiting for persona response ---');
		outputChannel.appendLine('');
		outputChannel.appendLine('(Persona-LLM integration coming soon)');
	}
);
```

---

## Summary: Critical Path Forward

### What's Blocking Everything
The rhizome CLI lacks an `ask` command that:
1. Takes a persona name + question
2. Loads persona definition
3. Invokes LLM with persona voice
4. Returns structured response

### Minimal MVP (Phase 1)
```
rhizome ask --persona don-socratic "What do you think of this code?"

→ Loads .rhizome/personas.d/custom/don-socratic.yml + .rhizome/don-socratic_persona.md
→ Calls Claude API with system prompt = persona definition
→ Returns response in don-socratic voice
```

### Phase 2
- vscode-rhizome calls this from cliBackend
- extension.ts wires don-socratic command to backend
- Output channel displays response

### Phase 3+
- Webview UI with async loading
- Context passing (file path, code selection)
- Chat history
- Other personas in UI
- Decision logging

---

## Files to Review for Implementation

**rhizome CLI (Python):**
- `/Users/hallie/Documents/repos/tools/rhizome/scripts/rhizome.py` — Main CLI entry
- `/Users/hallie/Documents/repos/tools/rhizome/personas.py` — Persona loading logic

**vscode-rhizome (TypeScript):**
- `/Users/hallie/Documents/repos/vscode-rhizome/src/extension.ts` — Start here (lines 64-102 for don-socratic)
- `/Users/hallie/Documents/repos/vscode-rhizome/src/stubGenerator.ts` — Stub logic (not yet implemented)

**Architecture/Docs:**
- `/Users/hallie/Documents/repos/vscode-rhizome/.rhizome/rhizome_memories.md` — All design decisions
- `/Users/hallie/Documents/repos/vscode-rhizome/.rhizome/don-socratic_persona.md` — Persona voice/values

