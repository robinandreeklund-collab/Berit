"use client";

import { Loader2Icon, Trash2Icon } from "lucide-react";
import { useCallback, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { getAPIClient } from "@/core/api";
import { useI18n } from "@/core/i18n/hooks";
import { clearMemory } from "@/core/memory/api";
import type { AgentThread } from "@/core/threads/types";

import { SettingsSection } from "./settings-section";

type ResetStatus = "idle" | "loading" | "done" | "error";

function ResetButton({
  label,
  description,
  onReset,
}: {
  label: string;
  description: string;
  onReset: () => Promise<void>;
}) {
  const { t } = useI18n();
  const [status, setStatus] = useState<ResetStatus>("idle");

  const handleClick = useCallback(async () => {
    setStatus("loading");
    try {
      await onReset();
      setStatus("done");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }, [onReset]);

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-muted-foreground text-xs">{description}</div>
      </div>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleClick}
        disabled={status === "loading"}
        className="ml-4 shrink-0"
      >
        {status === "loading" ? (
          <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />
        ) : (
          <Trash2Icon className="mr-1.5 size-3.5" />
        )}
        {status === "done"
          ? t.settings.developer.cleared
          : status === "error"
            ? t.settings.developer.error
            : t.settings.developer.clearButton}
      </Button>
    </div>
  );
}

export function DeveloperSettingsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const handleClearMemory = useCallback(async () => {
    await clearMemory();
    await queryClient.invalidateQueries({ queryKey: ["memory"] });
  }, [queryClient]);

  const handleClearThreads = useCallback(async () => {
    const apiClient = getAPIClient();
    const threads = (await apiClient.threads.search({
      limit: 100,
    })) as AgentThread[];
    await Promise.all(threads.map((t) => apiClient.threads.delete(t.thread_id)));
    queryClient.setQueriesData(
      { queryKey: ["threads", "search"], exact: false },
      () => [],
    );
  }, [queryClient]);

  const handleClearAll = useCallback(async () => {
    await handleClearMemory();
    await handleClearThreads();
  }, [handleClearMemory, handleClearThreads]);

  return (
    <SettingsSection
      title={t.settings.developer.title}
      description={t.settings.developer.description}
    >
      <div className="space-y-3">
        <ResetButton
          label={t.settings.developer.clearMemory}
          description={t.settings.developer.clearMemoryDescription}
          onReset={handleClearMemory}
        />
        <ResetButton
          label={t.settings.developer.clearThreads}
          description={t.settings.developer.clearThreadsDescription}
          onReset={handleClearThreads}
        />
        <ResetButton
          label={t.settings.developer.clearAll}
          description={t.settings.developer.clearAllDescription}
          onReset={handleClearAll}
        />
      </div>
    </SettingsSection>
  );
}
