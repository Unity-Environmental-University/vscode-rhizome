import * as vscode from 'vscode';
import { SessionState } from './rubberDuckStateManager';
import { RubberDuckStorage, ConversationEntry } from './rubberDuckStorage';
import { DuckObservation } from './rubberDuckQuery';

/**
 * Commands the user can issue during a rubber duck session.
 * What's a good command set?
 * - "next" or "→": move forward
 * - "back" or "←": go back
 * - "deeper" or "dig": explore current line more
 * - "summary" or "tl;dr": what did we learn?
 * - "stop" or "quit": end session
 */
export type DuckCommand = 'next' | 'back' | 'deeper' | 'summary' | 'stop';

/**
 * Parse user input into a command.
 * Should we be case-insensitive? Allow aliases?
 * What if the user types something we don't recognize?
 */
export function parseCommand(input: string): DuckCommand | null {
  throw new Error(
    `parseCommand: ` +
    `How strict should command parsing be? ` +
    `Should "NEXT" and "next" and "→" all work? What about typos?`
  );
}

/**
 * A rubber duck debugging session.
 *
 * The main orchestrator. It coordinates:
 * - Loading the file and previous conversation
 * - Displaying the output channel
 * - Getting duck observations from the persona
 * - Handling user commands (next, deeper, stop, etc)
 * - Saving progress to JSONL
 * - Managing state across the session
 */
export class RubberDuckSession {
  private filePath: string;
  private selectedRange: vscode.Range | null;
  private state: SessionState;
  private storage: RubberDuckStorage;
  private outputChannel: vscode.OutputChannel;
  private currentObservation: DuckObservation | null;

  /**
   * Create a new rubber duck session.
   *
   * What happens here?
   * - Verify the file exists
   * - Get file length
   * - Initialize state
   * - Create/get output channel
   * - Maybe load previous session?
   */
  constructor(
    filePath: string,
    workspaceRoot: string,
    selectedRange?: vscode.Range
  ) {
    this.filePath = filePath;
    this.selectedRange = selectedRange || null;
    throw new Error(
      `RubberDuckSession constructor: ` +
      `What should happen here? Create storage? Initialize state? Load previous?`
    );
  }

  /**
   * Start the session.
   *
   * This is the main loop. What happens?
   * 1. Load previous conversation if exists
   * 2. Show first line (or resume from last)
   * 3. Get duck observation
   * 4. Display in output channel
   * 5. Show input box, wait for command
   * 6. Process command (next/deeper/stop)
   * 7. Save entry to JSONL
   * 8. Loop until stop
   */
  async start(): Promise<void> {
    throw new Error(
      `start: ` +
      `What's the session lifecycle? ` +
      `How do you show the output channel? How do you get user input?`
    );
  }

  /**
   * Load the previous conversation for this file.
   * If this is a resume, where should we start?
   * - At line 1 (fresh eyes)?
   * - At the last visited line (continue)?
   * - At the first unfinished line (smart resume)?
   */
  private async loadPreviousSession(): Promise<void> {
    throw new Error(
      `loadPreviousSession: ` +
      `How do you determine "resume point"? ` +
      `Should you ask the user, or be smart about it?`
    );
  }

  /**
   * Get the next line to discuss (from current line in state).
   * What if the file has changed? Lines added/deleted?
   * How do we know if a line has already been discussed?
   */
  private async getCurrentLineForDiscussion(): Promise<string> {
    throw new Error(
      `getCurrentLineForDiscussion: ` +
      `How do you get line N from the editor? ` +
      `What if the file was modified since last session?`
    );
  }

  /**
   * Ask the duck (persona) for an observation about the current line.
   * This calls queryRubberDuck() from rubberDuckQuery.ts.
   *
   * What context do you give the persona?
   * - The line itself
   * - A few lines before (for flow)?
   * - The language
   * - How deep to dig
   */
  private async askDuck(depth: 'observe' | 'deeper'): Promise<DuckObservation> {
    throw new Error(
      `askDuck: ` +
      `Should the persona see the whole file? Just this line? A few lines of context? ` +
      `What's the right balance between detail and token cost?`
    );
  }

