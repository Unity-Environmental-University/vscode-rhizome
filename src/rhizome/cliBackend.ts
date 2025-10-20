/**
 * @rhizome stub
 * CLI Backend: call rhizome command-line tool
 *
 * TODO: implement CLI invocation
 * User Stories: bootstrap, use existing rhizome installation
 * Strategy: spawn child_process, parse JSON output, handle errors
 */

import { RhizomeBackend, RecordOptions, RecordResult, PersonaInfo } from './rhizomeBackend';
// TODO: import { execFile } from 'child_process';

export class CLIBackend implements RhizomeBackend {
	private rhizomePath: string;

	/**
	 * @rhizome stub
	 * Initialize CLI backend
	 *
	 * TODO: verify rhizome is in PATH
	 * TODO: handle not found gracefully
	 */
	constructor(rhizomePath: string = 'rhizome') {
		this.rhizomePath = rhizomePath;
	}

	/**
	 * @rhizome stub
	 * Record a decision/observation
	 *
	 * TODO: convert RecordOptions to CLI args
	 * TODO: spawn rhizome process
	 * TODO: parse JSON output
	 * TODO: handle error cases (command not found, invalid args)
	 */
	async record(options: RecordOptions): Promise<RecordResult> {
		throw new NotImplementedError();
		// Build command: rhizome record --actor ... --action ... etc.
		// Execute: execFile('rhizome', [...args])
		// Parse: JSON.parse(stdout)
		// Return: { ok: true, recorded: ... } or { ok: false, error: ... }
	}

	/**
	 * @rhizome stub
	 * List all personas
	 *
	 * TODO: run rhizome persona-list
	 * TODO: parse table output into PersonaInfo[]
	 */
	async personaList(): Promise<PersonaInfo[]> {
		throw new NotImplementedError();
		// Execute: execFile('rhizome', ['persona-list'])
		// Parse: table format or JSON (check rhizome output)
		// Return: PersonaInfo[]
	}

	/**
	 * @rhizome stub
	 * Show persona details
	 *
	 * TODO: run rhizome persona-show --name <name>
	 * TODO: parse JSON output
	 */
	async personaShow(name: string): Promise<PersonaInfo> {
		throw new NotImplementedError();
		// Execute: execFile('rhizome', ['persona-show', '--name', name])
		// Parse: JSON.parse(stdout)
		// Return: PersonaInfo
	}

	/**
	 * @rhizome stub
	 * Adopt persona
	 *
	 * TODO: run rhizome persona-adopt with options
	 */
	async personaAdopt(options: {
		includeBro?: boolean;
		includeBrand?: boolean;
	}): Promise<RecordResult> {
		throw new NotImplementedError();
		// Build args: ['persona-adopt']
		// Add: if includeBro, append '--include-bro'
		// Add: if includeBrand, append '--include-brand'
		// Execute and parse like record()
	}
}
