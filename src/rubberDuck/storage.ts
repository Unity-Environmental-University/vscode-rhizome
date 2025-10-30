import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════
// Configuration: Centralized paths and constants
// If you change these, rubber duck storage paths change everywhere
// ═══════════════════════════════════════════════════════════════

/** Root directory for all rubber duck state */
export const RUBBER_DUCK_STATE_DIR = '.rhizome/vscodestate/rubber';

/** File extension for active sessions */
export const RUBBER_DUCK_FILE_EXT = '.rubber.jsonl';

/** File extension for archived sessions */
export const RUBBER_DUCK_ARCHIVE_EXT = '.rubber.archived.jsonl';

/** Hash length for path hashing (avoid collisions) */
export const PATH_HASH_LENGTH = 6;

/** Hash length for line hashing (survives small edits) */
export const LINE_HASH_LENGTH = 12;

/** Line content truncation for hashing (survives small refactors) */
export const LINE_HASH_CONTENT_LENGTH = 80;

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
 * Pure I/O layer for rubber duck conversation persistence.
 *
 * Philosophy: Just do JSONL read/write. Throw hard on errors.
 * No logging, no output channels, no fancy recovery.
 * Session layer decides what to do with errors and communicates to user.
 *
 * Storage format: JSONL in .rhizome/vscodestate/rubber/
 * - One entry per line
 * - Append-only (no full rewrites)
 * - Stream-friendly for long interactive sessions
 */
