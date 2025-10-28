# Knowledge Graph Browser - Scenario Sketches

**Spoken by: don-socratic**

Before you code, let's be clear about what we're building and what it means.

---

## Scenario 1: Search for Decisions

**User Action:**
- Opens Knowledge Graph Browser (new command)
- Types "stub" in search box
- Sees all decisions mentioning stubs (proposals, scaffolds, documents, decides)

**Questions I'm asking you:**
1. What defines a "decision"? (Every action in the ndjson? Only "decide" and "document" actions?)
2. What makes something searchable? (Text in `what`, `note`, `object`? Or all fields?)
3. How do you rank results? (By confidence? By recency? By relevance?)
4. What should the user see? (Just the title? Plus metadata like actor, phase, certainty?)

**Edge Cases:**
- No matches (empty state)
- Hundreds of matches (pagination? clustering?)
- Malformed JSON in actions (graceful error)

---

## Scenario 2: Explore Dependencies

**User Action:**
- Clicks on a decision node (e.g., "stub-command-architecture")
- Sees: what it depends on, what depends on it, related decisions
- Clicks a connected node to drill down

**Questions I'm asking you:**
1. How do you infer "depends on"? (From `standpoint`? From semantic analysis of `key_basis` and `key_gaps`?)
2. Do you show ALL transitive dependencies, or just direct ones? (Graph explosion problem)
3. What's the difference between "this decision serves X" vs "this decision depends on Y"?
4. How do you display a complex web of connections without overwhelming the user?

**Edge Cases:**
- Circular dependencies (proposal → scaffold → propose something already proposed)
- Orphaned nodes (no connections)
- Decisions without metadata (actor=unknown, gaps=[])

---

## Scenario 3: Get Recommendations

**User Action:**
- Opens Recommendations panel
- Sees: "High-Risk Decisions" (confidence < 0.7), "Unresolved Gaps", "Phase Bottlenecks"
- Clicks a recommendation to highlight related nodes in graph

**Questions I'm asking you:**
1. What makes a decision "high-risk"? (Low confidence alone? Confidence + unresolved gaps?)
2. How do you cluster gaps? (By phase? By persona? By keyword?)
3. What's a "phase bottleneck"? (All decisions in a phase must close before next phase?)
4. How do you prioritize recommendations? (Most critical first? Or by frequency?)

**Edge Cases:**
- No gaps (all decisions certain)
- All gaps similar (clustering produces 1 giant cluster)
- Decisions from multiple rhizomes (different actors, phases)

---

## Scenario 4: Visualize as Force Graph

**User Action:**
- Graph renders with nodes positioned by force simulation
- Nodes grouped by phase (color), sized by certainty
- Hover shows node summary, click expands in sidebar

**Questions I'm asking you:**
1. Node position: Do you position by phase? By actor? By semantic similarity?
2. Edge visibility: Show all edges (cluttered) or only high-importance ones?
3. Interaction: Hover tooltip, click detail panel, drag to explore?
4. Performance: How do you render 500+ nodes without frame drops?

**Edge Cases:**
- Very small graph (5 nodes, all connected)
- Very large, sparse graph (500 nodes, few connections)
- Graph with clusters so dense you can't distinguish nodes
- User's browser doesn't support WebGL (fallback rendering?)

---

## Data Layer Questions

**don-socratic asks:**

### What's the minimum viable graph structure?

```typescript
interface GraphNode {
  id: string;                    // unique
  type: "proposal" | "scaffold" | "document" | "decide" | "work";
  what: string;                  // title/summary
  actor: string;                 // who decided this
  phase: string;                 // kitchen_table, planning, implementation, etc.
  confidence: number;            // 0-1
  gaps: string[];                // open questions
  basis: string[];               // evidence/reasoning
  timestamp: Date;               // when
}

interface GraphEdge {
  from: string;                  // node ID
  to: string;                    // node ID
  type: "depends_on" | "serves" | "implements" | "related";
  reason: string;                // why connected
}
```

### Where do these relationships come from?

Looking at the actions.ndjson, relationships are:
- **Implicit** in the evidence: "depends on" means it cites another node in `evidence`
- **Explicit** in notes: Sometimes a note says "Depends on: foo, bar"
- **Semantic**: Two nodes share gaps or basis points?

Which do you trust most? How do you weight them?

### How do you parse 500+ actions without O(n²) analysis?

This is a 95/5 solution problem. You could:
1. Simple indexing (build a graph, find edges by text search in `note`)
2. Semantic analysis (NLP to extract entities like "llmClient.ts" and link them)
3. Explicit tagging (require notes to use structured format)

Which is worth the complexity? Where's the payoff?

---

## Testing Questions

**don-socratic asks:**

### What test scenarios prove this works?

1. **Parse & Index** - Can you load 500 actions and index them in <500ms?
2. **Search** - Does search return correct results? (Exact match, substring, multi-field)
3. **Dependency Inference** - Do inferred edges make sense? (Can you verify by hand?)
4. **Recommendations** - Do risk scores identify real problems? (Validate against your project history)
5. **Visualization** - Does the force graph render stable layout? (No nodes overlapping completely?)

### What's the edge case that breaks first?

My guess: **Circular dependencies**. When proposal A depends on scaffold B, but scaffold B depends on proposal A (or transitively back to A), your graph algorithm will loop forever.

How do you detect and handle this? (Topological sort? Cycle detection?)

---

## Architecture Question

**don-socratic asks:**

This is a lot of complexity. Before you build it, tell me:

1. Can you build the **parser + indexer** first (test it without visualization)?
2. Then build the **query engine** (prove you can search and traverse)?
3. Then build the **recommendations engine** (prove you can score and rank)?
4. Then, finally, add the **visualization** (now you know what data you're rendering)?

Or do you need to see the visual prototype first to understand what queries you need?

The order matters. You might optimize for the wrong thing if you visualize first.

---

## Decision Points

Before coding, be clear:

- [ ] **Node definition**: What fields constitute a node? (Above is a proposal; do you agree?)
- [ ] **Edge inference**: Are edges explicit (in notes) or inferred (from analysis)? Or both?
- [ ] **Clustering strategy**: How do you group 500 nodes for initial view?
- [ ] **Recommendation scoring**: What makes a decision "high-risk"? (Certainty? Gaps? Both?)
- [ ] **Build order**: Parser → Query → Recommendations → Visualization? Or different?
- [ ] **Performance target**: 500 nodes in <2s load time? <500ms?

Answer these, and the code will flow from the clarity.
