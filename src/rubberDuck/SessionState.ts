import { ConversationEntry } from './storage';

/**
 * Complete state of a rubber duck session.
 * What does a session need to track in memory?
 */
export type SessionState = {
  filePath: string;
  currentLineNum: number;           // 1-indexed
  totalLines: number;
  isActive: boolean;
  conversationHistory: ConversationEntry[];
  fileContentHash: string;          // To detect file changes
  startedAt: Date;
};

/**
 * Create a new session state.
 * Start at line 0, empty history, fresh start.
 */
export function createSessionState(
  filePath: string,
  totalLines: number,
  fileContentHash: string
): SessionState {
  return {
    filePath,
    currentLineNum: 0,
    totalLines,
    isActive: true,
    conversationHistory: [],
    fileContentHash,
    startedAt: new Date(),
  };
}

/**
 * Move to the next line.
 * Throws if at EOF.
 */
export function nextLine(state: SessionState): SessionState {
  if (state.currentLineNum >= state.totalLines) {
    throw new Error(
      `nextLine: Already at EOF (line ${state.currentLineNum} of ${state.totalLines}). ` +
      `Session should offer summary and stop.`
    );
  }

  return {
    ...state,
    currentLineNum: state.currentLineNum + 1,
  };
}

/**
 * Go back to the previous line.
 * Throws if at line 0.
 */
export function previousLine(state: SessionState): SessionState {
  if (state.currentLineNum <= 0) {
    throw new Error(
      `previousLine: Already at start (line 0). Cannot go back further.`
    );
  }

  return {
    ...state,
    currentLineNum: state.currentLineNum - 1,
  };
}

/**
 * Jump to a specific line number.
 * Throws if out of bounds.
 */
export function jumpToLine(state: SessionState, lineNum: number): SessionState {
  if (lineNum < 0 || lineNum > state.totalLines) {
    throw new Error(
      `jumpToLine: Line ${lineNum} is out of bounds (0..${state.totalLines}).`
    );
  }

  return {
    ...state,
    currentLineNum: lineNum,
  };
}

/**
 * Is this line already in the conversation?
 */
export function hasLineBeenCovered(state: SessionState, lineNum: number): boolean {
  return state.conversationHistory.some(entry => entry.lineNum === lineNum);
}

/**
 * Add a conversation entry to the history.
 * Validates entry, throws if invalid.
 */
export function addEntry(state: SessionState, entry: ConversationEntry): SessionState {
  // Basic validation
  if (!entry || entry.lineNum == null || !entry.duck || !entry.lineContent) {
    throw new Error(
      `addEntry: Entry missing required fields. Need: lineNum, lineContent, duck, userResponse.`
    );
  }

  return {
    ...state,
    conversationHistory: [...state.conversationHistory, entry],
  };
}

/**
 * Summarize what we've covered so far.
 */
export function getSummary(
  state: SessionState
): { linesVisited: Set<number>; coverage: number; observations: string[] } {
  const linesVisited = new Set(state.conversationHistory.map(e => e.lineNum));
  const coverage = state.totalLines > 0 ? (linesVisited.size / state.totalLines) * 100 : 0;
  const observations = state.conversationHistory.map(e => `Line ${e.lineNum}: ${e.duck}`);

  return {
    linesVisited,
    coverage: Math.round(coverage),
    observations,
  };
}

/**
 * Mark the session as ended.
 */
export function endSession(state: SessionState): SessionState {
  return {
    ...state,
    isActive: false,
  };
}

/**
 * Load previous conversation history into session state.
 * Resume from the last visited line (if unchanged).
 */
export function loadHistory(
  state: SessionState,
  history: ConversationEntry[]
): SessionState {
  if (!history || history.length === 0) {
    return state;
  }

  // Resume from the last line in history
  const lastEntry = history[history.length - 1];
  const resumeLineNum = lastEntry.lineNum;

  return {
    ...state,
    conversationHistory: history,
    currentLineNum: resumeLineNum,
  };
}
