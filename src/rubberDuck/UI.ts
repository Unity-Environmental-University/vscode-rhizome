/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RUBBERDUCKUI: The view layer. VSCode output channel + input handling
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This orchestrates the whole session:
 * 1. Load or create session state
 * 2. Show output channel
 * 3. Loop: render → get input → process command → save → repeat
 * 4. Handle errors and user feedback
 *
 * It knows about:
 * - VSCode APIs (output channel, input box, editor)
 * - Storage (when to persist)
 * - Query (when to ask the duck)
 * - Session (when to process commands)
 *
 * It does NOT know:
 * - How commands work (that's Session)
 * - How to format state (that's display helpers)
 */

import * as vscode from 'vscode';
import { SessionState, createSessionState } from './SessionState';
import { RubberDuckStorage, ConversationEntry } from './storage';
import { processCommand, parseCommand, DuckCommand } from './session';
import { queryRubberDuck, DuckObservation } from './query';

/**
 * A rubber duck session in the UI.
 * This is the game loop. What's the flow?
 */
export class RubberDuckUI {
  private state: SessionState;
  private storage: RubberDuckStorage;
  private outputChannel: vscode.OutputChannel;
  private editor: vscode.TextEditor;
  private workspaceRoot: string;

  /**
   * Create a new rubber duck session.
   * What setup is needed? Load file? Create directory? Check state?
   */
  constructor(
    editor: vscode.TextEditor,
    workspaceRoot: string,
    storage: RubberDuckStorage,
    outputChannel: vscode.OutputChannel
  ) {
    throw new Error(
      `RubberDuckUI constructor: Initialize state. ` +
      `Load previous session or create fresh? ` +
      `Validate editor + file + workspace?`
    );
  }

  /**
   * Start the session.
   * This is the main loop. What's the lifecycle?
   */
  async start(): Promise<void> {
    throw new Error(
      `start: Main loop. ` +
      `1. Show output channel ` +
      `2. Render current line + duck observation ` +
      `3. Get user input (next/back/deeper/stop) ` +
      `4. Process command (state transition) ` +
      `5. Save to storage ` +
      `6. Repeat until isActive = false`
    );
  }

  /**
   * Load previous session from storage.
   * Should we resume from last line, or ask the user?
   */
  private async loadPreviousSession(): Promise<SessionState> {
    throw new Error(
      `loadPreviousSession: Get previous entries from storage. ` +
      `Check if file has changed (content hash). ` +
      `If unchanged: offer resume. If changed: warn user. ` +
      `Return loaded state or null if first-time.`
    );
  }

  /**
   * Get the current line from the editor.
   * What if file was modified since session started?
   */
  private getCurrentLineContent(): string {
    throw new Error(
      `getCurrentLineContent: Read line N from editor. ` +
      `What if file has fewer lines now? ` +
      `What if file was deleted? Throw? Warn?`
    );
  }

  /**
   * Ask the rubber duck persona about the current line.
   * What context do we give? Just this line, or more?
   */
  private async askDuck(depth: 'observe' | 'deeper'): Promise<DuckObservation> {
    throw new Error(
      `askDuck: Call queryRubberDuck(). ` +
      `Pass: current line, language, depth. ` +
      `Return DuckObservation or throw if rhizome unavailable.`
    );
  }

  /**
   * Render the current line and duck observation in the output channel.
   */
  private renderLineAndObservation(line: string, observation: DuckObservation): void {
    throw new Error(
      `renderLineAndObservation: Format and display in output channel. ` +
      `Make it readable: line number, code, duck observation. ` +
      `Should syntax highlighting happen here? Or in storage?`
    );
  }

  /**
   * Get user input from an input box.
   * Prompt: "next | back | deeper | summary | stop"
   * What if they wait too long? Timeout? Cancel?
   */
  private async getUserInput(): Promise<{ command: DuckCommand; response: string } | null> {
    throw new Error(
      `getUserInput: Show input box with command prompt. ` +
      `Parse input with parseCommand(). ` +
      `Return { command, response } or null if cancelled.`
    );
  }

  /**
   * Save the current conversation entry to storage.
   * When does this happen? After each command? Or batched?
   */
  private async saveEntry(entry: ConversationEntry): Promise<void> {
    throw new Error(
      `saveEntry: Append entry to JSONL. ` +
      `What if write fails? Throw? Show warning? ` +
      `Should we save immediately, or batch?`
    );
  }

  /**
   * Show the summary to the user.
   */
  private renderSummary(): void {
    throw new Error(
      `renderSummary: Display getSummary(state) in output channel. ` +
      `Show: lines visited, coverage %, key observations. ` +
      `Offer to continue later or save?`
    );
  }

  /**
   * End the session gracefully.
   */
  private async end(): Promise<void> {
    throw new Error(
      `end: Set isActive = false. ` +
      `Show exit message. ` +
      `Offer to save/continue/archive. ` +
      `Clean up resources (output channel still open?).`
    );
  }
}
