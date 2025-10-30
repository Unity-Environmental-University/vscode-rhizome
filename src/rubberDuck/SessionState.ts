import { InferFromUsage } from "@decohere/ts-decohere";


/**
 * A single turn in the conversation.
 * Line-by-line discussion between user and duck.
 */
export type ConversationEntry = InferFromUsage<Record<string, any>>;

/**
 * What the UI needs to show for one line.
 */
export interface ConvoEntryUiView {
  lineText: string;
  lineNum: number;  // 1-indexed
  lineConversation: ConversationEntry[];
}

/**
 * What we store. We reconstruct line numbers from content.
 */
export interface ConvoEntryStorageView {
  lineText: string;
  lineConversation: ConversationEntry[];
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SESSIONSTATE: A single rubber duck debugging session record
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * User perspective:
 * - I start debugging a file at 2:30pm
 * - I walk through lines 5-12, have a conversation with the duck
 * - I close the session at 2:45pm
 * - Later, I can resume that exact session or start fresh
 *
 * Key insight: Not "the active session". A session is a record.
 * There can be many per file. Current one has endedAt: null.
 *
 * Q: Should endedAt be null or a date?
 * A: null = session ongoing. Date = session archived.
 *    Lets you query: which sessions did I have on file X?
 */
export type SessionState = {
  sessionId: string;                // Unique ID for this session
  filePath: string;
  startedAt: Date;
  endedAt: Date | null;             // null = session ongoing
  currentLineNum: number;            // 1-indexed, runtime only
  totalLines: number;
  conversationHistory: ConversationEntry[];
  fileContentHashAtStart: string;   // To detect file changes
};

/**
 * Create a new session state.
 * Initial state: line 0, empty history, session ongoing.
 */
export function createSessionState(
  filePath: string,
  totalLines: number,
  fileContentHash: string
): SessionState {
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  return {
    sessionId,
    filePath,
    startedAt: new Date(),
    endedAt: null,
    currentLineNum: 0,
    totalLines,
    conversationHistory: [],
    fileContentHashAtStart: fileContentHash,
  };
}

// Stubs for remaining functions (to be implemented)
export function nextLine(state: SessionState): SessionState {
  throw new Error(`nextLine: not implemented`);
}

export function previousLine(state: SessionState): SessionState {
  throw new Error(`previousLine: not implemented`);
}

export function jumpToLine(state: SessionState, lineNum: number): SessionState {
  throw new Error(`jumpToLine: not implemented`);
}

export function addEntry(state: SessionState, entry: ConversationEntry): SessionState {
  throw new Error(`addEntry: not implemented`);
}

export function hasLineBeenCovered(state: SessionState, lineNum: number): boolean {
  throw new Error(`hasLineBeenCovered: not implemented`);
}

export function getSummary(state: SessionState): { linesVisited: Set<number>; coverage: number; observations: string[] } {
  throw new Error(`getSummary: not implemented`);
}

export function endSession(state: SessionState): SessionState {
  throw new Error(`endSession: not implemented`);
}

export function loadHistory(state: SessionState, history: ConversationEntry[]): SessionState {
  throw new Error(`loadHistory: not implemented`);
}
