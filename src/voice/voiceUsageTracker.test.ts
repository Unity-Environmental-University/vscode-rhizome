import assert from 'assert';
import { VoiceUsageTracker } from './voiceUsageTracker';

describe('VoiceUsageTracker', () => {
	it('accumulates bytes, duration, and estimated cost', () => {
		const tracker = new VoiceUsageTracker(0.006);
		tracker.record({ sizeBytes: 64000, durationSec: 2 });
		const totals = tracker.record({ sizeBytes: 32000 });
		assert.strictEqual(totals.chunks, 2);
		assert.strictEqual(totals.totalBytes, 96000);
		assert.ok(totals.totalDurationSec > 2, 'Duration should include fallback estimate');
		assert.ok(totals.estimatedCostUSD > 0);
	});
});

