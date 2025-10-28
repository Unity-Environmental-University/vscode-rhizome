# Tutorial: Persona Advocates for Animated Refactoring

**Goal**: Learn how to use personas to advocate for files they maintain, embedding design rationale as living code comments.

## The Idea (60 seconds)

Instead of code comments that rot, you create living comments where **a persona advocates for the file's design**.

When you refactor, the persona watches and provides commentary in an epistle.

Result: **animated refactors** where you see *why* the code evolved that way.

---

## Example: Flight Commander Advocates for flight_commands.py

### Step 1: Attach the Advocate

```bash
rhizome persona power-user advocate-attach flight-commander scripts/flight_commands.py
```

**What happens:**
- Reads Flight Commander persona (from `.rhizome/personas.d/custom/flight-commander.yml`)
- Syncs persona's mission + principles into file header as a comment block
- Computes file hash for change detection
- Registers advocate in `persona-advocates.ndjson`

**Result in flight_commands.py:**
```python
################################################################################
# PERSONA ADVOCATE: File Maintenance & Design
################################################################################
#
# This file is advocated for by: flight-commander
# Mission: Flight plan steward & workflow architect. Keeps flight planning
#          intuitive, phase-aware, and reversible.
# Modes: steward, architect, advocate, clarity_guardian
#
# This comment header is maintained by the persona advocate system.
# It serves as a continuous reminder of the file's design principles.
# When the file is refactored, this advocate provides context on maintainability.
#
# Last synced: 2025-10-28T13:45:22Z
################################################################################

# [rest of your file...]
```

### Step 2: Refactor the File

Now you make changes to the file. Maybe you:
- Reorganize commands by workflow phase
- Improve help text
- Add new features
- Simplify logic

The advocate header stays at the top as a reminder of *why* the design matters.

### Step 3: Watch for Changes

```bash
rhizome persona power-user advocate-watch flight-commander scripts/flight_commands.py
```

**Output:**
```
🔍 flight-commander observing changes to scripts/flight_commands.py

Original hash: 3f7b8e2a...
Current hash:  a9d2c1f4...

⚠️ CHANGED — file has been refactored
```

This tells you the file has changed since the advocate was attached.

### Step 4: Document the Refactor

```bash
rhizome persona power-user advocate-epistle flight-commander scripts/flight_commands.py
```

**What happens:**
- Creates a new epistle: `flight-commander_advocates_for_refactor_20251028.md`
- Pre-populates it with Flight Commander's mission
- Auto-includes links to the file and persona
- Ready for you to fill in your observations

**Your task:** Edit the epistle to describe:
- What changed? (reorganized commands by phase)
- Why? (users see workflow immediately)
- Does it serve Flight Commander's mission? (yes/no)
- Did we maintain reversibility? (yes/no/needs work)

**Example entry:**
```markdown
## Advocate's Observations

Flight Commander observes that commands have been reorganized by workflow phase:

✅ **GOOD**: Users see workflow structure immediately
   - CREATE/PLAN phase groups init, propose
   - POPULATE phase groups add-story, add
   - Help text now shows "when" before "what"

✅ **MAINTAINS REVERSIBILITY**: Old command names still work via aliases
   - Users with scripts won't break
   - Can migrate gradually

❓ **QUESTION**: Should we show phase headers in --help output?
   - Currently visible only in code comments
   - Persona recommends: custom argparse formatter to make visible
   - See epistle-001 (Don-Socratic challenges this)

**Conclusion**: This refactor aligns with Flight Commander's mission.
The file is more maintainable and user-centered.
```

### Step 5: Commit & Link

```bash
git add scripts/flight_commands.py
git add .rhizome/plugins/epistles/flight-commander_advocates_for_refactor_20251028.md
git commit -m "Refactor: Organize flight commands by workflow phase

Addresses epistle-001 suggestion to show phase groups to users.
Flight Commander advocates for this change (see epistle-003).

✨ Changes:
- Grouped commands: CREATE, POPULATE, TRACK, MANAGE, TRANSITION
- Updated help text: 'when' context before 'what' mechanics
- Maintained backward compatibility via command aliases
- Added phase headers to --help formatting

Epistle: flight-commander advocates for its file (animated refactor)
Reference: epistle-003
"