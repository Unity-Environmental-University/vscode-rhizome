# Implementation Roadmap: Persona "Ask" Feature

## Status Summary

| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| **Personas Defined** | 5/5 DONE | `.rhizome/personas.d/custom/*.yml` | don-socratic, dev-guide, code-reviewer, ux-advocate, dev-advocate |
| **Persona Markdown** | 5/5 DONE | `.rhizome/<name>_persona.md` | Full voice, values, signature moves |
| **Extension Command** | REGISTERED | `src/extension.ts` line 64 | "Ask don-socratic" in context menu |
| **CLI Backend Stub** | TODO | `src/cliBackend.ts` (doesn't exist) | Spawn rhizome CLI, parse response |
| **rhizome ask CLI** | TODO | `tools/rhizome/scripts/rhizome.py` | New @click.command() needed |
| **LLM Integration** | BLOCKED | N/A | Depends on rhizome CLI ask command |
| **Webview UI** | FUTURE | `src/webview/` (doesn't exist) | Post-MVP, async loading states |

---

## Next Steps (Ordered by Dependency)

### URGENT: Phase 1 - rhizome CLI "ask" Command
**Repo:** tools/rhizome  
**Blocker:** Everything else waits for this

```bash
# What user will eventually run (via vscode-rhizome):
rhizome ask --persona don-socratic "How should I name this variable?"

# What needs to happen internally:
1. Parse --persona argument → "don-socratic"
2. Load .rhizome/personas.d/custom/don-socratic.yml
3. Load .rhizome/don-socratic_persona.md
4. Build system prompt from markdown
5. Call Claude API: messages.create(system=prompt, user_message=question)
6. Return JSON: {"ok": true, "response": "..."}
```

**Files to modify:**
- `tools/rhizome/scripts/rhizome.py` — Add @click.command('ask')
- `tools/rhizome/personas.py` — Reuse for loading (if it exists)
- `.env` or config — Read ANTHROPIC_API_KEY

**Dependencies:**
```bash
pip install anthropic  # Claude SDK
```

**Minimal Code:**
```python
import click
from anthropic import Anthropic

@click.command()
@click.option('--persona', required=True)
@click.option('--context', default=None)
@click.argument('question')
def ask(persona, context, question):
    """Ask a persona a question."""
    persona_md = read_file(f".rhizome/{persona}_persona.md")
    
    client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1024,
        system=persona_md,
        messages=[{"role": "user", "content": question}]
    )
    
    return {"ok": True, "response": response.content[0].text}
```

**Testing:**
```bash
export ANTHROPIC_API_KEY=sk-ant-...
rhizome ask --persona don-socratic "What's a good variable name?"
# Should see JSON response with don-socratic's answer
```

---

### HIGH: Phase 2 - cliBackend.ts Bridge
**Repo:** vscode-rhizome  
**Depends on:** Phase 1 (rhizome CLI ask command working)

**File to create:** `src/cliBackend.ts` (100-150 lines)

```typescript
import { spawn } from 'child_process';

export class CLIBackend {
    async ask(
        persona: string,
        question: string,
        options?: { context?: string }
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            const args = ['ask', '--persona', persona];
            if (options?.context) args.push('--context', options.context);
            args.push(question);
            
            const proc = spawn('rhizome', args);
            let stdout = '';
            let stderr = '';
            
            proc.stdout?.on('data', (d) => { stdout += d; });
            proc.stderr?.on('data', (d) => { stderr += d; });
            
            const timeout = setTimeout(
                () => {
                    proc.kill();
                    reject(new Error('rhizome ask timeout (>30s)'));
                },
                30000
            );
            
            proc.on('close', (code) => {
                clearTimeout(timeout);
                if (code === 0) {
                    try {
                        const json = JSON.parse(stdout);
                        resolve(json.response);
                    } catch {
                        resolve(stdout);  // Plain text fallback
                    }
                } else {
                    reject(new Error(stderr || `rhizome exited with code ${code}`));
                }
            });
            
            proc.on('error', reject);
        });
    }
}
```

**Integration test:**
```typescript
const backend = new CLIBackend();
const response = await backend.ask('don-socratic', 'Test question');
console.log(response);  // Should print don-socratic's response
```

---

### HIGH: Phase 3 - Wire extension.ts Command Handler
**Repo:** vscode-rhizome  
**Depends on:** Phase 2 (cliBackend working)

**File to modify:** `src/extension.ts` (lines 64-102)

**Replace placeholder with:**
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
            vscode.window.showErrorMessage('Please select code first');
            return;
        }

        const outputChannel = vscode.window.createOutputChannel('vscode-rhizome');
        outputChannel.show(true);

        outputChannel.appendLine('='.repeat(60));
        outputChannel.appendLine('don-socratic');
        outputChannel.appendLine('='.repeat(60));
        outputChannel.appendLine(selectedText);
        outputChannel.appendLine('');
        outputChannel.appendLine('--- Thinking... ---');
        outputChannel.appendLine('');

        try {
            const response = await backend.ask('don-socratic', selectedText, {
                context: editor.document.uri.fsPath
            });
            outputChannel.appendLine(response);
        } catch (error) {
            outputChannel.appendLine('ERROR: ' + String(error));
            vscode.window.showErrorMessage(`Failed: ${String(error)}`);
        }
    }
);
```

**Manual test:**
1. Open VSCode (with vscode-rhizome loaded)
2. Select code
3. Right-click → "Ask don-socratic"
4. Check output channel for response

---

## Success Criteria

### Phase 1 (rhizome CLI)
- [ ] `rhizome ask --persona don-socratic "test"` executes
- [ ] Returns valid JSON with "response" key
- [ ] Response contains don-socratic's voice (challenges, asks "why", references evidence)
- [ ] Handles errors: missing persona, missing API key, timeout
- [ ] Works with file path: `--context /path/to/file.ts`

### Phase 2 (cliBackend)
- [ ] CLIBackend.ask() spawns process and waits
- [ ] Parses JSON response correctly
- [ ] Falls back to plain text if JSON fails
- [ ] Rejects promise on error
- [ ] Timeout after 30 seconds
- [ ] Works with context option

### Phase 3 (extension)
- [ ] "Ask don-socratic" command is clickable
- [ ] Selected code is captured
- [ ] Output channel shows response in real-time
- [ ] Errors are displayed to user
- [ ] No crashes if rhizome CLI not found

---

## Known Gotchas

### 1. API Key Not Set
```
Error: Anthropic API key not found
Solution: Set export ANTHROPIC_API_KEY=sk-ant-...
```

### 2. rhizome CLI Not in PATH
```
Error: Command "rhizome" not found
Solution: Ensure tools/rhizome is in PATH or use full path
```

### 3. Claude API Rate Limit
```
Error: 429 Too Many Requests
Solution: Add exponential backoff retry logic (future)
```

### 4. Persona File Not Found
```
Error: File not found: .rhizome/don-socratic_persona.md
Solution: Ensure .rhizome/ is in repo root, check file exists
```

### 5. JSON Parse Error
```
If rhizome returns plain text instead of JSON:
Solution: Fallback to plain text (cliBackend already does this)
```

---

## Quick Verification Commands

```bash
# Phase 1 testing
export ANTHROPIC_API_KEY=sk-ant-...
rhizome ask --persona don-socratic "What's 2+2?" --context /tmp/test.txt

