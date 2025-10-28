# vscode-rhizome Logging & Debugging Guide

**Last Updated:** Oct 28, 2025
**Purpose:** Complete guide to logging, API key checking, and persona availability

## Quick Start: How to See Logs

1. Open the extension in debug mode: **F5**
2. Open Debug Console: **Cmd+Shift+U** (or **View > Debug Console**)
3. All logs start with `[module.function]` format for easy searching

## Logging Categories

### `[vscode-rhizome]` - Extension Lifecycle

**When:** Extension starts and stops
**What to look for:** Activation status, available personas at startup

**Startup output:**
```
[vscode-rhizome] ========== ACTIVATION START ==========
[vscode-rhizome] Activation starting
[vscode-rhizome] Local bin path ensured
[vscode-rhizome] Fetching available personas on startup...
[vscode-rhizome] ========== AVAILABLE PERSONAS AT STARTUP ==========
[vscode-rhizome] Total: 50 personas
[vscode-rhizome]   - don-socratic: Socratic questioning
[vscode-rhizome]   - dev-guide: Mentor: What were you trying to accomplish?
[vscode-rhizome]   - ux-advocate: Curator: Have we watched someone use this?
... (all 50 personas listed)
[vscode-rhizome] ========== ACTIVATION COMPLETE ==========
[vscode-rhizome] Ready to use! Open Debug Console (Cmd+Shift+U) to see activity logs.
```

**If you see:** `[vscode-rhizome] ERROR fetching personas on startup`
**Then check:** Is rhizome installed? (`rhizome --version` in terminal)

---

### `[getAvailablePersonas]` - Fetching Personas

**When:** Called on startup and before showing persona picker
**What it logs:**
- Where it's looking (workspace path)
- Command being executed (`rhizome persona list`)
- Raw output from rhizome
- How many personas were parsed
- Falls back to hardcoded list if rhizome fails

**Success output:**
```
[getAvailablePersonas] ========== FETCH PERSONAS START ==========
[getAvailablePersonas] Workspace: /Users/hallie/Documents/repos/vscode-rhizome
[getAvailablePersonas] Executing: rhizome persona list
[getAvailablePersonas] Raw output length: 1234 chars
[getAvailablePersonas] Raw output:
don-socratic         | role: Socratic questioning | source: ...
dev-guide            | role: Mentor: What were you trying to accomplish? | source: ...
... (all personas)
[getAvailablePersonas] Total lines in output: 52
[getAvailablePersonas] Parsed: don-socratic => Socratic questioning
[getAvailablePersonas] Parsed: dev-guide => Mentor: What were you trying to accomplish?
... (all parsed)
[getAvailablePersonas] ========== FETCH PERSONAS END (SUCCESS) ==========
[getAvailablePersonas] Total personas found: 50
[getAvailablePersonas] Personas list: don-socratic, dev-guide, code-reviewer, ux-advocate, ...
```

**Error output (fallback):**
```
[getAvailablePersonas] ERROR fetching personas: Command failed: rhizome persona list
[getAvailablePersonas] stderr: <error details>
[getAvailablePersonas] Falling back to hardcoded personas
[getAvailablePersonas] ========== FETCH PERSONAS END (FALLBACK) ==========
[getAvailablePersonas] Fallback personas: don-socratic, dev-guide, code-reviewer, ux-advocate, dev-advocate
```

---

### `[checkApiKeyAvailable]` - API Key Detection

**When:** Before calling `queryPersona()`
**What it checks:**
1. Environment variables: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `RHIZOME_API_KEY`
2. Config file at: `<workspace>/.rhizome/config.json`
3. Tries `rhizome config get ai` command

**Output:**
```
[checkApiKeyAvailable] Checking API key in workspace: /Users/hallie/Documents/repos/vscode-rhizome
[checkApiKeyAvailable] Checking API key in workspace: /Users/hallie/Documents/repos/vscode-rhizome
[checkApiKeyAvailable] No API keys in environment variables
[checkApiKeyAvailable] Checking config at: /Users/hallie/Documents/repos/vscode-rhizome/.rhizome/config.json
[checkApiKeyAvailable] Config exists. Checking for API keys...
[checkApiKeyAvailable] Config structure: { "ai": { "provider": "openai", "model": "gpt-4o-mini" } }
[checkApiKeyAvailable] Config found but no API key field detected
[checkApiKeyAvailable] Attempting to read rhizome config via CLI...
[checkApiKeyAvailable] rhizome config output: ai.openai_key=sk-proj-xxxxx
[checkApiKeyAvailable] Found key reference in rhizome config
[checkApiKeyAvailable] RESULT: API key found
```

**If NO API key found:**
```
[checkApiKeyAvailable] No API keys in environment variables
[checkApiKeyAvailable] No config file found at /workspace/.rhizome/config.json
[checkApiKeyAvailable] Could not read rhizome config: Command failed: rhizome config get ai
[checkApiKeyAvailable] RESULT: No API key found
```

