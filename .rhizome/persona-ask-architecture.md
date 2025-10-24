# Persona "Ask" Command Architecture

## Quick Reference: What Needs Building

### Current State
```
VSCode Extension (extension.ts)
  ├─ don-socratic command REGISTERED ✓
  ├─ User selects code ✓
  └─ TODO: Call rhizome ask command ✗
```

### Target State
```
User selects code in VSCode editor
  ↓
Right-click → "Ask don-socratic"
  ↓
extension.ts (vscode-rhizome.donSocratic handler)
  ↓
cliBackend.ts (invoke rhizome CLI)
  ↓
rhizome CLI: rhizome ask --persona don-socratic "<code>"
  ↓
Load .rhizome/don-socratic_persona.md + YAML config
  ↓
Call Claude API with system prompt = persona voice
  ↓
Claude returns response in don-socratic voice
  ↓
Response displayed in VSCode output channel or webview
```

---

## Implementation Order (Highest to Lowest Risk)

### Phase 1: rhizome CLI (tools/rhizome repo)
**CRITICAL PATH BLOCKER**

```python
# Location: scripts/rhizome.py (add new @click.command)

@click.command()
@click.option('--persona', required=True, help='Persona name')
@click.option('--mode', default=None, help='Persona mode (optional)')
@click.option('--context', default=None, help='File path for context (optional)')
@click.argument('question')
def ask(persona, mode, context, question):
    """Ask a persona a question. Persona responds via LLM with their voice."""
    
    # 1. Load persona definition
    persona_yaml = load_persona_yaml(persona)  # from .rhizome/personas.d/custom/
    persona_md = load_persona_markdown(persona)  # from .rhizome/
    
    # 2. Build system prompt
    system_prompt = build_persona_prompt(persona_md, mode)
    
    # 3. Add context if provided
    if context:
        file_content = read_file(context)
        question = f"[File: {context}]\n{file_content}\n\nQuestion: {question}"
    
    # 4. Call Claude API
    response = call_claude(
        system=system_prompt,
        user_message=question,
        model="claude-3-5-sonnet-20241022"  # or configurable
    )
    
    # 5. Return response
    return {"ok": True, "response": response, "persona": persona}
```

**What's needed:**
- Claude API client (use `anthropic` Python package)
- Persona loader (read .yml + .md files)
- Prompt builder (system prompt from persona definition)
- Error handling (persona not found, API timeout, no API key)

**Config needed:**
- `ANTHROPIC_API_KEY` environment variable (or read from ~/.rhizome/config)

---

### Phase 2: vscode-rhizome Backend (TypeScript)

**Location:** `src/rhizomeBackend.ts` (interface)

```typescript
export interface RhizomeBackend {
    ask(
        persona: string,
        question: string,
        options?: {
            mode?: string;
            context?: string;  // file path
        }
    ): Promise<string>;
    
    personaList(): Promise<string[]>;
    personaShow(name: string): Promise<PersonaDefinition>;
}
```

**Location:** `src/cliBackend.ts` (implementation)

```typescript
import { spawn } from 'child_process';

export class CLIBackend implements RhizomeBackend {
    async ask(
        persona: string,
        question: string,
        options?: { mode?: string; context?: string }
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            const args = ['ask', '--persona', persona];
            if (options?.mode) args.push('--mode', options.mode);
            if (options?.context) args.push('--context', options.context);
            args.push(question);
            
            const proc = spawn('rhizome', args);
            let stdout = '';
            let stderr = '';
            
            proc.stdout?.on('data', (data) => { stdout += data; });
            proc.stderr?.on('data', (data) => { stderr += data; });
            
            proc.on('close', (code) => {
                if (code === 0) {
                    try {
                        const result = JSON.parse(stdout);
                        resolve(result.response);
                    } catch {
                        resolve(stdout);  // fallback to plain text
                    }
                } else {
                    reject(new Error(`rhizome ask failed: ${stderr}`));
                }
            });
            
            proc.on('error', reject);
        });
    }
}
```

