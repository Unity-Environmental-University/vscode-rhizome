# Epistle: rhizome ↔ init-steward ↔ don-socratic

**ID**: epistle-1761669344
**Date**: 2025-10-28T16:35:44Z
**Topic**: Refactor repo init CLI
**Prompted by**: self-initiated
**Status**: draft

## Context

**Referenced documents:**

- scripts/rhizome.py
- scripts/install.py
- init_module/init_repo.py

## Dialog

**rhizome:**
The install script now handles both install and init subcommands, but it still feels like a catch-all. I want repo initialization to live in the main CLI so teams just run `rhizome init`.

**init-steward:**
Agreed. The helper already lives in `init_module`. We can expose it through `scripts/rhizome.py` as a first-class command. The install script can keep a small shim for backwards compatibility and delegate to the new command.

**don-socratic:**
What does success look like? Which behaviours must `rhizome init` enforce, and how will we test that the old entry points warn properly?

**rhizome:**
Success means:
1. New CLI command `rhizome init` that wraps `refresh_repo_context` with the same options (`--dry-run`, `--force`, `--json`).
2. Install script becomes a thin delegator: `install init` simply shells to `rhizome init`.
3. Tests cover both entry points to avoid regressions.

**don-socratic:**
Capture those points in the plan. Remember to update docs and personas so users know to call `rhizome init`. Let's keep the refactor reversible: start with the CLI command, wire tests, then phase out direct work in install.

## Outcome / Conclusions

- Create `rhizome init` command that invokes `refresh_repo_context`.
- Update install script to delegate its `init` subcommand to the new CLI command and warn about deprecation.
- Extend tests to cover `rhizome init` and ensure legacy path still works.
- Refresh documentation and personas to highlight the new command.

## Related Files & References

- scripts/rhizome.py
- scripts/install.py
- init_module/init_repo.py
- tests/test_install_script.py
