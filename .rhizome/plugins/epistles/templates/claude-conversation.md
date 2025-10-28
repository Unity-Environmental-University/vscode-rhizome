# Epistle Template: Claude ↔ [Persona/User]

**Purpose**: Document real conversations during coding sessions where Claude (AI assistant) and a persona or user discuss design, assumptions, and decisions.

---

# Epistle: Claude ↔ [Persona Name]

**ID**: epistle-[timestamp]
**Date**: [YYYY-MM-DD]
**Topic**: [What are we discussing?]
**Prompted by**: [Flight plan / code file / user request]
**Status**: [draft | complete]

## Context

**Referenced documents:**
- [File being worked on]
- [Flight plan or issue]
- [Previous epistles this builds on]

**Session notes:**
- What problem are we solving?
- What assumption are we testing?
- What decision point came up?

---

## Dialog

### Claude

[Claude's initial observation, question, or proposal]

### [Persona/User]

[Response: agreement, challenge, clarification, or counter-question]

### Claude

[Claude's response: incorporating feedback, pushing back, or refining]

### [Persona/User]

[Conclusion or new direction]

---

## Outcome / Conclusions

**Decision made**: [What did we decide?]

**Why**: [The reasoning that led to this]

**Code changes**: [What files were affected?]

**Trade-offs accepted**: [What are we giving up?]

**Assumptions we're relying on**: [Things to revisit later]

---

## Related Files & Next Steps

- Code: [file.py lines X-Y]
- Flight plan: [fp-id if applicable]
- Previous epistles: [links to related conversations]
- Follow-up epistle: [if this needs continuation]
- TODO: [anything deferred for later]

---

## Why This Matters

This epistle documents **why the code is written this way**, not just what it does.
Future developers (or future-you) can understand:
- What assumptions led to this design
- What alternatives were considered
- What trade-offs were accepted
- Whether this decision should be revisited

Epistles are the "design rationale" that test suites and comments can't capture.
