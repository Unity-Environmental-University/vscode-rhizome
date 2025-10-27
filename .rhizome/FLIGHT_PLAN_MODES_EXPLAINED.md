# Flight Plan Modes: vscode-rhizome as Reference Implementation

**Last Updated**: 2025-10-27
**Purpose**: Demonstrate how don-socratic phases map to actual VSCode extension development work
**Audience**: Teams adopting flight plan modes in their own repos

---

## What Are Flight Plan Modes?

Flight plan modes are **how a repository thinks about work**.

Instead of generic phases (Backlog → In Progress → Done), flight plan modes align work with don-socratic thinking:

1. **Kitchen Table** - "What are we actually trying to do?"
2. **Garden** - "What does the evidence show us?"
3. **Library** - "What does this teach us?"

Each mode has:
- **Archetypal question** (the big-picture "why")
- **Thinking patterns** (5-6 specific mental moves)
- **Persona roles** (how una, bro, root contribute)
- **Exit criteria** (how you know you're done)
- **Anti-patterns** (what to avoid)

---

## vscode-rhizome's Example

### Why This Repo?

vscode-rhizome is teaching-first code. It's explicitly designed so:
- Code comments ask don-socratic questions
- Rough edges are intentional (they invite refactoring)
- Test structure teaches patterns
- Every feature serves the teaching mission

This makes it a **perfect example** of how flight plan modes guide a real project.

### Kitchen Table: "What Are We Building?"

**Real question vscode-rhizome asked:**
> "How does a VSCode extension bring don-socratic thinking into the moment someone's writing code, without being preachy?"

**Thinking patterns that happened:**

1. **User Experience First**
   - "When I mark @rhizome stub, what's happening in my head?"
   - "Am I excited or confused?"
   - Decision: Keep UI minimal; let code quality do the teaching

2. **Teaching Through Friction**
   - "Where should this code be intentionally rough?"
   - Decision: Leave function structure slightly unclear; add a comment-question asking readers to think about design

3. **Map the AI Integration**
   - "Where do we need OpenAI? Where should we be deterministic?"
   - Decision: Stub generation is pure (no AI); querying is AI-powered (with graceful fallback)

4. **Define Success Criteria**
   - "How will we know this works?"
   - Decision: Two test scenarios (stub generation AND don-socratic querying); both must work end-to-end

5. **Identify Teaching Moments**
   - "What should developers learn by reading this code?"
   - Decision: Extract test-utils.ts as reusable patterns; they become a curriculum

**Exit criteria met:**
- ✅ Extension UX sketched (stub + query features clear)
- ✅ AI boundaries clear (what needs OpenAI, what doesn't)
- ✅ Test scenarios written (testable design spec)
- ✅ Teaching moments identified (rough spots intentional)
- ✅ Success metrics known (two scenarios work)

**Evidence:**
- See: `.rhizome/PROJECT_SUMMARY.md` (design decisions)
- See: `.rhizome/TEST_DESIGN_PHILOSOPHY.md` (testing as specification)
- See: `src/test-utils.ts` (extracted patterns)

---

### Garden: "What's Actually Working?"

**Real work that happened:**

1. **Build Testable First**
   - Implemented stub generation without UI
   - Tested AST parsing against real TypeScript/Python code
   - Found edge case: Python indentation rules are different than expected
   - Graceful fallback: regex parser for simpler cases

2. **Observe and Document**
   - Ran test scenarios (23 comprehensive tests)
   - Discovered: Multiline function signatures break simple regex
   - Response: Implemented Babel-based AST parsing for robustness

3. **Test Both Paths**
   - Happy path: OpenAI key set, rhizome init done → query works
   - Error path: No key, no context → graceful fallback, helpful error message
   - Edge path: Rhizome installed but not initialized → guide user through init

4. **Extract Patterns**
   - Three test files doing similar setup/assertion/teardown
   - Extracted into test-utils.ts: TestWorkspace, MockRhizome, TestAssertions, TestSetup
   - Now all tests use these; readability increases, boilerplate decreases

5. **Verify Teaching Works**
   - Code review question: "Is this function confusing?"
   - Answer: "Yes, intentionally. Here's a comment explaining the design decision."
   - Keep rough spots; clarify intent through questions, not by simplifying

**Exit criteria met:**
- ✅ Stub generation works (TypeScript, Python, edge cases)
- ✅ Querying tested (with/without key, with/without init)
- ✅ Error paths handled (no silent failures)
- ✅ Test scenarios automated (kitchen_table design → garden tests)
- ✅ Test patterns extracted (test-utils.ts)
- ✅ Intentional roughness documented (code comments explain why)

**Evidence:**
- See: `src/extension.test.ts` (23 tests, organized by scenario)
- See: `src/test-utils.ts` (reusable patterns)
- See: `src/extension.ts` (code comments asking questions)
- See: `.rhizome/TESTING_GUIDE.md` (how tests teach)

---

### Library: "What Does This Teach?"

**Real work that's happening:**

1. **Document the Why**
   - "Why do we use AST parsing for JS/TS but regex for Python?"
   - Answer: Trade-off document explaining robustness vs. simplicity
   - Future maintainer reads this and understands the choice

2. **Extract Teaching Moments**
   - Catalog code comments that ask questions
   - They're a curriculum in themselves
   - New developer reads them, learns how to think about design

3. **Connect to Ecosystem**
   - "How does stub generation compare to Jest snapshots?"
   - "What can we learn from how VSCode extensions typically work?"
   - Document the patterns so next vscode tool can build on them

4. **Catalog Patterns**
   - TestWorkspace (isolated temp directories)
   - MockRhizome (record commands without executing)
   - TestAssertions (semantic checks)
   - TestSetup (factory methods)
   - These patterns become templates for next tool

5. **Identify Next Questions**
   - "Could we extend don-socratic querying to suggest refactors?"
   - "Should we have a mode that explains code?"
   - "How would inter-rhizome communication change this?"
   - These seed the next kitchen_table phase

**Exit criteria met:**
- ✅ Design decisions documented (why AST vs. regex? documented)
- ✅ Teaching moments catalogued (code comments are specification)
- ✅ Patterns identified (test-utils becomes reusable library)
- ✅ Ecosystem connections documented (how it fits vscode world)
- ✅ Next improvements clear (roadmap in PROJECT_SUMMARY.md)
- ✅ New developer can understand (architecture doc exists)
- ✅ Institutional knowledge preserved (docs live in .rhizome/)

**Evidence:**
- See: `.rhizome/PROJECT_SUMMARY.md` (big picture)
- See: `.rhizome/TEST_DESIGN_PHILOSOPHY.md` (teaching philosophy)
- See: `.rhizome/don-socratic_persona.md` (persona that guides all work)
- See: `src/extension.ts` comments (code as curriculum)

---

## How Phases Show in Flight Plan History

vscode-rhizome's active flight plan (fp-1761567687) shows the phases in action:

```json
{
  "title": "Test vscode-rhizome with comprehensive coverage",
  "workflow": "kitchen_table",  // Phase name
  "phase": {
    "current": "kitchen_table",
    "entered_at": "2025-10-27T12:21:27Z"
  },
  "personas": {
    "voices": {
      "una": { "mode": "guide" },      // What una does in kitchen_table
      "bro": { "mode": "executor" },   // What bro does in garden
      "root": { "mode": "reasoner" }   // What root does in kitchen_table
    }
  }
}
```

This says:
- **Current phase**: kitchen_table (strategic design)
- **Una's role**: guide (asks for clarity)
- **Bro's role**: executor (builds the thing)
- **Root's role**: reasoner (connects to prior patterns)

When the flight transitions to garden, these modes change:
- Una becomes "witness" (documents what we're learning)
- Bro becomes "executor" (continues building)
- Root becomes "skeptic" (checks against design)

---

## Key Insights from This Example

### 1. Flight Plan Modes Are Per-Repo

vscode-rhizome's modes reflect **this project's specific needs**:
- Heavy focus on teaching (not every project has this)
- Test-driven from kitchen_table (not every project does this)
- Explicit consideration of "rough spots are features" (unique)

Another repo's kitchen_table might ask completely different questions:
- "What are the performance constraints?"
- "How does this integrate with existing systems?"
- "Who's the end user?"

**Each repo defines its own modes** (like personas are per-repo).

### 2. Personas Shift Modes As Phases Change

Same persona (una, bro, root) but different **modes** per phase:

| Phase | Una | Bro | Root |
|-------|-----|-----|------|
| Kitchen Table | **guide** (asks clarifying questions) | **challenger** (surfaces edge cases) | **reasoner** (finds patterns) |
| Garden | **witness** (documents evidence) | **executor** (builds) | **skeptic** (verifies against design) |
| Library | **advocate** (tells the story) | **balance** (evaluates trade-offs) | **reasoner** (synthesizes patterns) |

This is already in vscode-rhizome's code:
```yaml
# From don-socratic_persona.md
modes:
  - kitchen_table   # Strategic clarity
  - garden          # Evidence-based maintenance
  - library         # Precise knowledge retrieval
  - synthesis       # Patterns across the collection
```

### 3. Thinking Patterns Are How You Know You're Thinking

Each mode has 5-6 thinking patterns—these are the **specific mental moves** you make:

**In kitchen_table, vscode-rhizome thinks about**:
1. User experience first
2. Teaching through friction
3. AI integration boundaries
4. Success criteria
5. Teaching moments

If a flight plan in kitchen_table phase is **not doing these**, something's wrong. The phase definition becomes a checklist.

### 4. Exit Criteria Prevent Premature Transition

Kitchen table exit criteria prevent jumping to code:
- ✅ Design is clear
- ✅ Test scenarios written
- ✅ Success metrics known

If you move to garden (implementation) without these, you'll re-do kitchen_table work during garden (bad).

### 5. Anti-Patterns Protect Against Common Mistakes

Each phase lists what **not** to do:

**Kitchen table anti-patterns**:
- "Building before sketching what it feels like to use"
- "Forgetting this is a teaching tool"

These protect against the instinct to "just start coding."

---

## How to Use This in Your Own Repo

### Step 1: Create `.rhizome/flight_plan_modes.yml`

Copy the structure from vscode-rhizome's, but change:
- **Archetypal questions** (what does YOUR project ask?)
- **Thinking patterns** (what mental moves does YOUR team make?)
- **Persona modes** (how do YOUR personas contribute?)
- **Exit criteria** (what does "done with this phase" mean for YOU?)

### Step 2: Describe Your Project Context

At the bottom of flight_plan_modes.yml, add:
```yaml
project_context:
  project_name: "Your Project"
  purpose: "What are you building?"
  key_features: [...]
  teaching_focus: "Is learning part of this?"
  audience: "Who reads this code?"
```

### Step 3: Create Flight Plans Using These Modes

When you create a flight plan, specify the phase:
```bash
rhizome flight init \
  --title "Implement authentication" \
  --phase kitchen_table
```

### Step 4: Use Thinking Patterns as a Checklist

Before transitioning from kitchen_table → garden, verify:
- [ ] All 5 thinking patterns were explored
- [ ] Exit criteria are met
- [ ] Anti-patterns were avoided

---

## Future: Flight Plan Modes in Rhizome

This demonstration is the **reference implementation** for a feature coming to rhizome:

**Currently**: Flight plans hardcode phases (kitchen_table, garden, library)
**Future**: Flight plan modes loaded from YAML (per-repo)

When that's implemented:
1. Rhizome will load `.rhizome/flight_plan_modes.yml` (per-repo)
2. Fall back to `~/.rhizome/flight_plan_modes.yml` (user default)
3. Fall back to built-in modes (system default)

Each repo can customize how it thinks about work.

---

## See Also

- **flight_plan_modes.yml** - Detailed mode definitions for vscode-rhizome
- **don-socratic_persona.md** - The persona that guides all thinking
- **PROJECT_SUMMARY.md** - How the project actually used these phases
- **TEST_DESIGN_PHILOSOPHY.md** - How testing served the teaching mission
- **RHIZOME_ARCHITECTURE_CORE.md** (in main rhizome repo) - How modes will integrate