# Epistle: rhizome ↔ init-steward ↔ don-socratic

**ID**: epistle-1761667373
**Date**: 2025-10-28
**Topic**: Define repo init philosophy
**Prompted by**: self-initiated
**Status**: draft

## Context

**Referenced documents:**

- init_module/init_repo.py
- scripts/install.py

## Dialog

**rhizome:**
We finally carved repo initialization into its own module. I want the helper to feel like a portable pattern any downstream rhizome can reuse. How do we frame its mission?

**init-steward:**
My priority is safety. Copy the latest `.rhizome/` scaffold, but never overwrite `personas.d/custom/` or other overlays. Provide a dry-run diff so maintainers see impact before writing.

**don-socratic:**
Where do the CLI install responsibilities stop and this helper takes over? What would confuse a contributor about having two commands?

**rhizome:**
`install.py install` should focus on shims + home context. `install.py init <path>` will call this module. Shared utilities (like persona seeds) can live in one place, but each command logs its intent.

**don-socratic:**
And how will you keep the module from growing into another rhizome.py—full of unrelated helpers?

**init-steward:**
I'll keep `init_repo.py` to three responsibilities: build a plan, execute the plan, report the plan. Anything else—prompting users, CLI parsing—stays in `scripts/install.py`. The persona header on the module reminds us to keep it sharp.

**rhizome:**
Let's also output machine-readable summaries (JSON) so automation can watch for conflicts. The plan object can expose `.to_dict()` for that.

**don-socratic:**
Good. Capture these principles in the outcomes and update the README/CLAUDE docs so users know when to run each path.

## Outcome / Conclusions

- `init_module/init_repo.py` owns repo context refresh: build → execute → report copy plans.
- CLI install remains focused on shims/home; it will call the helper via `install.py init <path>`.
- The helper preserves `personas.d/custom/`, supports dry-run and `--force`, and logs JSON summaries for automation.
- Documentation will clearly separate install vs init usage, with legacy flags warning and redirecting.

## Related Files & References

- Registry entry: epistle-1761667373
- Implementation: init_module/init_repo.py, scripts/install.py
