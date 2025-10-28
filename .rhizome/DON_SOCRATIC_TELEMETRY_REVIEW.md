# Don-Socratic Review: Telemetry Logging Approach

**Date:** Oct 28, 2025
**Context:** Flight plan fp-1761682847 completion review
**Reviewer Persona:** don-socratic

## The Questions (and honest answers)

### 1. Is the telemetry format clear and helpful for debugging?

**Don's question:** What criteria did you use to determine clarity and helpfulness? How do you know that this format communicates the necessary information effectively?

**Honest answer:** I *assumed* clarity based on:
- Pattern consistency ([COMPONENT] PHASE: MESSAGE)
- Real-world debugging of extension problems
- Chronological readability

But I don't actually *know* this is clear until:
- A developer unfamiliar with the codebase tries to debug with it
- We watch someone interpret these logs in real time
- We measure: Did they find the problem? How long did it take?

**The uncertainty:** The format *feels* clear to me (the author), but that's selection bias. I designed the format, so naturally it makes sense to me.

**What we should do:**
- Test with a developer who isn't familiar with this codebase
- Ask: "What does this log line tell you?" and watch for hesitation
- Watch where they *can't* find the answer in the logs
- That gap is where clarity breaks down

### 2. Did we strike the right balance between detail and noise?

**Don's question:** What specific details were included, and what were the considerations for noise? How might different developers perceive the balance?

**Honest answer:** The balance is *optimized for slow failure debugging*, not fast success paths.

**What we're logging:**
- ✓ Each major phase transition (INIT → EXECUTE → FORMAT → RESULT)
- ✓ Branching paths (JSON path vs text fallback vs hardcoded fallback)
- ✓ Data at each step (response length, persona count, error messages)
- ✓ API key checks (three different checks: env → config → CLI)

**What we're NOT logging:**
- ✗ Individual for-loop iterations (parsing each persona line)
- ✗ Every execSync argument passed
- ✗ Stack traces for all errors (only the message)

**The trade-off:** If a query succeeds, you see 10-15 log lines. That's reasonable. But if you're debugging a timeout, you see 3-4 lines of timeout explanation... but you might *need* to see the actual rhizome command that was run, with exact arguments.

**The real risk:** A developer might say:
- "It says 'Execute phase failed' but doesn't tell me WHAT command failed"
- "It logged 'Could not parse line' but didn't show me the line"
- "It says 'Rhizome dependency issue' but I need to see the actual error from Python"

We truncated some details (line preview, error messages) to keep logs readable. But that truncation might hide the exact problem we're debugging.

**What we should do:**
- Add a DEBUG flag that logs everything (full error messages, full commands, full output)
- In normal mode: show summary; in DEBUG mode: show raw data
- Currently we're at "summary" level. That's appropriate for happy path, but insufficient for some failures.

### 3. What assumptions are we making about how developers will use these logs?

**Don's question:** What use cases do you envision? How do you know developers will engage with them as anticipated?

**Honest assumptions we made:**

1. **Developers will open the debug console**
   - Assumption: Users know VS Code has a debug console
   - Reality: Some developers don't know about it, or forget to open it
   - We should document: "How to see telemetry logs" as first step

2. **Developers will read logs chronologically**
   - Assumption: They scan from top to bottom, understanding flow
   - Reality: Some will skip to ERROR logs, miss context
   - We should highlight: "Start here ↓" and "This matters ↑"

3. **Developers will understand what each phase means**
   - Assumption: INIT/EXECUTE/FORMAT/RESULT are obvious
   - Reality: These are our domain terms, not universal
   - We should document with examples what each phase does

4. **Developers will copy logs into a bug report**
   - Assumption: They'll paste complete logs, preserving order
   - Reality: They might screenshot, lose details, or cherry-pick lines
   - We should encourage: "Paste the entire console output"

5. **Developers will know where to look for problems**
   - Assumption: [APIKEY] section for API issues, [QUERY] for query issues
   - Reality: "I got an error" might come from anywhere
   - We should provide: "If X happened, look in Y section"

**The biggest assumption:** We assume this is *self-explanatory*. But the guide itself is 200+ lines. That means it's not self-explanatory—it requires reading documentation.

**What we should do:**
- Add inline comments in code saying "If this line appears, the cause is X"
- Create a quick troubleshooting flowchart (not in the code, but in docs)
- Test: Can someone fix a problem using only the logs, without the guide?

### 4. Where might this approach break down?

**Don's question:** Can you think of scenarios where telemetry might not provide necessary context? What limitations might arise?

**Real limitations I see:**

**Limitation 1: Async/concurrent calls**
- If two persona queries run at the same time, logs interleave
- [QUERY] STEP from query 1, then [QUERY] STEP from query 2
- We have no trace ID or session ID to connect related logs
- A developer would see:
  ```
  [QUERY] STEP: Execute phase completed
  [QUERY] START: Query to persona: code-reviewer
  [QUERY] ERROR: Execute phase failed
  ```
  Is the error for the first or second query? Unclear.

**Limitation 2: Slow failures (timeouts)**
- We log "timeout occurred" but not what happened in the 30 seconds *inside* rhizome
- The actual problem might be "rhizome hung while waiting for API"
- We're logging the extension's perspective, not the root cause
- A developer might see: "[QUERY] TIMEOUT" but the real problem is in rhizome's execution, not visible in our logs

**Limitation 3: Silent failures**
- If a persona query returns empty response, we log "[QUERY] SUCCESS: Got response"
- But the persona returned nothing useful
- We log success (the query executed) not outcome (the result was good)
- A developer debugging might think "query worked" but actually persona gave no useful response

