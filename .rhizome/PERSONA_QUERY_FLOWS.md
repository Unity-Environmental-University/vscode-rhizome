# Persona Query Flows: Complete Guide

## What Actually Happens: User Perspective

### Flow 1: Quick Picker (Command Palette)

**User sees:**
1. Opens command palette (Cmd+Shift+P)
2. Types "ask a persona"
3. Quick picker appears with 47 personas (0.5 sec)
4. Selects one (e.g., "code-reviewer")
5. Output pane opens
6. Waits 10-30 seconds
7. **Response appears in output pane** ✓

**User can:**
- Read the analysis
- Copy insights into code
- Run another persona query
- Close the pane

**File is:** Not modified

---

### Flow 2: Inline Comments (Right-Click)

**User sees:**
1. Selects code in editor
2. Right-clicks → "Ask a persona to document this"
3. Quick picker appears with 47 personas (0.5 sec)
4. Selects one (e.g., "una")
5. Progress notification: "Asking una to document your code..."
6. Waits 10-30 seconds
7. **Comments appear above code** ✓
8. Progress notification closes
9. File shows modified indicator (dot)

**User can:**
- Review the comments
- Edit them manually
- Save (Cmd+S) or undo (Cmd+Z)
- Ask different persona to document same code

**File is:** Modified (can undo or save)

---

## Two Ways to Ask a Persona

The vscode-rhizome extension has **two distinct command paths** for querying personas:

### 1. QUICK PICKER: `vscode-rhizome.askPersona`
**What it does:** Shows all available personas in a quick picker, lets you select one, displays response in output channel.

**How to trigger:**
- Command palette: `Cmd+Shift+P` → `Ask a persona`
- Requires: Selected text in editor

**Flow:**
```
1. Select code in editor
2. Command palette → "Ask a persona"
3. getAvailablePersonas() called
   ├─ Try: rhizome persona list --json
   ├─ Fallback: rhizome persona list (text)
   └─ Fallback: hardcoded list (5 personas)
4. Show quick picker with all personas
5. User picks persona (e.g., "bro")
6. Call askPersonaAboutSelection("bro")
   ├─ Initialize rhizome if needed
   ├─ Call queryPersona(code, "bro", 30000ms)
   │  └─ Executes: rhizome query --persona bro
   │     └─ Sends your code via stdin
   │     └─ Gets AI response back
   ├─ Format response in output channel
   └─ Show response in "vscode-rhizome" output pane
7. User sees persona's analysis of their code
```

**Log markers:**
```
[askPersona] Command invoked
[askPersona] Got selection, fetching personas
[getAvailablePersonas] ✓ JSON PATH: Got structured JSON
[getAvailablePersonas] Total personas found: 47
[askPersona] Available personas: [list of 47]
[askPersona] Showing quick picker
[askPersona] User picked: bro
[queryPersona] ========== QUERY START ==========
[queryPersona] Executing: rhizome query --persona bro
[queryPersona] SUCCESS: Got response from bro
```

**Response location:** Output channel named "vscode-rhizome"

---

### 2. INLINE COMMENTS: `vscode-rhizome.documentWithPersona`
**What it does:** Shows picker, asks persona to document code, **inserts formatted comments directly above selection**.

**How to trigger:**
- Right-click on selection → `Ask a persona to document this`
- Requires: Selected text in editor

**Flow:**
```
1. Select code in editor
2. Right-click → "Ask a persona to document this"
3. getAvailablePersonas() called (same as above)
   ├─ JSON parsing (47 personas)
   └─ Text fallback / hardcoded
4. Show quick picker with all personas
5. User picks persona (e.g., "una")
6. Command: vscode-rhizome.documentWithPersona handler
   ├─ Initialize rhizome if needed
   ├─ Build prompt: "Please provide clear documentation/comments for this code: [your code]"
   ├─ Call queryPersona(prompt, "una", 15000ms) with progress notification
   │  └─ Executes: rhizome query --persona una
   │     └─ Gets documentation response
   ├─ Detect language (Python, TypeScript, etc)
   ├─ Format response with correct comment syntax
   │  ├─ Python: # comment
   │  └─ TypeScript/JS: // comment
   ├─ Insert formatted comment above selected code
   └─ Update editor (shows modified indicator)
7. Comments appear in your file
```