  /**
   * Display a line and duck observation in the output channel.
   * Make it clean, readable, highlighted.
   *
   * Example:
   * ─────────────────────────────────────
   * Line 5 | const channel = vscode.window.createOutputChannel(...)
   * Duck: Creating an output channel. Why in activate() instead of lazy?
   * ─────────────────────────────────────
   */
  private displayLineAndObservation(lineNum: number, lineContent: string, observation: DuckObservation): void {
    throw new Error(
      `displayLineAndObservation: ` +
      `How should this look in the output channel? ` +
      `Should line numbers be highlighted? Should code be syntax highlighted?`
    );
  }

  /**
   * Process a user command (next, deeper, stop, etc).
   * This is the command dispatcher.
   *
   * - "next": Save this entry, move to next line, ask duck, loop
   * - "back": Move to previous line (re-explore)
   * - "deeper": Ask duck more about current line
   * - "summary": Show what we've learned so far
   * - "stop": End session, save, clean up
   */
  async processCommand(command: DuckCommand, userResponse?: string): Promise<void> {
    throw new Error(
      `processCommand: ` +
      `How do you handle each command? ` +
      `What state changes? What gets saved?`
    );
  }

  /**
   * Move to the next line.
   * Save the current entry first?
   * Show the new line?
   * Ask the duck?
   */
  private async moveToNextLine(userResponse: string): Promise<void> {
    throw new Error(
      `moveToNextLine: ` +
      `What's the sequence? Save → Move → Display → Ask → Wait? ` +
      `Should error handling happen here or in processCommand?`
    );
  }

  /**
   * Dig deeper on the current line.
   * Don't move, just ask the duck more.
   * Should we show the previous response?
   * Should we show multiple duck responses side-by-side?
   */
  private async goDeeper(userResponse: string): Promise<void> {
    throw new Error(
      `goDeeper: ` +
      `How many times can the user dig deeper on one line? ` +
      `Should we accumulate responses or replace them?`
    );
  }

  /**
   * Summarize what we've learned in this session so far.
   * What makes a good summary?
   * - List of lines + observations?
   * - Themes we noticed?
   * - Trade-offs we identified?
   * - Questions we still have?
   */
  private async generateSummary(): Promise<string> {
    throw new Error(
      `generateSummary: ` +
      `What's useful to the user? ` +
      `Should the summary be generated by the persona, or just extracted from history?`
    );
  }

  /**
   * Save a conversation entry to JSONL.
   * What if the write fails?
   * What if the directory doesn't exist?
   */
  private async saveEntry(entry: ConversationEntry): Promise<void> {
    throw new Error(
      `saveEntry: ` +
      `Should you save incrementally (append immediately) or batch saves? ` +
      `What if network is slow or storage fails?`
    );
  }

  /**
   * End the session gracefully.
   * Save any pending data?
   * Show a summary?
   * Offer to continue next time?
   */
  private async end(): Promise<void> {
    throw new Error(
      `end: ` +
      `What should the exit experience be? ` +
      `Should we show a summary? Offer to continue later?`
    );
  }

  /**
   * Get user input from the input box.
   * Show a prompt like: "next | deeper | summary | stop"
   * What if they wait too long?
   * What if they hit escape?
   */
  private async getUserInput(): Promise<string | undefined> {
    throw new Error(
      `getUserInput: ` +
      `How do you prompt the user? ` +
      `What's the UX if they cancel or timeout?`
    );
  }

  /**
   * Display help text about available commands.
   * When should this be shown?
   * On first start? After invalid command?
   * In output channel or info dialog?
   */
  private displayHelp(): void {
    throw new Error(
      `displayHelp: ` +
      `Should help be verbose or terse? ` +
      `Should it show example commands?`
    );
  }
}
