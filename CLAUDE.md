# CLAUDE.md: Working with vscode-rhizome

**LAST UPDATED:** Oct 29, 2025 16:00 UTC
**STATUS:** Comment syntax formatting complete, ready for manual testing
**GIT:** Main branch, all changes committed

## What This Document Is

This is a guide for **Claude Code** (and anyone helping maintain vscode-rhizome) to understand:
1. The repo's structure, philosophy, and how it teaches
2. How to work **WITH** rhizome's flight plan system (not around it)
3. What the personas mean and how to call them
4. The don-socratic questioning approach to design and code

**This file is living.** Update it as the architecture evolves.

---

## The Core Philosophy: Mindful Development via Socratic Questioning

vscode-rhizome is a **teaching-first** VSCode extension. Every piece of code serves two purposes:
1. **It works** (the feature)
2. **It teaches** (the pattern, the questions, the design thinking)

The extension brings the **don-socratic persona** into your editor at the moment you're writing code—asking questions instead of giving answers.

### The Don's Core Values
- **Precision** — "What do you mean by that, exactly?"
- **Evidence** — "What does the collection show?"
- **First principles** — Back up and examine assumptions
- **The work matters** — Truth emerges through making things
- **Sustainable rigor** — Excellence isn't sprinting; it's tending

### Teaching Through Intentional Friction
The code has **deliberate rough edges**:
- Repetitive `.appendLine()` calls → teaches pattern recognition
- Nested if/else for optional fields → asks about clarity
- Silent regex fallback → questions error handling design
- insertStub heuristic → when to stop and ask for help

**These are not bugs. They're teaching moments.** Preserve them.

---

## Repository Structure

```
vscode-rhizome/
├── src/
│   ├── extension.ts              # Main extension (thin commands + helpers)
│   ├── stubGenerator.ts          # Stub generation (3 functions)
│   ├── test-utils.ts             # Reusable testing library
│   ├── extension.test.ts         # Comprehensive tests (23 tests)
│   └── graphBuilder.test.ts      # Tests for knowledge graph (scaffolded, needs impl)
├── .rhizome/                     # Rhizome context (the real knowledge)
│   ├── actions.ndjson            # Decision log (append-only)
│   ├── flight_plans/             # Work guidance via don-socratic phases
│   ├── personas.d/               # Custom personas (dev-guide, code-reviewer, etc)
│   ├── PROJECT_SUMMARY.md        # What this project is
│   ├── TEACHING_MOMENTS.md       # Intentional rough edges explained
│   ├── TEST_DESIGN_PHILOSOPHY.md # Why test library exists
│   └── decisions.md              # Architectural choices
├── test-workspace/               # Manual testing (opens on F5)
├── .vscode/
│   ├── launch.json               # F5 debug config
│   └── tasks.json                # Build task
├── package.json                  # Dependencies, scripts, metadata
├── tsconfig.json                 # TypeScript config
└── CLAUDE.md                     # This file

```

### Key Files to Understand

**`src/extension.ts` (450+ lines)**
- Main entry point: `activate()` and `deactivate()`
- Command handlers: `vscode-rhizome.init`, `vscode-rhizome.donSocratic`, `vscode-rhizome.inlineQuestion`, `vscode-rhizome.stub`
- Helpers: `queryPersona()`, `formatPersonaOutput()`, `getActiveSelection()`, `detectLanguage()`, `isRhizomeInstalled()`, `ensureOpenAIKeyConfigured()`, `addToGitignore()`, `initializeRhizomeIfNeeded()`
- **Teaching pattern**: Thin commands (1-4 lines) delegate to reusable helpers

**`src/stubGenerator.ts` (460+ lines)**
- Three core functions:
  - `generateStub(signature, language)` → creates TODO + throw/raise
  - `findStubComments(filepath, language)` → finds @rhizome stub markers using AST or regex
  - `insertStub(filepath, stub, location)` → splices stub into file
