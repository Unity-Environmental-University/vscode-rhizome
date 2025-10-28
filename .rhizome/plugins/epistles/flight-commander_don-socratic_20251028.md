# Epistle: Flight Commander ↔ Don-Socratic

**ID**: epistle-001
**Date**: 2025-10-28
**Topic**: Workflow phases and command organization for flight plans
**Prompted by**: [fp-1761601520] CLI Structure Review
**Status**: draft

---

## Context

**Referenced documents:**
- `scripts/flight_commands.py` — Flight command definitions & help text
- `CLAUDE.md` — Project guidance (rootsong voice)
- Flight Plan: [fp-1761601520] CLI Structure Review: Group Commands & Improve Help
- Previous work: Step 6 (nesting persona commands) completed ✓

**What we're examining:**
- Steps 7 & 8: Reorganizing flight commands by workflow phase
- Help text: Making it relationship-focused (why + context) vs mechanics-focused
- Command grouping strategy: Is flat structure right, or should we nest?

---

## Dialog

### Flight Commander

Hi Don-Socratic. I've just reorganized the flight commands into workflow phases:

- **CREATE/PLAN**: init, propose
- **POPULATE**: add-story, add
- **TRACK/EXECUTE**: start, done, note, show, render
- **MANAGE**: set-active, clear-active, list, approve, require-approval, exec-check
- **TRANSITION**: phase, archive, archive-all, deprecate, finish, unshelve
- **UTILITIES**: commit, compress, sprout, personas

And I've enhanced help text to show **relationship + purpose** instead of just mechanics. Examples:

- Old: "Add a step to active plan"
- New: "Add a step: break work into small, reversible, clear pieces"

Keeps the rootsong voice: "Small steps. Clear workflow. What's the next phase?"

Does this work for you?

### Don-Socratic

Hold on — before I agree, let me ask some hard questions:

**On workflow phases:**
1. You have 6 phase groups + "Utilities." Why 6? Who told you those were the right boundaries?
2. "MANAGE" has both approve AND require-approval. Are those really the same workflow stage, or are you forcing them together?
3. Where do batch operations (add-batch, file) fit? They're in POPULATE but could be "advanced CREATE."

**On help text:**
1. "Break work into small, reversible, clear pieces" — that's beautiful, but **whose voice is that?** Flight Commander? The rootsong persona? Or the learner?
2. By showing *why* (`capture learnings and blockers`), are we teaching workflow or explaining mechanics?
3. What if someone just wants to get things done, not understand the philosophy?

**On grouping strategy:**
Here's my real question: **Are these groups for the human reading --help, or for the system architecture?**

If it's for humans, comments in the code don't help anyone using the CLI. They see `flight add`, `flight start`, `flight done` — still flat.

If it's for developers, then... why not actually nest them?

```bash
# Currently flat:
flight add-batch
flight add
flight add-story

# Could be nested:
flight populate add
flight populate add-batch
flight populate add-story
```

Have you considered that?

### Flight Commander

Ouch. Good questions. Let me push back a bit, then concede:

**On phases** — Yes, I grouped them, but I used the *flight plan lifecycle* as the organizing principle:
1. You create a plan (CREATE/PLAN)
2. You fill it in (POPULATE)
3. You do the work (TRACK/EXECUTE)
4. You manage the work (MANAGE)
5. You transition it (TRANSITION)
6. You close it (implied in archive/finish)

That's derived from *user workflow*, not arbitrary. And yes, approve + require-approval are both in MANAGE because they're both "governing who can do what" — gatekeeping.

**On help text voice** — You're right to push. The help text should be *for the learner*, not for the rootsong philosophy lecture. It should answer: "When would I use this command?" Not "What is the meaning of this step?"

**On grouping strategy** — Here's where I concede completely: **Code comments don't help CLI users.** If I want humans to see the phases, they need to be visible in the help output. That means either:

1. **Nesting them** (flight populate add) — Changes UX, might confuse power users
2. **Grouping comments in help output** — Requires custom argparse formatting
3. **Keeping flat, but better help** — What we have now; phases stay implicit

I chose #3 because nesting would break existing scripts. But you're right — it's a cop-out. The phases are only visible to someone reading the source code.

### Don-Socratic

OK, so here's what I think:

**You should do #3 (flat + better help), BUT go further:**

Instead of just better help text, **show the phase structure in the help itself.** Argparse supports custom help formatting. You could do:

