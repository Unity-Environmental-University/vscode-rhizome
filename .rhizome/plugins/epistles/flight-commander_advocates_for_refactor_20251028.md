# Epistle: Flight Commander Advocates for Its Own File

**ID**: epistle-003
**Date**: 2025-10-28
**Topic**: Persona advocate system: animated refactoring with design rationale
**Prompted by**: Power-user request for "personas advocating for files they maintain"
**Status**: complete

---

## Context

**What we're building:** A system where personas can "advocate" for source files they maintain, embedding their mission and principles as living comments at the top of files.

**Why it matters:** Files evolve. Developers refactor. But *why* was it designed this way? A persona advocate provides continuous commentary on maintainability and design intent.

**System components:**
- `persona_advocate.py` — Core advocate system (sync, watch, track changes)
- `persona-advocates.ndjson` — Registry mapping personas → files
- Power-user commands under `rhizome persona power-user`:
  - `advocate-attach` — Sync persona header into file
  - `advocate-list` — Show all advocates and tracked files
  - `advocate-watch` — Detect file changes, prepare commentary
  - `advocate-epistle` — Generate epistle for the advocate

**Flight Commander as example:** Flight Commander advocates for `scripts/flight_commands.py`

---

## The Concept: Animated Refactor

An **animated refactor** is a development workflow where:

1. A persona (e.g., Flight Commander) is responsible for a file
2. Its mission/principles are synced into a comment header
3. The file evolves (refactors, improvements, changes)
4. The persona "watches" and can generate commentary on:
   - Does this change serve the file's original purpose?
   - Is the change reversible?
   - Did we document *why*?

**Example flow:**
```bash
# 1. Attach Flight Commander to flight_commands.py
rhizome persona power-user advocate-attach flight-commander scripts/flight_commands.py
# → Syncs header comment with mission + key principles

# 2. Developer refactors the file
# → Changes file_commands.py (e.g., reorganizing commands, updating help text)

# 3. Watch for changes
rhizome persona power-user advocate-watch flight-commander scripts/flight_commands.py
# → Detects file_hash changed
# → Prepares for persona commentary

# 4. Create epistle documenting the advocate's view
rhizome persona power-user advocate-epistle flight-commander scripts/flight_commands.py
# → Generates epistle with advocate's observations on the refactor
```

**Result:** A living narrative of *why* the file is designed this way, maintained by the persona responsible for it.

---

## Design Philosophy

### Why Personas Should Advocate for Files

Files have souls. Not literally, but:
- They embody design decisions
- They represent someone's *intent*
- They contain implicit knowledge about "why"

A persona advocate makes that intent **explicit**.

**Example:** Flight Commander advocates for `flight_commands.py` because:
- It implements the flight planning workflow
- Commands should be organized by user workflow, not implementation
- Help text should teach users *when* to use a command, not just *what* it does
- Every change should preserve reversibility

When the file is refactored, Flight Commander can advocate:
- ✅ "Good: The new phase grouping matches user mental models"
- ❌ "Question: Does this change break reversibility?"
- 📝 "Remember: Help text should answer 'when' before 'what'"

### Power-User vs Regular Commands

The advocate system is intentionally **power-user only**:
- Regular users: `rhizome epistle` (create conversations)
- Power users: `rhizome persona power-user advocate-*` (personas maintain files)

This keeps the CLI clean while enabling advanced workflows for people who need them.

---

## Implementation Details

### Persona Metadata: `advocates_for`

Personas can now include:
```yaml
advocates_for:
  - scripts/flight_commands.py
```

This tells the system: "This persona is responsible for this file."

### Advocate Header Synced Into Files

When you run `advocate-attach`, a header is inserted at the top:

```python
################################################################################
# PERSONA ADVOCATE: File Maintenance & Design
################################################################################
#
# This file is advocated for by: flight-commander
# Mission: Flight plan steward & workflow architect...
# Modes: steward, architect, advocate, clarity_guardian
#
# Last synced: 2025-10-28T...
################################################################################

[rest of file...]
```

**Why this header?**
1. **Visible to developers** — Not buried in comments elsewhere
2. **Self-documenting** — Anyone opening the file sees who's responsible
3. **Updateable** — Re-running `advocate-attach` updates the header with latest persona data
4. **Change-trackable** — File hash shows if changes were made since last sync

### File Hash Tracking

Registry stores:
- `file_hash` — SHA256 of file content when last synced
- `synced_at` — Timestamp of last sync
- `status` — active/paused/archived

When `advocate-watch` runs:
- Computes current file hash
- Compares to stored hash
- If changed: "⚠️ CHANGED — file has been refactored"
- Prepares for persona commentary

### Registry Format (NDJSON)

Each line is an advocate entry:
```json
{"persona":"flight-commander","file":"scripts/flight_commands.py","file_hash":"abc123...","synced_at":"2025-10-28T...","status":"active"}
```

Searchable, git-trackable, mergeable.

---

## Use Cases

### Use Case 1: File Maintenance During Refactor

```bash
# Before starting a refactor:
rhizome persona power-user advocate-attach flight-commander scripts/flight_commands.py

# During refactor (edit the file...)

# After refactor, create an epistle:
rhizome persona power-user advocate-epistle flight-commander scripts/flight_commands.py
# → Epistle auto-populated with advocate's mission + concerns
# → You fill in "what changed" and "why"
# → Epistle becomes record of design decisions
```

