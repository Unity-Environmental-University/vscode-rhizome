import * as assert from 'assert';
import * as os from 'os';
import * as path from 'path';
import {
	DEFAULT_RHIZOME_LOCATIONS,
	ensureLocalBinOnPath,
	findRhizomeOnDisk,
	getCandidateLocations,
} from './rhizomePath';

	describe('rhizomePath utilities', () => {
		let originalPathEnv: string | undefined;

		beforeEach(() => {
			originalPathEnv = process.env.PATH;
		});

		afterEach(() => {
			delete process.env.RHIZOME_CUSTOM_PATHS;
			process.env.PATH = originalPathEnv;
		});

	it('includes ~/.local/bin/rhizome in candidate list by default', () => {
		const expected = path.join(os.homedir(), '.local', 'bin', 'rhizome');
		const candidates = getCandidateLocations();
		assert.ok(
			candidates.includes(expected),
			`Expected candidates to include ${expected}, got ${candidates.join(', ')}`
		);
	});

	it('prefers explicit custom locations before defaults', () => {
		process.env.RHIZOME_CUSTOM_PATHS = ['/custom/path/rhizome', DEFAULT_RHIZOME_LOCATIONS[0]].join(
			path.delimiter
		);
		const candidates = getCandidateLocations();
		assert.strictEqual(candidates[0], path.normalize('/custom/path/rhizome'));
	});

	it('finds the first existing candidate on disk', () => {
		process.env.RHIZOME_CUSTOM_PATHS = ['/preferred/rhizome', '/fallback/rhizome'].join(path.delimiter);
		const mockExists = (candidate: string) => candidate === path.normalize('/preferred/rhizome');
		const expected = path.normalize('/preferred/rhizome');
		const result = findRhizomeOnDisk(mockExists);
		assert.strictEqual(result, expected);
	});

	it('ensureLocalBinOnPath prepends ~/.local/bin when missing', () => {
		const localBin = path.join(os.homedir(), '.local', 'bin');
		process.env.PATH = ['/usr/local/bin', '/usr/bin'].join(path.delimiter);
		ensureLocalBinOnPath();
		const segments = (process.env.PATH ?? '').split(path.delimiter);
		assert.strictEqual(segments[0], localBin);
	});
});
