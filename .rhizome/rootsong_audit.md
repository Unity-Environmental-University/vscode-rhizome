# Rootsong Alignment Audit for UNA

## Current State Analysis

### Main Description
**Current**: "UNA: Unity's course design helper"
**Assessment**: Corporate/generic
**Rootsong**: "UNA: Kitchen table planning, garden-paced growth, organized knowledge"
**Rationale**: Establishes the three archetypes immediately

### Command Help Text Analysis

#### ✅ Already Aligned
- `init` - "scaffold" and "idempotent" are garden/stability language
- `archive` - library archival concept

#### ⚠️ Needs Rootsong Enhancement

| Command | Current | Rootsong Opportunity |
|---------|---------|---------------------|
| `record` | "Record an action" | "Log an action to the knowledge graph (archival quality)" |
| `link-commit` | "Link the latest commit into action log" | "Accession commit to action log and flight plan history" |
| `persona` | "Show rhizomeUNA persona summary" | "Show UNA's active voice and patterns (from special collections)" |
| `brand` | "Show public UNA brand links" | "Show public UNA references (circulation ready)" |
| `memory-load` | "Print rhizomeUNA memory file" | "Read UNA's saved seeds (lessons from past work)" |
| `memory-append` | "Append a note to rhizomeUNA memory" | "Save seeds: add a lesson to UNA's memory" |
| `persona-adopt` | "Seed UNA memories with core lessons" | ✅ Already uses "seed" - good! |
| `persona-init` | "Create a course-specific persona scaffold" | "Prepare soil: scaffold course-specific persona" |
| `persona-merge` | "Compile effective persona..." | "Harvest persona: merge capsule + course + overlays" |
| `graph-config` | "Show graph logging config" | "Show knowledge graph circulation settings" |
| `graph-mirror` | "Set graph mirror path (repo-tracked)" | "Set graph mirror for companion planting (repo-tracked)" |
| `export` | "Export persona/actions/graph/plan..." | "Harvest and archive: export to tracked paths" |
| `watch` | "Watch for local edits and log actions..." | "Tend the garden: watch edits, log actions, infer stories" |
| `flight` | "Flight Plan (lightweight planning)" | "Kitchen table planning: collaborative task management" |
| `policy` | "Show/accept UNA policy" | "Show/accept UNA collaboration agreement" |
| `context` | "Manage .local_context backups (external)" | "Manage special collections backups (external storage)" |
| `web` | "Run a tiny local web UI for flight planning" | "Serve kitchen table UI for collaborative planning" |

#### Flight Subcommands

| Subcommand | Current | Rootsong Opportunity |
|------------|---------|---------------------|
| `init` | "Create and set active flight plan (immediate)" | "Table a new plan: create and set active (immediate)" |
| `propose` | "Create proposed plan (requires approval)" | "Propose plan for the table (requires team approval)" |
| `add-story` | "Add a user story to active plan" | "Add story to the table: describe who/want/why" |
| `add` | "Add a step to active plan" | "Add step: one task to tend" |
| `start` | "Mark a step in progress" | "Start tending: mark step in progress" |
| `done` | "Mark a step done" | "Harvest: mark step complete" |
| `approve` | "Approve active plan" | "Approve for execution: mise en place verified" |
| `require-approval` | "Toggle require_approval on active plan" | "Toggle approval gate (kitchen table coordination)" |
| `note` | "Add a note to active plan log" | "Save seeds: add note to plan's memory" |
| `show` | "Show active plan summary" | "Show what's on the table (active plan summary)" |
| `render` | "Render active plan for human review" | "Render for review: readable table view" |
| `list` | "List flight plans" | "Browse the collection: list all plans" |
| `file` | "Create a plan from a JSON file (batch-friendly)" | "Accession plan from file (batch import)" |
| `set-active` | "Set active plan by id" | "Bring to table: set plan as active" |
| `clear-active` | "Clear active plan pointer" | "Clear the table: no active plan" |
| `exec-check` | "Check if execution is allowed (approval)" | "Verify mise en place: check approval gates" |
| `scaffold` | "Interactive scaffold: ask for title, stories, and steps" | "Interactive mise en place: gather plan ingredients" |
| `add-batch` | "Add multiple steps from file or stdin" | "Accession batch: add steps from file/stdin" |
| `revise` | "Log a revision to the active plan and record an action" | "Compost and replant: revise plan, log the change" |
| `commit` | "Create a git commit correlated to the active flight plan and optional step" | "Harvest to repo: commit with flight plan context" |
| `archive` | "Archive a flight plan and mark its status" | "Archive to special collections: preserve with status" |
| `archive-all` | "Archive all non-archived flight plans with optional filters" | "Archive batch to collections (filtered)" |
| `deprecate` | "Deprecate (archive) a flight plan" | "Compost: archive plan as deprecated" |

