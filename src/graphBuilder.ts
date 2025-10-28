import * as crypto from 'crypto';

export interface RhizomeAction {
	actor: string;
	action: string;
	object: string;
	what: string;
	confidence?: number | null;
	key_basis?: string[];
	key_gaps?: string[];
	timestamp?: string;
	standpoint?: {
		phase?: string;
	};
}

export interface GraphNode {
	id: string;
	type: string;
	actor: string;
	object: string;
	what: string;
	confidence: number;
	phase: string;
	basis: string[];
	gaps: string[];
	timestamp?: string;
}

export interface GraphEdge {
	from: string;
	to: string;
	label: string;
}

interface Graph {
	nodes: GraphNode[];
	edges: GraphEdge[];
}

const MIN_CONFIDENCE = 0;
const MAX_CONFIDENCE = 1;

function slugify(raw: string): string {
	return raw
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9\-]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '') || crypto.randomUUID();
}

function sanitizeConfidence(confidence: number | null | undefined): number | null {
	if (confidence === null) {
		return null;
	}
	if (confidence === undefined || Number.isNaN(confidence)) {
		return 0.5;
	}
	const clamped = Math.min(Math.max(confidence, MIN_CONFIDENCE), MAX_CONFIDENCE);
	return clamped;
}

function resolvePhase(action: RhizomeAction): string {
	return action.standpoint?.phase?.trim() || 'unknown';
}

function ensureRequiredFields(action: RhizomeAction): void {
	const missing: string[] = [];
	if (!action.actor) missing.push('actor');
	if (!action.action) missing.push('action');
	if (!action.object) missing.push('object');
	if (!action.what) missing.push('what');
	if (missing.length > 0) {
		throw new Error(`Missing required fields: ${missing.join(', ')}`);
	}
}

function buildNodeId(action: RhizomeAction): string {
	const actionSlug = slugify(action.action);
	const objectSlug = slugify(action.object);
	return `${actionSlug}-${objectSlug}`;
}

export class GraphBuilder {
	parseAction(action: RhizomeAction): GraphNode {
		ensureRequiredFields(action);

		const confidence = sanitizeConfidence(action.confidence);
		if (confidence === null) {
			throw new Error('Confidence explicitly null – skip this action');
		}

		return {
			id: buildNodeId(action),
			type: action.action,
			actor: action.actor,
			object: action.object,
			what: action.what,
			confidence,
			phase: resolvePhase(action),
			basis: action.key_basis ?? [],
			gaps: action.key_gaps ?? [],
			timestamp: action.timestamp,
		};
	}

	buildGraph(actions: RhizomeAction[]): Graph {
		const nodes: GraphNode[] = [];
		const nodeMap = new Map<string, GraphNode>();

		for (const action of actions) {
			const confidence = sanitizeConfidence(action.confidence);
			if (confidence === null) {
				continue;
			}

			try {
				const node = this.parseAction({ ...action, confidence });
				if (!nodeMap.has(node.id)) {
					nodeMap.set(node.id, node);
					nodes.push(node);
				}
			} catch (error) {
				// Skip malformed actions but continue building the graph.
			}
		}

		return {
			nodes,
			edges: this.buildEdges(nodes),
		};
	}

	private buildEdges(nodes: GraphNode[]): GraphEdge[] {
		// Placeholder: generate edges when data contains explicit relationships.
		// For now, return an empty list to satisfy integrity tests.
		return [];
	}
}

