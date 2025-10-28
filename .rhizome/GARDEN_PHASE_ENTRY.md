# Garden Phase Entry: Perspective-Encoding (fp-1760618097)

**Date**: 2025-10-16
**Phase Transition**: Kitchen Table → Garden
**Conductor**: Root (quality-led execution)
**Status**: All kitchen table steps complete (1-5)

---

## Kitchen Table Summary

We designed a **perspective-rich knowledge graph schema** that:

1. **Embeds subjectivity as first-class** — Every observation from an explicit standpoint (persona + role + phase)
2. **Solves merge conflicts** — Different developers' observations coexist naturally (via unique IDs)
3. **Incentivizes honesty** — Two-axis confidence (certainty + uncertainty) with articulation requirements
4. **Maintains backward compatibility** — Zero breaking changes; old and new schemas query transparently
5. **Serves multiple voices** — Base chorus + sprouted personas (Maya/Jordan/Alex) each have what they need

### Key Design Decisions

| Decision | Why | Outcome |
|----------|-----|---------|
| Two-axis confidence | Single scale collapses different uncertainties | Certainty + Uncertainty both measurable; validation enforced |
| Standpoint required | Perspective is always embedded | Clear lens; enables query by persona/role/phase |
| Articulation required | Prevents gaming the system | Must provide key_basis + key_gaps; honesty rewarded |
| IDs prevent conflicts | Merge-safe observations | Two devs log different things; both preserved |
| Backwards compatible | Old systems don't break | Old actions retrofit optionally; queries work on both |
| Sprouted personas | Users need different views | Maya sees patterns; Jordan audits; Alex learns |

---

## Garden Phase: 6 Execution Steps

### Step 6: ROOT Conducts Weed Checks (Next)
**Purpose**: Verify schema rigor before full implementation

ROOT will:
- [ ] Check circular logic in certainty/uncertainty constraints
- [ ] Walk merge scenario end-to-end
- [ ] Test query patterns on both old and new schema
- [ ] Validate edge cases (null fields, mixed data)
- [ ] Sign off: "Schema is sound for execution"

**What ROOT is watching for:**
- Certainty + Uncertainty constraint: is it enforceable?
- Merge conflict resolution: do IDs truly prevent collisions?
- Query performance: can we search 1000+ mixed actions quickly?
- Backwards compatibility: do old queries still work?

---

### Step 7: ROOT Writes Test Suite
**Purpose**: Full test coverage before shipping

ROOT will write:
- [ ] Unit tests: Certainty/uncertainty validation
- [ ] Unit tests: Standpoint extraction and labeling
- [ ] Integration tests: Old action → New schema migration
- [ ] Integration tests: Mixed old/new queries
- [ ] Performance tests: Query latency on 1000 actions
- [ ] Merge tests: Two branches with different standpoints

**Test targets:**
- 20+ unit tests covering schema constraints
- 15+ integration tests covering real-world scenarios
- Performance baseline: <100ms for query on 1000 actions
- 100% pass rate before garden signature

---

### Step 8: BRO Executes — CLI Updates
**Purpose**: Update `rhizome record` to capture new fields

BRO will add CLI flags:
- [ ] `--persona {una|root|bro|rhizome}` — Sets standpoint.persona
- [ ] `--role {guide|skeptic|executor|conductor}` — Sets standpoint.role
- [ ] `--phase {kitchen_table|garden|library}` — Sets standpoint.phase
- [ ] `--certainty 0.92` — Sets certainty (default 1.0)
- [ ] `--uncertainty 0.18` — Sets uncertainty (default 0.0)
- [ ] `--basis "Item 1" --basis "Item 2"` — Sets key_basis
- [ ] `--gap "Gap 1" --gap "Gap 2"` — Sets key_gaps

**Validation at log time:**
- If certainty >= 0.95, uncertainty must be >= 0.15
- Each basis item must be non-empty
- Each gap must be non-empty
- certainty + uncertainty <= 1.1

**Example usage:**
```bash
rhizome record \
  --persona root \
  --role skeptic \
  --phase garden \
  --action quality_led \
  --object "cascade_resolution" \
  --certainty 0.92 \
  --uncertainty 0.18 \
  --basis "16 unit tests passing" \
  --basis "14 integration tests passing" \
  --gap "Not tested on Windows" \
  --gap "Performance at 100+ files unknown"
```

---

### Step 9: BRO Ships — Retrofit Existing 12 Actions
**Purpose**: Migrate existing actions to new schema

BRO will:
- [ ] Run automated migration script: `rhizome graph retrofit --auto`
- [ ] Verify 12 old actions now have standpoint, certainty, uncertainty
- [ ] Verify IDs are unique (no collisions)
- [ ] Preserve `_legacy` fields for audit trail
- [ ] Spot-check a few retrofitted actions manually

