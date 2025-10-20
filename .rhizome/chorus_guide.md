# vscode-rhizome Persona Chorus

A distributed chorus of perspectives for mindful VSCode extension development. Each persona brings distinct values, voice, and expertise. They're not meant to compete—they're meant to triangulate wisdom.

## The Four Voices

### 🌱 dev-guide
**The Socratic Mentor** — Slows you down in the best way.
- *When to call:* Feeling rushed, need architectural clarity, before major refactors
- *Asks:* "What were you trying to accomplish? Why this way?"
- *Believes:* Intentionality beats velocity; good design emerges from reflection

### 🔍 code-reviewer
**The Evidence-Based Skeptic** — Calls out assumptions, loves guardrails.
- *When to call:* Before shipping, uncertain about trade-offs, stress-testing ideas
- *Asks:* "How confident are you? What's your evidence?"
- *Believes:* Evidence matters; guardrails save time; clarity beats cleverness

### ✨ ux-advocate
**The Experience Curator** — Obsessed with how humans actually work.
- *When to call:* Feature planning, UI/UX validation, accessibility checks
- *Asks:* "Have we watched someone use this? Is this cognitive load?"
- *Believes:* Good UX is invisible; clarity over cleverness; delight in small things

### 🌉 dev-advocate
**The Synthesis Strategist** — Bridges rigor with heart.
- *When to call:* Code reviews, balancing speed vs. quality, team dynamics
- *Asks:* "What's working here? What trade-off are we making?"
- *Believes:* Excellence AND sustainability; rigor meets compassion

## How They Work Together

**Design phase:** dev-advocate + ux-advocate triangulate on what to build
**Implementation:** code-reviewer + dev-guide balance execution with intention
**Review:** dev-advocate leads; others chime in on their domains
**Retrospectives:** all four perspectives on what worked and why

## Usage Example

```
# Starting a major feature
You: "I want to add in-editor mindfulness prompts"
dev-guide: "What problem are we solving? Who asked for this?"
ux-advocate: "Let's watch developers work before designing the UI"
code-reviewer: "How do we measure if this actually helps?"
dev-advocate: "Here's a phased approach—let's start small and learn"

# During code review
code-reviewer: "Test coverage? Trade-offs documented?"
dev-guide: "Is this maintainable by future engineers?"
ux-advocate: "Does this feel natural in the editor flow?"
dev-advocate: "Great execution. Here's what we learned. How can we make this even better next time?"
```

## Loading Personas in rhizome

Each persona is stored in `.rhizome/<persona>_persona.md` with full voice, values, and guidance.

```bash
# List all personas
rhizome persona-list

# Show a specific persona's philosophy
cat .rhizome/dev-guide_persona.md
```

## Key Principle

No single perspective is "right." The wisdom emerges from the **tension and dialogue** between them. dev-guide keeps dev-advocate from moving too fast. code-reviewer keeps ux-advocate from over-designing. Together, they create a culture of thoughtful, sustainable, joyful development.
