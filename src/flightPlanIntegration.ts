/**
 * Flight Plan Integration for Epistles
 *
 * Utilities for linking epistles to flight plans and showing related epistles in flight plan views.
 *
 * @rhizome: Why separate this from extension.ts?
 * Flight plan operations are independent of VSCode lifecycle.
 * Separating them lets us test without VSCode, reuse in other contexts,
 * and keep extension.ts focused on UI/command handling.
 */

import * as fs from 'fs';
import * as path from 'path';
import { EpistleRegistry, EpistleRegistryEntry } from './epistleRegistry';

/**
 * Flight plan metadata (simplified)
 *
 * @rhizome: What do we need to know about a flight plan for epistle linking?
 * - ID (for linking)
 * - Title (for display)
 * - Phase (kitchen_table, garden, library - what stage of work?)
 * - Status (active, completed, archived)
 */
export interface FlightPlanInfo {
	id: string;
	title: string;
	phase?: string;
	status?: string;
}

/**
 * Helper: Get the currently active flight plan
 *
 * Reads .rhizome/flight_plans/active.json to find which flight plan is active.
 *
 * @rhizome: When is a flight plan "active"?
 * The user sets it explicitly via `rhizome flight phase` or the UI.
 * Only one flight plan is active at a time (or none).
 * This is the default when linking epistles.
 */
export function getActiveFlightPlan(workspaceRoot: string): FlightPlanInfo | undefined {
	try {
		const activePath = path.join(workspaceRoot, '.rhizome', 'flight_plans', 'active.json');

		if (!fs.existsSync(activePath)) {
			return undefined;
		}

		const content = fs.readFileSync(activePath, 'utf-8');
		const activeData = JSON.parse(content) as { id: string; set_at: string };

		// Load the flight plan to get full info
		const flightPlanPath = path.join(
			workspaceRoot,
			'.rhizome',
			'flight_plans',
			`${activeData.id}.json`
		);

		if (!fs.existsSync(flightPlanPath)) {
			return undefined;
		}

		const flightPlanContent = fs.readFileSync(flightPlanPath, 'utf-8');
		const flightPlan = JSON.parse(flightPlanContent) as any;

		return {
			id: flightPlan.id,
			title: flightPlan.title,
			phase: flightPlan.phase?.current,
			status: flightPlan.status,
		};
	} catch (error) {
		// If anything goes wrong, return undefined
		return undefined;
	}
}

/**
 * Helper: Get all available flight plans
 *
 * Lists all flight plans in the workspace (active or not).
 * Useful for UI pickers when user manually selects which flight plan to link to.
 */
export function getAllFlightPlans(workspaceRoot: string): FlightPlanInfo[] {
	try {
		const flightPlansDir = path.join(workspaceRoot, '.rhizome', 'flight_plans');

		if (!fs.existsSync(flightPlansDir)) {
			return [];
		}

		const files = fs.readdirSync(flightPlansDir);
		const flightPlans: FlightPlanInfo[] = [];

		for (const file of files) {
			// Skip non-json files and special files
			if (!file.endsWith('.json') || file === 'active.json') {
				continue;
			}

			try {
				const filepath = path.join(flightPlansDir, file);
				const content = fs.readFileSync(filepath, 'utf-8');
				const plan = JSON.parse(content) as any;

				// Only include active plans (not archived)
				if (plan.archived === false) {
					flightPlans.push({
						id: plan.id,
						title: plan.title,
						phase: plan.phase?.current,
						status: plan.status,
					});
				}
			} catch {
				// Skip files that can't be parsed
			}
		}

		// Sort by recency (most recent first)
		flightPlans.sort((a, b) => {
			// Active plans first
			if (a.status === 'active' && b.status !== 'active') return -1;
			if (a.status !== 'active' && b.status === 'active') return 1;
			return 0;
		});

		return flightPlans;
	} catch (error) {
		return [];
	}
}

/**
 * Helper: Get epistles linked to a specific flight plan
 *
 * @rhizome: How do we find epistles for a flight plan?
 * The registry has a `flight_plan` field.
 * Query for all epistles where flight_plan matches the given ID.
 */
export function getEpistlesForFlightPlan(
	registry: EpistleRegistry,
	flightPlanId: string
): EpistleRegistryEntry[] {
	return registry.getEntriesByFlightPlan(flightPlanId);
}

/**
 * Helper: Count epistles by type for a flight plan
 *
 * Useful for showing summary: "3 letters, 1 inline, 1 dynamic persona"
 */
export function getEpistleCountsByType(
	registry: EpistleRegistry,
	flightPlanId: string
): { letters: number; inline: number; personas: number } {
	const epistles = getEpistlesForFlightPlan(registry, flightPlanId);

	return {
		letters: epistles.filter(e => e.type === 'letter').length,
		inline: epistles.filter(e => e.type === 'inline').length,
		personas: epistles.filter(e => e.type === 'dynamic_persona').length,
	};
}

/**
 * Helper: Format flight plan info for display
 *
 * @rhizome: How should we present flight plan context to the user?
 * - Title is most important (what are we building?)
 * - Phase matters (design vs implementation vs reflection)
 * - Status helps (is it active or done?)
 *
 * Example: "Epistle System (active, garden phase)"
 */
export function formatFlightPlanInfo(flightPlan: FlightPlanInfo): string {
	const parts: string[] = [flightPlan.title];

	if (flightPlan.status) {
		parts.push(flightPlan.status);
	}

	if (flightPlan.phase) {
		parts.push(`${flightPlan.phase} phase`);
	}

	return parts.join(' • ');
}

/**
 * Helper: Format epistle summary for flight plan display
 *
 * Example: "3 discussions • 5 design records • 2 file perspectives"
 */
export function formatEpistleSummary(
	letters: number,
	inline: number,
	personas: number
): string {
	const parts: string[] = [];

	if (letters > 0) {
		const label = letters === 1 ? 'discussion' : 'discussions';
		parts.push(`${letters} ${label}`);
	}

	if (inline > 0) {
		const label = inline === 1 ? 'design record' : 'design records';
		parts.push(`${inline} ${label}`);
	}

	if (personas > 0) {
		const label = personas === 1 ? 'file perspective' : 'file perspectives';
		parts.push(`${personas} ${label}`);
	}

	if (parts.length === 0) {
		return 'No epistles yet';
	}

	return parts.join(' • ');
}
