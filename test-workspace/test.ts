/**
 * Test file for vscode-rhizome extension
 *
 * don-socratic asks:
 * What is a function? What does it do?
 * What would you call a function that doesn't yet exist?
 *
 * Below: functions waiting to be questioned.
 */

export function greet(name: string): string {
	// What should this do?
	throw new Error('Not implemented');
}

export async function fetchUserData(userId: number): Promise<any> {
	// How would you get data about a user?
	// Where does the data come from?
	throw new Error('Not implemented');
}

export function calculateTotal(items: Array<{ price: number; quantity: number }>): number {
	// What does "total" mean?
	// How do you combine prices and quantities?
	throw new Error('Not implemented');
}

// @rhizome stub
export function parseJSON(input: string): Record<string, any> {
	// Try selecting this function and asking don-socratic
	// What are the edge cases here?
}