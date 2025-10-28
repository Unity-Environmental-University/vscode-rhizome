# Epistle: rhizome ↔ rhizome-architect ↔ don-socratic

**ID**: epistle-1761672461
**Date**: 2025-10-28T17:27:41Z
**Topic**: Modularize rhizome CLI
**Prompted by**: self-initiated
**Status**: draft

## Context

**Referenced documents:**

- scripts/rhizome.py
- CLAUDE.md

## Dialog

**rhizome:**
`scripts/rhizome.py` keeps swelling. Even with the new init helper extracted, the file registers every command, owns install shims, and hosts logic that belongs elsewhere. How do we carve it into modules without breaking the CLI?

**rhizome-architect:**
We need a staged approach: identify command families (install, persona, flight, registry, epistles, init), create modular registrars for each, and wire them from a minimal entrypoint. Tests should verify registration still works.

**don-socratic:**
What constraints keep this refactor safe? Which persona advocates should monitor the changes? How do we ensure docs and tests cover the new structure?

**rhizome:**
Constraints:
1. Command behavior stays identical; only wiring changes.
2. Each module exports `register(subparsers)` and optional helpers.
3. Core config and shared utilities live in dedicated modules (e.g., `cli_context.py`).

**rhizome-architect:**
We can start by extracting init/install registration into `cli/init.py` and `cli/install.py`, then move persona and flight next. We'll create a central `cli/__init__.py` that assembles the parser.

**don-socratic:**
Capture those steps in a new flight plan. Make sure tests cover both the new modules and the entrypoint's ability to wire them dynamically. Update CLAUDE and personas to reflect the modular structure so future maintainers know where to extend.

## Outcome / Conclusions

- Extract command families into dedicated modules that expose registration functions.
- Maintain a thin `scripts/rhizome.py` that imports modules and wires argparse only.
- Expand tests to ensure commands remain discoverable and behave identically.
- Update documentation/personas to guide contributors toward the new structure.

## Related Files & References

- scripts/rhizome.py
- tests/test_cli_behavior.py
- CLAUDE.md
