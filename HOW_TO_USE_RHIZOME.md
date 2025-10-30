# How to Use the Rhizome CLI

This guide captures the local workflows for invoking Rhizome tooling from the repository. It focuses on practical commands we rely on during development and testing.

## Prerequisites
- The `rhizome` CLI must be on your `PATH`. Install directions live in `tools/rhizome/README.md`.
- Persona and config files are expected under `.rhizome/` at the repo root.
- For remote AI calls, configure an API key:  
  `rhizome config set ai.openai_key "<YOUR KEY>"`

## Everyday Commands
- `rhizome persona list` &mdash; discover available personas and their roles.
- `rhizome query --persona <name>` &mdash; run a one-off prompt by piping text via stdin.
- `rhizome ask --persona <name> "<prompt>"` &mdash; quick question without stdin piping.
- `rhizome registry list` &mdash; inspect registered run artifacts and persona outputs.

## Agentic CLI (`rhizome agent`)

### Overview
`rhizome agent` orchestrates multi-step plans using persona knowledge. The `general` subcommand is the entry point for most work:

```bash
rhizome agent general \
  --persona don-socratic \
  --goal "Map verification steps for the plugin"
```

Key flags:
- `--persona` &mdash; persona to speak/plan through (see `rhizome persona list`).
- `--goal` &mdash; natural-language objective for the agent to pursue.
- `--provider` / `--model` &mdash; override defaults if needed (`auto`, `openai`, `ollama`, etc.).
- `--json` &mdash; emit machine-readable output (useful for scripting).
- `--execute` &mdash; run recommended CLI/MCP steps directly. Combine with `-y` to skip confirmation and `-v` for verbose command logs.

### Advanced Workflows
- **Plan-to-action loop**  
  1. Generate a plan with `--json` so you can log the steps.  
  2. Translate the suggested commands into real CLI calls (e.g., swap the agent’s `rhizome doc get` suggestion for the actual `rhizome docs status`).  
  3. Rerun the agent with `--execute -y -v` when you are confident the mapped commands are safe. This streams live output for each step.
- **Documentation sweep**  
  Use the agent to outline gaps, then run `rhizome docs status` to list existing guides and word counts. Add or edit files directly, or pipe drafts through `rhizome write --persona <name>` for first-pass prose before manual refinement.
- **Registry-first auditing**  
  Pair `--json` planning with `rhizome registry list` to reference prior runs. This helps when you need to prove a workflow already executed (tests, migrations, etc.) and prevents rework.
- **Persona rotation**  
  If a persona lacks effective context (warning shown for `.rhizome/<persona>/persona_effective.md`), synthesize it or fall back to another persona (e.g., `rhizome` or `root`) so the agent can still draft a plan.

### Intended Flow
1. Draft a goal (`--goal`) that explains the deliverable or investigation.
2. Review the generated plan (default behavior). No actions run until you opt in.
3. If the plan looks good, rerun with `--execute` to let Rhizome drive commands automatically.
4. Capture outputs in the registry (`rhizome registry list`) when you need an audit trail.

### Troubleshooting Notes
- **Missing persona context** &mdash; The agent expects `.rhizome/<persona>/persona_effective.md`. Regenerate via `rhizome persona synthesize --persona <name>` if the file is absent.
- **Network resolution errors** (`URLError: nodename nor servname provided`) &mdash; Indicates the CLI could not reach the configured provider URL. Verify your `rhizome config get ai.openai_key` and any proxy settings.
- **CLI not found** &mdash; Ensure the Python entry point is installed (`pip install -e tools/rhizome`) and restart your shell.

## Safety Checklist
- Review agent plans before granting execution.
- Keep API keys out of version control; prefer `rhizome config set` or environment variables.
- Log notable agent runs in `docs/` or project journals so the team can follow the trail.
