# Perspective-Encoding Schema: Final Design
## Flight Plan fp-1760618097 — Kitchen Table (Finalized)

**Date**: 2025-10-16
**Status**: Ready for Garden Phase Execution
**Chorus Decision**: Approved with backwards compatibility as structural foundation

---

## Executive Summary

**The Problem We're Solving**
- Current action log hides perspective behind false objectivity
- Merge conflicts occur when two devs log different observations (same NDJSON file, different content)
- Confidence as single 0-1 scale collapses different kinds of uncertainty
- No way to know: "Was I sure the event happened, or sure the assessment was right?"

**The Solution**
- Encode standpoint (persona + role + phase) as required first-class field
- Use two-axis confidence (certainty + uncertainty) with validation constraints
- Support multiple user perspectives (base chorus + sprouted personas)
- Design full backwards compatibility so existing actions don't break

**Key Innovation**
- Merge-safe via UUID; different perspectives coexist naturally
- Honesty-incentivized via articulation (must explain basis + gaps)
- Query-ready across all dimensions (persona, role, phase, confidence, etc.)
- Graceful degradation: old actions readable; new actions richer

---

## Core Schema (Required + Optional Layers)

### Layer 1: Identity + Standpoint (Always Present)

```json
{
  "id": "act-20251016-001",
  "ts": "2025-10-16T13:00:00Z",

  "standpoint": {
    "persona": "una",
    "role": "guide",
    "phase": "kitchen_table"
  },
  "standpoint_label": "una-as-guide (kitchen_table)"
}
```