export class RubberDuckStorage {
  private workspaceRoot: string;
  private rubberDuckDir: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.rubberDuckDir = path.join(workspaceRoot, RUBBER_DUCK_STATE_DIR);
  }

  /**
   * Given a file path, where should we store its rubber duck session?
   *
   * Decision: Base filename + hash of full path
   * - Preserves directory context (you know which file)
   * - Avoids collisions (hash makes it unique)
   * - Example: src/extension.ts → extension-abc123.rubber.jsonl
   */
  private getStoragePath(filePath: string): string {
    const relativePath = path.relative(this.workspaceRoot, filePath);
    const basename = path.basename(filePath, path.extname(filePath));

    // Hash the full relative path to avoid collisions
    const pathHash = crypto
      .createHash('sha256')
      .update(relativePath)
      .digest('hex')
      .substring(0, PATH_HASH_LENGTH);

    const filename = `${basename}-${pathHash}${RUBBER_DUCK_FILE_EXT}`;
    return path.join(this.rubberDuckDir, filename);
  }

  /**
   * Content changes, but we want to track which line we were on.
   *
   * Decision: SHA256 of first 80 chars + line number
   * - Survives small edits (refactoring variable names)
   * - Deterministic (same content = same hash)
   * - Line number adds context for nearby duplicates
   */
  private hashLine(content: string, lineNum: number): string {
    const trimmed = content.substring(0, LINE_HASH_CONTENT_LENGTH);
    const contentHash = crypto.createHash('sha256').update(trimmed).digest('hex');
    // Combine content hash + line number for resilience
    return crypto
      .createHash('sha256')
      .update(`${contentHash}:${lineNum}`)
      .digest('hex')
      .substring(0, LINE_HASH_LENGTH);
  }

  /**
   * Load the entire conversation history for a file from JSONL.
   *
   * Behavior:
   * - File doesn't exist: return [] (first session, totally normal)
   * - File exists, valid JSONL: parse and return entries
   * - File exists, malformed JSONL: throw (corruption detected)
   * - Read fails: throw (permissions, disk error, etc)
   */
  async loadSession(filePath: string): Promise<ConversationEntry[]> {
    const storagePath = this.getStoragePath(filePath);

    // First session: file doesn't exist yet. Normal.
    if (!fs.existsSync(storagePath)) {
      return [];
    }

    // Read file. If it fails, throw hard.
    const content = fs.readFileSync(storagePath, 'utf-8');

    // Parse JSONL. Each line must be valid JSON.
    const lines = content.trim().split('\n').filter(line => line.length > 0);
    const entries: ConversationEntry[] = [];

    for (const line of lines) {
      let entry: ConversationEntry;
      try {
        entry = JSON.parse(line) as ConversationEntry;
      } catch (parseError) {
        throw new Error(`Malformed JSON in conversation entry (${storagePath}): ${line.substring(0, 50)}`);
      }

      // Validate shape
      if (!this.isValidEntry(entry)) {
        throw new Error(`Malformed conversation entry in ${storagePath}: missing required fields in ${line.substring(0, 50)}`);
      }
      entries.push(entry);
    }

    return entries;
  }

  /**
   * Add a new entry to the conversation log.
   *
   * Behavior:
   * - Validates entry shape (throws if invalid)
   * - Auto-creates .rhizome/vscodestate/rubber/ if needed
   * - Appends JSONL line (no full rewrite)
   * - Throws if write fails
   */
  async appendEntry(
    filePath: string,
    lineNum: number,
    lineContent: string,
    duck: string,
    userResponse: string
  ): Promise<void> {
    // Compute line hash
    const lineHash = this.hashLine(lineContent, lineNum);

    // Create full entry
    const entry: ConversationEntry = {
      lineNum,
      lineHash,
      lineContent,
      duck,
      userResponse,
      timestamp: new Date().toISOString()
    };

    const storagePath = this.getStoragePath(filePath);
    const storageDir = path.dirname(storagePath);

    // Auto-create directory if needed
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    // Append JSONL line. If it fails, throw.
    const jsonLine = JSON.stringify(entry) + '\n';
    fs.appendFileSync(storagePath, jsonLine);
  }

  /**
   * If a session has no entries, delete the file to keep storage clean.
   *
   * Behavior:
   * - File doesn't exist: no-op
   * - File is empty: delete it
   * - Delete fails: throw
   */
  async deleteSessionIfEmpty(filePath: string): Promise<void> {
    const storagePath = this.getStoragePath(filePath);

    if (!fs.existsSync(storagePath)) {
      return; // Already doesn't exist
    }

    const entries = await this.loadSession(filePath);
    if (entries.length === 0) {
      fs.unlinkSync(storagePath);
    }
  }

  /**
   * List all active rubber duck sessions in the workspace.
   *
   * Returns: filename, last modified date, entry count
   * Throws if directory read fails.
   */
  async listActiveSessions(): Promise<{ file: string; lastModified: Date; entryCount: number }[]> {
    const sessions: { file: string; lastModified: Date; entryCount: number }[] = [];

    if (!fs.existsSync(this.rubberDuckDir)) {
      return sessions;
    }

    const files = fs.readdirSync(this.rubberDuckDir).filter(f => f.endsWith(RUBBER_DUCK_FILE_EXT));

    for (const file of files) {
      const filePath = path.join(this.rubberDuckDir, file);
      const stat = fs.statSync(filePath);

      const content = fs.readFileSync(filePath, 'utf-8');
      const lineCount = content.trim().split('\n').filter(l => l.length > 0).length;

      sessions.push({
        file: file,
        lastModified: stat.mtime,
        entryCount: lineCount
      });
    }

    return sessions;
  }

  /**
   * Archive a session (rename with .archived suffix).
   *
   * Example: extension-abc123.rubber.jsonl → extension-abc123.rubber.archived.jsonl
   *
   * Behavior:
   * - File doesn't exist: no-op
   * - Rename fails: throw
   */
  async archiveSession(filePath: string): Promise<void> {
    const storagePath = this.getStoragePath(filePath);

    if (!fs.existsSync(storagePath)) {
      return; // Nothing to archive
    }

    const archivedPath = storagePath.replace(RUBBER_DUCK_FILE_EXT, RUBBER_DUCK_ARCHIVE_EXT);
    fs.renameSync(storagePath, archivedPath);
  }

  /**
   * Validate that an entry has all required fields.
   *
   * Teaching moment: When should validation be strict vs lenient?
   * Here: strict (all fields required) because malformed entries corrupt history.
   */
  private isValidEntry(entry: any): entry is ConversationEntry {
    return (
      typeof entry.lineNum === 'number' &&
      typeof entry.lineHash === 'string' &&
      typeof entry.lineContent === 'string' &&
      typeof entry.duck === 'string' &&
      typeof entry.userResponse === 'string' &&
      typeof entry.timestamp === 'string'
    );
  }
}
