# Telemetry Logging Guide

**Last Updated:** Oct 28, 2025
**Status:** Steps 1-5 complete. Telemetry logging implemented in all major workflows.
**Flight Plan:** fp-1761682847

## What This Document Is

This guide explains the structured telemetry logging that has been added to vscode-rhizome to help developers debug persona workflows step-by-step.

## The Telemetry Format

All telemetry follows this pattern:

```
[COMPONENT] PHASE: MESSAGE | { optional data }
```

**COMPONENT:** Identifies which subsystem is logging
- `[WORKFLOW]` — Main command handlers (askPersona, documentWithPersona)
- `[PERSONAS]` — Getting available personas (rhizome persona list)
- `[QUERY]` — Querying a persona (rhizome query --persona X)
- `[APIKEY]` — API key checking and availability

**PHASE:** Stage of the operation
- `START` — Operation beginning (initial context)
- `STEP` — Progress within the operation (intermediate steps)
- `SUCCESS` — Operation completed successfully
- `ERROR` — Operation failed with error details
- `RESULT` — Final output or summary

## Workflows Covered

### 1. Ask Persona Workflow (Quick Picker Flow)

**File:** `src/extension.ts:askPersona` (commands.ts:380-442)

**Telemetry Trail:**
```
[WORKFLOW] START: User asked persona
[WORKFLOW] STEP: Selection obtained (245 chars)
[WORKFLOW] STEP: Personas loaded (47 total)
[WORKFLOW] STEP: Persona picker opened
[WORKFLOW] STEP: Persona picked (dev-guide)
[WORKFLOW] STEP: Query started
[APIKEY] START: Checking API key availability
[APIKEY] STEP: Checking environment variables...
[APIKEY] RESULT: No API key found in any location
[QUERY] START: Query to persona: dev-guide
[QUERY] STEP: Init phase: checking configuration
[QUERY] STEP: Checking API key availability...
[QUERY] STEP: API key confirmed available
[QUERY] STEP: Execute phase: running rhizome query
[QUERY] STEP: Executing: rhizome query --persona dev-guide
[QUERY] STEP: Execute phase completed successfully
[QUERY] STEP: Format phase: preparing response
[QUERY] RESULT: Query completed successfully
[QUERY] SUCCESS: Query returned result ready for formatting
[WORKFLOW] STEP: Response formatted (1235 chars)
[WORKFLOW] SUCCESS: Query result shown to user
```

**What Each Step Means:**

