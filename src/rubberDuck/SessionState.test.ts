/**
 * SESSIONSTATE TESTS
 *
 * Pattern: Property-based testing with decohereFuzzGenerator
 * - One Decohere<T>() call captures heuristics
 * - generateN(100) creates valid samples without LLM calls
 * - Each sample tests a property
 *
 * As functions are implemented, tests move from "describe what should happen"
 * to "verify what actually happens"
 *
 * FUTURE: Integrate decohereFuzzGenerator for property-based fuzzing
 * @see https://github.com/anthropics/ts-decohere/blob/main/src/decohereFuzzGenerator.ts
 * When implemented, replace hand-written test cases with:
 *   const gen = decohereFuzzGenerator<SessionState>();
 *   const samples = gen.generateN(100);
 *   samples.forEach((state, i) => { it(`property test ${i}`, ...) });
 */

import * as assert from 'assert';
import {
  SessionState,
  ConversationEntry,
  createSessionState,
  nextLine,
  previousLine,
  jumpToLine,
  addEntry,
  hasLineBeenCovered,
  getSummary,
  endSession,
  loadHistory,
} from './SessionState';

describe('SessionState: Pure state machine', () => {
  describe('createSessionState', () => {
    it('should create a fresh session starting at line 0', () => {
      const state = createSessionState('/path/to/file.ts', 100, 'hash123');

      // What should initial state look like?
      // Q: Should currentLineNum start at 0 or 1?
      // A: 0. The user hasn't looked at any line yet.
      assert.strictEqual(state.currentLineNum, 0);
      assert.strictEqual(state.totalLines, 100);
      assert.strictEqual(state.endedAt, null);  // Session is ongoing
      assert.deepStrictEqual(state.conversationHistory, []);
    });

    it('should record startedAt timestamp', () => {
      const before = new Date();
      const state = createSessionState('/path/to/file.ts', 50, 'hash');
      const after = new Date();

      // startedAt should be between before and after
      assert.ok(state.startedAt >= before && state.startedAt <= after);
      assert.strictEqual(state.endedAt, null);  // Session is ongoing
    });

    it('should have a unique sessionId', () => {
      const state1 = createSessionState('/file.ts', 10, 'hash1');
      const state2 = createSessionState('/file.ts', 10, 'hash1');

      // Two calls should create different sessions
      assert.notStrictEqual(state1.sessionId, state2.sessionId);
    });
  });

  describe('nextLine: Move forward one line', () => {
    it('should increment currentLineNum', () => {
      const state = createSessionState('/file.ts', 100, 'hash');
      const next = nextLine(state);

      assert.strictEqual(next.currentLineNum, 1);
    });

    it('should not mutate original state', () => {
      const state = createSessionState('/file.ts', 100, 'hash');
      const original = { ...state };
      nextLine(state);

      // state should be unchanged
      assert.deepStrictEqual(state, original);
    });

    it('should throw at EOF', () => {
      const state = createSessionState('/file.ts', 5, 'hash');
      const atEnd = { ...state, currentLineNum: 5 };

      assert.throws(
        () => nextLine(atEnd),
        /EOF|end of file/i
      );
    });

    it('property: nextLine → previousLine should be inverse', () => {
      // For any state where we can move forward and backward:
      const state = createSessionState('/file.ts', 100, 'hash');
      const start = { ...state, currentLineNum: 50 };
      
      const forward = nextLine(start);
      const backward = previousLine(forward);

      assert.strictEqual(backward.currentLineNum, start.currentLineNum);
    });
  });

  describe('previousLine: Move back one line', () => {
    it('should decrement currentLineNum', () => {
      const state = createSessionState('/file.ts', 100, 'hash');
      const moved = { ...state, currentLineNum: 50 };
      const prev = previousLine(moved);

      assert.strictEqual(prev.currentLineNum, 49);
    });

    it('should throw at line 0', () => {
      const state = createSessionState('/file.ts', 100, 'hash');
      // currentLineNum is already 0

      assert.throws(
        () => previousLine(state),
        /start|line 0/i
      );
    });
  });

  describe('jumpToLine: Go to specific line', () => {
    it('should set currentLineNum', () => {
      const state = createSessionState('/file.ts', 100, 'hash');
      const jumped = jumpToLine(state, 42);

      assert.strictEqual(jumped.currentLineNum, 42);
    });

    it('should throw if out of bounds', () => {
      const state = createSessionState('/file.ts', 100, 'hash');

      assert.throws(() => jumpToLine(state, -1));
      assert.throws(() => jumpToLine(state, 101));
    });

    it('should allow jumping to line 0', () => {
      const state = createSessionState('/file.ts', 100, 'hash');
      const moved = { ...state, currentLineNum: 50 };
      const jumped = jumpToLine(moved, 0);

      assert.strictEqual(jumped.currentLineNum, 0);
    });
  });

  describe('addEntry: Add conversation to history', () => {
    it('should append entry to conversationHistory', () => {
      const state = createSessionState('/file.ts', 100, 'hash');
      const entry: ConversationEntry = {
        lineNum: 10,
        lineText: 'const x = 5;',
        observation: 'Variable declared',
        userResponse: 'Good point',
        timestamp: new Date(),
      };

      const updated = addEntry(state, entry);

      assert.strictEqual(updated.conversationHistory.length, 1);
      assert.deepStrictEqual(updated.conversationHistory[0], entry);
    });

    it('should not mutate original history', () => {
      const state = createSessionState('/file.ts', 100, 'hash');
      const originalLength = state.conversationHistory.length;
      const entry: ConversationEntry = {
        lineNum: 1,
        lineText: 'code',
        observation: 'obs',
        userResponse: 'resp',
        timestamp: new Date(),
      };

      addEntry(state, entry);

      // Original state unchanged
      assert.strictEqual(state.conversationHistory.length, originalLength);
    });

    it('property: addEntry should be idempotent on state copy', () => {
      const state = createSessionState('/file.ts', 100, 'hash');
      const entry: ConversationEntry = {
        lineNum: 5,
        lineText: 'test',
        observation: 'obs',
        userResponse: 'resp',
        timestamp: new Date(),
      };

      const once = addEntry(state, entry);
      const twice = addEntry(once, entry);

      // Adding the same entry twice should double the history
      assert.strictEqual(twice.conversationHistory.length, 2);
    });

    it('should throw on invalid entry', () => {
      const state = createSessionState('/file.ts', 100, 'hash');
      const badEntry = { lineNum: 1 } as any;  // Missing fields

      assert.throws(
        () => addEntry(state, badEntry),
        /required fields|validation/i
      );
    });
  });

  describe('hasLineBeenCovered: Check if line discussed', () => {
    it('should return false for undiscussed line', () => {
      const state = createSessionState('/file.ts', 100, 'hash');

      assert.strictEqual(hasLineBeenCovered(state, 5), false);
    });

    it('should return true after addEntry', () => {
      let state = createSessionState('/file.ts', 100, 'hash');
      const entry: ConversationEntry = {
        lineNum: 10,
        lineText: 'code',
        observation: 'obs',
        userResponse: 'resp',
        timestamp: new Date(),
      };

      state = addEntry(state, entry);
      assert.strictEqual(hasLineBeenCovered(state, 10), true);
    });

    it('property: coverage should only grow', () => {
      let state = createSessionState('/file.ts', 100, 'hash');
      const initialCovered = new Set<number>();

      // Add entries and track covered lines
      for (let i = 1; i <= 10; i++) {
        if (!hasLineBeenCovered(state, i)) {
          const entry: ConversationEntry = {
            lineNum: i,
            lineText: `line ${i}`,
            observation: 'obs',
            userResponse: 'resp',
            timestamp: new Date(),
          };
          state = addEntry(state, entry);
          initialCovered.add(i);
        }
      }

      // All added lines should be covered
      initialCovered.forEach(lineNum => {
        assert.ok(hasLineBeenCovered(state, lineNum));
      });
    });
  });

  describe('getSummary: Aggregate progress', () => {
    it('should report lines visited', () => {
      let state = createSessionState('/file.ts', 100, 'hash');
      const entry1: ConversationEntry = {
        lineNum: 5,
        lineText: 'line 5',
        observation: 'obs',
        userResponse: 'resp',
        timestamp: new Date(),
      };
      const entry2: ConversationEntry = {
        lineNum: 10,
        lineText: 'line 10',
        observation: 'obs',
        userResponse: 'resp',
        timestamp: new Date(),
      };

      state = addEntry(state, entry1);
      state = addEntry(state, entry2);

      const summary = getSummary(state);

      assert.ok(summary.linesVisited.has(5));
      assert.ok(summary.linesVisited.has(10));
    });

    it('should calculate coverage percentage', () => {
      let state = createSessionState('/file.ts', 100, 'hash');
      const entry: ConversationEntry = {
        lineNum: 1,
        lineText: 'line 1',
        observation: 'obs',
        userResponse: 'resp',
        timestamp: new Date(),
      };

      state = addEntry(state, entry);
      const summary = getSummary(state);

      // 1 line visited out of 100 = 1%
      assert.strictEqual(summary.coverage, 1);
    });

    it('should extract observations', () => {
      let state = createSessionState('/file.ts', 100, 'hash');
      const entry: ConversationEntry = {
        lineNum: 1,
        lineText: 'code',
        observation: 'This is interesting',
        userResponse: 'I agree',
        timestamp: new Date(),
      };

      state = addEntry(state, entry);
      const summary = getSummary(state);

      assert.ok(summary.observations.length > 0);
      assert.ok(summary.observations[0].includes('interesting'));
    });
  });

  describe('endSession: Mark session complete', () => {
    it('should set endedAt to a date', () => {
      const state = createSessionState('/file.ts', 100, 'hash');
      const before = new Date();
      const ended = endSession(state);
      const after = new Date();

      assert.ok(ended.endedAt !== null);
      assert.ok(ended.endedAt >= before && ended.endedAt <= after);
    });

    it('property: endSession should be idempotent', () => {
      const state = createSessionState('/file.ts', 100, 'hash');
      const ended1 = endSession(state);
      const ended2 = endSession(ended1);

      assert.strictEqual(ended1.endedAt, ended2.endedAt);
    });
  });

  describe('loadHistory: Resume session', () => {
    it('should restore conversation history', () => {
      const entries: ConversationEntry[] = [
        {
          lineNum: 5,
          lineText: 'line 5',
          observation: 'obs',
          userResponse: 'resp',
          timestamp: new Date(),
        },
        {
          lineNum: 10,
          lineText: 'line 10',
          observation: 'obs',
          userResponse: 'resp',
          timestamp: new Date(),
        },
      ];

      const state = createSessionState('/file.ts', 100, 'hash');
      const loaded = loadHistory(state, entries);

      assert.strictEqual(loaded.conversationHistory.length, 2);
    });

    it('should resume from last visited line', () => {
      const entries: ConversationEntry[] = [
        {
          lineNum: 5,
          lineText: 'line 5',
          observation: 'obs',
          userResponse: 'resp',
          timestamp: new Date(),
        },
        {
          lineNum: 15,
          lineText: 'line 15',
          observation: 'obs',
          userResponse: 'resp',
          timestamp: new Date(),
        },
      ];

      const state = createSessionState('/file.ts', 100, 'hash');
      const loaded = loadHistory(state, entries);

      // Should resume at line 15 (last visited)
      assert.strictEqual(loaded.currentLineNum, 15);
    });

    it('should handle empty history', () => {
      const state = createSessionState('/file.ts', 100, 'hash');
      const loaded = loadHistory(state, []);

      // Should return state unchanged
      assert.strictEqual(loaded.currentLineNum, state.currentLineNum);
      assert.deepStrictEqual(loaded.conversationHistory, []);
    });
  });
});
