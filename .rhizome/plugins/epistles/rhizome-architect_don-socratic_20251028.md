# Epistle: rhizome-architect ↔ don-socratic

**ID**: epistle-1761666357
**Date**: 2025-10-28
**Topic**: Guard against cruft in rhizome.py
**Prompted by**: self-initiated
**Status**: draft

## Context

**Referenced documents:**

- scripts/rhizome.py
- CLAUDE.md

## Dialog

**rhizome-architect:**
Every time we add a helper, rhizome.py sprawls wider. The new `persona animate` command lives beside recording, flights, registry, web server—everything. We need the file to complain when we slip more multipurpose glue into it.

**don-socratic:**
What does the file guard today? Could the persona surface a checklist when someone edits sections outside their lanes? How might comments nudge a refactor instead of tolerating more weight?

**rhizome-architect:**
The advocate header now calls out “Module boundaries before monolith” and “Promote portable plugins." I can add inline TODOs near the subparser setup: one reminding us to extract command registrations into dedicated modules, another pointing to the epistles plugin wiring as a pattern to follow.

**don-socratic:**
If we aspire to extract modules, which subsection should move first? What signals will tell future contributors they crossed a boundary?

**rhizome-architect:**
Command registration is the loudest offender. I’ll drop a comment before the `sub = parser.add_subparsers` block stating that new commands belong in separate modules with registration helpers, not inline. I’ll also flag the persona animate helper as a stepping stone toward a `persona_cli.py` lift-out.

**don-socratic:**
And when those TODOs graduate into work, how will the persona celebrate—or at least update its mission?

**rhizome-architect:**
I’ll note in the epistle outcome that we track progress via the advocate list; once we extract modules, we update the persona principles and remove the warning comments.

## Outcome / Conclusions

- Advocate header now reminds maintainers to guard module boundaries and promote portable plugins.
- Inserted inline comments in `scripts/rhizome.py` near command registration calling for modular extraction.
- Marked persona animate helper as temporary glue until persona CLI commands move into a dedicated module.
- Future refactors should update the persona principles and remove warning comments once modularization lands.

## Related Files & References

- Registry entry: epistle-1761666357
- Implementation: scripts/rhizome.py, CLAUDE.md