**Migration rules:**
- Old `actor="rhizome_chorus"` → `standpoint: {persona: rhizome, role: conductor, phase: ...}`
- Old `action="phase_transition"` → Infer phase from qualifiers
- Old `confidence=null` → Defaults to `certainty=1.0, uncertainty=0.0`
- Old `qualifiers` → Auto-populate key_basis where possible

---

### Step 10: ROOT & BRO Verify — Merge Scenario Test
**Purpose**: Prove merge conflicts are solved

ROOT + BRO will:
- [ ] Create test branch A (alice-dev)
- [ ] Create test branch B (bro-dev)
- [ ] Each logs observation about same flight plan (different standpoints)
- [ ] Merge branches; verify NO conflict in `.rhizome/actions.ndjson`
- [ ] Query merged graph; both observations present
- [ ] Chorus can ask: "What did cada persona see?"
- [ ] Result: Different perspectives coexist; both preserved

**Merge scenario script:**
```bash
# On branch A
rhizome record --persona una --role guide --phase kitchen_table \
  --action design_led --object feature:x --certainty 0.9 ...

# On branch B
rhizome record --persona root --role skeptic --phase garden \
  --action quality_led --object feature:x --certainty 0.8 ...

# Merge
git merge branch-a  # No conflict; both actions in log
```

---

### Step 11: UNA Documents — Full Guide
**Purpose**: Teach others how to use the schema

UNA will write:
- [ ] Schema explanation (fields, layers, meaning)
- [ ] Migration guide (for teams with old logs)
- [ ] Query patterns (with examples)
- [ ] LLM prompt template (for honest observation logging)
- [ ] User guide per sprouted persona (what they see and why)
- [ ] Examples (real observations in new schema)

**Documentation artifacts:**
1. `PERSPECTIVE_ENCODING_SCHEMA.md` — Complete reference (already written)
2. `QUERY_PATTERNS.md` — How to ask questions of the graph
3. `LLM_PROMPT_TEMPLATE.md` — How to make LLMs log honestly
4. `USER_VIEWS.md` — What Maya/Jordan/Alex see and why
5. `MIGRATION_GUIDE.md` — How to retrofit old logs

---

## Garden Phase Timeline

**Expected execution:**
- Step 6 (ROOT weed checks): ~2 hours
- Step 7 (ROOT tests): ~4 hours
- Step 8 (BRO CLI): ~3 hours
- Step 9 (BRO retrofit): ~1 hour
- Step 10 (merge test): ~1 hour
- Step 11 (UNA docs): ~2 hours

**Total garden**: ~13 hours of focused work

---

## Success Criteria (ROOT's Checklist)

✓ Schema is mathematically sound (certainty/uncertainty relationship enforced)
✓ Merge conflicts eliminated (different IDs, different branches, no collision)
✓ Old actions readable and queryable (backwards compatibility proven)
✓ New actions capture standpoint, certainty, uncertainty, basis, gaps
✓ Queries work on both schemas transparently
✓ Tests pass (30+ tests, 100% coverage of new schema)
✓ Performance acceptable (<100ms for 1000 action query)
✓ Documentation clear and complete (new users can understand and use)
✓ LLM prompt template makes honesty the default
✓ Sprouted personas have what they need (Maya/Jordan/Alex views ready)

---

## Library Phase (Following)

Once garden is complete and shipped, library phase will:
- **Step 12**: Chorus curates learnings (perspective-as-first-class changes observability)
- **Step 13**: UNA & ROOT reflect (does pattern apply to themes/permissions/graph-settings?)
- **Step 14**: RHIZOME documents (form teaches form — epistemology in schema)

---

## What's Different Now

**Before perspective-encoding:**
```json
{"actor": "rhizome", "action": "conducted", "object": "flight:X"}
// Looks objective; hides lens; merge conflicts on edits
```

**After perspective-encoding:**
```json
{
  "standpoint": {"persona": "rhizome", "role": "conductor", "phase": "kitchen_table"},
  "action": "conducted",
  "object": "flight:X",
  "certainty": 0.98,
  "uncertainty": 0.05,
  "key_basis": ["Chorus aligned in kitchen table"],
  "key_gaps": ["Not yet tested in execution"]
}
// Lens explicit; two-axis honesty; merge-safe IDs; query by any dimension
```

---

## Ready to Garden

All kitchen table questions answered. Schema consolidated. Backwards compatibility designed.

ROOT takes the conductor role. Quality-led execution begins.

**Next action**: Mark step 6 as `in_progress` and begin weed checks.

---

*Garden phase begins. Root leads. Bro executes. UNA documents. Rhizome harmonizes. Chorus moves forward as one.*