```
flight COMMANDS:
  [CREATE/PLAN PHASE]
    init               Start a new flight plan (immediate, no approval)
    propose            Propose a plan for approval before work starts

  [POPULATE PHASE]
    add-story          Frame the work with user stories
    add                Break work into small, reversible steps

  [TRACK/EXECUTE PHASE]
    start              Begin work on a step
    done               Mark step complete
    note               Capture learnings and blockers

  [MANAGE PHASE]
    list               View all flight plans
    set-active         Switch to a different plan
    approve            Gate the work with approval
```

This way:
- **Phases are visible to CLI users** (not buried in source)
- **Flat structure unchanged** (no breaking changes)
- **Help is discoverable** (people learn the workflow from `--help`)
- **Voice is learner-focused** (not philosopher-focused)

And the help text for each command should answer: **"When would I use this?"** not **"What does this do?"**

Examples:
- `init`: "Start a new flight plan (ready to go immediately)"
- `propose`: "Propose a plan for others to approve before you start"
- `add`: "Add a step: break complex work into clear, reversible pieces"
- `note`: "Add a note: capture what you learned or what's blocking progress"

See the difference? The first line says "when," the second line shows "why."

### Flight Commander

*Takes a deep breath*

You're absolutely right. I was solving the wrong problem. I organized the code comments for **myself** (developer reading source), not for the **user reading --help**.

Let me revise the plan:

1. ✅ Keep commands flat (no nesting — maintains compatibility)
2. ✅ Use custom argparse formatting to **show phase groups in --help**
3. ✅ Rewrite help text to answer "When would I use this?" first
4. ✅ Second line explains philosophy (the "why")

Next step: **Implement custom help formatter for flight commands.** This is small but high-impact.

Also: I need to drop the "lecture tone" (rootsong philosophy) from the help and focus on **user workflow context**.

### Don-Socratic

Good. One more thing before you go:

**Test this assumption:**

You're claiming phases are based on "user workflow." But have you actually **asked users** what workflow they use? Or are you designing it based on what you think a flight plan *should* do?

There's a difference:

- **Prescriptive**: "Here's the right workflow" (what I see in your phases)
- **Descriptive**: "Here's what users actually do" (what you should discover)

For Step 9 (core workflows), I'd ask: **Who are your 3 users?** Get them to tell you their workflow. Then organize commands around *their* mental model, not yours.

Because what if users don't think in "CREATE→POPULATE→TRACK→MANAGE→TRANSITION"? What if they think in "solo vs collaborative work"? Or "quick draft vs formal plan"? Or "for myself vs for my team"?

**You should find out before you commit to this structure.**

### Flight Commander

*Nods*

That's the real Step 9, isn't it? Not "what are the 5 workflows" but "what workflows do our *actual users* have?"

I've been designing it like a librarian (categorical, hierarchical). But you're right — I should design like an anthropologist (observational, based on how people actually work).

Let me add that to the flight plan. Before I finalize the command structure, I need to:
1. Interview 3-5 actual users
2. Watch them use rhizome flight
3. Understand their mental model
4. Organize commands to match *that*, not my hypothesis

That might change everything. Good catch.

---

## Outcome / Conclusions

**Decisions made:**
1. ✅ Keep flight commands **flat** (no nesting) for compatibility
2. ✅ Implement **custom argparse formatting** to show phase groups in `--help`
3. ✅ Rewrite help text: "When?" (workflow context) + "Why?" (philosophy)
4. 🔄 **Hold off on finalizing phases** — need user research first

**What we learned:**
- Code comments are invisible to users (organize help output instead)
- Help text should be prescriptive not philosophical
- We're designing based on *assumptions* about user workflows, not observations
- Step 9 should be "User Research" not "Define Workflows"

**Next steps:**
1. Custom argparse formatter for flight commands (shows phase groups)
2. Rewrite help text (all flight commands) — workflow context first
3. User research sprint: interview actual flight plan users
4. If needed: reorganize phases based on what users actually do

**Related files:**
- Flight plan: [fp-1761601520] CLI Structure Review
- Source: `scripts/flight_commands.py`
- Next epistle: Flight Commander + User Researcher (after interviews)

---

## Questions for Future

- Should help groups be collapsible in the CLI? (Show only frequently-used commands by default?)
- How do we handle power-user workflows (scripting, automation) vs learning workflows?
- Should there be a `rhizome flight tutorial` command that walks users through workflows?
