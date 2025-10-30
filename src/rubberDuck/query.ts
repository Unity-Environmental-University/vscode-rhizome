/**
 * The rubber duck needs to say something about each line.
 * How is this different from don-socratic?
 * Don: "Stop. What do you mean by that?"
 * Duck: "I see you're checking if X. Why here?"
 *
 * One observation. One gentle question. Non-blocking.
 */
export interface DuckObservation {
  lineNum: number;
  observation: string;
  question: string;
}

/**
 * How deep should the duck dig?
 * "observe": First pass, surface level
 * "deeper": User said "dig more", press further
 */
export type DuckDepth = 'observe' | 'deeper';

/**
 * Call a persona to generate a rubber duck observation about a line of code.
 *
 * What's the prompt structure?
 * - Line number and content
 * - Language (for context)
 * - Previous lines (for flow understanding)
 * - Depth (observe vs deeper)
 *
 * What should the response look like?
 * - One sentence observation
 * - One follow-up question
 * - Nothing more (keep it brief)
 */
export async function queryRubberDuck(
  lineNum: number,
  lineContent: string,
  language: string,
  previousContext: string,
  depth: DuckDepth
): Promise<DuckObservation> {
  throw new Error(
    `queryRubberDuck: How do you call rhizome CLI from here? ` +
    `Do you spawn a child process? Use a library? What's the error path if rhizome isn't installed?`
  );
}

/**
 * What if the persona isn't available?
 * Generate a fallback observation using basic heuristics.
 *
 * This is the teaching moment: what can a dumb heuristic teach you?
 */
export function generateFallbackObservation(
  lineNum: number,
  lineContent: string
): DuckObservation {
  throw new Error(
    `generateFallbackObservation: ` +
    `What can you learn from line content alone? Variable names? Patterns? ` +
    `Should this fallback feel like a "dumb duck" so users notice the difference?`
  );
}

/**
 * Format the duck's response for display in the output channel.
 * How should it look?
 *
 * Line 5 | const channel = vscode.window.createOutputChannel(...)
 * Duck: Creating a channel here. Why in activate() and not in a helper?
 *
 * Clean? Readable? Can users easily copy the code?
 */
export function formatDuckResponse(observation: DuckObservation): string {
  throw new Error(
    `formatDuckResponse: ` +
    `What's the best layout for the user? ` +
    `How much context do they need to understand the observation?`
  );
}
