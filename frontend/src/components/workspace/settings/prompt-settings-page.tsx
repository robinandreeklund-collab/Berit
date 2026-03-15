"use client";

import { CheckIcon, RotateCcwIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/core/i18n/hooks";
import { usePrompts, useUpdatePrompt } from "@/core/prompts/hooks";
import type { PromptEntry } from "@/core/prompts/types";
import { cn } from "@/lib/utils";

import { SettingsSection } from "./settings-section";

export function PromptSettingsPage() {
  const { t } = useI18n();
  const { prompts, isLoading, error } = usePrompts();
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);

  // Auto-select first prompt when loaded
  useEffect(() => {
    if (prompts.length > 0 && !selectedPromptId) {
      setSelectedPromptId(prompts[0].id);
    }
  }, [prompts, selectedPromptId]);

  const selectedPrompt = prompts.find((p) => p.id === selectedPromptId);

  return (
    <SettingsSection
      title={t.settings.prompts.title}
      description={t.settings.prompts.description}
    >
      {isLoading ? (
        <div className="text-muted-foreground text-sm">
          {t.common.loading}
        </div>
      ) : error ? (
        <div className="text-destructive text-sm">
          {t.settings.prompts.loadError}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Prompt selector tabs */}
          <div className="flex flex-wrap gap-2">
            {prompts.map((prompt) => (
              <button
                key={prompt.id}
                type="button"
                onClick={() => setSelectedPromptId(prompt.id)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                  selectedPromptId === prompt.id
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "bg-background text-muted-foreground hover:bg-muted border-border",
                )}
              >
                {prompt.label}
              </button>
            ))}
          </div>

          {/* Prompt editor */}
          {selectedPrompt && <PromptEditor prompt={selectedPrompt} />}
        </div>
      )}
    </SettingsSection>
  );
}

function PromptEditor({ prompt }: { prompt: PromptEntry }) {
  const { t } = useI18n();
  const { mutate: doUpdate, isPending } = useUpdatePrompt();
  const [content, setContent] = useState(prompt.content);
  const [saved, setSaved] = useState(false);
  const originalContent = useRef(prompt.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset when prompt changes
  useEffect(() => {
    setContent(prompt.content);
    originalContent.current = prompt.content;
    setSaved(false);
  }, [prompt.id, prompt.content]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 500)}px`;
    }
  }, [content]);

  const hasChanges = content !== originalContent.current;

  const handleSave = useCallback(() => {
    doUpdate(
      { promptId: prompt.id, content },
      {
        onSuccess: () => {
          originalContent.current = content;
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      },
    );
  }, [doUpdate, prompt.id, content]);

  const handleReset = useCallback(() => {
    setContent(originalContent.current);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{prompt.description}</p>
          <p className="text-muted-foreground/60 mt-1 text-xs">
            {prompt.source_file}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={isPending}
            >
              <RotateCcwIcon className="mr-1 size-3.5" />
              {t.settings.prompts.reset}
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isPending}
          >
            {saved ? (
              <>
                <CheckIcon className="mr-1 size-3.5" />
                {t.settings.prompts.saved}
              </>
            ) : (
              t.common.save
            )}
          </Button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className={cn(
          "border-input bg-background ring-offset-background placeholder:text-muted-foreground",
          "focus-visible:ring-ring w-full rounded-md border px-3 py-2",
          "font-mono text-xs leading-relaxed",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "min-h-[200px] resize-y",
        )}
        spellCheck={false}
      />
      <p className="text-muted-foreground/60 text-xs">
        {t.settings.prompts.runtimeNote}
      </p>
    </div>
  );
}
