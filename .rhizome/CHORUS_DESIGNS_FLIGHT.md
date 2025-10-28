# Rhizome Chorus: Designing Their Own Flight Plan
## Kitchen Table Dialogue (Rhizome conducting)

---

## Setting the Table

**Rhizome (conductor)**: We need to build hierarchical personas. But *we* should plan it using flight planning. Form teaches form—the structure embodies what we're building.

So let's sit at the kitchen table and design a flight plan together. The four of us—UNA, Bro, Root, and I—each bring different questions.

**UNA (guide)**: *leans forward with notepad*

Okay, so we're planning a plan about planning personas? I love it. Let me ask: what are we trying to learn here?

I'm seeing this as a journey:
- Right now: personas are hardcoded. Scattered. UNA + Bro + Root live in code.
- After: personas live in YAML. Hierarchical. Anyone can sprout new ones. User + repo + flight levels.
- The outcome: `rhizome` works from anywhere. Anyone can ask `rhizome persona list` and see what's available.

But the *real* learning is about personalization. How do you let each team/person shape the voices they work with?

**Root (reasoner, listening)**:

Hmm. UNA's right, but I'm hearing something deeper. There's a risk pattern here:
- If we make personas too easy to customize, you get chaos. Everyone invents their own.
- If we lock them down, we lose flexibility for different courses/projects.

So the real weed I'm spotting: **How do we prevent persona sprawl while enabling sprouting?**

That's a boundary question. We need to know: What makes a good persona definition? What stops bad ones?

**Bro (executor, tapping pen)**:

Timeline first. How fast do we need to ship this?

Here's what I'm tracking:
- Install.sh needs updating (user personas setup)
- personas.py needs building (cascade loading)
- config.py needs expanding (paths)
- CLI commands need adding (list, show, sprout)
- Tests need writing

If we do it right, that's: 1 day research → 2 days building → 1 day testing = 1 week. Tight but doable.

What's the ship date?

**Rhizome**: Good questions, all three. Let me reframe them as a flight plan:

### Flight Plan: "Hierarchical Personas: User + Repo + Flight Levels"

