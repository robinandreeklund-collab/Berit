import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { loadPrompts, updatePrompt } from "./api";

export function usePrompts() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["prompts"],
    queryFn: () => loadPrompts(),
  });
  return { prompts: data?.prompts ?? [], isLoading, error };
}

export function useUpdatePrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      promptId,
      content,
    }: {
      promptId: string;
      content: string;
    }) => {
      return updatePrompt(promptId, content);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["prompts"] });
    },
  });
}
