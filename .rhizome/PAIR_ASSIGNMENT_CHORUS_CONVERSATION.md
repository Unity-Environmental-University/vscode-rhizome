# Pair Assignment Design: A Chorus Conversation

**Flight Plan**: fp-1761583384
**Status**: In design (kitchen_table phase)
**Purpose**: Demonstrate how the flight planning system itself can host design conversations through mask-based pair assignments

---

## What This Shows

Instead of writing a design document, we're **using the flight plan system to have the conversation**.

Each step is a turn in the chorus:
1. **UNA** (clarity_guardian + synthesizer) defines the problem space
2. **BRO** (challenger + executor) proposes one approach
3. **ROOT** (pattern_hunter + synthesizer) adds a contrasting approach
4. **UNA** identifies the core tension
5. **BRO** challenges the false binary
6. **ROOT** synthesizes a hybrid
7. **UNA** documents the reasoning
8. **BRO** makes it concrete (implementation check)

Each step has a **pair assignment**: questioner + answerer, showing which masks are in play.

---

## The Conversation (Condensed)

### Step 1: UNA Clarifies
**Masks**: clarity_guardian (questioner) + synthesizer (answerer)

"What problem are we solving with pair assignments?"

Before proposing solutions, we need clarity on what we're trying to accomplish:
- Onboard new developers?
- Improve decision quality?
- Ensure complementary perspectives?
- All of the above?

### Step 2: BRO Proposes (Explicit)
**Masks**: challenger (questioner) + executor (answerer)

"Explicit assignment: pair locked to step, masks locked to personas"

Structure it like a rolesheet. For each step type, pre-assign:
```
- Code implementation → bro (executor) + una (clarity_guardian)
- Testing → bro (executor) + root (skeptic)
- Design → una (clarity_guardian) + root (pattern_hunter)
```

**Advantage**: Clear, teachable, onboarding is straightforward.
**Risk**: Rigid. What if bro is unavailable? What if the step needs different thinking?

### Step 3: ROOT Adds (Fluid)
**Masks**: pattern_hunter (questioner) + synthesizer (answerer)

"Fluid assignment: pair chosen at startup, renegotiated as needed"

No pre-assignments. Instead:
- Flight startup negotiates: "This phase needs these masks. Which do you want?"
- Masks stay available but unassigned
- Personas adopt masks based on context
- Mid-phase: "This isn't working. Let's try different masks."

**Advantage**: Adaptive, resilient, honors real human variation.
**Risk**: Ambiguous. New people won't know what to do.

### Step 4: UNA Identifies Tension
**Masks**: clarity_guardian (questioner) + evidence_keeper (answerer)

Name the trade-off clearly:
- **Explicit** = clarity, structure, teachability
- **Fluid** = adaptability, resilience, reality-matching

This is a real tension. Both matter.

### Step 5: BRO Challenges
**Masks**: challenger (questioner) + pattern_hunter (answerer)

"Can we get both? Explicit framework, fluid execution?"

This pushes past the false binary. Don't assume we have to choose.
- What if we define defaults (explicit) but allow override (fluid)?
- What if the framework says "here's the expected pair" but people can negotiate?

### Step 6: ROOT Synthesizes
**Masks**: synthesizer (questioner) + advocate (answerer)

"Use default assignments (explicit), allow override (fluid)"

Proposed hybrid:
1. **System default**: flight_plan_modes.yml defines default pairs per step type
   - "Code implementation: executor + clarity_guardian"
   - "Testing: executor + skeptic"
2. **Startup negotiation**: "Here are the defaults. Do you want to adjust?"
3. **Runtime flexibility**: Mid-flight, teams can renegotiate

This gives clarity (there are defaults) + flexibility (they're not locked).

### Step 7: UNA Documents
**Masks**: advocate (questioner) + witness (answerer)

Record the decision with full reasoning:
- Why this design?
- What problems it solves?
- What constraints remain?
- What assumptions we're making?

Future teams read this and understand not just *what* we decided, but *why*.

### Step 8: BRO Sketches Implementation
**Masks**: executor (questioner) + skeptic (answerer)

"What data structure? How does the system enforce/suggest?"

Make it concrete:
```yaml
# flight_plan_modes.yml
default_pairs:
  implementation:
    questioner: clarity_guardian
    answerer: executor
  testing:
    questioner: skeptic
    answerer: executor

# flight plan step
steps:
  - id: 1
    title: "Implement API"
    pair: "implementation"  # Uses default
  - id: 2
    title: "Test edge cases"
    pair:  # Override default
      questioner: challenger
      answerer: executor
```

Can this actually be built? YES. Does it require work? YES. Is it worth it? That's what we're deciding.

---

## Key Insight: Chorus ≠ Debate

This isn't a debate where someone "wins." It's a **chorus conversation** where:
- Each voice brings its perspective
- Earlier voices don't disappear; they inform later ones
- The synthesis includes all previous voices
- The final design is stronger because all angles were considered

---

## How Pair Assignments Work in This Conversation

Each step has a pair because:
1. **The question is asked from somewhere** (questioner mask)
2. **The answer comes from somewhere** (answerer mask)

They're not just names on a step. They're the **thinking modes in play**.

When BRO proposes the explicit approach, he's not alone. The **challenger mask** is questioning him (pushing back) even as the **executor mask** builds the proposal. That tension is visible in the step.

This models what we want to happen in real code work: two perspectives in conversation, not one person alone.

---

## Next: Transition to Garden

Once this chorus conversation concludes (steps 1-8 complete), the flight can transition to garden phase:

**Garden work would be**:
- Implement the data structures
- Test the system with real flights
- Document the decision and reasoning
- Verify the design actually works in practice

Then **library phase** would synthesize:
- What did we learn?
- How should pair assignments evolve?
- What patterns emerged?

---

## See Also

- **masks.yml** - Full definition of all masks and their moves
- **flight_plan_modes.yml** - How thinking patterns differ per phase
- **MOB_PROGRAMMING_RPG** - The reference for how roles/masks work in collaborative work