⚠️ **WARNING:** If no API key is found and you query a persona, it will **hang or timeout**!

**To fix:**
```bash
# Set env var
export OPENAI_API_KEY=sk-proj-xxxxx

# OR add to .rhizome/config.json
{
  "ai": {
    "provider": "openai",
    "openai_key": "sk-proj-xxxxx"
  }
}
```

---

### `[queryPersona]` - Executing Persona Queries

**When:** User clicks "Ask a persona to document this" or uses `@rhizome ask` autocomplete
**What it logs:**
- Which persona is being queried
- Workspace being used
- Timeout value
- API key availability
- Exact command being executed
- Response length and preview
- Total execution time
- Any errors

**Success output:**
```
[queryPersona] ========== QUERY START ==========
[queryPersona] Persona: ux-advocate
[queryPersona] Timeout: 30000ms
[queryPersona] Workspace: /Users/hallie/Documents/repos/vscode-rhizome
[queryPersona] Input length: 456 chars

[queryPersona] Checking API key availability...
[checkApiKeyAvailable] ... (see above)
[queryPersona] WARNING: No API key found. Query may fail or hang if persona requires API.

[queryPersona] Executing: rhizome query --persona ux-advocate
[queryPersona] CWD: /Users/hallie/Documents/repos/vscode-rhizome

[queryPersona] SUCCESS: Got response from ux-advocate
[queryPersona] Response length: 234 chars
[queryPersona] Response preview: Have you considered how developers will discover this feature? The persona comments feature is great, but if users don't see the menu option...

[queryPersona] ========== QUERY END (SUCCESS) ==========
```

**Timeout output (CRITICAL):**
```
[queryPersona] ========== QUERY START ==========
[queryPersona] Persona: ux-advocate
[queryPersona] Timeout: 30000ms
[queryPersona] Workspace: /Users/hallie/Documents/repos/vscode-rhizome
[queryPersona] Input length: 456 chars

[queryPersona] Checking API key availability...
[checkApiKeyAvailable] RESULT: No API key found

[queryPersona] WARNING: No API key found. Query may fail or hang if persona requires API.

[queryPersona] Executing: rhizome query --persona ux-advocate
[queryPersona] CWD: /Users/hallie/Documents/repos/vscode-rhizome

[queryPersona] TIMEOUT: Query to ux-advocate exceeded 30000ms
[queryPersona] ========== QUERY END (ERROR) ==========
[queryPersona] Final error detail: Query to ux-advocate timed out after 30000ms. Persona may be slow or API key may be missing/invalid.
```

⚠️ **If you see timeout:** Check API key availability (see above)

---

### `[documentWithPersona]` - Documentation Command

**When:** User right-clicks selected code and chooses "Ask a persona to document this"
**What it logs:**
- Code selection details
- Persona picker state
- Which persona was selected
- Workspace and timeout
- Query execution details
- Comment formatting
- Edit application

**Complete workflow:**
```
[documentWithPersona] Command invoked
[documentWithPersona] Selected text: export function findStubComments(...

[documentWithPersona] ========== ABOUT TO FETCH PERSONAS ==========
[getAvailablePersonas] ========== FETCH PERSONAS START ==========
... (see getAvailablePersonas logs above)
[documentWithPersona] Available personas: don-socratic,dev-guide,code-reviewer,ux-advocate,dev-advocate

[documentWithPersona] User presented with quick picker (5 options)
[documentWithPersona] Selected persona: ux-advocate

[documentWithPersona] Rhizome initialized
[documentWithPersona] Querying persona with prompt length: 523

[documentWithPersona] ========== ABOUT TO CALL QUERY PERSONA ==========
[documentWithPersona] Persona: ux-advocate
[documentWithPersona] Workspace: /Users/hallie/Documents/repos/vscode-rhizome
[documentWithPersona] Timeout: 30000ms
[documentWithPersona] NOW CALLING: queryPersona(prompt, "ux-advocate", 30000, "/Users/hallie/Documents/repos/vscode-rhizome")

[queryPersona] ========== QUERY START ==========
... (see queryPersona logs above)
[queryPersona] ========== QUERY END (SUCCESS) ==========

[documentWithPersona] Query completed in 1234ms
[documentWithPersona] Got response from persona: Have you considered how developers will discover...

[documentWithPersona] Language: typescript Prefix: //
[documentWithPersona] Formatted comment: // Have you considered how developers will...

[documentWithPersona] Insert position: Position { line: 42, character: 0 }
[documentWithPersona] Applying edit...
[documentWithPersona] Edit applied successfully
```

---

## Common Issues & How to Debug

### Issue 1: `ux-advocate` Hangs (Times Out)