**Log markers:**
```
[askPersona] Command invoked (from right-click menu)
[documentWithPersona] User cancelled persona selection
  OR
[documentWithPersona] Selected persona: una
[documentWithPersona] Querying persona with prompt length: XXX
[documentWithPersona] Calling queryPersona now...
[queryPersona] ========== QUERY START ==========
[queryPersona] Persona: una
[queryPersona] Executing: rhizome query --persona una
[queryPersona] SUCCESS: Got response from una
[documentWithPersona] Got response from persona: [preview]
[documentWithPersona] Language: typescript, Prefix: //
[documentWithPersona] Formatted comment: [preview]
[documentWithPersona] Insert position: Position {...}
```

**Response location:** Inserted directly into editor above selection

---

## Key Differences

| Aspect | Quick Picker | Inline Comments |
|--------|--------------|-----------------|
| **Entry point** | Command palette | Right-click context menu |
| **Persona list** | Shows all with descriptions | Shows all with descriptions |
| **Timeout** | 30 seconds | 15 seconds |
| **Prompt** | Your raw code | "Please document this code: [your code]" |
| **Response location** | Output channel | Inserted as comments in file |
| **Comment formatting** | No — shows raw response | Yes — auto-detected language |
| **Persona suitable for** | Analysis, questions, reviews | Documentation, comments |

---

## Testing Both Flows (F5 Debugger)

### Setup
```
1. Press F5 to open extension in test-workspace
2. Create a test file (test.ts or test.py)
3. Add some code to analyze
```

### Test Flow 1: Quick Picker

```typescript
// In test-workspace/test.ts
function add(a: number, b: number): number {
  return a + b;
}
```

**Steps:**
1. Select the function
2. `Cmd+Shift+P` → "Ask a persona"
3. Pick "dev-guide"
4. Wait 10-30 seconds
5. Check "vscode-rhizome" output pane for response

**Expected logs:**
```
[askPersona] Command invoked
[askPersona] User picked: dev-guide
[queryPersona] ========== QUERY START ==========
[queryPersona] Executing: rhizome query --persona dev-guide
[queryPersona] SUCCESS: Got response from dev-guide
[queryPersona] Response length: XXXX chars
```

**Expected result:**
- Output pane shows persona's analysis
- Format: header divider, persona name, code, response, footer divider

---

### Test Flow 2: Inline Comments

```python
# In test-workspace/test.py
def multiply(x, y):
    return x * y
```

**Steps:**
1. Select the function
2. Right-click → "Ask a persona to document this"
3. Pick "una"
4. Wait 10-30 seconds
5. Check file — comments should appear above function

**Expected logs:**
```
[documentWithPersona] Selected persona: una
[documentWithPersona] Querying persona with prompt length: XXX
[documentWithPersona] Calling queryPersona now...
[queryPersona] ========== QUERY START ==========
[queryPersona] Executing: rhizome query --persona una
[queryPersona] SUCCESS: Got response from una
[documentWithPersona] Got response from persona: ...
[documentWithPersona] Language: python, Prefix: #
[documentWithPersona] Formatted comment: [preview]
[documentWithPersona] Insert position: Position {...}
```

**Expected result:**
```python
# Generated comments from una
# explaining what the function does

def multiply(x, y):
    return x * y
```

---

## The Complete `queryPersona()` Function

Both flows use the same underlying `queryPersona()` function. Here's what it does:

### Input
```typescript
queryPersona(
  text: string,           // Your selected code
  persona: string,        // Persona name (e.g., "bro")
  timeoutMs: number,      // Timeout in milliseconds
  workspaceRoot?: string  // Workspace path (critical!)
): Promise<string>
```

### Process
```
1. Check if API key available (rhizome queries may need OpenAI key)
2. Execute: rhizome query --persona {persona}
   ├─ Input: your code via stdin
   ├─ CWD: workspaceRoot (so rhizome finds .rhizome/)
   ├─ Timeout: specified timeout
   └─ Capture: stdout (response) and stderr (errors)
3. On success: return persona's response
4. On error: detect error type
   ├─ Rhizome dependency issue? → suggest pip install pyyaml
   ├─ Rhizome not found? → suggest installation
   ├─ Other? → return error message
```

