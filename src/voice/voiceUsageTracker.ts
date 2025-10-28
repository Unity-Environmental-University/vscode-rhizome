const DEFAULT_COST_PER_MINUTE_USD = 0.006; // Whisper pricing as of Oct 2024
const BYTES_PER_SECOND_FALLBACK = 32000; // Approx. 256 kbps stream when duration unavailable

export interface UsageTotals {
	chunks: number;
	totalBytes: number;
	totalDurationSec: number;
	estimatedCostUSD: number;
}

export interface UsageSample {
	sizeBytes?: number;
	durationSec?: number;
}

export class VoiceUsageTracker {
	private chunks = 0;
	private totalBytes = 0;
	private totalDurationSec = 0;

	constructor(private readonly costPerMinuteUsd = DEFAULT_COST_PER_MINUTE_USD) {}

	record(sample: UsageSample): UsageTotals {
		this.chunks += 1;
		if (sample.sizeBytes) {
			this.totalBytes += sample.sizeBytes;
		}
		const duration = sample.durationSec ?? this.estimateDuration(sample.sizeBytes);
		this.totalDurationSec += duration;
		return this.getTotals();
	}

	getTotals(): UsageTotals {
		const minutes = this.totalDurationSec / 60;
		const estimatedCostUSD = minutes * this.costPerMinuteUsd;
		return {
			chunks: this.chunks,
			totalBytes: this.totalBytes,
			totalDurationSec: this.totalDurationSec,
			estimatedCostUSD,
		};
	}

	private estimateDuration(sizeBytes?: number): number {
		if (!sizeBytes || sizeBytes <= 0) {
			return 0;
		}
		return sizeBytes / BYTES_PER_SECOND_FALLBACK;
	}
}

