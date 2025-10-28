# Perspective-Encoding Use Cases: Paper Prototypes

**Flight**: fp-1760618097
**Phase**: Garden (Design validation before test suite)
**Purpose**: Concrete scenarios to test schema assumptions and get chorus feedback

---

## Use Case 1: Merge Scenario — Two Developers, Same Feature

**Situation**: Alice (guide/designer) and Bob (executor/implementer) work on the same feature in parallel branches. Each logs observations about cascade resolution.

**Alice's observation** (branch feature/cascade-design):
```json
{
  "id": "act-20251016-alice-001",
  "ts": "2025-10-16T14:00:00Z",
  "standpoint": {
    "persona": "una",
    "role": "guide",
    "phase": "garden"
  },
  "standpoint_label": "una-as-guide (garden)",
  "event": "Cascade precedence clarified: repo-level override beats user-level custom",
  "certainty": 0.95,
  "uncertainty": 0.20,
  "confidence_summary": "Pattern validated in 3 repos; gaps remain in cross-org scenarios",
  "key_basis": [
    "Tested on 3 internal repos; all follow pattern",
    "YAML parsing confirms precedence order",
    "No collisions in 50+ persona files"
  ],
  "key_gaps": [
    "Never tested across org boundaries",
    "Unknown at 1000+ persona files",
    "Real-world teams haven't run this yet"
  ],
  "scope": "repo",
  "evidence": {
    "commit": "abc123",
    "branch": "feature/cascade-design",
    "note": "Design iteration 3; pattern stable"
  },
  "contested_by": []
}
```

**Bob's observation** (branch feature/cascade-impl):
```json
{
  "id": "act-20251016-bob-001",
  "ts": "2025-10-16T14:15:00Z",
  "standpoint": {
    "persona": "bro",
    "role": "executor",
    "phase": "garden"
  },
  "standpoint_label": "bro-as-executor (garden)",
  "event": "Cascade implementation complete; CLI integration working",
  "certainty": 0.92,
  "uncertainty": 0.22,
  "confidence_summary": "Code works; CLI tested; integration gaps unknown until real load",
  "key_basis": [
    "14 integration tests passing",
    "Manual CLI testing on 5 scenarios",
    "No crashes on stress test (100 persona files)"
  ],
  "key_gaps": [
    "Performance unknown at 10,000+ files",
    "Windows platform not tested",
    "Concurrency under load untested"
  ],
  "scope": "repo",
  "evidence": {
    "commit": "def456",
    "branch": "feature/cascade-impl",
    "note": "Implementation stable; ready for merge"
  },
  "contested_by": []
}
```

**Merge Result** (main):
```json
// Both observations preserved; no conflict
// Query: "What did each persona see?"
// Result: Two separate observations; different standpoints; different certainty/uncertainty
// Chorus can ask: "Do these conflict or complement?"
// Answer: Complement. Alice designed it; Bob built it. Both trustworthy from their lens.
```

**Schema Test**: ✓ Different IDs prevent collision. ✓ Standpoints make lenses clear. ✓ Two-axis confidence explains hesitations.

---

## Use Case 2: Audit Scenario — Jordan Reviews Cross-Repo Consistency

**Situation**: Jordan (auditor/skeptic) is checking if cascade precedence is truly consistent across 3 repos. Queries the knowledge graph.

**Jordan's query**:
```python
# "Give me all cascade-related observations from all personas"
actions.filter(
  object__contains="cascade",
  phase="garden"
)
```

**Chorus Response**:
```json
[
  {
    "id": "act-20251016-alice-001",
    "standpoint": {"persona": "una", "role": "guide"},
    "certainty": 0.95,
    "uncertainty": 0.20,
    "key_gaps": ["Never tested across org boundaries"]
  },
  {
    "id": "act-20251016-bob-001",
    "standpoint": {"persona": "bro", "role": "executor"},
    "certainty": 0.92,
    "uncertainty": 0.22,
    "key_gaps": ["Performance unknown at 10,000+ files"]
  },
  {
    "id": "act-20251015-root-001",
    "standpoint": {"persona": "root", "role": "skeptic"},
    "certainty": 0.88,
    "uncertainty": 0.30,
    "key_gaps": ["Edge case: circular persona references untested"]
  }
]
```

