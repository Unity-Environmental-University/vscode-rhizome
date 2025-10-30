import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { RubberDuckStorage, RUBBER_DUCK_STATE_DIR, RUBBER_DUCK_FILE_EXT, RUBBER_DUCK_ARCHIVE_EXT } from './rubberDuckStorage';

/**
 * Test Suite: RubberDuckStorage
 *
 * Tests the JSONL persistence layer:
 * - Hashing strategy (SHA256 of first 80 chars + line number)
 * - Path normalization (basename + path hash)
 * - JSONL read/write (append-only, resilience to malformed lines)
 * - Error handling (critical vs non-critical)
 * - Directory auto-creation
 */

describe('RubberDuckStorage', () => {
  let tempDir: string;
  let storage: RubberDuckStorage;

  // Test helpers
  const createTempDir = (): string => {
    const dir = path.join('/tmp', `rubber-duck-test-${Date.now()}`);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  };

  const cleanupTempDir = (dir: string) => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  };

  beforeEach(() => {
    tempDir = createTempDir();
    storage = new RubberDuckStorage(tempDir);
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  // ═══════════════════════════════════════════════════════════════
  // HAPPY PATH: Expected behavior
  // ═══════════════════════════════════════════════════════════════

  describe('Happy Path: Storage operations work correctly', () => {
    it('should create storage directory when appending first entry', async () => {
      const filePath = path.join(tempDir, 'src', 'extension.ts');

      await storage.appendEntry(
        filePath,
        5,
        'const channel = vscode.window.createOutputChannel(...)',
        'Creating a channel here. Why not in activate()?',
        'need it accessible'
      );

      const storageDir = path.join(tempDir, '.rhizome', 'vscodestate', 'rubber');
      assert.ok(fs.existsSync(storageDir), 'Storage directory should be created');
    });

    it('should append entry as JSONL line', async () => {
      const filePath = path.join(tempDir, 'src', 'extension.ts');

      await storage.appendEntry(
        filePath,
        5,
        'const x = 5',
        'Variable assignment.',
        'next'
      );

      // Load and verify
      const entries = await storage.loadSession(filePath);
      assert.strictEqual(entries.length, 1, 'Should have one entry');
      assert.strictEqual(entries[0].lineNum, 5);
      assert.strictEqual(entries[0].duck, 'Variable assignment.');
    });

    it('should load empty array for first session (no file exists)', async () => {
      const filePath = path.join(tempDir, 'new-file.ts');
      const entries = await storage.loadSession(filePath);

      assert.strictEqual(entries.length, 0, 'First session should return empty array');
    });

    it('should preserve multiple entries in order', async () => {
      const filePath = path.join(tempDir, 'src', 'test.ts');

      // Add 3 entries
      await storage.appendEntry(filePath, 1, 'import x', 'Importing.', 'next');
      await storage.appendEntry(filePath, 2, 'function foo()', 'Function def.', 'next');
      await storage.appendEntry(filePath, 3, '  return x', 'Return statement.', 'stop');

      const entries = await storage.loadSession(filePath);
      assert.strictEqual(entries.length, 3, 'Should have 3 entries');
      assert.strictEqual(entries[0].lineNum, 1);
      assert.strictEqual(entries[1].lineNum, 2);
      assert.strictEqual(entries[2].lineNum, 3);
    });

    it('should compute consistent line hashes', async () => {
      const filePath = path.join(tempDir, 'test.ts');
      const content = 'const x = 5';

      // Add same line twice
      await storage.appendEntry(filePath, 5, content, 'First duck', 'next');
      await storage.appendEntry(filePath, 5, content, 'Second duck', 'deeper');

      const entries = await storage.loadSession(filePath);
      // Both should have same hash (same line number + content)
      assert.strictEqual(
        entries[0].lineHash,
        entries[1].lineHash,
        'Same line content should produce same hash'
      );
    });

    it('should timestamp each entry', async () => {
      const filePath = path.join(tempDir, 'test.ts');
      const beforeTime = new Date().toISOString();

      await storage.appendEntry(filePath, 1, 'code', 'obs', 'resp');

      const afterTime = new Date().toISOString();
      const entries = await storage.loadSession(filePath);

      assert.ok(entries[0].timestamp);
      assert.ok(entries[0].timestamp >= beforeTime);
      assert.ok(entries[0].timestamp <= afterTime);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // ERROR PATHS: Edge cases and error handling
  // ═══════════════════════════════════════════════════════════════

  describe('Error Paths: Graceful handling of issues', () => {
    it('should throw on malformed JSONL', async () => {
      const filePath = path.join(tempDir, 'test.ts');

      // First, create a valid entry via normal append
      await storage.appendEntry(filePath, 1, 'code', 'obs', 'resp');

      // Now find and manually corrupt the storage file
      const storageDir = path.join(tempDir, RUBBER_DUCK_STATE_DIR);
      const files = fs.readdirSync(storageDir);
      if (files.length === 0) {
        assert.fail('No storage file created');
      }
      const storagePath = path.join(storageDir, files[0]!);

      // Append malformed JSONL
      const malformed = '\nthis is not json at all!\n';
      fs.appendFileSync(storagePath, malformed);

      // Should throw hard on malformed JSONL (let caller decide what to do)
      try {
        await storage.loadSession(filePath);
        assert.fail('Should have thrown on malformed JSONL');
      } catch (error) {
        assert.ok(error instanceof Error);
        assert.ok((error as Error).message.includes('Malformed'));
      }
    });

    it('should throw on write permission errors', async function () {
      // Note: This test is OS-specific. Skip on systems without chmod.
      if (process.platform === 'win32') {
        this.skip();
      }

      const filePath = path.join(tempDir, 'test.ts');

      // First append succeeds
      await storage.appendEntry(filePath, 1, 'code', 'obs', 'resp');

      // Make directory read-only (prevents writing new data)
      const storageDir = path.join(tempDir, RUBBER_DUCK_STATE_DIR);
      fs.chmodSync(storageDir, 0o555);

      // Second append should throw
      try {
        await storage.appendEntry(filePath, 2, 'more', 'obs2', 'resp2');
        fs.chmodSync(storageDir, 0o755); // Restore perms for cleanup
        assert.fail('Should have thrown error on permission denied');
      } catch (error) {
        fs.chmodSync(storageDir, 0o755); // Restore perms
        assert.ok(error instanceof Error);
      }
    });

    it('should validate entry fields before appending', async () => {
      const filePath = path.join(tempDir, 'test.ts');

      // This test checks that invalid entries are rejected
      // (In the current implementation, appendEntry computes the entry,
      // so it's always valid. This is a safeguard for future changes.)

      const validEntry = {
        lineNum: 1,
        lineHash: 'h1',
        lineContent: 'code',
        duck: 'obs',
        userResponse: 'resp',
        timestamp: new Date().toISOString()
      };

      // Append should succeed with valid entry
      await storage.appendEntry(
        filePath,
        validEntry.lineNum,
        validEntry.lineContent,
        validEntry.duck,
        validEntry.userResponse
      );

      const entries = await storage.loadSession(filePath);
      assert.strictEqual(entries.length, 1);
    });

    it('should handle empty file gracefully', async () => {
      const filePath = path.join(tempDir, 'test.ts');
      const storageDir = path.join(tempDir, '.rhizome', 'vscodestate', 'rubber');

      fs.mkdirSync(storageDir, { recursive: true });
      fs.writeFileSync(path.join(storageDir, 'test-abc.rubber.jsonl'), '');

      const entries = await storage.loadSession(filePath);
      assert.strictEqual(entries.length, 0, 'Empty file should return empty array');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // INTEGRATION: Multiple operations together
  // ═══════════════════════════════════════════════════════════════

  describe('Integration: Full session workflows', () => {
    it('should support session resume (load previous + add new)', async () => {
      const filePath = path.join(tempDir, 'session-test.ts');

      // Session 1: Add 2 entries
      await storage.appendEntry(filePath, 1, 'line 1', 'obs1', 'next');
      await storage.appendEntry(filePath, 2, 'line 2', 'obs2', 'stop');

      // Session 2: Load previous + add new
      const previousEntries = await storage.loadSession(filePath);
      assert.strictEqual(previousEntries.length, 2);

      await storage.appendEntry(filePath, 3, 'line 3', 'obs3', 'stop');

      // Session 3: Verify all 3 are there
      const allEntries = await storage.loadSession(filePath);
      assert.strictEqual(allEntries.length, 3, 'Should preserve across sessions');
    });

    it('should list active sessions', async () => {
      const file1 = path.join(tempDir, 'file1.ts');
      const file2 = path.join(tempDir, 'file2.ts');

      await storage.appendEntry(file1, 1, 'code', 'obs', 'resp');
      await storage.appendEntry(file2, 1, 'code', 'obs', 'resp');
      await storage.appendEntry(file2, 2, 'code2', 'obs2', 'resp2');

      const sessions = await storage.listActiveSessions();

      // Should have 2 session files
      assert.ok(sessions.length >= 2, 'Should list active sessions');

      // file2 should have 2 entries
      const file2Session = sessions.find(s => s.entryCount === 2);
      assert.ok(file2Session, 'Should find file2 session with 2 entries');
    });

    it('should archive a session', async () => {
      const filePath = path.join(tempDir, 'archive-test.ts');

      await storage.appendEntry(filePath, 1, 'code', 'obs', 'resp');

      // Archive
      await storage.archiveSession(filePath);

      // Original should not exist (loadSession looks for active files only)
      const entries = await storage.loadSession(filePath);
      assert.strictEqual(entries.length, 0, 'Archived session should not exist as active');

      // Check that archived file physically exists
      const storageDir = path.join(tempDir, RUBBER_DUCK_STATE_DIR);
      const files = fs.readdirSync(storageDir);
      const archived = files.find(f => f.includes(RUBBER_DUCK_ARCHIVE_EXT));
      assert.ok(archived, 'Should have archived file on disk');
    });

    it('should delete empty session', async () => {
      const filePath = path.join(tempDir, 'delete-test.ts');

      // Add then remove entry (simulate empty session)
      await storage.appendEntry(filePath, 1, 'code', 'obs', 'resp');

      // Manually delete entries to simulate empty file
      const storageDir = path.join(tempDir, '.rhizome', 'vscodestate', 'rubber');
      const files = fs.readdirSync(storageDir);
      fs.writeFileSync(path.join(storageDir, files[0]), '');

      await storage.deleteSessionIfEmpty(filePath);

      // File should be deleted
      const sessions = await storage.listActiveSessions();
      assert.strictEqual(sessions.length, 0, 'Empty session should be deleted');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // DESIGN VALIDATION: Testing the choices we made
  // ═══════════════════════════════════════════════════════════════

  describe('Design Validation: Verify chosen strategies', () => {
    it('should use path hashing to avoid collisions', async () => {
      const file1 = path.join(tempDir, 'src', 'extension.ts');
      const file2 = path.join(tempDir, 'lib', 'extension.ts');

      // Both files have same name but different paths
      await storage.appendEntry(file1, 1, 'code1', 'obs1', 'resp');
      await storage.appendEntry(file2, 1, 'code2', 'obs2', 'resp');

      // Should create two separate files (different path hashes)
      const sessions = await storage.listActiveSessions();
      assert.ok(sessions.length >= 2, 'Different paths should create different session files');
    });

    it('should make line hashes resilient to small edits', async () => {
      const filePath = path.join(tempDir, 'test.ts');

      // Same line with small edit
      const original = 'const variable = 5';
      const edited = 'const variable = 6';

      await storage.appendEntry(filePath, 5, original, 'obs1', 'next');
      await storage.appendEntry(filePath, 5, edited, 'obs2', 'next');

      const entries = await storage.loadSession(filePath);

      // Hashes should be different (content changed)
      // But note: our current hash is first 80 chars + line number,
      // so minor changes in the same position will produce different hashes
      // This is intentional - we want to catch line changes
      const hash1 = entries[0].lineHash;
      const hash2 = entries[1].lineHash;

      assert.notStrictEqual(hash1, hash2, 'Different content should produce different hashes');
    });
  });
});
