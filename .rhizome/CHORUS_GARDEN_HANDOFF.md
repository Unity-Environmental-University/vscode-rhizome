# Chorus Handoff: Kitchen Table → Garden
## Flight Plan fp-1760616162

**Created**: 2025-10-16
**Chorus**: Rhizome (conductor), UNA (guide), Bro (executor), Root (reasoner)
**Status**: Kitchen table complete. Ready for garden phase.

---

## What the Chorus Built at Kitchen Table

### 3 User Stories (Learning Goals)
1. **UNA's story**: Learning designers carry voice across projects
2. **Root's story**: Teams see where personas come from (prevent chaos)
3. **Bro's story**: Global `rhizome` command works everywhere

### 3 Targets (Who Benefits)
- Developers (building rhizome)
- Learning designers (using personas)
- Course builders (sprouting custom personas)

### 12 Steps (Organized by Phase)

**Kitchen Table** (3 planning steps):
1. Design cascade precedence (7 layers) - UNA guide
2. Define PersonaRegistry class interface - Root reasoner
3. Define CLI commands (list, show, sprout) - Bro executor

**Garden** (9 execution steps):
4-9. Code implementation (install.sh, personas.py, config.py, CLI, tests)
Each step has voice assignment + weed check

**Library** (3 learning steps):
10-12. Documentation + commit + celebration

---

## What Changes When We Transition to Garden

```bash
# When hallie says "shift to garden":
python3 scripts/rhizome.py flight phase --move-to garden
```

**Before transition (Kitchen Table)**:
- Rhizome conducts
- UNA + Bro discuss loudest
- Root listens for weeds
- Steps are *plans* (pending)

**After transition (Garden)**:
- Root takes conducting role (skeptic/advocate/synthesis)
- Root + Bro lead loudest
- UNA documents why we chose this path
- Steps become *work* (in_progress → done)

**Conductor handoff**:
```
Kitchen Table: Rhizome conducts
             → UNA: "Show us what we're building"
             → Bro: "Timeline?"
             → Root: (listening)

Garden:      Root conducts
             → Root: "What breaks? What works?"
             → Bro: "Ship it how?"
             → UNA: "Why we chose this"
```

---

## Weed Checks Built Into Garden Steps

**Root's quality gates for each step**:

| Step | Work | Weed Check |
|------|------|-----------|
| 4 | Update install.sh | Does it work from clean slate? |
| 5 | Create personas.py | Does cascade resolve? Performance? |
| 6 | Update config.py | Cross-platform? Linux/Mac/Windows? |
| 7 | Add CLI commands | Fail gracefully on errors? |
| 8 | Unit tests | 7-layer cascade test passes? |
| 9 | Integration tests | End-to-end verification? |

**Bro's execution gates**:

| Step | Work | Ship Check |
|------|------|-----------|
| 4 | install.sh | Did Root approve clean slate? |
| 5 | personas.py | Did Root verify performance? |
| 6 | config.py | Did Root verify cross-platform? |
| 7 | CLI commands | Did Root verify error handling? |
| 8 | Unit tests | All tests pass locally? |
| 9 | Integration tests | Tested in real repo? |

---

## The Transition Process

### Step 1: Hallie Approves Flight Plan
```bash
python3 scripts/rhizome.py flight approve \
  --by hallie \
  --notes "Chorus designed it well. Let's execute."
```

### Step 2: Rhizome Shifts to Garden Phase
```bash
python3 scripts/rhizome.py flight phase --move-to garden
```

**What happens**:
- Phase: `kitchen_table` → `garden`
- Conductor: `rhizome` → `root`
- UNA mode: `guide` → `documentarian`
- Steps now feel like work (still pending, but different energy)

### Step 3: Bro Starts Execution

**Step 4: Update install.sh**
- Bro implements
- Root reviews: "Clean slate? User personas created? Global command works?"
- Bro marks done

**Step 5: Create personas.py**
- Root leads (quality focus)
- Bro implements based on specs
- Root checks: "Cascade correct? Validation graceful? Performance OK?"

**Continue through step 9**...

