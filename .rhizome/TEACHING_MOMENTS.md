# Teaching Moments in vscode-rhizome

These are places in the code where the implementation works, but there's a deliberate choice to leave room for learning. Not TODOs. Not bugs. **Intentional rough edges that invite improvement.**

When someone reads this code, they should *feel* these moments and think "I could refactor that" — which is the point.

---

## 1. Repetitive outputChannel calls (extension.ts:87-131)

**Location:** `donSocratic` command handler

**What's there:**
```typescript
outputChannel.appendLine('='.repeat(60));
outputChannel.appendLine('don-socratic');
outputChannel.appendLine('='.repeat(60));
outputChannel.appendLine('Selected code:');
outputChannel.appendLine('');
outputChannel.appendLine(selectedText);
outputChannel.appendLine('');
// ... and more
```

**Teaching moment:** The repetition screams "extract a helper function." Eight `.appendLine()` calls in sequence, with a clear pattern (blank line, content, blank line).

**What to learn:**
- Recognize the pattern (section headers, labeled content, spacing)
- Extract `section()`, `label()`, `raw()` helper functions
- See how removing the noise makes the intent clearer

**Why we left it:** Repetition is its own teacher. A comment wouldn't hit as hard as reading the pattern and thinking "I could fix that."

---

## 2. Nested if/else for optional fields (stubGenerator.ts:67-75)

**Location:** `generateStub()` function, building the TODO comment

**What's there:**
```typescript
if (options?.timestamp) {
    todoComment += ` (stubbed ${options.timestamp}`;
    if (options?.userStory) {
        todoComment += `, ${options.userStory}`;
    }
    todoComment += ')';
} else if (options?.userStory) {
    todoComment += ` (${options.userStory})`;
}
```

**Teaching moment:** This works, but it's nested and a bit clunky. You could use nullish coalescing (`??`), optional chaining (`?.`), or template literals more idiomatically.

**What to learn:**
- Recognize when optional chaining is idiomatic vs when it adds noise
- See the tradeoff: nested logic is explicit but verbose
- Consider: could `returnType ?? null` or similar patterns make this clearer?

**Why we left it:** The current code is readable. Making it "clever" might obscure the intent. But the opportunity is there to make it more concise without losing clarity.

---

## 3. Silent regex failure (stubGenerator.ts:147-163)

**Location:** `findStubComments()` function, regex pattern matching

**What's there:**
The function silently returns an empty array if a signature doesn't match the regex. No error, no warning.

**Teaching moment:** This is the most important one. When the regex doesn't match, the user gets no feedback. The marker sits there unfound. "No stubs found" in the UI, but the user doesn't know *why*.

**What to learn:**
- Recognize silent failures in your code
- Think about user experience: how would you know it failed?
- Consider: should we emit a warning? Log which signatures failed to parse?
- Future: when would you swap regex for a real parser (@babel/parser, Python ast)?

**Why we left it:** Because this is the constraint you'll *feel* when you use the extension. You'll hit it, wonder why, and then you'll know exactly what to fix. That's real learning.

---

## 4. insertStub heuristics (stubGenerator.ts:292-331)

**Location:** `insertStub()` function, finding the function body scope

**What's there:**
We use line-by-line scanning to find `{` or `:` instead of parsing the actual scope. We assume the function body is empty or we're inserting at the start.

**Teaching moment:** This is a 95/5 solution. It works for most real code. The 5% breaks silently (you get an extra brace in the wrong place, or the stub doesn't insert where you expect).

**What to learn:**
- Recognize the heuristic approach vs. the "right" approach (AST parsing)
- Understand the tradeoff: simple string manipulation vs. proper scope parsing
- Think: when does heuristic-based code fail, and what's the cost?
- Future: could you build an AST-based version? What library would you use?

**Why we left it:** You'll use this command, and when it works, you'll wonder why. When it breaks on a weird function signature, you'll know exactly where to improve it.

---

## How to Use This

When you (or another developer) reads the code and thinks:

- "Why are there so many `.appendLine()` calls?" → See Teaching Moment #1
- "This if/else could be shorter" → See Teaching Moment #2
- "What happens if the regex doesn't match?" → See Teaching Moment #3
- "How does this handle complex function scopes?" → See Teaching Moment #4

Each moment is encoded here so the learning isn't lost. And the code stays honest—not cluttered with TODOs, but readable with intentional rough edges.

---

## The Philosophy

**Don't solve it yet. Make it visible. Let someone read the code and think: "I could improve that."**

That's better teaching than any comment. The itch to refactor is the itch to learn.