# Phase 2 testing (run from vscode-rhizome directory)
npm run esbuild  # Compile TypeScript
node -e "
  const { CLIBackend } = require('./dist/extension.js');
  const b = new CLIBackend();
  b.ask('don-socratic', 'Test').then(r => console.log(r));
"

# Phase 3 testing
1. In VSCode: F5 to launch extension
2. Open test file
3. Select code → right-click → "Ask don-socratic"
4. Check Output panel for response
```

---

## References

- **Personas defined:** `/Users/hallie/Documents/repos/vscode-rhizome/.rhizome/don-socratic_persona.md`
- **Architecture doc:** `/Users/hallie/Documents/repos/vscode-rhizome/.rhizome/persona-ask-architecture.md`
- **Exploration summary:** `/Users/hallie/Documents/repos/vscode-rhizome/.rhizome/persona-llm-cli-exploration.md`
- **Extension entry:** `/Users/hallie/Documents/repos/vscode-rhizome/src/extension.ts` (line 64)
- **rhizome CLI main:** `/Users/hallie/Documents/repos/tools/rhizome/scripts/rhizome.py`

---

## Timeline

- **Phase 1:** 2-3 hours (hardest part: integrating Claude API)
- **Phase 2:** 1 hour (straightforward CLI bridge)
- **Phase 3:** 1 hour (wire existing command to backend)
- **Total:** 4-5 hours for working MVP

MVP complete: User can select code, ask don-socratic, get response in VSCode output channel.

