# Agent Feature Suggestion Guide

**For Claude or any AI agent working with rhizome.**

If you have an idea for rhizome (a feature, a fix, a pattern, a question), record it so humans can find it later.

## Quick Command

```bash
rhizome record \
  --action suggest \
  --object feature \
  --what "Your idea title (1-2 sentences)" \
  --note "Longer explanation. Why this matters. Who would use it."
```

## Full Example

```bash
rhizome record \
  --action suggest \
  --object feature \
  --what "Code-example-tagging system for learning-by-example patterns" \
  --note "Enable agents and developers to tag functions/patterns as 'reference implementations.'
Later tools (extensions, docs, MCPs) can surface these as teachable examples.
Supports rhizome's learning-first philosophy.
Could live in .rhizome/examples.ndjson or similar."
```

## What Gets Recorded

Your suggestion lands in `.rhizome/actions.ndjson` with:
- Your actor name (if you set it)
- Timestamp (when you submitted it)
- Full text (what, note)
- Status: "suggest" (not yet decided, not yet implemented)

## How Humans Find It

```bash
rhizome actions grep suggest  # All suggestions
rhizome actions grep "Code-example"  # Search by keyword
```

(Assuming those commands exist or will exist.)

## Guidelines

**Good suggestions:**
- "X would make Y easier" (concrete benefit)
- "I noticed Z is missing, affects A/B/C workflows" (evidence)
- "This conflicts with W, need to resolve" (architectural)

**Less useful:**
- "Wouldn't it be cool if..." (vague)
- "Just add a button" (no context)
- "I read about X, you should do it too" (no connection to rhizome)

## You're Not Committing to Anything

Suggesting doesn't mean you have to implement it. It means: "Hey, here's something worth thinking about."

Humans will filter, prioritize, and decide. That's their job.

## Examples of Good Suggestions

```
WHAT: Persona-chunked CLI API (max 7 subcommands per persona)
NOTE: Current `rhizome` has 20+ subcommands, cognitive load is high.
Distribute ownership: rhizome persona (dev-guide), rhizome decision (code-reviewer),
rhizome memory (conductor). Scales better as we add more features.
```

```
WHAT: Local rhizome microservice for non-dev users
NOTE: Currently requires Python + CLI. For SMEs (learning designers, instructors)
to use rhizome in web UIs or MCPs, we need an easy-to-install service
(bundled Python, localhost HTTP). Bootstrap with CLI, migrate to MCP later.
```

```
WHAT: Cross-repo decision linkage
NOTE: If repo A references a decision from repo B, rhizome should track the relationship.
Enables meta-understanding of how decisions ripple across projects.
```

---

**Questions? Unclear?** Just suggest: "Agent feature suggestion guide is confusing, here's why..."

And we iterate.