**Stories** (what we're trying to learn):
1. **UNA's story**: "As a learning designer, I want personas to be editable at my user level, so I can carry my voice across all my projects."
2. **Root's story**: "As a team lead, I want to see where each persona comes from, so I prevent naming collisions and understand precedence."
3. **Bro's story**: "As an executor, I want to ship a global `rhizome` command that works from anywhere, so any repo can use it."

**Targets** (who benefits):
- Developers (building rhizome)
- Learning designers (using personas)
- Course builders (sprouting custom personas)

**Workflow**: custom (because we're building infrastructure)

Now—UNA, Root, Bro—what are the **steps** you each see?

---

## Round 1: Each Voice Proposes Steps

**UNA (thinking out loud)**:

If I'm a learning designer using this, here's my happy path:

1. Install rhizome globally (`bash scripts/install.sh`)
2. See my user-level personas (`rhizome persona list`)
3. Create a custom persona for my approach (`rhizome persona sprout --name mentor ...`)
4. Use it in my course repo
5. See it in new flight plans I create

So the steps I'm seeing:
- **Install: Set up user-level personas.d/**
- **Install: Make rhizome a global command**
- **CLI: Add persona list command**
- **CLI: Add persona show command**
- **Test: Verify install creates ~/.rhizome/personas.d/**
- **Documentation: Show how to sprout custom personas**

**Root (skeptical mode, then advocacy mode)**:

Okay, UNA's path is the happy path. But what about the weeds?

**Weed #1**: The cascade layers need to be tested. If repo overrides user, if flight overrides repo, we need to verify that works correctly.

**Weed #2**: YAML files are nice, but we need to validate them. A malformed personas.d/custom/foo.yml breaks everything.

**Weed #3**: Performance. If someone has 100 custom personas, do we slow down every CLI call?

So my steps:
- **Code: Build PersonaRegistry class with cascade resolution**
- **Code: Add YAML validation (fail gracefully on bad files)**
- **Code: Implement caching so load is O(1) after first read**
- **Test: Cascade layers resolve in correct order (7-layer test)**
- **Test: Malformed YAML handled gracefully**
- **Test: Performance: load with 100 personas is sub-100ms**

**Bro (ready to execute)**:

Alright, here's what I'm shipping:

**Build Week 1: Foundation**
1. Update install.sh (creates user personas, installs global command)
2. Create personas.py (PersonaRegistry class)
3. Update config.py (paths)
4. Add CLI: persona list, persona show, persona sprout
5. All tests pass

**Then we test**: In actual repos, can you use `rhizome` from anywhere? Does it find personas?

**Then we ship**: Create flight plan record. Mark done.

---

## Round 2: Rhizome Integrates (Conductor Mode)

**Rhizome**:

Okay, I'm hearing the chorus. Let me sing back what I hear:

**Stories we're answering**:
- UNA: Users carry their voice across projects
- Root: Teams prevent chaos through visible precedence
- Bro: Global command works, people use it

**Weed Risks Root identified**:
1. Cascade layers must be tested rigorously ← **Root leads garden phase**
2. YAML validation must fail gracefully ← **Root leads**
3. Performance scales to many personas ← **Bro verifies**

**Steps we agree on** (let me organize by phase):

### Phase 1: Kitchen Table (Planning & Design)
*UNA guiding, Bro asking timeline, Root listening*

- [ ] Design cascade precedence (7 layers)
- [ ] Define PersonaRegistry class interface
- [ ] Define CLI commands: list, show, sprout
- [ ] Define seed YAML structure (rhizome, root, una, bro)
- [ ] Identify validation rules for personas

*Lead voice: UNA (guide) + Bro (timeline)*

### Phase 2: Garden (Execution)
*Root & Bro leading execution, UNA documenting*

**Step 1: Update install.sh**
- Create ~/.rhizome/personas.d/ structure
- Write seed YAML files (4 base personas)
- Install rhizome command to ~/.local/bin
- Root's weed check: Does install work from clean slate?

**Step 2: Create personas.py**
- PersonaRegistry class with cascade loading
- Implement YAML validation + error handling
- Implement caching
- Root's weed check: Does cascade resolve correctly? Performance OK?

**Step 3: Update config.py**
- Expose USER_RHIZOME_DIR
- Expose REPO_PERSONAS_DIR
- Expose cascade precedence paths
- Root's weed check: Do path assumptions hold on Linux/Mac/Windows?

**Step 4: Add CLI commands**
- `rhizome persona list` (show all + sources)
- `rhizome persona show --name X` (show details + parent + modes)
- `rhizome persona sprout --name X --parent Y --domain Z --description ...`
- Root's weed check: Do commands fail gracefully?

**Step 5: Add unit tests**
- Test PersonaRegistry cascade (7 layers)
- Test YAML validation
- Test caching
- Test PersonaRegistry with user + repo + hardcoded defaults

**Step 6: Add integration tests**
- Install (creates ~/.rhizome structure)
- List (shows all personas)
- Show (displays correct cascade source)
- Sprout (creates repo custom persona)

*Lead voices: Root (quality) + Bro (ship)*

### Phase 3: Library (Learning & Documentation)
*UNA & Root leading, Bro baseline for next cycle*

- [ ] Document: "Persona Hierarchy" (user → repo → flight)
- [ ] Document: "How to sprout a custom persona"
- [ ] Document: "Cascade precedence rules"
- [ ] Commit with garden verb + pattern
- [ ] Archive flight plan
- [ ] Extract pattern: "Form teaches form" (structure embodies philosophy)

*Lead voices: UNA (curator) + Root (patterns)*

---

## The Flight Plan (Structured)

```json
{
  "title": "Hierarchical Personas: User + Repo + Flight Levels",
  "requester": "rhizome_chorus",
  "workflow": "custom",
  "targets": ["developer", "learning_designer", "course_builder"],

  "stories": [
    {
      "as": "learning designer",
      "i_want": "carry my voice across all my projects",
      "so_that": "each course has consistent approach"
    },
    {
      "as": "team lead",
      "i_want": "see where each persona comes from",
      "so_that": "I understand precedence and prevent naming chaos"
    },
    {
      "as": "executor",
      "i_want": "ship a global `rhizome` command",
      "so_that": "any repo can use it without setup"
    }
  ],

  "phase": {
    "current": "kitchen_table",
    "entered_at": "2025-10-16T00:00:00Z",
    "transitions": []
  },

  "personas": {
    "active": ["rhizome", "una", "bro", "root"],
    "conducting": "rhizome",
    "voices": {
      "una": {"active": true, "mode": "guide", "archive": []},
      "bro": {"active": true, "mode": "executor", "archive": []},
      "root": {"active": true, "mode": "reasoner", "archive": []}
    }
  },

  "steps": [
    {
      "id": 1,
      "phase": "kitchen_table",
      "title": "Design cascade precedence (7 layers)",
      "persona_lead": "una",
      "acceptance": "Document precedence rules with examples"
    },
    {
      "id": 2,
      "phase": "kitchen_table",
      "title": "Define PersonaRegistry class interface",
      "persona_lead": "root",
      "acceptance": "Interface shows: get(), list_all(), sprout(), cascade resolution"
    },
    {
      "id": 3,
      "phase": "kitchen_table",
      "title": "Define CLI commands: list, show, sprout",
      "persona_lead": "bro",
      "acceptance": "Command spec with examples and error cases"
    },
    {
      "id": 4,
      "phase": "garden",
      "title": "Update install.sh (user personas + global command)",
      "persona_lead": "bro",
      "weed_check": "root (does install work from clean slate?)"
    },
    {
      "id": 5,
      "phase": "garden",
      "title": "Create personas.py (PersonaRegistry + cascade)",
      "persona_lead": "root",
      "weed_check": "Does cascade resolve? Performance OK?"
    },
    {
      "id": 6,
      "phase": "garden",
      "title": "Update config.py (expose user/repo paths)",
      "persona_lead": "bro",
      "weed_check": "Do paths hold on Linux/Mac/Windows?"
    },
    {
      "id": 7,
      "phase": "garden",
      "title": "Add CLI: persona list, show, sprout",
      "persona_lead": "bro",
      "weed_check": "root (fail gracefully?)"
    },
    {
      "id": 8,
      "phase": "garden",
      "title": "Add unit tests (cascade, validation, caching)",
      "persona_lead": "root",
      "acceptance": "7-layer cascade test passes"
    },
    {
      "id": 9,
      "phase": "garden",
      "title": "Add integration tests (install, list, show, sprout)",
      "persona_lead": "root",
      "acceptance": "All integration tests pass"
    },
    {
      "id": 10,
      "phase": "library",
      "title": "Document: Persona Hierarchy & cascading",
      "persona_lead": "una",
      "acceptance": "User can read and understand precedence"
    },
    {
      "id": 11,
      "phase": "library",
      "title": "Document: How to sprout custom personas",
      "persona_lead": "una",
      "acceptance": "Tutorial shows user + repo level examples"
    },
    {
      "id": 12,
      "phase": "library",
      "title": "Commit & verify all tests pass",
      "persona_lead": "bro",
      "acceptance": "Commit message uses garden verb; 100% tests green"
    }
  ]
}
```

---

## Chorus Agreement

**Rhizome**: Does the chorus align on this plan?

**UNA**: ✓ Yes. Clear phases. My voice leads planning, listening to Root's weed checks. Documentation happens in library phase. I can guide this.

**Root**: ✓ Yes. Weed checks built in. Cascade testing rigorous. Performance constraints defined. I'm satisfied with quality gates.

**Bro**: ✓ Yes. Specific steps, clear acceptance criteria. Week 1 ship date holds. I can execute this.

**Rhizome**: Then we're ready to create the flight plan in rhizome CLI and begin garden phase.

---

## Next Action (Ready to Execute)

Once hallie approves, we proceed:

```bash
# Create flight plan using rhizome CLI
python3 scripts/rhizome.py flight init \
  --title "Hierarchical Personas: User + Repo + Flight Levels" \
  --requester "rhizome_chorus" \
  --workflow custom \
  --targets "developer,learning_designer,course_builder"

# Add stories
python3 scripts/rhizome.py flight add-story \
  --story-as "learning designer" \
  --story-want "carry my voice across all projects" \
  --story-so "each course has consistent approach"

# Transition to garden phase when ready
python3 scripts/rhizome.py flight phase --move-to garden

# Add steps as garden work begins
# (each step annotated with persona_lead + weed_checks)
```

**Timeline**: Kitchen table (1 hour) → Garden (1 week) → Library (1 day)

**Shipped by**: 2025-10-23 (target)

---

*Flight plan co-designed by Rhizome Chorus in kitchen table dialogue.*
*Ready for hallie's approval to move to garden phase.*