**Jordan's Analysis**:
- Three different certainty levels (0.95, 0.92, 0.88)
- Three different uncertainty levels (0.20, 0.22, 0.30)
- Three different key_gaps — none overlap; they're complementary
- **Conclusion**: Pattern is solid but each voice caught different gaps. Pattern is more trustworthy because gaps are honest.

**Schema Test**: ✓ Queries filter by standpoint work. ✓ Uncertainty values show where caution is warranted. ✓ Gaps reveal real risks, not overconfidence.

---

## Use Case 3: Learning Scenario — Alex Discovers Why Design Matters

**Situation**: Alex (learner/new team member) reads the action log to understand why cascade was designed the way it was.

**Alex's query**:
```python
# "Show me the kitchen table notes on cascade"
actions.filter(
  object="cascade",
  phase="kitchen_table",
  limit=10
)
```

**Kitchen Table Observation** (UNA, during design):
```json
{
  "id": "act-20251015-una-kt-001",
  "ts": "2025-10-15T13:00:00Z",
  "standpoint": {
    "persona": "una",
    "role": "guide",
    "phase": "kitchen_table"
  },
  "event": "Cascade precedence defined: 7 layers with repo override at layer 4",
  "certainty": 0.90,
  "uncertainty": 0.25,
  "key_basis": [
    "Rhizome's need: local overrides must work",
    "Bro's need: deployments can't break",
    "Root's need: audit trail is clear"
  ],
  "key_gaps": [
    "Never designed cross-org before",
    "Unknown if 7 layers is optimal",
    "Untested at scale"
  ],
  "_una_view": {
    "teaching_value": "High - layers teach ordering principles",
    "clarity_for_students": "Clear once you see the metaphor"
  },
  "_alex_learner": {
    "narrative": "We chose 7 layers because each layer solved a specific conflict",
    "why_this_design": "Previous flat config caused priority chaos",
    "what_happens_next": "Each layer is tested independently in garden phase"
  }
}
```

**Alex reads this and understands**:
- The design wasn't arbitrary; it solved specific problems
- Each persona had needs that shaped the solution
- Gaps were named upfront (honest about unknowns)
- Garden phase will test each layer (progression visible)

**Schema Test**: ✓ Sprouted persona view (alex_learner) teaches newcomers. ✓ Standpoint shows who decided this. ✓ key_gaps show this was tentative, not gospel. ✓ Kitchen table phase shows the reasoning.

---

## Use Case 4: Conflict Scenario — ROOT Contests Alice's Certainty

**Situation**: ROOT (quality/skeptic) disagrees with Alice's 0.95 certainty on cascade design. ROOT has found a bug.

**ROOT's Contestation**:
```json
{
  "id": "act-20251016-alice-001",
  "event": "Cascade precedence clarified: repo-level override beats user-level custom",
  "certainty": 0.95,
  "uncertainty": 0.20,

  // Alice's original values above; now contested:
  "contested_by": [
    {
      "by": "root",
      "ts": "2025-10-16T15:30:00Z",
      "claim": "Edge case found: circular persona references break precedence; Alice's test didn't cover this",
      "counter_event": "Cascade precedence has critical gap: circular refs not handled",
      "counter_certainty": 0.60,
      "counter_uncertainty": 0.40,
      "counter_basis": [
        "Found circular ref in test repo",
        "Precedence loop creates infinite resolver",
        "Blocker for production"
      ],
      "counter_gaps": [
        "Unknown if fix is simple or architectural",
        "Performance impact of cycle detection unknown"
      ]
    }
  ]
}
```

**Chorus Response**:
```json
// Now action has both perspectives in one record
// Query: "What's the status of cascade?"
// Result: "Alice: 0.95 certain. ROOT: Actually, 0.60 certain (found blocker)."
// Both preserved. Chorus can see disagreement clearly.
// Garden phase can focus on ROOT's gap (circular refs).
```

**Schema Test**: ✓ Disagreements don't create conflicts; they're preserved in one record. ✓ Counter-observations have their own certainty/uncertainty. ✓ Chorus sees both lenses; can decide.

---

## Use Case 5: LLM Logging Scenario — How Do We Prevent Gaming?

**Situation**: An LLM agent logs an observation about a resolved issue. We want to incentivize honesty, not inflated confidence.

