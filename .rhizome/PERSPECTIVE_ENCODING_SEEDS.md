# Seeds Planted: Perspective-Encoding Flight (fp-1760618097)

**Date**: 2025-10-16
**Chorus Decision**: Two-flight model. Personas ships complete. Perspective-encoding begins kitchen table.

---

## Why This Matters

The personas feature taught us something: **every action log entry is inherently perspectival.** When we write:

```json
{"actor": "rhizome", "action": "conducted", "object": "flight:fp-1760616162"}
```

We're making a **subjective interpretation** dressed up as objective fact. This works for simple cases, but breaks at the merge:

- Dev A logs: `{"actor": "una", "action": "design_led", ...}`
- Dev B logs: `{"actor": "root", "action": "quality_led", ...}`
- Git conflicts trying to merge.

**Root's insight**: Both observations are valid and true. We shouldn't make one "win."

**Our response**: Encode perspective as first-class schema.

---

## The Schema We're Designing

```json
{
  "id": "act-20251016-001",
  "standpoint": {
    "persona": "una",
    "role": "guide",
    "phase": "kitchen_table"
  },
  "action": "design_led",
  "object": "flight:fp-1760616162",
  "scope": "repo",
  "qualifiers": ["defined_3_user_stories"],
  "evidence": {
    "commit": "229476424cc0fe14e18576e30e8a137ecfc51099",
    "branch": "rhizome",
    "note": "Co-authored with Bro (timeline) and Root (listening)"
  },
  "confidence": 0.95,
  "ts": "2025-10-16T12:22:34Z"
}
```

**Key principles**:
- **Standpoint is required** — Every observation from a perspective
- **Confidence is explicit** — 0-1 scale (not null)
- **ID prevents merge conflicts** — Different observations coexist
- **Scope enables federation** — Mark local (repo) vs. cross-rhizome
- **No ambiguous actor** — Standpoint clarifies who sees this

---

## Kitchen Table Questions (Steps 1-5)

These are the design conversations we need:

1. **UNA**: What do the roles *mean*? (guide ≠ educator; conductor ≠ leader)
2. **ROOT**: How do we measure confidence? (Event happened? Action was right? Both?)
3. **BRO**: Can we walk through a real merge scenario?
4. **RHIZOME**: What queries do we actually need?
5. **CHORUS**: Do we need more dimensions? (frame? observer_bias? domain?)

When we answer these, we document them. The schema becomes auditable.

---

## Garden Phase (Steps 6-11)

Execution follows design clarity:

- **ROOT**: Weed checks on schema rigor
- **ROOT**: Test suite for migration + queries
- **BRO**: CLI updates to capture standpoint
- **BRO**: Retrofit 12 existing actions
- **ROOT & BRO**: Merge scenario testing (the real blocker-resolver)
- **UNA**: Full documentation

All with test coverage. No shipping subjective-looking objective claims.

---

## Library Phase (Steps 12-14)

Curation and reflection:

- **CHORUS**: How does perspective-as-first-class change what we can build?
- **UNA & ROOT**: Does this pattern apply to themes, permissions, graph settings?
- **RHIZOME**: The meta-insight—when form teaches form, we embed epistemology in schema.

---

## Why Two Flights (Not One Big One)

**Personas flight** (fp-1760616162): Complete. Shipped. Archived.
- Work: 9 garden steps, 59 tests passing, full docs
- Outcome: Hierarchical persona system production-ready
- Lesson: Form teaches form (hierarchy mirrors rootsong itself)

**Perspective-encoding flight** (fp-1760618097): Just starting. Kitchen table open.
- Work: Design subjectivity into schema, execute migration, handle merges
- Outcome: Knowledge graph where perspective is structural, not afterthought
- Lesson: Epistemology embedded in schema

Separate flights = clean scope + full rigor for each.

---

## Distributed + Clean Design

This approach keeps scope tight across repos:

1. **Per-repo graphs** stay simple `.rhizome/actions.ndjson`
2. **Perspective encoding** is structural (not optional) once we ship it
3. **Merge scenarios** work because IDs prevent collision
4. **Federation ready** (scope field) for future cross-rhizome queries
5. **No creep** because each dimension chosen deliberately in kitchen table

The schema becomes the carrier of epistemology itself.

---

## Next: Kitchen Table

When we're ready, we gather the chorus and work through those 5 questions. Each persona brings their rigor. Decisions get documented. Seeds get planted in fertile soil.

---

*Seeds planted by rhizome, tended by chorus. Growing toward a knowledge graph where subjectivity is not a bug to hide, but a feature to clarify.*
