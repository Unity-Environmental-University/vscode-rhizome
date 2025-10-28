// Test: Knowledge Graph Builder
//
// don-socratic asks: When parsing 500+ actions from ndjson, what patterns emerge?
// What should the tests validate?
//
// Test three categories:
// 1. Happy Path: Parser works on valid data
// 2. Error Paths: Parser handles malformed/missing data gracefully
// 3. Integration: Built graph is queryable and has correct structure

import * as assert from 'assert';
import { GraphBuilder, GraphNode, GraphEdge } from './graphBuilder';

/**
 * Happy Path: Parser handles valid actions correctly
 *
 * don-socratic: Can you parse a single action? Ten? A hundred?
 * Does your parser maintain correctness as volume increases?
 */
describe('Happy Path: Parse valid actions', () => {
    let builder: GraphBuilder;

    beforeEach(() => {
        builder = new GraphBuilder();
    });

    it('should create a node from a single action', () => {
        const action = {
            actor: 'vscode-rhizome',
            action: 'decide',
            object: 'test-decision',
            what: 'Test something',
            confidence: 0.9,
            key_basis: ['reasoning 1'],
            key_gaps: ['question 1'],
            timestamp: '2025-10-27T15:00:00Z',
            standpoint: { phase: 'kitchen_table' },
        };

        const node = builder.parseAction(action);

        assert.strictEqual(node.id, 'decide-test-decision');
        assert.strictEqual(node.type, 'decide');
        assert.strictEqual(node.what, 'Test something');
        assert.strictEqual(node.confidence, 0.9);
        assert.deepStrictEqual(node.gaps, ['question 1']);
    });

    it('should handle different action types (propose, scaffold, document, work)', () => {
        const types = ['propose', 'scaffold', 'document', 'decide', 'work'];

        types.forEach((actionType) => {
            const action = {
                actor: 'test-actor',
                action: actionType,
                object: `test-${actionType}`,
                what: `Test ${actionType}`,
                confidence: 0.8,
                key_basis: [],
                key_gaps: [],
                timestamp: '2025-10-27T15:00:00Z',
                standpoint: { phase: 'planning' },
            };

            const node = builder.parseAction(action);
            assert.strictEqual(node.type, actionType);
        });
    });

    it('should extract phase from standpoint', () => {
        const action = {
            actor: 'test',
            action: 'decide',
            object: 'test',
            what: 'Test',
            confidence: 0.9,
            key_basis: [],
            key_gaps: [],
            timestamp: '2025-10-27T15:00:00Z',
            standpoint: { phase: 'implementation' },
        };

        const node = builder.parseAction(action);
        assert.strictEqual(node.phase, 'implementation');
    });

    it('should build graph from multiple actions', () => {
        const actions = [
            {
                actor: 'vscode-rhizome',
                action: 'propose',
                object: 'feature-1',
                what: 'Feature 1',
                confidence: 0.8,
                key_basis: [],
                key_gaps: [],
                timestamp: '2025-10-27T15:00:00Z',
                standpoint: { phase: 'kitchen_table' },
            },
            {
                actor: 'vscode-rhizome',
                action: 'scaffold',
                object: 'feature-1-impl',
                what: 'Feature 1 Implementation',
                confidence: 0.85,
                key_basis: ['depends on feature-1'],
                key_gaps: [],
                timestamp: '2025-10-27T15:05:00Z',
                standpoint: { phase: 'planning' },
            },
        ];

        const graph = builder.buildGraph(actions);

        assert.strictEqual(graph.nodes.length, 2);
        assert.strictEqual(graph.nodes[0].type, 'propose');
        assert.strictEqual(graph.nodes[1].type, 'scaffold');
    });
});

/**
 * Error Paths: Parser handles missing/malformed data gracefully
 *
 * don-socratic: What happens when the data is incomplete?
 * Do you fail loudly, silently, or with helpful errors?
 * What's worth crashing over vs. what should be a warning?
 */
