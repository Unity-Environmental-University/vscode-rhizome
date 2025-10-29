# F5 Debugging Workflow: Telemetry-Enabled

**Updated:** Oct 28, 2025
**Context:** Extension debugging with automatic telemetry timestamps

## What Happens When You Press F5

When you press **F5** in VS Code to debug vscode-rhizome:

1. **Build task runs** — `npm run esbuild` compiles TypeScript → JavaScript
2. **Extension Host launches** — Opens test-workspace in debug mode
3. **RHIZOME_DEBUG=true set** — Automatically enabled in launch.json
4. **Telemetry captures timestamps** — All logs include [HH:MM:SS.mmm] prefix
5. **Debug Console opens** — Shows all console.log and console.error output

## The Debug Console Experience

### Example: Asking a persona (F5 + right-click "Ask persona")

**Without F5 (normal use):**
```
[WORKFLOW] START: User asked persona
[WORKFLOW] STEP: Selection obtained (245 chars)
[PERSONAS] START: Fetching available personas
[PERSONAS] STEP: Attempting JSON format first
```

**With F5 (debug mode):**
```
[12:34:56.123] [WORKFLOW] START: User asked persona
[12:34:56.125] [WORKFLOW] STEP: Selection obtained (245 chars)
[12:34:56.126] [PERSONAS] START: Fetching available personas
[12:34:56.127] [PERSONAS] STEP: Attempting JSON format first
[12:34:56.189] [PERSONAS] SUCCESS: All personas loaded (7 total)
[12:34:56.191] [WORKFLOW] STEP: Persona picker opened
[12:34:57.234] [WORKFLOW] STEP: Persona picked (dev-guide)
[12:34:57.235] [QUERY] START: Query to persona: dev-guide
[12:34:57.236] [APIKEY] START: Checking API key availability
[12:34:57.237] [APIKEY] STEP: Checking environment variables
[12:34:57.238] [APIKEY] SUCCESS: Found API key in environment
[12:34:57.240] [QUERY] STEP: API key confirmed available
[12:34:57.241] [QUERY] STEP: Execute phase: running rhizome query
[12:34:57.242] [QUERY] STEP: Executing: rhizome query --persona dev-guide
[12:35:02.789] [QUERY] STEP: Execute phase completed successfully
[12:35:02.791] [QUERY] RESULT: Query completed successfully
[12:35:02.792] [WORKFLOW] STEP: Response formatted (1235 chars)
[12:35:02.793] [WORKFLOW] SUCCESS: Query result shown to user
```

**Notice:**
- Timestamps show exact millisecond timing
- Gap between 57.242 and 02.789 = ~5.5 seconds (query execution)
- Each step is timestamped, so you can see phase duration

## How to Use This for Debugging

### Scenario 1: "Query is hanging/slow"

1. Press F5
2. Right-click → "Ask persona"
3. Check Debug Console timestamps
4. Look for the longest gap between timestamps
5. That gap identifies the slow phase

**Example:** If gap is at `[QUERY] STEP: Executing`, then rhizome is slow (not extension)

### Scenario 2: "Personas not loading"

1. Press F5
2. Trigger persona load
3. Find [PERSONAS] logs in Debug Console
4. Look for ERROR or missing SUCCESS logs
5. Check which path failed: JSON? Text fallback? Hardcoded fallback?

**Example log trail:**
```
[12:34:56.189] [PERSONAS] STEP: JSON command succeeded
[12:34:56.190] [PERSONAS] ERROR: Failed to fetch personas from rhizome
[12:34:56.191] [PERSONAS] STEP: Rhizome dependency issue detected
[12:34:56.192] [PERSONAS] SUCCESS: Fallback personas loaded
```

This shows: JSON execution succeeded, but parsing failed, so fallback activated.

### Scenario 3: "API key not found"

1. Press F5
2. Trigger query
3. Look for [APIKEY] logs
4. See which check failed:
   - Environment variables?
   - Config file?
   - Rhizome CLI?

**Example:**
```
[12:34:57.237] [APIKEY] STEP: Checking environment variables
[12:34:57.238] [APIKEY] STEP: No API keys found in environment
[12:34:57.239] [APIKEY] STEP: Checking rhizome config file
[12:34:57.241] [APIKEY] RESULT: No API key found in any location
```

This shows API key lookup checked all three sources and found nothing.

### Scenario 4: "Concurrent queries are interleaved"

When two persona queries happen simultaneously, F5 + timestamps help you see:

```
[12:34:57.240] [QUERY] START: Query to persona: dev-guide
[12:34:57.241] [QUERY] START: Query to persona: code-reviewer
[12:34:57.242] [QUERY] STEP: Executing: rhizome query --persona dev-guide
[12:34:57.243] [QUERY] STEP: Executing: rhizome query --persona code-reviewer
[12:35:02.789] [QUERY] RESULT: Query completed successfully (dev-guide)
[12:35:05.234] [QUERY] RESULT: Query completed successfully (code-reviewer)
```

Timestamps show which query is which, even though logs are interleaved.

## Configuration

**F5 Debug Configuration:** `.vscode/launch.json`

```json
{
  "env": {
    "RHIZOME_DEBUG": "true"
  }
}
```

**This means:**
- F5 always has DEBUG mode on
- Timestamps always visible
- Zero extra setup needed

**To disable timestamps during F5:**
- Edit `.vscode/launch.json`
- Remove or set `RHIZOME_DEBUG` to `false`
- Restart debugger

## What to Copy for Bug Reports

When debugging a problem with F5:

1. **Reproduce the issue** (in F5 debug session)
2. **Open Debug Console** (automatically open, usually)
3. **Copy all telemetry logs** (Ctrl+A, Ctrl+C in console)
4. **Include in bug report** with steps to reproduce

**Good bug report format:**
```
Steps to reproduce:
1. Pressed F5
2. Right-click on selection
3. Choose "Ask persona"
4. Picked "dev-guide"
5. Got timeout

Debug logs (F5 console output):
[12:34:56.123] [WORKFLOW] START: ...
[12:34:56.125] [WORKFLOW] STEP: ...
[... full log output ...]
```

## Key Takeaway

**F5 debugging is now telemetry-aware:**
- Press F5 → automatic timestamps
- No extra configuration
- Millisecond precision shows timing
- Helpful for identifying slow/hanging operations
- Makes concurrent query debugging possible

The telemetry system gives you complete visibility into what's happening at every step.
