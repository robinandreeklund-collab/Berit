import { getBackendBaseURL } from "../config";

import type { UserMemory } from "./types";

export async function loadMemory() {
  const memory = await fetch(`${getBackendBaseURL()}/api/memory`);
  const json = await memory.json();
  return json as UserMemory;
}

export async function clearMemory(): Promise<void> {
  const response = await fetch(`${getBackendBaseURL()}/api/memory`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to clear memory: ${response.statusText}`);
  }
}
