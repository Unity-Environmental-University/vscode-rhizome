import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execSync } from 'child_process';

const RHIZOME_BINARY_NAME = 'rhizome';

export const DEFAULT_RHIZOME_LOCATIONS: string[] = [
	path.join(os.homedir(), '.local', 'bin', RHIZOME_BINARY_NAME),
	path.join(os.homedir(), 'bin', RHIZOME_BINARY_NAME),
	path.join(os.homedir(), '.rhizome', 'bin', RHIZOME_BINARY_NAME),
	'/usr/local/bin/rhizome',
	'/usr/bin/rhizome',
];

function parseCustomLocations(): string[] {
	const envPaths = process.env.RHIZOME_CUSTOM_PATHS;
	if (!envPaths) {
		return [];
	}
	return envPaths
		.split(path.delimiter)
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);
}

export function getCandidateLocations(): string[] {
	const combined = [...parseCustomLocations(), ...DEFAULT_RHIZOME_LOCATIONS];
	const seen = new Set<string>();
	const deduped: string[] = [];
	for (const location of combined) {
		const normalized = path.normalize(location);
		if (!seen.has(normalized)) {
			seen.add(normalized);
			deduped.push(normalized);
		}
	}
	return deduped;
}

export function findRhizomeOnDisk(pathExists: (candidate: string) => boolean = fs.existsSync): string | null {
	for (const candidate of getCandidateLocations()) {
		if (pathExists(candidate)) {
			return candidate;
		}
	}
	return null;
}

/**
 * dev-guide reflection:
 * We expect rhizome to live in a handful of predictable locations. Rather than
 * assuming the user's PATH is configured, we check disk first (covers ~/.local/bin)
 * and only fall back to PATH resolution via `rhizome --version` as a final resort.
 * This keeps the experience frictionless for CLI installs that do not export PATH.
 */
export function isRhizomeInstalled(): boolean {
	if (findRhizomeOnDisk()) {
		return true;
	}

	try {
		execSync(`${RHIZOME_BINARY_NAME} --version`, {
			encoding: 'utf-8',
			timeout: 2000,
			stdio: 'pipe',
		});
		return true;
	} catch {
		return false;
	}
}

export function ensureLocalBinOnPath(): void {
	const localBin = path.join(os.homedir(), '.local', 'bin');
	const pathValue = process.env.PATH ?? '';
	const segments = pathValue.length > 0 ? pathValue.split(path.delimiter) : [];
	if (!segments.includes(localBin)) {
		segments.unshift(localBin);
		process.env.PATH = segments.join(path.delimiter);
	}
}
