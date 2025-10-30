# VSCode Rhizome Development Protocols

This directory documents the development methodology used in vscode-rhizome. It's not just a feature tracker—it's a **thinking protocol** for building features intentionally.

## Why Protocols?

Every decision made in vscode-rhizome should answer: **Why did we choose this?**

The protocol ensures:
- Decisions are **recorded** (not lost in memory)
- **Personas are consulted** (multiple perspectives)
- **Teaching moments are preserved** (questions visible, not hidden)
- **Next developer benefits** from reasoning (not just code)

## The Protocol Files

### 1. `vscode-rhizome-development-protocol.yaml`

**What**: Complete specification of the development methodology

**Structure**:
- 5 phases (Bootstrap → Kitchen Table → Garden → Integration → Library)
- Step-by-step process for each phase
- When to call which persona
- Testing strategy
- Git commit patterns
- Success criteria and anti-patterns

**Use this when**: You're starting a new feature and want to know the complete process

**Example**:
```bash
# Read the protocol
cat protocols/vscode-rhizome-development-protocol.yaml

# You'll see:
# - Bootstrap: How to start
# - Kitchen Table: Design questions to ask
# - Garden: Implementation pattern with stubs
# - Integration: Testing strategy
# - Library: Reflection and documentation
```

---

### 2. `development-flow.pseudo`

**What**: Pseudocode version of the protocol showing actual execution flow

**Structure**:
- Pseudocode that looks executable (readable by humans)
- Main flow: BOOTSTRAP() → KITCHEN_TABLE() → GARDEN() → INTEGRATION() → LIBRARY()
- Helper functions mapping to rhizome CLI commands
- Key principles highlighted
- Decision-making logic shown

**Use this when**: You want to see the flow without YAML verbosity, or understand control flow

**Example**:
```
KITCHEN_TABLE() {
  design_decisions = [...]
  FOR EACH decision IN design_decisions:
    feedback = rhizome.query(persona="code-reviewer", context=decision)
    rhizome.record(action="decide", object=decision.name, note=feedback.reasoning)
  END FOR
}
```

---

### 3. `EXAMPLE-rubber-duck-execution.md`

**What**: Real-world example of protocol applied to Rubber Duck Debugging feature (Oct 30, 2025)

**Structure**:
- Actual commands executed
- Actual output from personas
- Real design decisions made
- Commits and reasoning
- What the next developer will see

**Use this when**: You want to see "what does this actually look like in practice?"

**Example**:
```bash
# From the example:
rhizome flight init \
  --title "Rubber Duck Debugging: Interactive Line-by-Line Personas" \
  --requester "Claude Code" \
  --story-as "developer" \
  --story-want "walk through code line-by-line with a supportive persona" \
  ...
```

---

## How to Use This Protocol

### Starting a New Feature

1. **Read** `vscode-rhizome-development-protocol.yaml` (30 mins)
   - Understand the 5 phases
   - Know when to call which persona

2. **Follow** the phase steps in order
   - Phase 1: Bootstrap (quick, contextual)
   - Phase 2: Kitchen Table (design with personas)
   - Phase 3: Garden (stub architecture, implement incrementally)
   - Phase 4: Integration (wire together, test)
   - Phase 5: Library (reflect, document patterns)

3. **Reference** `EXAMPLE-rubber-duck-execution.md` when you're unsure
   - See actual commands
   - Understand what output to expect
   - Know when personas should be called

4. **Record decisions** in rhizome as you go
   - Each major decision: `rhizome record --action decide`
   - Each commit: `rhizome link-commit`
   - Each reflection: `rhizome record --action document`

### Modifying the Protocol

If you discover a better way:

1. Document what you changed
2. Explain why (what problem did it solve?)
3. Update all three files consistently:
   - YAML (formal specification)
   - Pseudocode (execution flow)
   - Example (real-world walkthrough)
4. Commit with a message like: "docs: Improve protocol [aspect], learned X"
5. Record in rhizome: `rhizome record --action document --object "protocol-improvement"`

---

## Key Concepts

### Teaching Through Friction

The protocol deliberately leaves **questions in code** instead of just implementations:

