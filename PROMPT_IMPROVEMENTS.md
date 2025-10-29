# Prompt Improvements: Comment Syntax Formatting

## Overview
Updated both selection-based and file-level review prompts to explicitly request comment formatting with the correct syntax for each file type (// for TypeScript, # for Python).

---

## Selection-Based Review Prompt

### Before
```typescript
const prompt = `You are a rigorous, critical code reviewer. Review this code and provide specific, actionable feedback.

For EACH issue or observation:
1. Reference the EXACT line number(s) where it occurs
2. Describe the specific problem
3. Ask a clarifying question or suggest improvement

Format: "Line X: [specific issue]. [Question or suggestion]"
Or for multiple lines: "Lines X-Y: [specific issue]. [Question or suggestion]"

Examples:
- Line 5: Missing null check. What if user is undefined?
- Lines 12-15: Loop could use Set for O(1) lookup instead of array.indexOf(). Have you considered this?
- Line 20: Good error handling here.

Be specific, reference actual code patterns, ask hard questions:\n\n${selectedText}`;
```

### After
```typescript
const prompt = `You are a rigorous, critical code reviewer. Review this code and provide specific, actionable feedback.

For EACH issue or observation, format as a code comment (${commentPrefix} syntax):

Format: "${commentPrefix} Line X: [specific issue]. [Question or suggestion]"
Or for multiple lines: "${commentPrefix} Lines X-Y: [specific issue]. [Question or suggestion]"

Examples (in ${commentPrefix} comment format):
${commentPrefix} Line 5: Missing null check. What if user is undefined?
${commentPrefix} Lines 12-15: Loop could use Set for O(1) lookup instead of array.indexOf(). Have you considered this?
${commentPrefix} Line 20: Good error handling here.

Important:
- Start each comment with '${commentPrefix}'
- Reference EXACT line numbers
- Be specific and reference actual code patterns
- Ask hard questions

Review this code:\n\n${selectedText}`;
```

### Key Changes
1. **"format as a code comment (${commentPrefix} syntax):"** - Explicit instruction to format as comments
2. **Examples show `${commentPrefix}` prefix** - Before: `Line 5:`, After: `// Line 5:` or `# Line 5:`
3. **"Examples (in ${commentPrefix} comment format)"** - Label clarifies that examples are formatted comments
4. **Added checklist** - Makes it crystal clear:
   - Start with comment syntax
   - Reference exact line numbers
   - Be specific and concrete
   - Ask hard questions
5. **"Review this code:"** - Simpler language than "Be specific..."

### Interpolation Examples
When persona sees this prompt:

**For TypeScript file** (`${commentPrefix}` = `//`):
```
Examples (in // comment format):
// Line 5: Missing null check. What if user is undefined?
// Lines 12-15: Loop could use Set for O(1) lookup instead of array.indexOf(). Have you considered this?
// Line 20: Good error handling here.

Important:
- Start each comment with '//'
- Reference EXACT line numbers
- Be specific and reference actual code patterns
- Ask hard questions
```

**For Python file** (`${commentPrefix}` = `#`):
```
Examples (in # comment format):
# Line 5: Missing null check. What if user is undefined?
# Lines 12-15: Loop could use Set for O(1) lookup instead of array.indexOf(). Have you considered this?
# Line 20: Good error handling here.

Important:
- Start each comment with '#'
- Reference EXACT line numbers
- Be specific and reference actual code patterns
- Ask hard questions
```

---

## File-Level Review Prompt

### Before
```typescript
const prompt = `You are a rigorous, critical code reviewer analyzing an entire file. Provide specific, actionable feedback.

For EACH issue, observation, or strength:
1. Reference the EXACT line number(s) where it occurs
2. Describe the specific problem or observation
3. Ask a clarifying question or suggest improvement

Format: "Line X: [specific issue]. [Question or suggestion]"
Or for multiple lines: "Lines X-Y: [specific issue]. [Question or suggestion]"

Review the ENTIRE file for:
- Structure and organization issues
- Missing error handling or edge cases
- Clarity and readability problems
- Design pattern violations
- Performance concerns
- Security vulnerabilities

Be specific, reference actual code, ask hard questions:\n\n${fileText}`;
```

### After
```typescript
const prompt = `You are a rigorous, critical code reviewer analyzing an entire file. Provide specific, actionable feedback.

For EACH issue, observation, or strength, format as a code comment (${commentPrefix} syntax):

Format: "${commentPrefix} Line X: [specific issue]. [Question or suggestion]"
Or for multiple lines: "${commentPrefix} Lines X-Y: [specific issue]. [Question or suggestion]"

Important:
- Start each comment with '${commentPrefix}'
- Reference EXACT line numbers from the code
- Be specific and reference actual code patterns
- Ask hard questions

Review the ENTIRE file for:
- Structure and organization issues
- Missing error handling or edge cases
- Clarity and readability problems
- Design pattern violations
- Performance concerns
- Security vulnerabilities

Analyze this file:\n\n${fileText}`;
```

### Key Changes
1. **"format as a code comment (${commentPrefix} syntax):"** - Same explicit instruction as selection review
2. **Examples show `${commentPrefix}` prefix** - Consistent with selection review
3. **Added checklist** - Same format as selection review for consistency
4. **"Analyze this file:"** - Simpler than "Be specific, reference actual code, ask hard questions"
5. **Removed numbered list** - Converted to more readable checklist format

### Consistency Across Both Prompts
- Both now request comment formatting
- Both show `${commentPrefix}` in examples
- Both have identical checklist items
- Both interpolate the correct syntax before sending to persona

---

## Why These Changes Matter

### Problem Solved
**Before**: Persona feedback lacked consistent formatting. Comments might be:
```
Line 5: Missing null check. What if user is undefined?
```
Then parser had to guess the syntax and add it.

**After**: Persona sees exactly what format is needed:
```typescript
// Line 5: Missing null check. What if user is undefined?    // (for TypeScript)
# Line 5: Missing null check. What if user is undefined?     # (for Python)
```

### Benefits
1. **Clarity** - Persona sees concrete examples, not generic format description
2. **Consistency** - All comments use same syntax within a file
3. **Maintainability** - Works for any language without code changes
4. **Simplicity** - No post-processing needed to add comment syntax
5. **Correctness** - Persona knows the exact format before responding

### What the Persona Gets

The persona receives a prompt where `${commentPrefix}` is already interpolated. So it literally sees:

```
For TypeScript:
"// Line 5: Missing null check. What if user is undefined?"

For Python:
"# Line 5: Missing null check. What if user is undefined?"
```

Not an abstract placeholder like `${commentPrefix}`, but the actual value.

---

## Integration with Parsing

The comment prefix flows through the entire pipeline:

```
1. detectLanguage(languageId)
   └─→ "typescript" or "python"

2. commentPrefix assignment
   └─→ "typescript" ? "//" : "#"

3. Prompt interpolation
   └─→ Examples show "// Line X:" or "# Line X:"

4. Persona response
   └─→ Formats feedback with correct syntax

5. parseCommentInsertion(response, fileLines, commentPrefix)
   └─→ Parses "Line X: feedback" → stores with commentPrefix: "// feedback" or "# feedback"

6. Insertion
   └─→ Comments appear as "// 🔴 feedback" or "# 🔴 feedback"
```

---

## Testing the Improvements

### Manual Test: TypeScript
1. Open `test-workspace/test.ts`
2. Select lines 11-14 (greet function)
3. Right-click → "Red Pen Review (don-socratic)"
4. **Verify**: Comments use `//` syntax (not `#`)
5. **Verify**: Line numbers match selected code range

### Manual Test: Python
1. Open `test-workspace/test.py`
2. Select lines 10-15 (greet function)
3. Right-click → "Red Pen Review (don-socratic)"
4. **Verify**: Comments use `#` syntax (not `//`)
5. **Verify**: Line numbers match selected code range

### Debug if Needed
- Check Debug Console (F5) for actual prompt text
- Verify `${commentPrefix}` is interpolated before sending
- Check persona response format
- Verify parseCommentInsertion receives correct prefix

---

## Before/After Comparison

| Aspect | Before | After |
|--------|--------|-------|
| **Example format** | `Line 5: issue` | `// Line 5: issue` or `# Line 5: issue` |
| **Comment prefix** | Generic instruction | Concrete example with actual syntax |
| **Persona clarity** | Unclear what format is expected | Clear: examples show exact format |
| **Post-processing** | Had to guess and add syntax | No post-processing needed |
| **Consistency** | Variable (depends on persona) | Guaranteed by prompt examples |
| **Maintainability** | Required code changes for new languages | Works for any language |

---

## Commit Information

**Hash**: 533def4
**Message**: "refactor: Improve persona review prompts with comment syntax examples"
**Files**: src/commands/personaCommands.ts (2 prompts updated)
**Date**: 2025-10-29

Both `redPenReviewCommand()` and `redPenReviewFileCommand()` received identical improvements for consistency.