## AI Prompts (in ai.py)

### Current Prompt Analysis
```python
draft_prompt = (
    "You are UNA's planning aide. Produce a plan UNA can execute.\n"
    + (f"\nActive plan context:\n{active_summary}\n" if active_summary else "")
    + (f"\nPersona (excerpt):\n{persona_text}\n" if persona_text else "")
    + f"\nUser goal/context:\n{prompt or '(none)'}\n\n"
    + f"Existing draft (if any):\n{current_plan or '(none)'}\n\n"
)
```

**Rootsong Enhancement:**
```python
draft_prompt = (
    "You're helping table a flight plan—kitchen table style, not performative.\n"
    "Draw from active context and persona. Keep it grounded, actionable, collaborative.\n\n"
    + (f"What's already on the table:\n{active_summary}\n\n" if active_summary else "")
    + (f"UNA's voice (from special collections):\n{persona_text}\n\n" if persona_text else "")
    + f"Goal we're tabling:\n{prompt or '(none)'}\n\n"
    + f"Working draft (if any):\n{current_plan or '(none)'}\n\n"
    + "Table this plan: clear stories (as/want/why), actionable steps, no fluff."
)
```

## Error Messages

### Common Patterns Needing Mulching

**Pattern**: Generic errors without actionable guidance
**Examples to find**:
- Subprocess timeouts
- Missing config
- Invalid inputs
- File not found

**Mulching Strategy**:
1. Clear problem statement
2. Why it matters
3. What to do next
4. Reference to docs/patterns

**Example transformation**:
```python
# Before
raise RuntimeError("No AI provider available")

# After (mulched)
raise RuntimeError(
    "No AI provider configured.\n"
    "Mise en place needed: set OPENAI_API_KEY or start Ollama locally.\n"
    "See docs/rootsong/ROOTSONG_FOR_UNA.md for provider setup patterns."
)
```

## Form Teaches Form Opportunities

### 1. Command Structure
**Opportunity**: Group commands by archetype in help
```
Kitchen Table (Collaboration):
  flight, init, persona-init, export

Garden (Systems & Growth):
  watch, graph-config, graph-mirror

Library (Knowledge):
  record, memory-load, memory-append, persona
```

### 2. Flag Naming
**Current**: `--dry-run`
**Rootsong**: `--taste-first` or keep `--dry-run` (already garden-aligned)

**Current**: Various approval flags
**Rootsong**: Consider `--mise-en-place` for pre-execution checks

### 3. Output Formatting
**Opportunity**: Use rootsong language in success messages
```python
# Before
print(json.dumps({"ok": True, "id": fp_id}))

# After
print(json.dumps({
    "ok": True,
    "id": fp_id,
    "message": "Plan tabled and ready for work"
}))
```

## Priority Recommendations

### High Priority (Steps 5-6)
1. **Main program description** - First thing users see
2. **Flight command descriptions** - Most used subsystem
3. **AI prompts** - Shapes collaborative tone
4. **Error messages** - Mulch for clarity

### Medium Priority
5. **Command grouping** - Organize by archetype
6. **Success messages** - Reinforce rootsong patterns

### Low Priority
7. **Flag naming** - Only if naturally fits
8. **Internal variable names** - Gradually over time

## Next Actions

1. Apply rootsong to main description and flight commands (Step 5)
2. Mulch AI prompts in ai.py (Step 6)
3. Update CLAUDE.md with rootsong principles (Step 7)
4. Verification pass (Step 8)

## Notes

- Don't force metaphors where they don't fit naturally
- Prioritize clarity over poeticism
- Let form teach form through structure, not just words
- Taste as we go: pilot changes, gather feedback