```typescript
// Instead of implementing parseCommand() with all edge cases handled:
function parseCommand(input: string): DuckCommand | null {
  throw new Error(
    `parseCommand: How strict should parsing be? ` +
    `Should "NEXT" and "next" and "→" all work? What about typos?`
  );
}

// Forces next developer to:
// 1. Read the question
// 2. Think about the design choice
// 3. Decide the answer
// 4. Document the reasoning
// 5. Implement intentionally
```

This is intentional. It's not incomplete code—it's **teaching code**.

### The Five Personas

| Persona | Role | When | Question |
|---------|------|------|----------|
| **dev-guide** | Mentor | Before major decisions | "What were you trying to accomplish? Is this the simplest way?" |
| **code-reviewer** | Skeptic | Design validation, edge cases | "What's your evidence? What trade-off are we making?" |
| **ux-advocate** | Experience curator | UX design, feature planning | "Is cognitive load acceptable? Have we watched a user try this?" |
| **dev-advocate** | Synthesizer | Retrospectives, team decisions | "What's working? What should we do differently next time?" |

---

## Protocol Flow at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│ BOOTSTRAP                                                   │
│ Context: Check flight plans, get dev-guide direction        │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│ KITCHEN TABLE (Design)                                      │
│ Context: Ask personas, validate design, record decisions    │
│ Personas: code-reviewer, ux-advocate, dev-advocate          │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│ GARDEN (Implementation)                                     │
│ Step 1: Stub all modules with method signatures             │
│ Step 2: For each method: Read question → Decide → Implement│
│ Step 3: Write tests, commit with reasoning                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│ INTEGRATION & TESTING                                       │
│ Integration tests, command wiring, manual testing           │
│ Personas: ux-advocate (UX validation)                       │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│ LIBRARY (Reflection)                                        │
│ Document patterns, record reflection, update CLAUDE.md      │
│ Personas: dev-advocate (synthesize learnings)               │
└─────────────────────────────────────────────────────────────┘
```

---

## Rhizome CLI Commands Used

The protocol relies on rhizome CLI. Key commands:

```bash
# Flight plans (work tracking)
rhizome flight init --title "..." --requester "..." --story-as "..." --story-want "..." --story-so "..."
rhizome flight add --title "..."
rhizome flight start --step N
rhizome flight done --step N
rhizome flight phase --move-to {kitchen_table|garden|library}
rhizome flight show

# Personas (advice)
rhizome query --persona {dev-guide|code-reviewer|ux-advocate|dev-advocate} "question"

# Decision recording (audit trail)
rhizome record --action {decide|scaffold|document|propose} --object "..." --what "..." --note "..." --confidence 0.0-1.0
rhizome link-commit --note "..."
```

---

## Expected Artifacts

When you follow this protocol, you'll produce:

### Git History
- Clear commit messages explaining decisions
- Each commit linked to decisions in `.rhizome/actions.ndjson`
- Feature tracking through flight plan

### .rhizome/actions.ndjson
- Complete audit trail of decisions
- Confidence levels for each decision
- Persona feedback for major choices
- Links to commits

### Code
- Stubs with don-socratic questions (not just TODOs)
- Methods with clear intent
- Tests covering happy + error paths
- Comments explaining "why", not "what"

### Documentation
- CLAUDE.md updated with new patterns
- TEACHING_MOMENTS.md with rough edges preserved
- This protocols directory, expanded with new learning

---

## Philosophy

> **Build thoughtfully, not quickly. Every decision deserves a "why". Every choice has a trade-off. Know them both.**

The protocol enforces this by making it **visible and traceable**. Not lost in commits, not hidden in code comments—recorded, personas-consulted, decision-logged.

---

## Further Reading

- `vscode-rhizome-development-protocol.yaml` — Formal specification
- `development-flow.pseudo` — Execution flow
- `EXAMPLE-rubber-duck-execution.md` — Real application
- `.rhizome/actions.ndjson` — Actual decision log
- `.rhizome/flight_plans/` — Active work plans
- `CLAUDE.md` — Project philosophy and patterns

---

**Last Updated**: Oct 30, 2025
**Maintained by**: Hallie + Claude Code, guided by rhizome flight plans
**Status**: Protocol established, applied to Rubber Duck feature, ready for next feature

Questions? Ask a persona:
```bash
rhizome query --persona dev-guide "How should I use this protocol?"
```
