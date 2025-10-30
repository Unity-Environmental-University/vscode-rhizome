/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STATEUTILS: Reusable building block for state machines
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Why this exists:
 * State machines appear everywhere in vscode-rhizome:
 * - Rubber duck sessions (line navigation, conversation)
 * - Flight plans (kitchen_table → garden → library)
 * - Decision workflows (propose → decide → document)
 *
 * This is a minimal scaffold. Not a framework. Not required. Just available.
 *
 * Pattern:
 * 1. Define your State type
 * 2. Write pure functions that transform State
 * 3. Use createStateMachine to manage it
 * 4. Your UI/controller orchestrates the transitions
 *
 * This is how you teach the pattern. Copy-paste SessionState.ts to see it in action.
 */

/**
 * A state machine is just:
 * - A piece of state (immutable)
 * - Ways to transform it (pure functions)
 * - A holder to manage updates
 *
 * Should this be a class wrapper, or just a type contract?
 */
export type StateMachine<T> = {
  getState: () => T;
  setState: (newState: T) => void;
};

/**
 * Create a state machine.
 * Holds state, provides methods to read/write it.
 * What's the contract? Should it emit events?
 */
export function createStateMachine<T>(initial: T): StateMachine<T> {
  let state = initial;

  return {
    getState: () => state,
    setState: (newState: T) => {
      state = newState;
    },
  };
}