**Limitation 4: Missing context for fallbacks**
- If JSON path fails and we fall back to text parsing, we log both paths
- But we don't log *why* JSON failed (was it a format issue? a rhizome version issue?)
- We just log "JSON parsing failed, trying text format"
- The root cause is hidden

**Limitation 5: Reproducing issues**
- Logs tell you what happened but not how to make it happen again
- A developer sees "[QUERY] ERROR: timeout" but doesn't know the conditions
- Was it slow network? Specific persona? Specific code? Unknown.
- Without reproduction steps, the fix is guesswork

**What we should do:**
- Add trace IDs for concurrent calls (UUID per workflow)
- Document that logs show extension perspective, not system perspective
- Distinguish between "operation succeeded" and "outcome was good"
- Log *why* fallbacks occurred, not just that they occurred
- Add a "reproduction steps" template to bug reports

### 5. What did we learn about the workflow that we didn't expect?

**Don's question:** What surprising insights emerged? How did they influence the approach?

**Unexpected discoveries:**

**Discovery 1: getAvailablePersonas has THREE fallback paths**
- We expected: Try JSON, fail back to text
- Reality: Three distinct paths (JSON → text → hardcoded)
- Implication: Personas might not be available in multiple ways
- Learning: Logging each path separately was crucial, not just binary success/fail

**Discovery 2: API key checking happens at THREE different times**
- When we ask a persona (checkApiKeyAvailable)
- When we query a persona (queryPersona also checks)
- When we verify config (checkApiKeyAvailable itself has 3 checks)
- Implication: Multiple API key sources (env, config file, rhizome CLI)
- Learning: We log each check separately so we see *where* the key comes from

**Discovery 3: The "execute" phase is a black box**
- We log "executing: rhizome query --persona X"
- But we don't log what rhizome does *inside* that 30-second window
- Implication: Failures might be in rhizome, not the extension
- Learning: Our logs are extension-centric, not system-centric

**Discovery 4: Error messages vary wildly**
- API key errors: "No module named pyyaml"
- Network errors: "ECONNREFUSED"
- Timeout errors: "Child process timeout"
- Implication: Developers debugging need to know which error corresponds to which problem
- Learning: We categorize errors by component ([APIKEY] vs [QUERY]) not by error message type

**Discovery 5: Silent failures are common**
- A query might return empty string and log "SUCCESS"
- A persona might exist but have no description
- A config file might exist but be empty
- Implication: Success != useful result
- Learning: We should distinguish between "operation completed" (SUCCESS) and "outcome was good" (RESULT)

**Discovery 6: Developers aren't always in the extension codebase**
- They might be debugging rhizome, or their persona, or their API
- Our logs are extension logs, not system logs
- Implication: Developers might look in the *wrong place* for the answer
- Learning: The guide should say "if X happens, the problem is probably in Y (not the extension)"

## The Core Tension

There's a fundamental tension in telemetry design:

**Comprehensive vs. Comprehensible**

- Comprehensive: Log everything so you never miss context
- Comprehensible: Log only what matters so the logs aren't overwhelming

We chose comprehensible (summary-level logging). That's good for happy paths but limits debugging.

**The don asks:** Did you choose this consciously, or by accident?

**Honest answer:** We chose it implicitly. We assumed developers want summaries. But we never verified this with actual developers.

**What we should do:**
- Ask developers: "Would you rather have 5 log lines or 50?"
- Watch what they do when logs are insufficient
- Let them guide the balance

## Recommendations for Next Steps

Rather than "fix these issues," the don-socratic approach asks: **What should we test and learn?**

### 1. User Testing
- Watch a developer unfamiliar with vscode-rhizome debug a problem using only the logs
- What do they understand? What confuses them?
- Where do they get stuck?

### 2. Real-World Failures
- Collect actual bug reports from users
- Do the logs help them describe the problem?
- Do the logs help us reproduce it?

### 3. Concurrent Usage
- Test: What happens if two personas are queried simultaneously?
- Are the logs still readable?

### 4. Silent Failures
- Test: What if a persona returns empty response?
- What if an API key exists but is invalid?
- What logs should we see?

### 5. Balance Verification
- Ask: For a given failure, how many log lines help?
- Is it 3 lines? 10 lines? 30 lines?
- Current balance might be too sparse or too verbose

## What We Got Right

**Not everything is uncertain.** Three things we did well:

1. **Format consistency** — [COMPONENT] PHASE: MESSAGE is predictable
2. **Documentation** — We wrote the guide, not just code
3. **Phase clarity** — START/STEP/SUCCESS/ERROR/RESULT is self-documenting

## What We Should Question

1. **Assumption of self-explanatory format** — It's not. The guide is 200+ lines.
2. **Assumption of correct balance** — We might be too sparse or too verbose.
3. **Assumption developers will use it as intended** — They might look elsewhere first.
4. **Assumption extension logs are sufficient** — Root cause might be in rhizome.
5. **Assumption success means useful result** — Operation success ≠ outcome success.

---

## Closing Question (from the don)

Before we declare this "complete," let me ask one more:

**If a developer came to you with a problem and said, "I got an error, here are my logs," could you help them based ONLY on the logs and the guide? Or would you ask for more information?**

If the answer is "I'd ask for more information," then our telemetry isn't quite complete yet.

What information would you ask for? That gap is where the next iteration should focus.

---

*This review embodies the don-socratic principle: Not "we did this right," but "here's what we're uncertain about and should test."*
