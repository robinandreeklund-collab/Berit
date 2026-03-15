import { getBackendBaseURL } from "@/core/config";

import type { PromptsListResponse, PromptUpdateResponse } from "./types";

export async function loadPrompts(): Promise<PromptsListResponse> {
  const response = await fetch(`${getBackendBaseURL()}/api/prompts/`);
  return response.json() as Promise<PromptsListResponse>;
}

export async function updatePrompt(
  promptId: string,
  content: string,
): Promise<PromptUpdateResponse> {
  const response = await fetch(
    `${getBackendBaseURL()}/api/prompts/${promptId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    },
  );
  return response.json() as Promise<PromptUpdateResponse>;
}
