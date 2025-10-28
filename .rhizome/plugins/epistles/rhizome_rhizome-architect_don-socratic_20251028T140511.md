# Epistle: rhizome ↔ rhizome-architect ↔ don-socratic

**ID**: epistle-1761674711
**Date**: 2025-10-28T18:05:11Z
**Topic**: Context manager for persona conversations
**Prompted by**: self-initiated
**Status**: draft

## Context

**Referenced documents:**

- cli/persona_cli.py
- scripts/rhizome.py

## Dialog

**rhizome:**
Persona commands keep requesting different slices of context—sometimes they need the effective persona, sometimes the conversation log, sometimes active flight data. I'd like a unified context manager that knows which ingredients to gather before a conversation or epistle.

**rhizome-architect:**
We can design a context manager module (maybe `context/persona_context.py`) that decides what files to load, which tools to invoke, and how to pass the data back to persona handlers. It should integrate with epistolary so conversations automatically receive the right context bundle.

**don-socratic:**
What heuristics drive these decisions? How do we avoid a monolith of if/else logic—and what tests tell us the manager is fetching the right context?

**rhizome:**
Heuristics include persona metadata (e.g., advocates, requested tools), flight plan state, and conversation intent (analysis vs. command execution). We'll stub the manager with pluggable heuristics; tests can simulate requests and assert that required pieces (effective persona text, actions log, tool handles) are provided.

**rhizome-architect:**
Let's place the manager in `context/manager.py`, expose a `PersonaContextManager` class, and have persona CLI commands call `with PersonaContextManager(...) as ctx:`. The manager can decide which tools to fetch and provide helpers for epistolary integrations.

**don-socratic:**
Capture this plan in a flight file and stub the module so future changes are guided by tests and personas. Ensure the epistolary conversation with the new module records its mission.

## Outcome / Conclusions

- Introduce `PersonaContextManager` in a new `context/` package.
- Heuristics consider persona metadata, active flight plans, and command intent to fetch required context.
- Persona CLI and epistolary flows will use the manager via `with` blocks.
- Tests will simulate persona requests and verify the context provided.

## Related Files & References

- cli/persona_cli.py
- scripts/rhizome.py
- (new) context/manager.py
