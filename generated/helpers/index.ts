export type HelperEntry = {
  id: string;
  name: string;
  description: string;
  category: string;
  execute: (...args: any[]) => any;
};

export const helperEntries: Record<string, HelperEntry> = {
};

export function getHelperEntry(id: string): HelperEntry | undefined {
  return helperEntries[id];
}

export function invokeHelper(id: string, ...args: any[]): any {
  const entry = helperEntries[id];
  if (!entry) {
    throw new Error(`Helper not found: ${id}`);
  }
  return entry.execute(...args);
}