**Symptoms:**
- Extension freezes when querying `ux-advocate`
- Other personas work fine
- Console shows `TIMEOUT: Query to ux-advocate exceeded 30000ms`

**Debug steps:**
1. Check API key:
   ```bash
   echo $OPENAI_API_KEY
   # If empty, set it:
   export OPENAI_API_KEY=sk-proj-xxxxx
   ```

2. Test directly:
   ```bash
   rhizome query --persona don-socratic <<< "test"  # This should work instantly
   rhizome query --persona ux-advocate <<< "test"   # Does this hang?
   ```

3. Check console logs:
   - Look for `[checkApiKeyAvailable] RESULT: No API key found`
   - Look for `[queryPersona] WARNING: No API key found`

4. If ux-advocate still hangs with API key:
   - It might be a persona inheritance issue
   - Try: `rhizome query --persona una <<< "test"` (parent of ux-advocate)

### Issue 2: Persona List Not Showing

**Symptoms:**
- Quick picker is empty when you right-click "Ask a persona to document this"
- Console shows no personas

**Debug steps:**
1. Check console for:
   ```
   [vscode-rhizome] ========== AVAILABLE PERSONAS AT STARTUP ==========
   ```
   If missing, extension didn't start properly.

2. Check if fallback was used:
   ```
   [getAvailablePersonas] Falling back to hardcoded personas
   ```
   This means `rhizome persona list` failed. Try:
   ```bash
   rhizome persona list
   ```

3. Verify rhizome is installed:
   ```bash
   rhizome --version
   ```

### Issue 3: Extension Crashes/Won't Start

**Symptoms:**
- F5 doesn't open extension
- Errors in terminal

**Debug steps:**
1. Check console during activation:
   ```
   [vscode-rhizome] ========== ACTIVATION START ==========
   [vscode-rhizome] Activation starting
   ```
   Does this appear?

2. Check for TypeScript errors:
   ```bash
   npm run typecheck
   ```

3. Rebuild:
   ```bash
   npm run esbuild
   ```

---

## Log Format Reference

All logs follow this pattern:
```
[module.function] Message here
```

**Modules:**
- `[vscode-rhizome]` — Extension lifecycle
- `[getAvailablePersonas]` — Fetching personas list
- `[checkApiKeyAvailable]` — Checking for API keys
- `[queryPersona]` — Making a persona query
- `[documentWithPersona]` — Documentation command
- `[autocomplete]` — @rhizome ask autocomplete
- `[askPersona]` — Ask persona command

**Special markers:**
- `========== START ==========` — Operation beginning
- `========== END (SUCCESS) ==========` — Operation succeeded
- `========== END (ERROR) ==========` — Operation failed
- `========== END (FALLBACK) ==========` — Using fallback/default
- `ERROR` — An error occurred
- `WARNING` — Something might go wrong
- `TIMEOUT` — Operation exceeded time limit

---

## Collecting Logs for Support

To report an issue, include:

1. **When** the problem occurred
2. **What** you were doing (right-clicking, typing, etc.)
3. **Debug console output** (F5, then Cmd+Shift+U, copy/paste everything)
4. **Terminal output** (if you ran `rhizome` commands)
5. **API key status** (yes/no, not the actual key!)

Example bug report:
```
When I try to ask ux-advocate to document my code, the extension hangs.

Debug Console shows:
[queryPersona] TIMEOUT: Query to ux-advocate exceeded 30000ms
[checkApiKeyAvailable] RESULT: No API key found

I have OPENAI_API_KEY set in my shell.
```

---

## Using Logs to Understand Flow

### The Happy Path (Everything Works)

```
[vscode-rhizome] Activation starting
  → [getAvailablePersonas] Fetch personas
    → [vscode-rhizome] Show personas list

User selects persona
  → [documentWithPersona] Command invoked
    → [checkApiKeyAvailable] Check API key
    → [queryPersona] Execute query
      → [queryPersona] Got response
    → [documentWithPersona] Format and insert comment
```

### The Error Path (What Goes Wrong)

```
[vscode-rhizome] Activation starting
  → [getAvailablePersonas] ERROR fetching personas
    → Falls back to hardcoded 5 personas
    → User can still pick from fallback

User selects persona
  → [documentWithPersona] Command invoked
    → [checkApiKeyAvailable] No API key found ⚠️
    → [queryPersona] Execute query
      → [queryPersona] TIMEOUT ❌
      → Error shown to user
```

---

## Next Steps

1. **Open Debug Console:** F5, then Cmd+Shift+U
2. **Trigger the feature:** Right-click code, select "Ask a persona to document this"
3. **Watch the logs:** They'll tell you exactly what's happening
4. **Check for:** `WARNING` and `ERROR` messages
5. **If stuck:** Look for the `[module] =========` markers to find where it's hanging

**Any hanging points will show:** `[module] NOW CALLING:` followed by silence = it's stuck there
