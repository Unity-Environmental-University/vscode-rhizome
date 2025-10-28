# Persona Stewardship Review
**Reviewer**: don-socratic
**Mode**: Skeptic → Advocate
**Date**: 2025-10-24

## What We Built

Minimal persona command stewardship:
- Added `suggests_commands`, `guide`, `mcp` (dormant) to persona YAML schema
- Created personas: root, flight_planner, config_admin, ai_assistant
- New command: `rhizome persona-commands --name <persona>` (human + JSON output)
- PyYAML for full YAML parsing (multi-line strings, nested dicts)
- Future-ready: MCP hooks dormant but present in schema

## Socratic Examination

### What do you mean by "stewardship"?

**Claim**: Personas "steward" commands
**Question**: Does stewardship = ownership? Enforcement? Guidance?
**Answer**: Guidance only. Patterns are suggestions, not enforcement.
**Weakness**: Name implies more authority than exists. "suggests" vs "stewards" vs "owns"?

**Proposed**: Consider `expertise_patterns` or `guidance_for` instead of `suggests_commands`

### How do you know this won't become brittle?

**Claim**: Pattern-based, optional, future-proof
**Evidence**:
- No validation or enforcement
- Commands work without personas
- Patterns (e.g., `flight.*`) auto-match future commands
- MCP hooks dormant (no dead code when we evolve)

**Vulnerability**: What if command naming changes? `flight init` → `plan init`?
**Mitigation**: Multiple patterns allowed. Personas can match both old and new.

**Proposed**: Add migration path docs: "If renaming commands, update persona patterns OR add aliases"

### What would happen if personas conflicted?

**Scenario**: Two personas both suggest `config.*` commands
**Current**: No conflict detection, both would show guidance
**Question**: Is this a bug or a feature?

**Answer**: Probably feature? Multiple experts for same domain = good?
**But**: Could confuse users. Which guide is canonical?

**Proposed**:
1. Allow conflicts (multiple perspectives)
2. OR: Add `priority` field to personas
3. OR: Make `rhizome help config` show ALL relevant personas

### What assumptions are we making?

**Assumption 1**: Users/AI will discover `persona-commands`
**Risk**: Hidden feature, low discoverability
**Mitigation**: Add to `rhizome help`, update README

**Assumption 2**: Guide text is enough for AI autonomy
**Risk**: Prose is ambiguous, AI might misinterpret
**Mitigation**: We have dormant MCP for structured tool definitions later

**Assumption 3**: Patterns like `flight.*` are sufficient
**Risk**: Doesn't handle: subcommands, aliases, renames
**Mitigation**: Easy to extend patterns list in YAML

### What are we NOT building?

Explicitly avoiding (good!):
- ❌ Command validation/enforcement
- ❌ Recipe execution engine
- ❌ Persona version management
- ❌ Stewardship conflicts/resolution
- ❌ Active MCP server spawning

**Question**: Are we deferring too much? Or appropriately minimal?
**Answer**: Appropriately minimal. We can layer on later without breaking changes.

## Red Pen Edits for Next Implementation

### Priority 1: Discoverability

**Problem**: `persona-commands` is hidden
**Fix**: Update `rhizome help` output to mention persona stewardship

```bash
# Current:
rhizome help → lists commands alphabetically

# Proposed:
rhizome help → lists commands grouped by persona steward
rhizome help --persona <name> → filtered view
rhizome help --all → full alphabetical list
```

### Priority 2: Vocabulary Precision

**Problem**: "stewardship" implies ownership
**Consider**:
- `expertise_patterns` instead of `suggests_commands`
- `provides_guidance_for` instead of `stewards`
- Or: embrace "steward" but document as "non-exclusive guidance provider"

**Decision needed**: What metaphor do we want?

### Priority 3: Migration Path

**Problem**: No docs on what happens when we:
- Rename commands
- Add MCP servers
- Evolve persona schema

**Fix**: Add to CLAUDE.md:

```markdown
## Persona Evolution Path

### Phase 1 (Current): Static guidance
- Personas suggest command patterns
- Guide text provides context
- No enforcement, no execution

### Phase 2 (Next): Enhanced discovery
- Help system groups by persona
- Persona-aware --help text
- Conflict detection (optional)

### Phase 3 (Future): MCP agents
- Personas register MCP servers
- Tools defined programmatically
- Inter-persona delegation
```

### Priority 4: Schema Versioning

**Problem**: No version field in persona YAML
**Risk**: Future breaking changes with no migration signal

**Fix**: Add `schema_version: 1` to persona files
**Benefit**: Can detect old formats and migrate/warn

### Priority 5: Testing Strategy

**Problem**: No tests for:
- Persona loading with new fields
- Pattern matching logic
- JSON output format stability

**Fix**: Add to `tests/test_cli_behavior.py`:
```python
def test_persona_commands_output():
    # Test human-readable output
    # Test JSON output structure
    # Test missing persona handling
```

## Advocate Mode: What Works Well

**✓ Minimal viable implementation**: Just enough to be useful
**✓ Future-ready schema**: MCP hooks dormant, not absent
**✓ Loose coupling**: Personas don't break if commands change
**✓ Multiple outputs**: Human text + JSON for AI agents
**✓ No breaking changes**: Everything additive

**✓ Pattern-based discovery**: Resilient to command additions
**✓ Voice preservation**: Each persona keeps its character
**✓ Clear separation**: Guidance vs enforcement

## Synthesis: Ship It?

**Verdict**: Yes, with caveats

**Must address before merge**:
- [ ] Add `schema_version: 1` to persona files
- [ ] Document evolution path in CLAUDE.md
- [ ] Add discoverability note to README

**Should address in next iteration**:
- [ ] Update `rhizome help` to group by persona
- [ ] Add tests for persona-commands
- [ ] Consider vocabulary: "stewardship" vs "expertise"

**Can defer**:
- Help system overhaul (bigger change)
- Conflict detection (YAGNI for now)
- Recipe execution (Phase 3 feature)

## Questions for Hallie

1. Do you want help grouped by persona by default? Or opt-in via `--persona`?
2. Is "stewardship" the right metaphor, or too strong?
3. Should we detect/warn on conflicts (two personas, same command)?
4. When do we want Phase 2 (enhanced discovery)?

---

**Next steps**: Address "must" items, commit, document in CHANGELOG.
