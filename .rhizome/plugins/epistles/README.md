# Epistles Plugin

**Version**: 0.1.0
**Status**: Portable, lift-out ready
**Purpose**: Letter-based persona conversations with full context & registry support

## What Are Epistles?

Epistles are **letters between personas** — recorded dialogs that preserve reasoning about decisions. They:

- Capture multi-perspective thinking (persona A questions, persona B responds)
- Include full context (linked docs, flight plans, previous epistles)
- Are searchable and cross-referenceable
- Serve as audit trail: "Why did we decide this way?"
- Work as teaching tool: new team members see how we think

## Install

### Quick Install (Single Repo)

```bash
# Already in your .rhizome/plugins/epistles/ — register with rhizome
cd /path/to/your/repo
python3 scripts/rhizome.py epistle list  # Should work if wired into rhizome.py
```

### Wire Into rhizome.py

In `scripts/rhizome.py`, after flight_commands registration:

```python
# Epistles plugin
try:
    from epistles_commands import register_epistle_commands
    register_epistle_commands(sub)
except ImportError:
    pass  # Plugin not installed
```

Add to sys.path if needed:
```python
sys.path.insert(0, os.path.join(CTX_DIR, 'plugins', 'epistles'))
```

### Lift to Another Repo

```bash
# Copy entire plugin directory to target repo
cp -r .rhizome/plugins/epistles /target/repo/.rhizome/plugins/epistles

# Wire into target's rhizome.py (see above)
# Done! Now you have: rhizome epistle ...
```

## Commands

### Create a new epistle

```bash
rhizome epistle new \
  --with "Flight Commander,Don-Socratic" \
  --topic "Workflow phases and command organization" \
  --prompted-by fp-1761601520 \
  --context flight_commands.py CLAUDE.md \
  --keywords "flight,workflow,help-text"
```

Creates:
- `flight-commander_don-socratic_20251028.md` (epistle file)
- Registry entry in `registry.ndjson`

### List all epistles

```bash
rhizome epistle list
rhizome epistle list --filter "Don-Socratic"
rhizome epistle list --since 2025-10-27
```

### Show a specific epistle

```bash
rhizome epistle show epistle-1730137245
rhizome epistle show flight-commander_don-socratic
```

### Search epistles

```bash
rhizome epistle search --topic "workflow"
rhizome epistle search --personas "Don-Socratic,Flight Commander"
rhizome epistle search --keywords "phases,help-text"
```

### Add context to existing epistle

```bash
rhizome epistle add-context epistle-1730137245 \
  --context flight_commands.py \
  --context rhizome.py
```

## Power-User: Persona Advocates for Files

**[ADVANCED FEATURE]** Personas can "advocate" for source files, embedding their mission as a living comment header. This enables **animated refactors** where personas provide commentary on code changes.

### Advocate Commands (Power-User Only)

These commands live under `rhizome persona power-user`:

#### Attach a persona to a file

```bash
rhizome persona power-user advocate-attach flight-commander scripts/flight_commands.py
# → Syncs Flight Commander's mission/principles into file header comment
# → Tracks file hash for change detection
```

Result: File header becomes:
```python
################################################################################
# PERSONA ADVOCATE: File Maintenance & Design
################################################################################
#
# This file is advocated for by: flight-commander
# Mission: Flight plan steward & workflow architect...
#
# Last synced: 2025-10-28T...
################################################################################
```

#### List all advocates and their files

```bash
rhizome persona power-user advocate-list
# Shows: Persona | File | Status | Last Synced
# Status: ✓ Synced or ⚠️ CHANGED (file modified since last sync)
```

#### Watch a file for changes

```bash
rhizome persona power-user advocate-watch flight-commander scripts/flight_commands.py
# Detects if file was refactored
# [Future: Auto-generates persona commentary]
```

#### Generate an epistle for the advocate

```bash
rhizome persona power-user advocate-epistle flight-commander scripts/flight_commands.py
# Creates epistle: flight-commander advocates for its file
# Pre-populated with persona mission + design principles
# You fill in observations about the refactor
```

### Use Cases