**What's needed:**
- Error handling for CLI not found
- Timeout handling (don't wait forever for Claude API)
- JSON parsing (rhizome CLI output format)

---

### Phase 3: VSCode Extension (TypeScript)

**Location:** `src/extension.ts` (replace placeholder)

```typescript
import { CLIBackend } from './cliBackend';

const backend = new CLIBackend();

let donSocraticDisposable = vscode.commands.registerCommand(
    'vscode-rhizome.donSocratic',
    async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const selectedText = editor.document.getText(editor.selection);
        if (!selectedText) {
            vscode.window.showErrorMessage('Please select code to question');
            return;
        }

        const outputChannel = vscode.window.createOutputChannel('vscode-rhizome');
        outputChannel.show(true);

        outputChannel.appendLine('='.repeat(60));
        outputChannel.appendLine('don-socratic');
        outputChannel.appendLine('='.repeat(60));
        outputChannel.appendLine('Selected code:');
        outputChannel.appendLine(selectedText);
        outputChannel.appendLine('');
        outputChannel.appendLine('--- Waiting for don-socratic response ---');
        outputChannel.appendLine('');

        try {
            const response = await backend.ask(
                'don-socratic',
                selectedText,
                { context: editor.document.uri.fsPath }
            );
            outputChannel.appendLine(response);
        } catch (error) {
            outputChannel.appendLine('ERROR: ' + String(error));
            vscode.window.showErrorMessage(
                `don-socratic failed: ${String(error)}`
            );
        }
    }
);
```

**What's needed:**
- cliBackend module exists and is imported
- Error handling + user feedback
- Loading state (e.g., "Thinking..." animation)

---

## Persona Prompt Template

### What the System Prompt Looks Like

```
You are don-socratic, a wizened Oxford don who guides through Socratic questioning.

Your role: Librarian, Gardener, Kitchen Table Strategist
Your domain: VSCode Extension Development

## Voice & Personality
Knows the collection. Tended this garden long enough to spot a weed from ten yards away. 
Doesn't hedge, doesn't defer false-nice. You get straight diagnosis: here's what works, 
here's why that won't, here's the evidence from what's been planted before.

## Core Values
- Precision — "What do you mean by that, exactly?"
- Evidence — "What does the collection show?"
- First principles — Back up and examine assumptions
- The work matters — Truth emerges through making things
- Sustainable rigor — Excellence isn't sprinting; it's tending

## Signature Moves
- Opens with: "Let's be clear about what we're doing here."
- Asks: "What does the collection show us?"
- Diagnoses: "This is a weed. We pull it now or it spreads."
- Redirects: "You're asking the wrong question. Here's what you actually need."
- Confirms: "So here's what I'm seeing. Does that match?"
- Hands over: "Here's the pattern. Use it."

## When responding:
Answer with don-socratic voice. Ask clarifying questions. Challenge assumptions.
Reference "the collection" (patterns, prior art). Ground advice in evidence.
Be direct. Care about the work, not about being liked.
```

---

## Data Flow Diagrams

### Happy Path (Code Question)

```
User: selects code in VSCode editor
  ↓ [Selected text = "function getName() { ... }"]
  │
User: right-click → "Ask don-socratic"
  ↓ [Command: vscode-rhizome.donSocratic]
  │
extension.ts: Get editor + selection
  ↓ [selectedText, filePath]
  │
cliBackend.ask('don-socratic', selectedText, {context: filePath})
  ↓ [spawn rhizome process]
  │
rhizome ask --persona don-socratic --context /path/to/file "function getName()..."
  ↓ [Load persona definition]
  │
[system prompt = don-socratic voice + values]
[user message = selected code + context]
  ↓ [Call Claude API]
  │
Claude returns:
"Let's be clear about what we're doing here. Why does this function exist?
What problem is it solving? And how do you KNOW getName is the right name?
Have you considered getFullName or computeDisplayName?"
  ↓ [Return JSON response]
  │
rhizome outputs: {"ok": true, "response": "..."}
  ↓ [CLIBackend parses]
  │
extension.ts: Display in output channel
  ↓
User sees don-socratic response in VSCode output
```

### Error Path

```
User: selects code → "Ask don-socratic"
  ↓
CLIBackend: spawn('rhizome', ...)
  ↓
[ERROR: rhizome CLI not found in PATH]
  ↓
CLIBackend rejects promise
  ↓
extension.ts catches error
  ↓
extension.ts: showErrorMessage("rhizome CLI not installed")
  ↓
User sees error notification
```

---

## Testing Checklist

### Before Phase 1 (rhizome CLI) is Done
- [ ] `rhizome ask --persona don-socratic "test"` works
- [ ] Returns valid JSON: `{"ok": true, "response": "..."}`
- [ ] Persona markdown is loaded correctly
- [ ] Claude API is called with correct system prompt
- [ ] Handles missing persona gracefully
- [ ] Handles missing API key with helpful error

### Before Phase 2 (cliBackend) is Done
- [ ] CLIBackend.ask() spawns rhizome process
- [ ] Parses JSON response correctly
- [ ] Fallback to plain text if JSON fails
- [ ] Timeout after 30 seconds
- [ ] Error rejected promise on CLI failure

### Before Phase 3 (extension) is Done
- [ ] don-socratic command invokes backend
- [ ] Output channel shows response
- [ ] Selected code is passed to CLI
- [ ] File path is passed as context
- [ ] Errors are caught and displayed to user
- [ ] Loading indicator shown while waiting

---

## Configuration Needed

### rhizome CLI (.env or config file)
```
ANTHROPIC_API_KEY=sk-ant-...  # Required for Claude API
RHIZOME_CONTEXT_DIR=~/.rhizome  # Where personas live
RHIZOME_LOG_LEVEL=info  # Optional
```

### VSCode Extension (package.json)
Already has:
- Commands registered
- Context menu integration
- Activation event

No new config needed in V1 (API key inherited from environment).

---

## Alternative Architectures Considered

### Option A: Direct LLM Call in VSCode
- ❌ Embedding API key in extension code = security risk
- ❌ Loses persona management centralization
- ✓ Faster, no CLI subprocess

### Option B: MCP Server (Future)
- ✓ Better distribution (no Python dependency)
- ✓ JSON-RPC protocol is standard
- ❌ More complex to set up for V1
- Decision: Use CLI for bootstrap, swap to MCP later

### Option C: Local LLM (Ollama)
- ✓ Privacy, no API key
- ❌ Requires running local model
- ❌ Slower inference
- Decision: Default to Claude (via API key), support local later

---

## Timeline Estimate

**Phase 1 (rhizome CLI):** 2-3 hours
- Load persona files
- Build system prompt
- Claude API integration
- Error handling

**Phase 2 (cliBackend):** 1 hour
- Spawn rhizome process
- Parse response
- Error handling

**Phase 3 (extension.ts):** 1 hour
- Wire command handler
- Display response
- Error handling

**Total:** ~4-5 hours for minimal working version

---

## Known Limitations (V1)

- Single-turn Q&A only (no conversation history)
- No persona mode selection (uses default)
- No decision logging (Q&A not recorded in actions.ndjson)
- No webview UI (uses output channel)
- No other personas in extension UI (only don-socratic)
- No async loading indicator
- No context from imports/dependencies (just code + file)

All addressable in V2 once MVP is stable.