### Logging Details
Every `queryPersona()` call logs:
```
[queryPersona] ========== QUERY START ==========
[queryPersona] Persona: {persona_name}
[queryPersona] Timeout: {timeoutMs}ms
[queryPersona] Workspace: {cwd}
[queryPersona] Input length: {text.length} chars
[queryPersona] Executing: rhizome query --persona {persona}
  ...
[queryPersona] SUCCESS: Got response from {persona}
[queryPersona] Response length: {response.length} chars
[queryPersona] Response preview: {first 200 chars}...
```

---

## Persona Selection Strategy (getAvailablePersonas)

Both flows use the same persona fetching, which now works like this:

### Three-Tier Strategy
```
Tier 1: Try JSON (modern rhizome)
├─ Command: rhizome persona list --json
├─ Parse: JSON object with {name: {role, source}}
├─ Success: Use these 37+ personas ✓
└─ Fail: Try tier 2

Tier 2: Try text (older rhizome)
├─ Command: rhizome persona list
├─ Parse: Regex on "  name | role: ... | source: ..."
├─ Success: Use these personas ✓
└─ Fail: Try tier 3

Tier 3: Hardcoded fallback (no rhizome)
├─ Use 5 core personas:
│  ├─ don-socratic
│  ├─ dev-guide
│  ├─ code-reviewer
│  ├─ ux-advocate
│  └─ dev-advocate
└─ Always available as safety net
```

### Logs Show Which Path
```
[getAvailablePersonas] ✓ JSON PATH: Got structured JSON
[getAvailablePersonas] ========== FETCH PERSONAS END (JSON PATH - SUCCESS) ==========
  → You're using modern rhizome with --json

[getAvailablePersonas] JSON parsing failed, trying text format
[getAvailablePersonas] Raw output length: XXXX chars
[getAvailablePersonas] ========== FETCH PERSONAS END (TEXT FALLBACK) ==========
  → You're using older rhizome, text parsing fallback

[getAvailablePersonas] ERROR fetching personas
[getAvailablePersonas] Falling back to hardcoded personas
[getAvailablePersonas] ========== FETCH PERSONAS END (FALLBACK) ==========
  → Rhizome missing/broken, using 5 core personas
```

---