**Why these fields:**
- `id`: UUID-like; prevents merge conflicts when two branches log observations
- `ts`: Timestamp; enables time-series queries
- `standpoint`: The lens from which this observation is made
- `standpoint_label`: Human-readable one-liner (for UNA's clarity need)

**Backwards Compatibility**
- Old actions have `"actor": "rhizome_chorus"` or similar
- New schema requires `standpoint` instead
- Migration: Deterministic mapping from actor → persona/role/phase
- Query: Can filter by either old actor OR new standpoint (both work)

---

### Layer 2: Event + Confidence (Always Present)

```json
{
  "event": "Cascade resolution pattern clarified with 7 layers",

  "certainty": 0.92,
  "uncertainty": 0.18,
  "confidence_summary": "High confidence in pattern; real gaps remain in scale/platform testing"
}
```

**Why this structure:**
- `event`: One sentence, clear, what happened
- `certainty`: 0-1 scale; "how sure are we this event occurred?"
- `uncertainty`: 0-1 scale; "what gaps or doubts remain?"
- `confidence_summary`: One sentence explaining the relationship

**Validation Rules** (enforced at log time)
```
IF certainty >= 0.95:  uncertainty must be >= 0.15
IF certainty >= 0.80:  uncertainty must be >= 0.10
IF certainty >= 0.50:  uncertainty must be >= 0.05
IF certainty <  0.50:  uncertainty must be >= 0.01

ALWAYS: certainty + uncertainty <= 1.1  (allow small margin for epistemic humility)
```

**Backwards Compatibility**
- Old actions have flat `"confidence": null` or similar
- New schema: default certainty=1.0, uncertainty=0.0 (conservative)
- Migration: Retrofit old actions with sensible defaults
- Query: Can filter by certainty/uncertainty or old confidence field

---

### Layer 3: Articulation (Required for New Actions; Optional for Old)

When new observations are logged, must provide:

```json
{
  "key_basis": [
    "Item 1: Concrete evidence",
    "Item 2: Concrete evidence"
  ],
  "key_gaps": [
    "Gap 1: Real untested area",
    "Gap 2: Real untested area"
  ]
}
```

**For Deep Audits** (optional, in `_audit` namespace):
```json
{
  "_audit": {
    "full_basis": [
      "7-layer design ratified in kitchen table",
      "16 unit tests (all layers) passing",
      "14 integration tests (file ops) passing",
      "Code reviewed; logic chain clear"
    ],
    "full_gaps": [
      "Not tested on Windows (Phase 2)",
      "Performance untested at 100+ files",
      "Real-world team usage untested"
    ]
  }
}
```

**Backwards Compatibility**
- Old actions may have `"qualifiers"` instead of `key_basis`
- New schema: prefers explicit basis/gaps
- Migration: Auto-generate reasonable defaults from qualifiers
- Query: Can search both old qualifiers AND new basis fields

---

### Layer 4: Persona Standing Ground (Optional; Namespaced)

Each base persona's specific needs:

```json
{
  "_una_view": {
    "clarity_level": "high",
    "teaching_value": "High - pattern is teachable and reusable"
  },

  "_root_view": {
    "validation_status": "passed",
    "certainty_justification": "0.92 justified by 4 concrete test results",
    "audit_concerns": []
  },

  "_bro_view": {
    "blocker": false,
    "can_ship": true,
    "timeline_impact": "No delay; ready for Phase 1",
    "known_deferred_gaps": ["Windows support", "Scale testing"]
  },

  "_rhizome_view": {
    "related_observations": [],
    "chorus_consensus": "unanimous_with_caveats",
    "phase_progression": "kitchen_table -> garden"
  }
}
```

**Backwards Compatibility**
- These are entirely optional, namespaced fields
- Old actions won't have them
- New actions can optionally include them
- Query: If absent, assume neutral (not negative)

---

### Layer 5: User Views (Sprouted Personas; Optional; Namespaced)

Views for downstream users of the knowledge graph:

```json
{
  "_maya_implementation_lead": {
    "lesson": "Explicit precedence prevents sprawl",
    "pattern_to_reuse": "7-layer cascade model",
    "warning": "Monitor performance at scale"
  },

  "_jordan_auditor": {
    "evidence_chain": [...],
    "hidden_assumptions": [...],
    "audit_status": "green"
  },

  "_alex_learner": {
    "narrative": "We designed hierarchy so preferences layer without collision",
    "why_this_design": "Previous unclear precedence caused conflicts",
    "what_happens_next": "Garden phase tests CLI; library reflects on pattern"
  }
}
```

**Backwards Compatibility**
- Entirely optional; namespaced with `_` prefix
- Old actions never have these
- New actions can optionally add them
- Query: Ignore if absent; useful if present

---

### Layer 6: Shared Metadata (Always Present)

```json
{
  "scope": "repo",
  "evidence": {
    "commit": "2938fcd",
    "branch": "rhizome",
    "path": null,
    "note": "Kitchen table session documented"
  },
  "contested_by": []
}
```

**Backwards Compatibility**
- `scope`: New field; defaults to "repo" for old actions
- `evidence`: Already present in old schema; unchanged
- `contested_by`: New; empty for old actions
- Query: Always present; safe to filter

---

## Complete Example: Retrofitted Old Action

**Old Format** (from existing action log):
```json
{
  "actor": "rhizome_chorus",
  "action": "phase_transition",
  "object": "flight:fp-1760616162",
  "qualifiers": ["kitchen_table_complete"],
  "confidence": null,
  "evidence": {
    "repo": "una",
    "branch": "rhizome",
    "commit": "229476424cc0fe14e18576e30e8a137ecfc51099",
    "note": "Kitchen table: UNA guided, Bro asked timeline, Root listened"
  },
  "timestamp": "2025-10-16T12:22:24Z"
}
```

**Retrofitted to New Schema** (auto-migration):
```json
{
  "id": "act-20251016-retrofit-001",
  "ts": "2025-10-16T12:22:24Z",

  "standpoint": {
    "persona": "rhizome",
    "role": "conductor",
    "phase": "kitchen_table"
  },
  "standpoint_label": "rhizome-as-conductor (kitchen_table)",

  "event": "Kitchen table phase completed",

  "certainty": 1.0,
  "uncertainty": 0.0,
  "confidence_summary": "Event is certain (it happened); no assessment uncertainty",

  "key_basis": [
    "Flight plan kitchen table steps completed",
    "Chorus alignment achieved"
  ],
  "key_gaps": [],

  "scope": "repo",
  "evidence": {
    "commit": "229476424cc0fe14e18576e30e8a137ecfc51099",
    "branch": "rhizome",
    "note": "Kitchen table: UNA guided, Bro asked timeline, Root listened"
  },

  "contested_by": [],

  // Original fields preserved (for backwards compat queries)
  "_legacy": {
    "actor": "rhizome_chorus",
    "action": "phase_transition",
    "object": "flight:fp-1760616162",
    "qualifiers": ["kitchen_table_complete"]
  }
}
```

**Why This Works:**
✓ Old queries that look for `actor="rhizome_chorus"` still work (in `_legacy` or filter logic)
✓ New queries that look for `standpoint.persona="rhizome"` work natively
✓ Default certainty/uncertainty are conservative (1.0, 0.0 = "happened; no assessment")
✓ Roundtrip possible: Can convert back to old format if needed

---

## Query Patterns: Backwards Compatible

### Pattern 1: "Give me ROOT's observations from the garden phase"

```python
# New way (recommended):
actions.filter(
  standpoint__persona="root",
  standpoint__role="skeptic",
  standpoint__phase="garden"
)

# Old way (still works):
actions.filter(actor="root")

# Both return the same results (new schema is supertype of old)
```

### Pattern 2: "What observations have high uncertainty?"

```python
# New way (only works on new schema):
actions.filter(uncertainty__gte=0.20)

# Old way (won't find anything):
actions.filter(confidence__lte=0.50)
  # Old actions have null confidence; filter returns empty

# Result: Graceful degradation (old actions not matched, not broken)
```

### Pattern 3: "Give me observations about this flight plan"

```python
# Namespace-agnostic query:
actions.filter(object="flight:fp-1760618097")

# Returns both old AND new observations
# Old observations have actor, qualifiers, confidence
# New observations have standpoint, certainty, uncertainty, basis
# Query layer handles both schemas transparently
```

### Pattern 4: "What did the chorus think about feature X?"

```python
# New way (aggregates across personas):
observations = actions.filter(object="feature:x")
by_persona = observations.group_by(standpoint__persona)

for persona, obs_list in by_persona.items():
  consensus = obs_list.majority_consensus()
  print(f"{persona}: {consensus}")

# Result: Clear breakdown by perspective
```

---

## Migration Strategy: Zero Breaking Changes

### Phase 1: Deploy New Schema (This Garden Phase)

1. **CLI updated** to log with new schema (standpoint, certainty, uncertainty, basis)
2. **Old actions stay as-is** in actions.ndjson (no retroactive rewrite)
3. **Query layer** transparently handles both old and new
4. **Documentation** shows both query styles

### Phase 2: Gradual Retrofit (Next Flight Plan)

1. **When convenient** (during new flights), retrofit old actions
2. **Automated migration** available as CLI command: `rhizome graph retrofit --old-format`
3. **Optional** — old actions continue to work unmodified
4. **No forcing** — teams choose when/if to retrofit

### Phase 3: Future Simplification (Phase 2+ of feature work)

1. **Once majority are retrofitted**, can sunset old schema
2. **Backwards compat layer** remains indefinitely (JSON schema supports both)
3. **Query layer** can optimize once old format is rare

---

## Validation & Honesty Incentives

### For LLMs: Required Articulation

When logging a new observation, must provide:

```json
{
  "certainty": 0.92,
  "uncertainty": 0.18,
  "key_basis": [
    "Item 1",
    "Item 2"
  ],
  "key_gaps": [
    "Gap 1",
    "Gap 2"
  ]
}
```

**Validation enforced at log time:**
- If `certainty >= 0.95`, must provide `uncertainty >= 0.15`
- Each basis item must be concrete (not "seems good")
- Each gap must be a real untested area (not manufactured)
- `certainty + uncertainty <= 1.1` (allow margin but prevent over-constraint)

### For Auditors: Full Audit Trail

ROOT can invoke deep audit:

```python
actions.audit(object="feature:x")
# Returns:
# - Full basis (all evidence)
# - Full gaps (all untested areas)
# - Validation status
# - Any contested observations
# - Hidden assumptions
```

### For Disputed Observations

If someone contests an observation:

```json
{
  "id": "act-20251016-001",
  "event": "Cascade resolution tested",
  "certainty": 0.92,
  "uncertainty": 0.18,

  "contested_by": [
    {
      "by": "bro",
      "ts": "2025-10-17T10:00:00Z",
      "claim": "Scale testing already done; not a real gap",
      "counter_certainty": 0.95,
      "counter_uncertainty": 0.08,
      "counter_basis": ["Found 3 repos with 50+ persona files; all fast"]
    }
  ]
}
```

**Both perspectives are preserved.** Chorus can review the dispute and update consensus.

---

## Fields Summary: What's Required vs. Optional

| Field | Required | Backwards Compat | Purpose |
|-------|----------|------------------|---------|
| `id` | Yes | UUID for new; generated for old | Prevents merge conflicts |
| `ts` | Yes | Preserved from old | Timeline queries |
| `standpoint` | Yes (new) | Migrated from actor | Shows perspective |
| `event` | Yes | Generated from action | What happened |
| `certainty` | Yes (new) | Defaults to 1.0 if absent | How sure we are |
| `uncertainty` | Yes (new) | Defaults to 0.0 if absent | What gaps remain |
| `confidence_summary` | Yes (new) | Generated if absent | Human-readable |
| `key_basis` | Yes (new) | Migrated from qualifiers | Why we believe it |
| `key_gaps` | Yes (new) | Empty if absent | What we don't know |
| `_audit.*` | No | N/A | Deep audit trail |
| `_persona_view.*` | No | N/A | Persona-specific views |
| `_user_view.*` | No | N/A | Sprouted persona views |
| `scope` | Yes | Defaults to "repo" | Local vs. federated |
| `evidence` | Yes | Preserved from old | Commit, branch, etc. |
| `contested_by` | Yes | Empty if not contested | Dispute history |

---

## Implementation Checklist: Garden Phase

### Step 6: ROOT Conducts Weed Checks
- [ ] Validate schema for circular logic (certainty + uncertainty constraint)
- [ ] Check merge scenario: Two observations coexist without conflict
- [ ] Verify query patterns work on both old and new schema
- [ ] Test edge cases: Old actions with null fields; new actions with optional fields

### Step 7: ROOT Writes Test Suite
- [ ] Unit tests: certainty/uncertainty validation
- [ ] Unit tests: Standpoint extraction and labeling
- [ ] Integration tests: Old action → New schema migration
- [ ] Integration tests: Queries work on mixed old/new data
- [ ] Performance: Query on 1000 mixed actions takes <100ms

### Step 8: BRO Updates CLI
- [ ] `rhizome record --persona X --role Y --phase Z` captures standpoint
- [ ] `rhizome record --certainty 0.92 --uncertainty 0.18` captures two-axis confidence
- [ ] `rhizome record --basis "Item 1" --basis "Item 2"` captures articulation
- [ ] `rhizome record --gap "Gap 1" --gap "Gap 2"` captures what we don't know
- [ ] Validation enforced: High certainty requires high uncertainty

### Step 9: BRO Retrofits Existing 12 Actions
- [ ] Run migration script: `rhizome graph retrofit --auto`
- [ ] Verify 12 old actions now have standpoint, certainty, uncertainty
- [ ] Verify old queries still work
- [ ] Verify new queries work

### Step 10: ROOT & BRO Verify Merge Scenario
- [ ] Create two branches; each logs observation about same flight
- [ ] Merge branches; no conflict (different IDs)
- [ ] Query merged graph; both observations present
- [ ] Chorus can review: Which persona saw what?

### Step 11: UNA Documents
- [ ] Schema explanation (this file expanded)
- [ ] Migration guide (for teams using old schema)
- [ ] Query patterns (with examples)
- [ ] LLM prompt template (for honest articulation)
- [ ] User guide per sprouted persona (what they see)

---

## Chorus Sign-Off: Each Voice Confirms

**UNA (Guide):**
✓ Schema is clear and teachable
✓ New readers can understand standpoint immediately
✓ Backwards compatibility means old docs still work
✓ Migration is optional, not forced

**ROOT (Skeptic):**
✓ Certainty/uncertainty relationship is mathematically enforced
✓ Articulation requirement prevents gaming
✓ Audit trail is complete
✓ Disputed observations are preserved
✓ Old actions remain auditable

**BRO (Executor):**
✓ Can ship Phase 1 without breaking old systems
✓ CLI updates are straightforward
✓ Migration is optional (no forced change)
✓ Merge conflicts eliminated
✓ No timeline impact

**RHIZOME (Conductor):**
✓ Related observations can be linked
✓ Chorus consensus visible across perspectives
✓ Phase progression clear
✓ Harmony between old and new; no jarring transitions
✓ Distributed schema works across repos

---

## One-Line Why

**We embedded subjectivity into the schema itself—every observation from an explicit standpoint, with honest uncertainty—so that perspectives merge cleanly, honesty is rewarded, and teams know exactly what lens they're seeing through.**

---

*Schema finalized by chorus. Kitchen table complete. Ready for garden phase execution.*