### Use Case 2: Onboarding New Developers

New developer opens `flight_commands.py`:
1. Sees header comment with Flight Commander's mission
2. Understands the file's design intent immediately
3. Can check related epistles for "why" decisions
4. Knows who to ask about design questions

### Use Case 3: Design Audit Trail

Over time, epistles accumulate:
- epistle-001: Initial design (why these phases?)
- epistle-002: First refactor (moved commands to nested structure)
- epistle-003: Help text improvements (showing why before what)

Future developers can trace *how* the file evolved and *why*.

---

## Trade-offs & Considerations

### Pro: Living Documentation
- Persona metadata stays with the file
- No separate "design rationale" docs to maintain
- Automatically updated when persona changes

### Con: File Size
- Header comment adds ~15 lines per file
- For small files, this is noticeable
- But carries valuable design info

### Approach: Pragmatic
- Only attach advocates to core files (not every utility)
- Remove advocacy if file becomes stable/archived
- Headers are optional (can be paused/deleted)

---

## Evolution Path

### Phase 1 (Current MVP)
✅ Personas advocate for files (header sync)
✅ File hash tracking (detect changes)
✅ Commands: attach, list, watch, epistle
✅ Registry (NDJSON)

### Phase 2 (Next)
- AI-powered commentary: When file changes, AI generates observations from persona perspective
- Selective sync: Only sync header if approved (not auto-update)
- Custom header templates: Different formats for .py/.js/.ts/.java

### Phase 3 (Future)
- Integrated with flight plans: "step 7: refactor with advocate"
- Approval workflows: "Advocate must approve breaking changes"
- Cross-file advocacy: One persona advocates for file family
- Visualizer: Timeline showing file evolution + advocate commentary

---

## Implementation Notes

### File Extension Support
Currently: `.py`, `.js`, `.ts`, `.tsx`, `.jsx` (comment syntax differs)

To add more: Update `_get_file_extension()` in `persona_advocate.py`

### Persona Resolution
Persona files: `.rhizome/personas.d/custom/{name}.yml`

The system reads persona metadata (name, description, modes, mission) and syncs into header.

### CLI Nesting
Advocate commands live under:
```
rhizome
  ├─ epistle (regular epistles)
  └─ persona
      └─ power-user (advocate commands)
          ├─ advocate-attach
          ├─ advocate-list
          ├─ advocate-watch
          └─ advocate-epistle
```

Power-user isn't shown by default in help (it's advanced), but fully functional.

---

## Example: Flight Commander Advocates for flight_commands.py

### The Persona
```yaml
name: flight-commander
mission: |
  Small, reversible steps. Clear workflow. What's the next phase?

  Commands should teach by example:
  - Organize by workflow (not implementation)
  - Show "why" before "what"
  - Keep commands discoverable
  - Advocate for maintainability
```

### The Synced Header (in flight_commands.py)
```python
################################################################################
# PERSONA ADVOCATE: File Maintenance & Design
################################################################################
#
# This file is advocated for by: flight-commander
# Mission: Flight plan steward & workflow architect...
# Modes: steward, architect, advocate, clarity_guardian
#
# This comment header is maintained by the persona advocate system.
# It serves as a continuous reminder of the file's design principles.
# When the file is refactored, this advocate provides context on maintainability.
#
# Last synced: 2025-10-28T...
################################################################################
```

### Sample Epistle Entry (epistle-003)
```markdown
# Epistle: Flight Commander Advocates for scripts/flight_commands.py

**Topic**: Refactor of flight commands (Phase reorganization)

## Advocate's Observations

Flight Commander observes that commands are now grouped by workflow phase
in the `--help` output. This is GOOD because:
- Users see the workflow immediately
- Commands are discoverable by context
- Help text teaches the mental model

### Design Principles This File Embodies
- Small, reversible steps
- Clear workflow organization
- Progressive disclosure (common commands first)
- Help text that teaches "why"
```

---

## Related

**Personas:**
- Flight Commander (advocates for flight_commands.py)
- Don-Socratic (challenges design assumptions)
- sim-hallie-empathy-agent (brings user empathy)

**Epistles:**
- epistle-001: Flight Commander ↔ Don-Socratic (workflow phases)
- epistle-002: Claude ↔ sim-hallie-empathy-agent (epistles system)
- epistle-003: Flight Commander advocates (this epistle)

**Files:**
- `.rhizome/plugins/epistles/persona_advocate.py` — Core system
- `.rhizome/plugins/epistles/persona-advocates.ndjson` — Registry
- `.rhizome/personas.d/custom/flight-commander.yml` — Flight Commander persona

**Flight Plan:**
- fp-1761601520: CLI Structure Review (steps 6-10)

---

## Questions for Future Sessions

1. Should advocates be able to auto-generate diffs with commentary? ("Here's what changed, here's why I care...")
2. Could personas refuse changes that violate their principles? (Approval workflow)
3. Should advocate headers be collapsible in IDEs?
4. How do we avoid "dead" advocates on abandoned files?
5. Could epistles be generated automatically when file is refactored?

---

## Gratitude

This feature came from a simple ask: "Show how a persona advocates for a file's maintainability during refactors."

The result is richer: a system for embedding design rationale *inside* files, while preserving the full conversation history in epistles.

It's the opposite of code comments that rot: it's code comments that *advocate*.
