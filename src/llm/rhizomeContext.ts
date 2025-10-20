/**
 * @rhizome stub
 * Build rhizome-aware context for LLM prompts
 *
 * TODO: implement rhizome context builder
 * User Stories: all (decisions grounded in personas)
 */

export interface RhizomeContext {
	persona?: {
		name: string;
		role: string;
		phase: 'kitchen_table' | 'garden' | 'library';
	};
	codeContext?: {
		filePath: string;
		selection?: string;
		language: string;
	};
	decision?: {
		topic: string;
		certainty?: number;
		basis?: string[];
		gaps?: string[];
	};
}

/**
 * @rhizome stub
 * Load persona from .rhizome/personas.d/ and attach to context
 *
 * TODO: implement persona loading
 * Questions: active persona? default to rhizome/conductor? user-selectable?
 */
export async function buildRhizomeContext(
	codeFilePath: string,
	selectedText?: string
): Promise<RhizomeContext> {
	throw new NotImplementedError();
	// TODO: read active persona from config or .rhizome
	// TODO: load persona voice, values, signature moves
	// TODO: attach code context
	// TODO: return enriched context for LLM
}

/**
 * @rhizome stub
 * Format rhizome context into system prompt for LLM
 *
 * TODO: implement prompt formatting
 * Format: "You are [persona name], role: [role]. Your voice: [voice]. Current phase: [phase]. Code context: [file, selection]"
 */
export function formatContextAsSystemPrompt(context: RhizomeContext): string {
	throw new NotImplementedError();
	// TODO: construct system prompt from persona attributes
}

/**
 * @rhizome stub
 * Log decision back to rhizome journal
 *
 * TODO: implement decision logging
 * User Story: decisions stay in knowledge graph
 * Depends on: RhizomeBackend abstraction
 */
export async function logDecisionToRhizome(
	action: string,
	object: string,
	what: string,
	context: RhizomeContext
): Promise<void> {
	throw new NotImplementedError();
	// TODO: import { getRhizomeBackend } from '../rhizome/rhizomeBackend';
	// TODO: const backend = await getRhizomeBackend();
	// TODO: await backend.record({
	//   action,
	//   object,
	//   what,
	//   persona: context.persona?.name,
	//   role: context.persona?.role,
	//   phase: context.persona?.phase,
	//   basis: context.decision?.basis,
	//   gap: context.decision?.gaps,
	// });
}
