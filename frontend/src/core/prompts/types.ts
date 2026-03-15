export interface PromptEntry {
  id: string;
  label: string;
  description: string;
  content: string;
  source_file: string;
}

export interface PromptsListResponse {
  prompts: PromptEntry[];
}

export interface PromptUpdateResponse {
  success: boolean;
  id: string;
  content: string;
}
