/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SESSION: Pure command orchestrator for rubber duck debugging
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This is the controller. It knows the rules:
 * - What happens when user hits "next"
 * - How to validate commands
 * - State transitions (next, back, deeper, summary, stop)
 *
 * It does NOT know:
 * - How to show UI
 * - How to call rhizome
 * - How to read files
 * - How to save to storage
 *
 * That's RubberDuckUI's job.
 */

import {
  SessionState,
  nextLine,
  previousLine,
  jumpToLine,
  addEntry,
  getSummary,
  endSession,
} from './SessionState';
import { DuckObservation } from './query';

export type DuckCommand = 'next' | 'back' | 'deeper' | 'summary' | 'stop';

/**
 * Parse user input into a command.
 * Should we be case-insensitive? Allow aliases like "→" or "next"?
 * What if the user types garbage?
 */
export function parseCommand(input: string): DuckCommand | null {
  throw new Error(
    `parseCommand: Convert user input to a DuckCommand. ` +
    `Be lenient (case-insensitive, aliases)? Or strict? ` +
    `Return null if unrecognized.`
  );
}

/**
 * Process a user command and return new state.
 * This is the main state transition function.
 *
 * What happens on each command?
 * - next: Add entry, move to next line, throw if EOF
 * - back: Move to previous line (can re-explore)
 * - deeper: Add response to current entry, ask duck again
 * - summary: Generate summary (no state change)
 * - stop: End session
 *
 * Throws if command is invalid.
 */
export function processCommand(
  state: SessionState,
  command: DuckCommand,
  observation?: DuckObservation,
  userResponse?: string
): SessionState {
  throw new Error(
    `processCommand: Dispatch based on command. ` +
    `Which commands need observation + userResponse? ` +
    `Which just move state? ` +
    `When do you throw vs return state unchanged?`
  );
}

/**
 * Handle "next" command.
 * User finished with this line, move to next.
 * Should we save the entry first? Or does caller handle that?
 */
function handleNext(
  state: SessionState,
  observation: DuckObservation,
  userResponse: string
): SessionState {
  throw new Error(
    `handleNext: Validate observation. Add entry to state. Move to next line. ` +
    `Throw if validation fails or at EOF. ` +
    `Should caller persist, or should this?`
  );
}

/**
 * Handle "back" command.
 * User wants to re-explore the previous line.
 * Should they see the old observation, or ask again?
 */
function handleBack(state: SessionState): SessionState {
  throw new Error(
    `handleBack: Move to previous line. ` +
    `Do we preserve the old conversation entry? ` +
    `Or clear it and start fresh on re-entry?`
  );
}

/**
 * Handle "deeper" command.
 * User wants more detail on the current line.
 * Should we show the previous response alongside?
 */
function handleDeeper(
  state: SessionState,
  observation: DuckObservation,
  userResponse: string
): SessionState {
  throw new Error(
    `handleDeeper: Add a "deeper" response to the current line's entry. ` +
    `Should we track multiple duck observations per line? ` +
    `Or replace the old one?`
  );
}

/**
 * Handle "summary" command.
 * User wants to see what we've learned so far.
 * Just return the summary? Don't change state?
 */
function handleSummary(state: SessionState): SessionState {
  throw new Error(
    `handleSummary: Return getSummary(state). ` +
    `Should state change? No. ` +
    `Who displays the summary? Session or UI?`
  );
}

/**
 * Handle "stop" command.
 * User is done. End the session.
 */
function handleStop(state: SessionState): SessionState {
  throw new Error(
    `handleStop: Call endSession(state). ` +
    `Should we show a final summary? ` +
    `Should we persist anything special?`
  );
}
