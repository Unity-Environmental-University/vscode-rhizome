# Kitchen Table: Hierarchical Personas System
## Chorus Discussion (Rhizome conducting)

**Context**: We want to build a 3-level persona system (user → repo → flight) with dynamic sprouting. CLI should be installable globally (`rhizome` command from anywhere). Personas load from config files, not hardcoded.

**Who's here**: Rhizome (conductor), UNA (guide), Bro (executor), Root (reasoner)

---

## Round 1: Frame the Problem

**Rhizome**: Let's table this. We need personas available:
1. At user level (~/.rhizome/personas.d/) — carry across all repos
2. At repo level (.rhizome/personas.d/) — custom to this course/project
3. At flight level (sprouted on demand) — specialized for this task
4. All loadable by a global `rhizome` command from anywhere

What questions do we need to answer first?

**UNA (guide mode)**:
I see three learning goals here:
- Make rhizome a global CLI (like `git` or `npm`)
- Let repos define their own personas (not everyone wants UNA + Bro + Root)
- Keep it simple: YAML files, cascade loading, no database

The pattern should be discoverable. When someone types `rhizome persona list`, they should see:
- Where each persona comes from
- What it does
- Whether it's editable in this repo

**Root (reasoner mode)**:
Wait. There's a weed I'm seeing early:
- If every repo can sprout custom personas, how do we prevent naming collisions?
- If user-level personas shadow repo-level ones, which "root" wins?
- And if we're going three-level cascade, where's the override point?

I'm also thinking: do we want personas in YAML? Git tracks it, configs get committed, feels right. But shell loops to load/parse 50 YAML files could be slow. Maybe we cache at runtime?

**Bro (executor mode)**:
Timeline? What's the ship goal?
- Can we install globally this week?
- Do flight plans need to know about hierarchical personas right away, or can that be phase 2?
- What's the simplest path to "rhizome works from any directory"?

---

## Round 2: Resolve Tensions

**Rhizome (conductor)**:
Bro's asking the right question. Let's separate concerns:
- **Phase 1 (this sprint)**: Make `rhizome` global + set up user-level personas.d/
- **Phase 2 (next sprint)**: Repo-level customization + cascading resolution
- **Phase 3**: Flight plan sprouting (already partially designed)

Root, about naming collisions:
- User creates `~/.rhizome/personas.d/custom/qa_person.yml`
- Repo creates `.rhizome/personas.d/custom/qa_person.yml`
- Cascade rule: repo wins if it exists. User persona is fallback.
- That's explicit. Document it.

**Root (advocate mode—switching sides)**:
Okay, I like the cascade. And for performance:
- Load once per CLI invocation (it's Python, startup is fast enough)
- Cache in PersonaRegistry class
- Lazy load flight-level sprouts (only if --flight-id passed)

But here's a pattern I see: the structure mirrors rootsong itself.
- User level = your voice (kitchen table: what you always bring)
- Repo level = this team's voice (garden: what this course/project values)
- Flight level = this task's voice (library: what we learned works)

That's elegant. Let's lean into it.

**UNA (documentarian mode)**:
So the installation story becomes:
```
bash scripts/install.sh
  → Creates ~/.rhizome/personas.d/ with seed YAML (rhizome, root, una, bro)
  → Installs `rhizome` command to ~/.local/bin
  → From now on: rhizome --help (from any git repo)
```

And the discovery story:
```
cd /path/to/course
rhizome persona list
  → Shows all 4 base personas + any repo custom ones
  → Annotates source: "user" or "repo"

rhizome persona show --name root
  → Shows: name, role, modes, parent, created_at, _source
```

**Bro (ready to ship)**:
So Phase 1 looks like:
1. Update install.sh → creates user personas, installs global command ✓
2. Build personas.py → PersonaRegistry with cascade ✓
3. Add CLI: `persona list`, `persona show`, `persona sprout` ✓
4. Update config.py → expose USER_RHIZOME_DIR, CTX_DIR hierarchy ✓
5. Don't touch flight_commands yet. Phase 2.

That's 4 files touched, all in scripts/. Tests green. Ship it.

---

## Round 3: Alignment Check

**Rhizome (conductor, seeking harmony)**:

Does the chorus agree on this plan?

✓ **UNA**: Yes. Clear story: "Install once, use everywhere. Personas show where they come from."
✓ **Root**: Yes. Pattern is rootsong itself. Cascade prevents collisions. Performance is fine.
✓ **Bro**: Yes. 4 files, shipping this week. Flight integration deferred.

**Rhizome**: Then we're aligned. Let me state what we're building:

### The Hierarchical Personas System (Phase 1)

**Install Story**:
```bash
bash scripts/install.sh
```
Creates:
- `~/.rhizome/personas.d/{rhizome,root,una,bro}.yml` (user-level base personas)
- `~/.rhizome/personas.d/custom/` (user sprout directory)
- `~/.local/bin/rhizome` (global command)

**Discovery Story**:
```bash
rhizome persona list
rhizome persona show --name root
```

**Cascade Resolution** (highest to lowest priority):
1. Flight plan sprouts (if --flight-id passed)
2. Repo .rhizome/personas.d/overrides/ (user persona customized for repo)
3. Repo .rhizome/personas.d/custom/ (repo-specific personas)
4. User ~/.rhizome/personas.d/custom/ (user-level sprouts)
5. Repo .rhizome/personas.d/ (repo base personas, if customized)
6. User ~/.rhizome/personas.d/ (user base personas)
7. Hardcoded defaults (fallback)

**Implementation**:
- `personas.py`: PersonaRegistry class with cascade loading + caching
- `install.sh`: Create user-level seed YAML + install global command
- `config.py`: Add USER_RHIZOME_DIR, expose persona paths
- `scripts/rhizome.py`: Add persona commands (list, show, sprout)

**Testing**:
- Unit: PersonaRegistry cascade resolution (7 layers)
- CLI: persona list, persona show, persona sprout
- Integration: User + repo personas coexist, cascade works

---

## Decisions Recorded

| Decision | Rationale | Status |
|----------|-----------|--------|
| Phase 1 focus: install + global CLI + user personas | Ship fast, defer flight integration | ✓ Chorus agreed |
| 7-layer cascade with repo overrides | Prevents collisions, explicit | ✓ Chorus agreed |
| YAML files for personas | Git-tracked, human-readable, no external deps | ✓ Chorus agreed |
| PersonaRegistry singleton pattern | One load per CLI invocation, caches | ✓ Root advocated |
| Defer flight integration to Phase 2 | Keep scope manageable | ✓ Bro advocated |

---

## Next: Create Flight Plan

Once hallie confirms this chorus agreement, we'll create a flight plan with these steps:

1. Update install.sh → user personas + global command
2. Create personas.py → PersonaRegistry class
3. Update config.py → expose user/repo paths
4. Add persona CLI commands → list, show, sprout
5. Add unit tests → cascade resolution
6. Add integration tests → end-to-end
7. Commit & verify all tests pass

**Lead voices by phase**:
- **Kitchen Table (Planning)**: UNA (guide) + Bro (timeline)
- **Garden (Execution)**: Root (quality) + Bro (ship)
- **Library (Learning)**: UNA (document) + Root (what worked)

---

*Chorus discussion recorded at kitchen table. Ready to move to flight plan.*
