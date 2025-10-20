/**
 * @rhizome stub
 * Abstract LLM client interface
 *
 * TODO: implement LLM provider abstraction
 * User Stories: "Understand Before Commit", property inference, LLM infer mode
 */

export interface LLMRequest {
	prompt: string;
	context?: Record<string, unknown>;
	temperature?: number;
	maxTokens?: number;
}

export interface LLMResponse {
	text: string;
	tokensUsed?: number;
	model?: string;
}

export interface LLMClient {
	/**
	 * @rhizome stub
	 * Send a prompt to LLM and get response
	 *
	 * TODO: implement provider-specific logic
	 * Depends on: config for API keys, model selection
	 */
	query(request: LLMRequest): Promise<LLMResponse>;

	/**
	 * @rhizome stub
	 * Check if LLM is available (API key configured, endpoint reachable)
	 *
	 * TODO: implement availability check
	 */
	isAvailable(): Promise<boolean>;
}

/**
 * @rhizome stub infer
 * Factory to create LLM client based on config
 *
 * TODO: implement provider factory
 * Decide: Claude API? Local Ollama? Fallback chain?
 * User Story: configurable LLM backend
 */
export class LLMClientFactory {
	static async create(): Promise<LLMClient> {
		throw new NotImplementedError();
		// TODO: read config, instantiate appropriate provider
	}
}