1. **WORKFLOW START** — User triggered command
2. **WORKFLOW STEP** — Code selection captured and validated
3. **PERSONAS START** — Fetching available personas from rhizome
4. **PERSONAS STEP** — Trying JSON format first (modern rhizome)
5. **PERSONAS SUCCESS** — Got list back (or fallback if both formats fail)
6. **QUERY START** — About to query a persona
7. **APIKEY STEP** — Checking if API key is configured
8. **QUERY STEP** — API check result (found/not found)
9. **QUERY STEP** — Running rhizome query command
10. **QUERY SUCCESS** — Got response back (length matters: if it's empty, something failed)
11. **WORKFLOW SUCCESS** — User sees the result

### 2. Document With Persona Workflow (Inline Comments Flow)

**File:** `src/extension.ts:documentWithPersona` (commands.ts:445-528)

**Telemetry Trail:**
```
[WORKFLOW] START: User asked to document code
[WORKFLOW] STEP: Selection obtained (156 chars)
[WORKFLOW] STEP: Personas loaded (47 total)
[WORKFLOW] STEP: Persona picker opened
[WORKFLOW] STEP: Persona picked (code-reviewer)
[WORKFLOW] STEP: Detected language: typescript
[WORKFLOW] STEP: Query started
[QUERY] START: Query to persona: code-reviewer
[QUERY] STEP: Init phase: checking configuration
[QUERY] STEP: Execute phase: running rhizome query
[QUERY] STEP: Executing: rhizome query --persona code-reviewer
[QUERY] STEP: Execute phase completed successfully
[QUERY] STEP: Format phase: preparing response
[QUERY] RESULT: Query completed successfully
[QUERY] SUCCESS: Query returned result ready for formatting
[WORKFLOW] STEP: Comments inserted (line 45)
[WORKFLOW] SUCCESS: Code documented inline
```

### 3. Get Available Personas

**File:** `src/extension.ts:getAvailablePersonas` (line 232)

**Expected Telemetry (JSON path - success):**
```
[PERSONAS] START: Fetching available personas from rhizome
[PERSONAS] STEP: Workspace context
[PERSONAS] STEP: Attempting JSON format first
[PERSONAS] STEP: JSON command succeeded
[PERSONAS] STEP: Parsing 7 personas from JSON
[PERSONAS] STEP: Parsed persona: dev-guide
[PERSONAS] STEP: Parsed persona: code-reviewer
... (more personas)
[PERSONAS] SUCCESS: All personas loaded successfully via JSON path
```

**If JSON fails (fallback to text):**
```
[PERSONAS] STEP: JSON path failed, falling back to text format
[PERSONAS] STEP: Text command succeeded
[PERSONAS] STEP: Parsing 52 lines from text output
[PERSONAS] STEP: Parsed persona: dev-guide
... (more personas)
[PERSONAS] STEP: Could not parse line (skipped)
[PERSONAS] SUCCESS: All personas loaded successfully via text fallback
```

**If both fail (hardcoded fallback):**
```
[PERSONAS] ERROR: Failed to fetch personas from rhizome
[PERSONAS] STEP: Rhizome dependency issue detected
[PERSONAS] STEP: Using hardcoded fallback personas
[PERSONAS] SUCCESS: Fallback personas loaded
```

### 4. Query Persona (Core Operation)

**File:** `src/extension.ts:queryPersona` (line 52)

**Phases (in order):**

1. **INIT Phase:** Setup and API key check
   ```
   [QUERY] START: Query to persona: dev-guide
   [QUERY] STEP: Init phase: checking configuration
   [QUERY] STEP: Checking API key availability...
   [QUERY] STEP: API key confirmed available
   ```

2. **EXECUTE Phase:** Run rhizome query command
   ```
   [QUERY] STEP: Execute phase: running rhizome query
   [QUERY] STEP: Executing: rhizome query --persona dev-guide
   [QUERY] STEP: Execute phase completed successfully
   ```

3. **FORMAT Phase:** Prepare response
   ```
   [QUERY] STEP: Format phase: preparing response
   ```

4. **RESULT Phase:** Return result
   ```
   [QUERY] RESULT: Query completed successfully
   [QUERY] SUCCESS: Query returned result ready for formatting
   ```

**If timeout occurs:**
```
[QUERY] ERROR: Timeout: Query to dev-guide exceeded 30000ms
[QUERY] STEP: Possible timeout causes:
  - Missing API key
  - API is slow or unreachable
  - Persona has circular dependency
  - Python module missing
```

**If error in execution:**
```
[QUERY] ERROR: Execute phase failed
[QUERY] STEP: Rhizome dependency issue detected
[QUERY] STEP: Recommendation: Run "pip install pyyaml"
```

### 5. Check API Key Availability

**File:** `src/extension.ts:checkApiKeyAvailable` (line 145)

**Successful path (env var found):**
```
[APIKEY] START: Checking API key availability
[APIKEY] STEP: Checking environment variables for API keys
[APIKEY] SUCCESS: Found API key in environment
```

**Config file path:**
```
[APIKEY] STEP: Checking rhizome config file
[APIKEY] STEP: Config file exists, checking for API key fields
[APIKEY] SUCCESS: Found ai.openai_key in config
```

**No key found anywhere:**
```
[APIKEY] STEP: Checking environment variables...
[APIKEY] STEP: No API keys found in environment
[APIKEY] STEP: Checking rhizome config file...
[APIKEY] STEP: Could not read rhizome config via CLI
[APIKEY] RESULT: No API key found in any location
```

## How to Read Telemetry

Open VS Code console and run the command:
1. Press `Ctrl+Shift+P` (Cmd+Shift+P on Mac)
2. Type: `Developer: Toggle Developer Tools`
3. Click the "Console" tab
4. Look for logs starting with `[COMPONENT]`

## Debugging Guide

### Issue: "Got timeout after 30 seconds"

**Check logs for:**
1. `[APIKEY] RESULT: No API key found` → Configure API key
2. `[QUERY] ERROR: Timeout` → API is too slow or unreachable
3. `[QUERY] STEP: Python module missing` → Install dependencies

### Issue: "No personas loaded"

**Check logs for:**
1. `[PERSONAS] ERROR: Failed to fetch personas` → Look at stderr
2. `[PERSONAS] SUCCESS: Fallback personas loaded` → Fallback working (rhizome unavailable)
3. `[PERSONAS] STEP: Rhizome dependency issue detected` → Install pyyaml

### Issue: "Query returned empty response"

**Check logs for:**
1. `[QUERY] STEP: Execute phase completed successfully` ✓
2. `[QUERY] RESULT: Query completed successfully` ✓
3. But response length in logs? If 0 chars, persona returned nothing

### Issue: "Query to specific persona hangs"

**Check logs for:**
1. `[QUERY] START: Query to persona: X` ✓
2. Then nothing for 30+ seconds → Timeout occurs
3. Check `[APIKEY]` logs: Did it find the API key?
4. Check `[QUERY] ERROR: Timeout` → Message explains causes

## The Data Objects

When telemetry includes optional `data`, here's what each field means:

**For getAvailablePersonas:**
- `count: 7` → Number of personas loaded
- `list: ["dev-guide", "code-reviewer"]` → Persona names
- `parsedLines: 52` → For text fallback, how many lines parsed

**For queryPersona:**
- `persona: "dev-guide"` → Which persona was queried
- `timeoutMs: 30000` → Timeout in milliseconds
- `inputLength: 245` → How long was the code selection (chars)
- `responseLength: 1235` → How long was the response (chars)
- `error: "..."` → Error message if operation failed

**For checkApiKeyAvailable:**
- `workspace: "/path/to/workspace"` → Where we're looking
- `key: "OPENAI_API_KEY"` → Which API key was found
- `error: "..."` → Error reading config file

## End-to-End Test Scenarios

### Scenario 1: Happy Path (JSON + API Key)
```
Expected logs:
- [WORKFLOW] START
- [PERSONAS] STEP: JSON command succeeded
- [APIKEY] SUCCESS: Found API key
- [QUERY] STEP: Execute phase completed
- [WORKFLOW] SUCCESS
```

### Scenario 2: Fallback Path (Text + Env Var)
```
Expected logs:
- [PERSONAS] STEP: JSON path failed, falling back
- [PERSONAS] SUCCESS: All personas loaded via text fallback
- [APIKEY] SUCCESS: Found in environment
- [QUERY] SUCCESS
```

### Scenario 3: All Failures (Hardcoded Fallback)
```
Expected logs:
- [PERSONAS] ERROR: Failed to fetch
- [PERSONAS] SUCCESS: Fallback personas loaded (5 personas)
- [APIKEY] RESULT: No API key found
- [QUERY] WARNING: No API key found (query may fail)
- [QUERY] ERROR: Query failed
```

## How Telemetry Helps Debugging

The telemetry logs form a **complete trail** of what happened:

1. **You can see exactly where failures occur** — Not just "it failed" but "it failed at query execution because..."
2. **You can see the data at each step** — Response lengths, persona names, error messages
3. **You can distinguish user errors from system errors** — No API key? Missing Python module? Both reported clearly
4. **You can replay the entire workflow** — Following the log chronologically shows the exact sequence

## Recording Your Test Results

When testing the end-to-end flows (Step 6), capture:

1. **User action** — e.g., "Right-click on selection, choose 'Ask persona'"
2. **Telemetry trail** — Copy from console
3. **Result** — Did it work? Was response shown?
4. **Edge cases tested:**
   - No API key configured
   - No rhizome installed
   - Text fallback (JSON unavailable)
   - Timeout scenarios

---

*This guide is part of vscode-rhizome's comprehensive telemetry system.*
*For more context, see CLAUDE.md and the flight plan fp-1761682847.*