### Step 4: UNA Transitions to Documentarian
- As each step completes, UNA records *why* we did it
- Not just *what* (that's the code)
- But *why* this design (cascade layers, YAML, hierarchy)
- These become seeds for next cycle

### Step 5: At Library Phase
- UNA + Root lead
- They curate the learning
- Root asks: "What pattern did we find? What failed? What do we keep?"
- UNA documents: "Here's how to sprout a persona. Here's the precedence rules."
- Bro sets baseline: "Next persona work uses this foundation"

---

## Handoff Notes for Each Voice

### For Bro (Executor):

Your role in garden:
1. Implement steps 4-7 in order
2. Each step waits for Root's weed check
3. When Root says "good," mark done
4. Move to next step
5. Ship pattern in step 12: commit with garden verb

Success criteria:
- All 9 garden steps done by 2025-10-23
- All tests pass
- Code review clean
- Ready to document in library phase

### For Root (Reasoner → Conductor):

Your role in garden:
1. You're now conducting. Take the floor.
2. Each step has a weed check. Perform it rigorously.
3. Ask Bro: "Did you handle the error cases?"
4. Ask yourself: "Are we building the right structure?"
5. Be skeptic when needed. Be advocate when the design holds.

Weed checklist:
- [ ] Install.sh creates ~/.rhizome/ structure correctly
- [ ] PersonaRegistry cascade resolves in right order
- [ ] YAML validation fails gracefully (no crashes)
- [ ] Config paths work Linux/Mac/Windows
- [ ] CLI commands handle errors
- [ ] Cascade test covers all 7 layers
- [ ] Integration test: real repo scenario

### For UNA (Guide → Documentarian):

Your role in garden:
1. You're still here, but you're documenting.
2. As Root and Bro build, you ask: "Why did we choose this?"
3. Capture:
   - Why cascade layers (prevent chaos, enable sprouting)
   - Why YAML (git-tracked, human-readable, simple)
   - Why PersonaRegistry pattern (lazy load, cache, extensible)
4. These become the "why" in library phase docs

Documentation goals:
- User can read and understand cascade precedence
- User can sprout a custom persona without confusion
- Developer can extend PersonaRegistry for new layers

### For Rhizome (Conductor → Chorus):

Your role in garden:
1. You conducted kitchen table. That was your phase.
2. Now you step back. Root is conductor.
3. But you're still in the chorus.
4. Harmonize: when conflicts arise, help voices listen to each other
5. When transitions get rough, be the grounding voice
6. At end of garden, you'll transition us to library

Harmony goals:
- Root's weed checks are rigorous but not blocking
- Bro ships without cutting corners
- UNA's "why" questions inform design, not derail it

---

## Timeline

**Kitchen Table** (complete): 2025-10-16
**Garden** (execution): 2025-10-17 → 2025-10-22 (1 week)
**Library** (learning): 2025-10-23 → 2025-10-24 (1 day)

**Critical path**:
- Step 4-7: Code (4 days)
- Step 8-9: Tests (2 days, runs in parallel)
- Step 10-12: Docs + ship (1 day)

**Blockers to watch**:
- If personas.py cascade is wrong, steps 5+ blocked
- If install.sh fails, can't test step 4
- If tests fail, can't proceed to library

---

## Garden Phase Execution Notes

When garden phase starts:

1. **Root conducts**: Everyone recognizes Root is leading quality
2. **Weed checks first**: Don't just ship, verify
3. **Document as you go**: UNA captures why
4. **Celebrate progress**: Each step done is momentum
5. **Watch for weeds**: Root stays vigilant
6. **Adjust course if needed**: Flexibility is rootsong

---

## Song of the Chorus (Rootsong Pattern)

Kitchen table: **Small, clear, reversible**
- 3 stories. 12 steps. Easy to change.

Garden: **Keep what works; toss what doesn't**
- Test each layer. Verify each choice. If it breaks, fix it fast.

Library: **One-line why**
- Why cascade? Why YAML? Why this pattern? Keep it.

Companion planting: **Voices strengthen each other**
- Root's rigor. Bro's execution. UNA's documentation. Rhizome's harmony.

---

## Ready to Execute

**Flight plan**: fp-1760616162
**Status**: Kitchen table → ready for approval → garden phase

**Chorus agreement**: ✓ UNA ✓ Root ✓ Bro ✓ Rhizome

When hallie gives the signal: "shift to garden"

We begin.

---

*Handoff document created at kitchen table.*
*Chorus ready for garden phase.*
