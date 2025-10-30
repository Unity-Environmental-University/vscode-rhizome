import { ConversationEntry } from './storage';

/**
 * We're walking through code line by line.
 * What state needs to live in memory during a session?
 */
export class SessionState {
  filePath: string;
  currentLineNum: number;
  totalLines: number;
  isActive: boolean;
  conversationHistory: ConversationEntry[];

  constructor(filePath: string, totalLines: number) {
    this.filePath = filePath;
    this.currentLineNum = 0;
    this.totalLines = totalLines;
    this.isActive = true;
    this.conversationHistory = [];
  }

  /**
   * Load previous conversation history into this session state.
   * Should we resume from where we left off? Or start fresh?
   */
  loadHistory(history: ConversationEntry[]): void {
    throw new Error('loadHistory: How do you resume a session? Go to the last line, or the first unfinished one?');
  }

  /**
   * Move to the next line.
   * What if we're already at the end? Should we loop or stop?
   */
  nextLine(): void {
    throw new Error('nextLine: What happens at the end of the file? Error? Offer summary?');
  }

  /**
   * Go back to the previous line.
   * Why would a user want to? Can they re-explore a line they already covered?
   */
  previousLine(): void {
    throw new Error('previousLine: Should we show the original duck observation, or ask again?');
  }

  /**
   * Jump to a specific line number.
   * How do you validate the line number? What if it's out of bounds?
   */
  jumpToLine(lineNum: number): void {
    throw new Error('jumpToLine: Should jumping create a gap in the conversation? Or backfill?');
  }

  /**
   * Is this line already in the conversation?
   * How do we know if we've already discussed line 5?
   */
  hasLineBeenCovered(lineNum: number): boolean {
    throw new Error('hasLineBeenCovered: Is this useful for resuming sessions? Showing progress?');
  }

  /**
   * Get the current line from the file.
   * But you don't have access to the file here. Should you?
   */
  getCurrentLine(): string {
    throw new Error('getCurrentLine: Does this belong in StateManager, or should Session ask the editor?');
  }

  /**
   * Add a conversation entry to the history.
   * Should we validate it? Transform it?
   */
  addEntry(entry: ConversationEntry): void {
    throw new Error('addEntry: Should StateManager know about persistence, or just track in-memory state?');
  }

  /**
   * What have we learned so far?
   * Summarize the conversation for the user.
   */
  getSummary(): string {
    throw new Error('getSummary: Should this be a list of lines + observations? Themes? Trade-offs observed?');
  }

  /**
   * Is the session still active?
   * What ends a session? User hits stop? End of file? Timeout?
   */
  end(): void {
    throw new Error('end: Should ending a session persist immediately? Or wait for explicit save?');
  }
}
