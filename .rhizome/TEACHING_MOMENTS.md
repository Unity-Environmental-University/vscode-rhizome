# Teaching Moments in vscode-rhizome

**Spoken by: don-socratic**

Before you proceed, help me understand. You've read the code and noticed something. A pattern. A constraint. A choice we made that seems... incomplete.

Good. That's not a bug. That's an invitation to think.

Below are four places where the code works, but we left the edges rough. Not TODOs. Questions. When you feel the friction, pause and ask yourself what I'm asking you here.

---

## 1. Eight `.appendLine()` calls (extension.ts:87-131)

Look at the `donSocratic` command handler. What do you notice about the output channel calls?

```typescript
outputChannel.appendLine('='.repeat(60));
outputChannel.appendLine('don-socratic');
outputChannel.appendLine('='.repeat(60));
outputChannel.appendLine('Selected code:');
outputChannel.appendLine('');
outputChannel.appendLine(selectedText);
outputChannel.appendLine('');
// ... more of the same
```

**My questions for you:**

- Do you see a pattern in how we structure the output? (Section headers, labeled content, spacing?)
- If you extract that pattern into a helper function, what would you call it? `section()`? `label()`?
- How would the code read differently if you pulled that out?
- What would you *gain* by removing this repetition? What might you *lose*?

**Why we left it this way:** Repetition is honest. It shows you the pattern without hiding it in abstraction. You'll feel it and think "I could fix that." That's the moment worth having.

---

## 2. Nested if/else for optional fields (stubGenerator.ts:67-75)

Look at how we build the TODO comment in `generateStub()`:

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

**My questions for you:**

- This works. But is it the clearest way to express what's happening?
- What if you tried nullish coalescing (`??`) or optional chaining (`?.`)? How would that change the code?
- Would it be more readable, or just more clever?
- What's the tradeoff between explicit nesting and idiomatic TypeScript?

**Why we left it this way:** Explicit is often better than clever. But the opportunity is there. You might find a way that's both clear *and* concise. Or you might decide the nesting is fine. Either way, you'll have thought about it.

---

## 3. Silent regex failure (stubGenerator.ts:147-163)

Look at `findStubComments()`. If a function signature doesn't match the regex, what happens?

```typescript
const sig = lines[signatureLine].trim();
let match;
let name, params, returnType;

if (language === 'python') {
    match = sig.match(pythonFunctionRegex);
    if (match) {
        name = match[1];
        // ...
    }
}

// If the regex matched, we add it. If not, silent failure.
if (name && params) {
    results.push({ /* ... */ });
}
```

**My questions for you:**

- What happens if the regex doesn't match? (Answer: nothing. We return an empty array.)
- How would a user know their `@rhizome stub` marker wasn't found? Would they see an error? A warning?
- If I put a marker on a function with a destructured parameter or complex generic type, what would happen?
- What would you need to do to give the user better feedback?

**Why we left it this way:** This is the constraint you'll *feel* when you use the extension. You'll put a marker on some code, run the command, and get "no stubs found." You'll wonder why. Then you'll read this file and understand: regex is powerful but brittle. And you'll know exactly what to reach for next—either better error messages, or a real parser like @babel/parser.

---

## 4. insertStub uses heuristics, not parsing (stubGenerator.ts:292-331)

How does `insertStub()` know where the function body starts?

```typescript
if (language === 'python') {
    if (!signatureText.trimEnd().endsWith(':')) {
        openingBraceLine = signatureLine + 1;
        while (
            openingBraceLine < lines.length &&
            !lines[openingBraceLine].trimEnd().endsWith(':')
        ) {
            openingBraceLine++;
        }
    }
} else {
    if (signatureText.indexOf('{') === -1) {
        // scan forward for {
    }
}
```

**My questions for you:**

- We're looking for `{` or `:` by scanning lines. What happens if those characters appear in a string literal on the signature line?
- What happens if a function signature spans 15 lines?
- We assume the function body is empty or we're inserting at the start. What breaks if someone already has code there?
- What would you need to know about the *entire* function scope to insert correctly? How would you find that?

**Why we left it this way:** This is a 95/5 solution. It works for 95% of real code. The other 5%—complex signatures, existing implementations, edge cases—will teach you why parsing is hard. You'll hit the wall and think: "I need a real AST parser here." And then you'll understand exactly what that means and why you need it. That's worth more than me telling you upfront.

---

## How to read this

When you're using the extension, or reading the code, and you think:

- "Why eight `.appendLine()` calls?" → Read #1. Then ask: could I improve this?
- "This if/else looks clunky" → Read #2. Then ask: what would be clearer?
- "What if my marker doesn't work?" → Read #3. Then ask: why is it silent?
- "Does this work for all functions?" → Read #4. Then ask: what would break?

These moments are here because they're worth thinking about. Not because they're broken. Not because they need fixing *right now*.

They're here because you'll learn more by feeling the constraint than by being told the answer.

---

## The Principle

The unexamined code is not worth shipping.

I've left these edges rough on purpose. When you're ready—when you've felt the friction—you'll know what to improve and why it matters.

That's teaching. That's learning.