## Visual Comparison: Side by Side

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    QUICK PICKER vs INLINE COMMENTS                      │
├────────────────────────────┬─────────────────────────────────────────────┤
│      QUICK PICKER          │          INLINE COMMENTS                    │
├────────────────────────────┼─────────────────────────────────────────────┤
│                            │                                             │
│ 1. Cmd+Shift+P             │ 1. Right-click on selection                 │
│ 2. "Ask a persona"         │ 2. "Ask a persona to document this"         │
│ 3. Pick from 47            │ 3. Pick from 47                             │
│ 4. Output pane opens       │ 4. Progress notification                    │
│ 5. Wait 10-30 sec          │ 5. Wait 10-30 sec                           │
│ 6. Response in pane        │ 6. Comments in file                         │
│                            │ 7. File marked modified                     │
│                            │                                             │
│ ┌────────────────────────┐ │ ┌─────────────────────────────────────┐    │
│ │ vscode-rhizome        │ │ │ // Clear documentation comment       │    │
│ ├────────────────────────┤ │ │ // generated by una persona          │    │
│ │ code-reviewer          │ │ │ // explaining what this function does│    │
│ │ ════════════════════ │ │ │ function multiply(x, y) {             │    │
│ │ Selected code:         │ │ │   return x * y;                      │    │
│ │ function add(a, b) {.. │ │ │ }                                    │    │
│ │                        │ │ │ (file is modified)                   │    │
│ │ ════════════════════ │ │ └─────────────────────────────────────┘    │
│ │ Response:              │ │                                             │
│ │ This is straightfwd... │ │ User can:                                   │
│ │                        │ │ - Review comments                           │
│ │ Code review points:    │ │ - Edit them                                 │
│ │ 1. Simple/readable     │ │ - Save (Cmd+S)                              │
│ │ 2. Good names (a, b)   │ │ - Undo (Cmd+Z)                              │
│ │ 3. Edge cases?         │ │                                             │
│ │ 4. Type safety?        │ │                                             │
│ └────────────────────────┘ │                                             │
│                            │                                             │
│ User can:                  │                                             │
│ - Read analysis            │                                             │
│ - Copy-paste insights      │                                             │
│ - Keep history             │                                             │
│ - Ask other personas       │                                             │
├────────────────────────────┼─────────────────────────────────────────────┤
│ Best for:                  │ Best for:                                   │
│ - Code reviews             │ - Documentation                             │
│ - Questions/analysis       │ - Inline comments                           │
│ - Learning why             │ - Explaining to others                      │
│                            │ - Building context                          │
├────────────────────────────┼─────────────────────────────────────────────┤
│ Response stays in:         │ Response becomes:                           │
│ - Output pane (separate)   │ - Part of your file                         │
│ - Viewable indefinitely    │ - Can be edited/saved                       │
│ - Non-intrusive            │ - Version control friendly                  │
├────────────────────────────┼─────────────────────────────────────────────┤
│ File: Not modified         │ File: Modified (can undo)                   │
│ Clipboard: Nothing changed │ Clipboard: Nothing changed                  │
└────────────────────────────┴─────────────────────────────────────────────┘
```

---

## Verification Checklist

### Quick Picker Actually Worked?
- [ ] Selected code before opening command palette
- [ ] Output pane labeled "vscode-rhizome" opened
- [ ] Persona response appeared (not empty)
- [ ] Response contains analysis of your code
- [ ] Took 10-30 seconds (not instant, not timeout)

### Inline Comments Actually Worked?
- [ ] Selected code before right-clicking
- [ ] Saw progress notification "Asking {persona}..."
- [ ] Notification disappeared (success) or error shown
- [ ] Comments appeared above your selected code
- [ ] File shows dot (modified indicator) in tab
- [ ] Comments have proper language syntax (// or #)
- [ ] Can Cmd+Z to undo if needed

### Persona List Loaded Correctly?
- [ ] Quick picker showed 40+ personas (not just 5)
- [ ] Personas included: don-socratic, dev-guide, bro, una, code-reviewer
- [ ] Each persona had role description
- [ ] Could filter by typing (e.g., "code" → shows code-reviewer)

---

## Troubleshooting: Persona Queries Not Working

### Symptom 1: Picker shows 0 personas
**Cause:** All three getAvailablePersonas tiers failed
**Check logs:**
```
[getAvailablePersonas] Total personas found: 0
```
**Solutions:**
1. Is rhizome installed? `which rhizome`
2. Is it in PATH? `echo $PATH`
3. Run health check: `vscode-rhizome.healthCheck` command

### Symptom 2: Picker shows personas, but query hangs
**Cause:** `rhizome query --persona` is hanging
**Check logs:**
```
[queryPersona] Executing: rhizome query --persona bro
  ... (no SUCCESS log)
  ... (then timeout)
```
**Solutions:**
1. Run rhizome manually: `echo "test" | rhizome query --persona bro`
2. Check for API key: `cat ~/.rhizome/config.json | grep openai_key`
3. Run diagnosis: `vscode-rhizome.diagnoseEnvironment` command

### Symptom 3: Query responds but wrong format
**Cause:** Comment formatting failed (inline only)
**Check logs:**
```
[documentWithPersona] Language: {language}, Prefix: {prefix}
[documentWithPersona] Formatted comment: [check this]
```
**Solutions:**
1. Verify file extension (.ts, .py, etc)
2. Check language detection in `detectLanguage()` function
3. File a bug with language + code example

---

## Integration Test Verification

Run the integration tests to verify both flows work:

```bash
npm test
```

Look for:
```
Persona List Integration (F5 Debugger Style)
  ✓ should parse real rhizome persona list --json output
  ✓ should fall back to text parsing if --json is unavailable
  ✓ should handle gracefully if both JSON and text parsing fail
  ✓ should match personas between JSON and text formats

57 passing (2s)
```

These tests verify:
- JSON parsing works with real rhizome
- Text fallback works
- Hardcoded personas ready
- Format consistency

---

## Summary: What "Actually Asking" Means

**Quick Picker:**
```
Select code
  ↓
Ask persona (Cmd+Shift+P)
  ↓
See response in output pane
```

**Inline Comments:**
```
Select code
  ↓
Right-click → Document this
  ↓
Comments inserted in file
```

Both use the same `queryPersona()` function, which:
```
Calls: rhizome query --persona {name}
Sends: your code
Gets: AI response
Shows: in output pane OR inserts as comments
```

If you see these logs, the persona query **actually happened**:
```
[queryPersona] Executing: rhizome query --persona bro
[queryPersona] SUCCESS: Got response from bro
[queryPersona] Response length: XXXX chars
```

Otherwise, you're just testing the picker, not the query.