**Bad Approach** (What we're preventing):
```json
{
  "event": "Issue resolved completely",
  "certainty": 1.0,  // Overconfident; hides doubts
  "uncertainty": 0.0,  // Dishonest; always have doubts
  // (No basis/gaps; can't verify)
}
```

**Good Approach** (With our schema):
```json
{
  "event": "Issue cascade-rotation-001 resolved",
  "certainty": 0.85,
  "uncertainty": 0.25,
  "confidence_summary": "Fix deployed and tested; real gaps in edge cases",
  "key_basis": [
    "Root cause identified: layer 4 precedence not applied",
    "Fix deployed to staging",
    "5 regression tests passing",
    "Verified on 3 test personas"
  ],
  "key_gaps": [
    "Not tested with circular persona refs yet (ROOT's finding)",
    "Performance impact unknown",
    "Real team load testing still needed"
  ]
}
```

**Why This Works**:
- LLM **must** articulate basis (prevents hallucination)
- LLM **must** articulate gaps (prevents overconfidence)
- Validation rule: If certainty >= 0.85, then uncertainty must be >= 0.15 (enforced)
- LLM learns: "Honesty = specificity. Gaming = vague + overconfident. Honesty is easier."

**Schema Test**: ✓ Validation rules prevent overconfidence. ✓ Articulation requirements make gaming harder than honesty. ✓ Two-axis model (not single scale) catches false high confidence.

---

## Use Case 6: Backwards Compatibility — Old Action Still Works

**Situation**: We have an old observation from before perspective-encoding. It has no standpoint, no two-axis confidence. We want to query new + old together.

**Old Observation** (from last month):
```json
{
  "actor": "rhizome_chorus",
  "action": "phase_transition",
  "object": "flight:old-flight",
  "qualifiers": ["kitchen_table_complete"],
  "confidence": null,
  "timestamp": "2025-09-16T12:00:00Z"
}
```

**Query Result** (mixed old + new):
```python
actions.filter(object__contains="flight")
```

**Returns**:
```json
[
  // New observation (with standpoint)
  {
    "id": "act-20251016-new",
    "standpoint": {"persona": "root", "role": "conductor"},
    "certainty": 0.98,
    "uncertainty": 0.05
  },
  // Old observation (automatically retrofitted for compatibility)
  {
    "id": "act-retrofit-old",
    "standpoint": {"persona": "rhizome", "role": "conductor"},  // Inferred from actor
    "certainty": 1.0,  // Conservative default
    "uncertainty": 0.0,  // Conservative default
    "_legacy": {
      "actor": "rhizome_chorus",
      "action": "phase_transition",
      "qualifiers": ["kitchen_table_complete"]
    }
  }
]
```

**Schema Test**: ✓ Old queries still work. ✓ New queries still work. ✓ Both return sensible results. ✓ `_legacy` field preserves original for audit.

---

## Schema Assumptions Being Tested

| Assumption | Use Case Testing It | Result |
|-----------|-------------------|--------|
| Different IDs prevent merge conflicts | Use Case 1 (Merge) | ✓ Works—both observations preserved |
| Queries work across standpoints | Use Case 2 (Audit) | ✓ Works—can group by persona/role/phase |
| Sprouted personas teach newcomers | Use Case 3 (Learning) | ✓ Works—Alex understands reasoning |
| Contested observations don't split logs | Use Case 4 (Conflict) | ✓ Works—both in same record |
| Validation rules prevent gaming | Use Case 5 (LLM Logging) | ✓ Works—honesty is easier than lying |
| Backwards compat doesn't break queries | Use Case 6 (Old + New) | ✓ Works—both schemas coexist |
| Two-axis confidence catches overconfidence | Use Cases 1, 2, 5 | ✓ Works—prevents 1.0 without gaps |
| Standpoint labels make lenses clear | All use cases | ✓ Works—readers know who's speaking |

---

## Questions for Chorus

1. **UNA (Guide)**: Do these use cases show the schema clearly? Are there scenarios where new readers would be confused? Should we add teaching value notes to more observations?

2. **ROOT (Skeptic)**: Do any of these scenarios expose gaps in the validation rules? Should we strengthen certainty/uncertainty constraints? Is the contested_by mechanism sufficient for disputes?

3. **BRO (Executor)**: Can you build the CLI flags to support all these scenarios? Are there logging shortcuts we should add? Will this be shippable in Phase 1?

4. **RHIZOME (Conductor)**: Do these use cases align observations across personas well? Can chorus synthesize consensus from contested observations? Do phase transitions show clearly?

---

*Ready for chorus design notes. Each voice: What would you change or strengthen in these scenarios?*