**Animated Refactor Workflow:**
1. Start refactoring: `advocate-attach flight-commander flight_commands.py`
2. Make changes to the file
3. End refactor: `advocate-epistle flight-commander flight_commands.py`
4. Result: Epistle documenting *why* the file evolved that way, from persona's perspective

**File Onboarding:**
- New developer opens file
- Sees advocate header with persona mission
- Understands design intent immediately
- Can check related epistles for historical context

**Design Audit Trail:**
- Each refactor creates an epistle
- Over time: chain of epistle-001, epistle-002, epistle-003...
- Shows how file evolved + reasoning for each change

### Persona Metadata: `advocates_for`

In a persona YAML file:
```yaml
name: flight-commander
advocates_for:
  - scripts/flight_commands.py
```

When synced, this tells the system which files the persona is responsible for.

## Directory Structure

```
.rhizome/plugins/epistles/
├── plugin.yaml                           # Plugin manifest
├── epistles_commands.py                  # CLI commands & logic
├── persona_advocate.py                   # Power-user: personas advocate for files
├── persona-advocates.ndjson              # Registry of persona advocates
├── README.md                             # This file
├── INSTALLATION.md                       # Detailed setup
├── registry.ndjson                       # Index of all epistles (line-delimited JSON)
├── templates/
│   ├── claude-conversation.md            # Template for Claude conversations
│   ├── socratic-challenge.md             # [Future]
│   └── decision-review.md                # [Future]
├── context/                              # [Optional] Referenced context docs
│   └── (copies of files referenced by epistles)
└── *.md                                  # Epistle files
    ├── flight-commander_don-socratic_20251028.md
    ├── claude-sim-hallie-empathy-agent_cli-restructuring_20251028.md
    ├── flight-commander_advocates_for_refactor_20251028.md
    └── ...
```

## Registry Format (registry.ndjson)

Each line is a JSON object:

```json
{
  "id": "epistle-1730137245",
  "date": "2025-10-28",
  "personas": ["Flight Commander", "Don-Socratic"],
  "topic": "Workflow phases and command organization",
  "prompted_by": "fp-1761601520",
  "file": "flight-commander_don-socratic_20251028.md",
  "status": "draft",
  "references": ["epistle-1730136999"],
  "context": ["flight_commands.py", "CLAUDE.md"],
  "keywords": ["flight", "workflow", "help-text", "phases"]
}
```

## Epistle File Format

```markdown
# Epistle: Persona A ↔ Persona B

**ID**: epistle-1730137245
**Date**: 2025-10-28
**Topic**: Workflow phases and command organization
**Prompted by**: fp-1761601520
**Status**: draft

## Context

**Referenced documents:**
- flight_commands.py
- CLAUDE.md
- Previous epistle: epistle-1730136999

## Dialog

**Flight Commander:**
[message]

**Don-Socratic:**
[question/response]

...

## Outcome / Conclusions

[What did we decide? What did we learn?]

## Related Files & References

- Flight plan: fp-1761601520
- Previous epistles: epistle-1730136999
- Implementation: flight-commander persona sprout in flight_commands.py
```

## Design Principles

1. **Self-contained** - Can be copied wholesale to another repo
2. **Zero external dependencies** - Uses only stdlib
3. **Portable** - Python 3.8+, no pip installs needed
4. **Easy discovery** - Registry is human-readable + searchable
5. **Context-aware** - Epistles link to docs, flight plans, each other
6. **Audit-friendly** - Every epistle is versioned by date
7. **Extensible** - Templates & custom personas welcomed

## Future Enhancements

- [x] Persona advocate system (power-user: animated refactoring)
- [ ] AI-powered advocate commentary (auto-generate observations on file changes)
- [ ] epistle template system (socratic-challenge, decision-review, etc.)
- [ ] Cross-epistle linking (show relationship graph)
- [ ] Export epistles to HTML/PDF for sharing
- [ ] Integration with flight plan approval workflows
- [ ] Epistle AI summaries (via rhizome's AI)
- [ ] Discord/Slack integration for recording dialogs
- [ ] Approval workflows for code changes based on advocate review

## Related

- Flight plans: `.rhizome/flight_plans/`
- Personas: `.rhizome/personas.d/`
- Actions log: `.rhizome/actions.ndjson`
