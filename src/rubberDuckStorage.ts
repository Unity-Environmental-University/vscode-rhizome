import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as vscode from 'vscode';

/**
 * What does a single conversation turn look like?
 * Line number, the code, what the duck said, what the user said, when.
 */
export interface ConversationEntry {
  lineNum: number;
  lineHash: string;
  lineContent: string;
  duck: string;
  userResponse: string;
  timestamp: string;
}

/**
 * How should we store and retrieve rubber duck conversations?
 * JSONL format: one entry per line, append-only, stream-friendly.
 */
export class RubberDuckStorage {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Given a file path, where should we store its rubber duck session?
   * What's a good naming convention that survives path separators?
   */
  private getStoragePath(filePath: string): string {
    throw new Error('getStoragePath: How do you normalize a file path to a safe storage name?');
  }

  /**
   * Content changes, but we want to track which line we were on.
   * How should we hash the line content so it survives small edits?
   */
  private hashLine(content: string): string {
    throw new Error('hashLine: Should we use SHA256? First 50 chars + line number? What survives refactoring?');
  }

  /**
   * Load the entire conversation history for a file from JSONL.
   * What if the file doesn't exist (first session)? What if it's malformed?
   */
  async loadSession(filePath: string): Promise<ConversationEntry[]> {
    throw new Error('loadSession: How do you read JSONL efficiently? One line at a time?');
  }

  /**
   * Add a new entry to the conversation log.
   * Should we validate the entry before appending? What if write fails?
   */
  async appendEntry(filePath: string, entry: ConversationEntry): Promise<void> {
    throw new Error('appendEntry: How do you append to JSONL without rewriting the file?');
  }

  /**
   * If a session has no entries, should we clean it up?
   * Or keep empty files for reference?
   */
  async deleteSessionIfEmpty(filePath: string): Promise<void> {
    throw new Error('deleteSessionIfEmpty: What counts as "empty"? Zero entries? Should we warn first?');
  }

  /**
   * List all active rubber duck sessions in the workspace.
   * What formats should we return? Filenames? Metadata?
   */
  async listActiveSessions(): Promise<{ file: string; lastModified: Date; entryCount: number }[]> {
    throw new Error('listActiveSessions: How do you discover all .rubber.jsonl files? Should you cache this?');
  }

  /**
   * Archive a session (move it somewhere, rename it, mark it stale)?
   * What does "archiving" mean in this context?
   */
  async archiveSession(filePath: string): Promise<void> {
    throw new Error('archiveSession: Should archived sessions be viewable? How long should they persist?');
  }
}