describe('Error Paths: Handle malformed/missing data', () => {
    let builder: GraphBuilder;

    beforeEach(() => {
        builder = new GraphBuilder();
    });

    it('should handle missing confidence field (default to 0.5)', () => {
        const action = {
            actor: 'test',
            action: 'decide',
            object: 'test',
            what: 'Test',
            // confidence: MISSING
            key_basis: [],
            key_gaps: [],
            timestamp: '2025-10-27T15:00:00Z',
            standpoint: { phase: 'kitchen_table' },
        };

        const node = builder.parseAction(action as any);
        assert.strictEqual(node.confidence, 0.5); // Default
    });

    it('should handle missing standpoint (default phase to "unknown")', () => {
        const action = {
            actor: 'test',
            action: 'decide',
            object: 'test',
            what: 'Test',
            confidence: 0.8,
            key_basis: [],
            key_gaps: [],
            timestamp: '2025-10-27T15:00:00Z',
            standpoint: {}, // Missing phase
        };

        const node = builder.parseAction(action as any);
        assert.strictEqual(node.phase, 'unknown');
    });

    it('should handle missing required fields gracefully', () => {
        const action = {
            actor: 'test',
            // action: MISSING
            object: 'test',
            what: 'Test',
            confidence: 0.8,
            key_basis: [],
            key_gaps: [],
            timestamp: '2025-10-27T15:00:00Z',
            standpoint: { phase: 'kitchen_table' },
        };

        assert.throws(() => {
            builder.parseAction(action as any);
        });
    });

    it('should skip nodes with confidence = null', () => {
        const actions = [
            {
                actor: 'test',
                action: 'decide',
                object: 'test1',
                what: 'Test 1',
                confidence: 0.9,
                key_basis: [],
                key_gaps: [],
                timestamp: '2025-10-27T15:00:00Z',
                standpoint: { phase: 'kitchen_table' },
            },
            {
                actor: 'test',
                action: 'propose',
                object: 'test2',
                what: 'Test 2',
                confidence: null, // Skip this
                key_basis: [],
                key_gaps: [],
                timestamp: '2025-10-27T15:05:00Z',
                standpoint: { phase: 'kitchen_table' },
            },
        ];

        const graph = builder.buildGraph(actions as any);
        assert.strictEqual(graph.nodes.length, 1); // Only the first
    });
});

/**
 * Integration: Graph structure is correct and queryable
 *
 * don-socratic: Can you prove that the graph you built
 * is correct? What properties should always be true?
 *
 * Properties:
 * - No duplicate node IDs
 * - All edges reference existing nodes
 * - Node IDs are consistent (same action → same ID)
 */
describe('Integration: Graph structure and consistency', () => {
    let builder: GraphBuilder;

    beforeEach(() => {
        builder = new GraphBuilder();
    });

    it('should produce unique node IDs', () => {
        const actions = Array.from({ length: 10 }, (_, i) => ({
            actor: 'test',
            action: 'decide',
            object: `decision-${i}`,
            what: `Decision ${i}`,
            confidence: 0.8,
            key_basis: [],
            key_gaps: [],
            timestamp: '2025-10-27T15:00:00Z',
            standpoint: { phase: 'kitchen_table' },
        }));

        const graph = builder.buildGraph(actions);

        const ids = graph.nodes.map((n) => n.id);
        const uniqueIds = new Set(ids);

        assert.strictEqual(ids.length, uniqueIds.size, 'Duplicate node IDs detected');
    });

    it('should produce consistent IDs for same action', () => {
        const action = {
            actor: 'test',
            action: 'decide',
            object: 'test-obj',
            what: 'Test',
            confidence: 0.8,
            key_basis: [],
            key_gaps: [],
            timestamp: '2025-10-27T15:00:00Z',
            standpoint: { phase: 'kitchen_table' },
        };

        const id1 = builder.parseAction(action).id;
        const id2 = builder.parseAction(action).id;

        assert.strictEqual(id1, id2, 'Same action produced different IDs');
    });

    it('should ensure all edge references point to existing nodes', () => {
        const actions = [
            {
                actor: 'test',
                action: 'propose',
                object: 'feature-1',
                what: 'Feature 1',
                confidence: 0.8,
                key_basis: ['needs review'],
                key_gaps: ['unclear scope'],
                timestamp: '2025-10-27T15:00:00Z',
                standpoint: { phase: 'kitchen_table' },
            },
            {
                actor: 'test',
                action: 'scaffold',
                object: 'feature-1-impl',
                what: 'Feature 1 Implementation',
                confidence: 0.85,
                key_basis: ['implements feature-1'],
                key_gaps: [],
                timestamp: '2025-10-27T15:05:00Z',
                standpoint: { phase: 'planning' },
            },
        ];

        const graph = builder.buildGraph(actions);

        const nodeIds = new Set(graph.nodes.map((n) => n.id));
        graph.edges.forEach((edge) => {
            assert(nodeIds.has(edge.from), `Edge references non-existent node: ${edge.from}`);
            assert(nodeIds.has(edge.to), `Edge references non-existent node: ${edge.to}`);
        });
    });
});

/**
 * Teaching moment: What happens at scale?
 *
 * don-socratic: What's the largest graph you've tested?
 * What performance guarantees do you have?
 * When does parsing get slow?
 *
 * This test is intentionally marked as "pending" because answering it
 * requires understanding your performance requirements.
 */
describe.skip('Scale test: Performance with 500+ actions', () => {
    it('should parse 500 actions in < 2s', () => {
        // TODO: When you care about performance, enable this.
        // For now, this is a placeholder that says:
        // "Yes, we thought about scale. No, we haven't optimized yet."
    });
});