- **Teaching pattern**: Hybrid parsing (AST primary, regex fallback) with error handling

**`src/test-utils.ts` (100+ lines)**
- Extracted from asking: "What patterns hurt in tests?"
- Classes:
  - `TestWorkspace` — temp directories + cleanup
  - `MockRhizome` — mock CLI responses
  - `TestAssertions` — semantic assertions (file, config, gitignore)
  - `TestSetup` — factory methods for common scenarios
- **Teaching pattern**: Name patterns that repeat and cause pain

**`.rhizome/actions.ndjson`**
- Append-only decision log (28+ records)
- Every significant decision recorded with:
  - Actor (who decided)
  - Action type (scaffold, decide, propose, document, begin)
  - Object (what it's about)
  - Evidence (repo, branch, commit, note)
  - Standpoint (phase: kitchen_table, garden, library)
  - Certainty level (0.0-1.0)
- **This is the real knowledge of the project.** Not in code, not in docs—in the log.

**`.rhizome/flight_plans/fp-1761567687.json`**
- Active flight plan: "Test vscode-rhizome with comprehensive coverage"
- Status: kitchen_table phase
- Three steps (all done)
- Personas: rhizome (conducting), una/bro/root (voices)
- **This guides work.**

---

## How Rhizome Works (The Commands You'll Use)

### Flight Plans (Your North Star)

```bash
# List all flight plans
rhizome flight list

# Show a specific flight plan
rhizome flight show <id>

# Create a new flight plan
rhizome flight scaffold --title "Feature name" --story "As a..., I want..., so that..."

# Update a flight plan (add step, change phase, etc.)
# You'll edit the JSON directly in .rhizome/flight_plans/<id>.json
```

**Flight Plans have three phases:**
- **kitchen_table** — "What are we building?" (design, clarity, big picture)
- **garden** — "What does the evidence show?" (implementation, testing, iteration)
- **library** — "What does this teach?" (documentation, reflection, patterns)

### Recording Decisions

```bash
# Record an action (decision, design, implementation)
rhizome record \
  --action decide \
  --object "feature-name" \
  --note "Design rationale here" \
  --what "High-level description" \
  --confidence 0.9

# Link a commit to the action log
rhizome link-commit --note "Implemented X as decided"
```

**Action types:**
- `scaffold` — Set up initial structure
- `decide` — Make a design choice
- `propose` — Suggest something (uncertainty, 0.0-0.7 confidence)
- `document` — Write down knowledge
- `extract` — Pull out patterns
- `begin` — Start a new phase or task
- `work` — Record ongoing work (no decision yet)

### Personas (Your Advisors)

```bash
# List all personas
rhizome persona list

# Show a specific persona's philosophy
cat .rhizome/dev-guide_persona.md
cat .rhizome/don-socratic_persona.md

# Query a persona
rhizome query --persona dev-guide "Should I refactor this?"

# Call a persona with your code as context
rhizome query --persona code-reviewer << 'EOF'
<your code here>
EOF
```

**The Four Voices in vscode-rhizome:**
1. **dev-guide** — Socratic mentor. "What were you trying to accomplish?"
2. **code-reviewer** — Evidence-based skeptic. "What's your confidence level?"
3. **ux-advocate** — Experience curator. "Have we watched someone use this?"
4. **dev-advocate** — Synthesis strategist. "What trade-off are we making?"

Plus: **don-socratic** — The core teaching voice (what the extension embodies)

---

## Development Workflow

### Before You Write Code

1. **Check the flight plan**
   ```bash
   rhizome flight list
   rhizome flight show <id>
   ```
   - What phase are we in?
   - What's the next step?
   - What's the user story?

2. **Ask the don questions (kitchen_table phase)**
   ```bash
   rhizome query --persona dev-guide "I want to add <feature>. What should I think about first?"
   ```

3. **Scaffold the flight plan if needed**
   ```bash
   rhizome flight scaffold --title "Add graphBuilder module"
   ```

### While You Write Code

1. **Keep tests written first** (TDD mindset)
   ```bash
   npm test -- src/extension.test.ts  # Run specific tests
   npm run test:watch                  # Watch mode
   ```

2. **Ask for code review from personas**
   ```bash
   # Show a function to code-reviewer
   rhizome query --persona code-reviewer << 'EOF'
   <your function here>
   EOF
   ```

3. **Record decisions as you go**
   ```bash
   rhizome record \
     --action decide \
     --object "graphBuilder-parsing-strategy" \
     --note "Use recursive descent with early exit for depth limit" \
     --what "Graph building strategy for 500+ actions" \
     --confidence 0.85
   ```

### Before You Commit

1. **Run all tests**
   ```bash
   npm test
   npm run typecheck
   ```

2. **Ask the chorus for review** (garden/library phases)
   ```bash
   # Show the diff to the code-reviewer
   git diff HEAD~1 | rhizome query --persona code-reviewer
   ```

3. **Link the commit to your decisions**
   ```bash
   rhizome link-commit --note "Implement graphBuilder: recursive descent parser"
   ```

---

## The Four Personas (When to Call Them)

### 🌱 dev-guide — "What were you trying to accomplish?"

**Call this voice when:**
- Feeling rushed or overwhelmed
- Before major architectural decisions
- Refactoring and you're not sure about intent
- Documenting architectural choices

**Asks:**
- Is this the simplest way to express intent?
- How confident are you in this decision?
- What were you trying to accomplish here?

**Example:**
```bash
rhizome query --persona dev-guide "I want to make stub generation work with Python. Should I use AST parsing or regex?"
```

### 🔍 code-reviewer — "What's your evidence?"

**Call this voice when:**
- Before shipping changes
- Uncertain about trade-offs
- Need to stress-test assumptions
- Clarifying guardrails

**Asks:**
- How are we testing this?
- What's your confidence level?
- Can you document the trade-off?
- Who's going to maintain this next year?

**Example:**
```bash
rhizome query --persona code-reviewer << 'EOF'
function findStubComments(filepath: string) {
  // ... implementation ...
}
EOF
```

### ✨ ux-advocate — "Have we watched someone use this?"

**Call this voice when:**
- Feature planning
- UI/UX validation
- Accessibility checks
- Extension discoverability

**Asks:**
- Is this cognitive load acceptable?
- Have we watched a developer try this?
- What's the flow from intent to result?

**Example:**
```bash
rhizome query --persona ux-advocate "Right-click menu for @rhizome stub... good UX or confusing?"
```

### 🌉 dev-advocate — "What's working here?"

**Call this voice when:**
- Code reviews (bridges the other three)
- Balancing speed vs. quality
- Team dynamics or mentoring
- Retrospectives

**Asks:**
- What's working here?
- What trade-off are we making?
- How can we make this better next time?

**Example:**
```bash
rhizome query --persona dev-advocate "We just finished stub generation. What should we learn for the next feature?"
```

### don-socratic — "Let's be clear about what we're doing here."

**This is the core of vscode-rhizome.** It's embedded in:
- Every code comment (questions, not instructions)
- The teaching moments (intentional rough edges)
- The test design (comprehensive coverage)
- The extension UI (right-click to question your code)

---

## Building New Features (The Pattern)

### Step 1: Kitchen Table (Design Phase)

1. **Create a flight plan**
   ```bash
   rhizome flight scaffold \
     --title "Add graphBuilder: Parse rhizome actions into knowledge graph" \
     --story "As a developer, I want to visualize my decisions as a graph so that I can see patterns"
   ```

2. **Ask don-socratic questions**
   ```bash
   rhizome query --persona dev-guide "What should the graph include? Nodes? Edges? What queries should be fast?"
   ```

3. **Sketch the design** (in flight plan YAML)
   - What's the MVP?
   - What are edge cases?
   - What's the success metric?

4. **Record the design decision**
   ```bash
   rhizome record \
     --action decide \
     --object "graphBuilder-design" \
     --note "Nodes: actions, personas, decisions. Edges: causality, authorship. Query: by phase, by person, by theme." \
     --confidence 0.9
   ```

5. **Update flight plan to garden phase**
   - Edit `.rhizome/flight_plans/<id>.json`
   - Change phase to `garden`

### Step 2: Garden (Implementation Phase)

1. **Write tests first** (TDD)
   ```typescript
   // src/graphBuilder.test.ts
   describe('Happy Path: Parse valid actions', () => {
     it('should create a node from a single action', () => {
       // ...
     });
   });
   ```

2. **Implement the feature**
   ```typescript
   // src/graphBuilder.ts
   export class GraphBuilder {
     // ...
   }
   ```

3. **Run tests constantly**
   ```bash
   npm run test:watch
   ```

4. **Ask personas for feedback**
   ```bash
   rhizome query --persona code-reviewer << 'EOF'
   <your implementation>
   EOF
   ```

5. **Record implementation decisions**
   ```bash
   rhizome record \
     --action decide \
     --object "graphBuilder-parsing-strategy" \
     --note "Recursive descent parser with cycle detection" \
     --what "How to parse 500+ actions" \
     --confidence 0.85
   ```

6. **Commit with rhizome link**
   ```bash
   git add src/graphBuilder.ts
   git commit -m "Implement GraphBuilder: recursive descent parser"
   rhizome link-commit --note "Implemented graphBuilder parsing"
   ```

### Step 3: Library (Reflection Phase)

1. **Update flight plan to library phase**
   - Edit `.rhizome/flight_plans/<id>.json`
   - Change phase to `library`

2. **Document the teaching moments**
   ```bash
   # Update .rhizome/TEACHING_MOMENTS.md
   # Add: what was rough? what did we learn?
   ```

3. **Record the reflection**
   ```bash
   rhizome record \
     --action document \
     --object "graphBuilder-completion" \
     --note "Learned: cycle detection is essential. Silent failures hide bugs." \
     --what "Reflection on graphBuilder implementation" \
     --confidence 0.95
   ```

4. **Mark flight plan as done**
   - Edit `.rhizome/flight_plans/<id>.json`
   - Change status to `archived` or mark final step as done

---

## Testing Pattern (Always Do This)

Every feature has **three kinds of tests:**

```typescript
describe('Feature: Stub Generation', () => {
  // 1. HAPPY PATH: What should happen?
  describe('Happy Path', () => {
    it('should generate a stub for a marked function', () => {
      // Test the normal case
    });
  });

  // 2. ERROR PATHS: How should failure be handled?
  describe('Error Paths', () => {
    it('should handle missing function signature gracefully', () => {
      // Test edge cases, missing data, etc.
    });
  });

  // 3. INTEGRATION: Do components work together?
  describe('Integration', () => {
    it('should find stub, generate code, and insert into file', () => {
      // Test the full flow end-to-end
    });
  });
});
```

**Use the test library:**
```typescript
import { TestWorkspace, MockRhizome, TestAssertions, TestSetup } from './test-utils';

// Create temp workspace for test
const ws = new TestWorkspace();
ws.setup(); // Create temp dirs
ws.cleanup(); // Clean up after

// Mock rhizome responses
const mockRhizome = new MockRhizome();
mockRhizome.respondWith('query', { /* response */ });

// Assert file/config state
TestAssertions.fileExists(filepath);
TestAssertions.configMatches(filepath, { key: 'value' });

// Common scenarios
const setup = TestSetup.withOpenAIKey();
const setup2 = TestSetup.withRhizomeInitialized();
```

---

## Committing Work (WITH Rhizome)

### The Commit Ritual

1. **Check git status**
   ```bash
   git status
   ```

2. **Review changes**
   ```bash
   git diff
   ```

3. **Run tests**
   ```bash
   npm test
   npm run typecheck
   ```

4. **Ask persona for final review** (optional but recommended)
   ```bash
   git diff | rhizome query --persona code-reviewer
   ```

5. **Stage changes**
   ```bash
   git add src/
   ```

6. **Commit with intention**
   ```bash
   git commit -m "Implement graphBuilder: recursive descent parser

   - Parse 500+ actions from ndjson
   - Create graph nodes from decisions
   - Detect cycles, weight edges

   Decided: recursive descent with early exit for depth limit.
   Confidence: 0.85 (tested against real actions.ndjson)

   Linked to flight plan fp-xxx, garden phase."
   ```

7. **Link to rhizome**
   ```bash
   rhizome link-commit --note "Implemented graphBuilder parser"
   ```

8. **Record the milestone** (optional)
   ```bash
   rhizome record \
     --action document \
     --object "graphBuilder-complete" \
     --note "All tests pass. 100+ actions parsed correctly." \
     --what "graphBuilder implementation milestone" \
     --confidence 0.95
   ```

---

## Intentional Rough Edges (DO NOT SMOOTH OVER)

These are **teaching moments**. When you see them, pause and ask: "Why is this here? What does it teach?"

### 1. Repetitive `.appendLine()` calls in `formatPersonaOutput()`

**What's rough:**
```typescript
channel.appendLine('='.repeat(60));
channel.appendLine(personaName);
channel.appendLine('='.repeat(60));
channel.appendLine('Selected code:');
channel.appendLine('');
channel.appendLine(selectedCode);
// ... 8 times
```

**What it teaches:**
- Do you see the pattern? (header, content, footer structure)
- Could you name it? (Header + Body + Footer?)
- Should it be abstracted? (When does repetition become a pattern?)

**When refactoring, ask first:** Does abstracting this lose the teaching value?

### 2. Nested if/else for optional fields in `ensureOpenAIKeyConfigured()`

**What's rough:**
```typescript
if (!config.ai) config.ai = {};
config.ai.openai_key = key;
```

**What it teaches:**
- Is this the clearest way to ensure nested objects exist?
- Should you use optional chaining? Nullish coalescing?
- When is explicit clarity worth the repetition?

### 3. Silent regex fallback in `findStubComments()`

**What's rough:**
```typescript
try {
  // Try AST parsing
} catch {
  // Fall back to regex, no error message
}
```

**What it teaches:**
- When should errors be silent vs. visible?
- What's the trade-off between robustness and debuggability?
- How do you know the fallback is working?

### 4. Heuristic parsing in `insertStub()`

**What's rough:**
```typescript
// Find the line after "function methodName"
// and insert before the first "}"
// (This is a heuristic, not foolproof)
```

**What it teaches:**
- When should you stop and ask for help?
- What's the limit of heuristic parsing?
- When should you require explicit markers (like `@rhizome stub`)?

**When maintaining:** Keep these rough edges visible. They're better than smoothing them over.

---

## Maintenance Checklist

Before committing anything, ask:

- [ ] **dev-guide asked:** "Is this intentional?"
- [ ] **code-reviewer asked:** "Is this tested and trade-offs documented?"
- [ ] **ux-advocate asked:** "Does this feel natural?"
- [ ] **dev-advocate summarized:** "What did we learn?"
- [ ] Tests pass: `npm test && npm run typecheck`
- [ ] Code still teaches by friction, not instruction
- [ ] Comments ask don-socratic questions, not give answers
- [ ] Flight plan updated with progress
- [ ] Decision recorded via `rhizome record`

---

## Quick Reference: Rhizome Commands

```bash
# Flight plans
rhizome flight list                    # See all flight plans
rhizome flight show <id>               # See details
rhizome flight scaffold ...            # Create new one

# Recording decisions
rhizome record --action decide ...     # Record a decision
rhizome link-commit --note "..."       # Link commit to action log

# Personas
rhizome persona list                   # See all personas
cat .rhizome/dev-guide_persona.md      # Read persona philosophy
rhizome query --persona dev-guide "Q"  # Ask a persona

# Memory
rhizome memory-load                    # See memory notes
rhizome memory-append "Note here"      # Quick jot

# Exploring decisions
cat .rhizome/actions.ndjson            # Read the decision log
cat .rhizome/decisions.md              # Major decisions
```

---

## Next Time You Open This Repo

1. **Check the flight plan**
   ```bash
   rhizome flight list
   rhizome flight show <id>
   ```

2. **Read the current phase**
   - Kitchen table? Start with design questions.
   - Garden? Focus on implementation and testing.
   - Library? Reflect and document.

3. **Ask the don what to do next**
   ```bash
   rhizome query --persona dev-guide "What should I work on next?"
   ```

4. **Code with intention**
   - Tests first
   - Questions in comments (don-socratic)
   - Decisions recorded
   - Commit linked to flight plan

---

## The Philosophy in One Sentence

**Build thoughtfully, not quickly. Every decision deserves a "why." Every choice has a trade-off. Know them both.**

The extension teaches by example. Your job is to maintain that example with care, precision, and intentionality.

---

## Session Summary (Oct 29, 2025)

### The Question: How Should the Don Speak?

The red pen review prompts were telling the don-socratic to be "a rigorous, critical code reviewer" giving "specific, actionable feedback." But that's not the don's voice. That's contradiction. The don doesn't give answers. The don asks questions.

What changed: Let the don be the don.

### What Was Rewritten

Both prompts—selection review and file review—were reworded to embody the don's actual voice:

**Selection-based review** (src/commands/personaCommands.ts, lines 134-149):
- Before: "provide specific, actionable feedback"
- After: "Your role is not to give answers, but to ask questions"
- Before: "Ask hard questions" (as a requirement)
- After: "Question, don't instruct. Observe, then ask why." (as an invitation)

**File-level review** (src/commands/personaCommands.ts, lines 236-257):
- Before: "critical code reviewer" giving "actionable feedback"
- After: "You are the don-socratic, examining this entire file. Not to judge it, but to question it."
- Before: Checklist of what to review
- After: Questions about structure, assumptions, edges, error cases

**The examples changed too:**
```
Before: "Missing null check. What if user is undefined?"
After:  "User could be undefined here. What happens then?"

Before: "Loop could use Set for O(1) lookup. Have you considered this?"
After:  "You're checking membership in an array. Have you measured the cost?"
```

Notice: Observation first. Then the real question underneath.

### Why This Matters

The prompt is the contract between tool and persona. If you tell the don to be directive, you get directives dressed up as questions. If you invite the don to question, you get real questioning—discomfort, reflection, the moment where assumptions crack.

### Technical Notes

- Comment syntax formatting (`${commentPrefix}`) still works exactly as before
- Language detection still correct (// for TypeScript, # for Python)
- Reverse-order insertion still prevents line number drift
- All 113 tests passing, no regressions

### How to Experience This

1. F5 to open extension in debug mode
2. Select some code in test.ts or test.py
3. Right-click → "Red Pen Review (don-socratic)"
4. Watch what questions come back

Does it feel different? Does it invite reflection instead of correction?

### Commits

- `98150dd`: "refactor: Let the don speak in the prompts, not against it"
  - Rewrote both review prompts to embody don's voice
  - Changed from instruction to invitation
  - Changed examples from directive to questioning

### What to Think About

- How much of good teaching is *not telling*?
- What happens when a tool's voice contradicts its purpose?
- Can examples be questions instead of answers?
- Does the prompt matter if the persona already knows who it is?

---

*Last Updated: 2025-10-29 16:15 UTC*
*Maintained by: Hallie + Claude Code, guided by rhizome flight plans*
*Current Work: Let the don speak (EMBODIED IN PROMPTS)*
