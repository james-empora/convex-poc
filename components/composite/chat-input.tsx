"use client";

import {
  useState,
  useRef,
  useCallback,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import {
  ArrowUp,
  Square,
  Paperclip,
  FileText,
  ImageIcon,
  X,
  Brain,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/composite/markdown-renderer";
import type { SkillContext } from "@/lib/skills/domains";
import type { SkillDomain } from "@/lib/skills/domains";
import type { SkillWithPlacements } from "@/lib/skills/list-skills";
import { useSlashCommandMenu } from "@/lib/skills/use-slash-command-menu";
import { SlashCommandMenu } from "@/components/composite/slash-command-menu";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ---------- types ---------- */

interface ModelOption {
  id: string;
  name: string;
  provider: string;
}

export interface ChatSendOptions {
  model: string;
  thinking: boolean;
}

export interface ChatInputProps {
  onSend?: (message: string, files: File[], options: ChatSendOptions) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  /** Pre-fill the input with this message (e.g., from a skill button). Set to null to clear. */
  initialMessage?: string | null;
  /** Active skill contexts for the multi-skill compose UX (read-only prompts + user additions). */
  activeSkills?: SkillContext[];
  /** Called when the user dismisses a specific skill from the banner. */
  onDismissSkill?: (skillId: string) => void;
  /** Called when the user clicks "+ Add skill" to open an in-chat picker. */
  onAddSkill?: () => void;
  /** Called when the user selects a skill via the "/" slash command menu. */
  onSlashSkillSelect?: (skill: SkillWithPlacements) => void;
  /** Domain scope for the skill picker (when set, "+ Add skill" button is shown). */
  chatDomain?: SkillDomain;
  placeholder?: string;
  models?: ModelOption[];
  defaultModel?: string;
  className?: string;
}

export type { SkillContext };

/* ---------- helpers ---------- */

const DEFAULT_MODELS: ModelOption[] = [
  { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", provider: "Anthropic" },
  { id: "claude-opus-4-6", name: "Claude Opus 4.6", provider: "Anthropic" },
  { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", provider: "Anthropic" },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return ImageIcon;
  return FileText;
}

/* ---------- component ---------- */

/** Build the final message when one or more skills are active. */
export function buildMultiSkillMessage(skills: SkillContext[], userMessage: string): string {
  if (skills.length === 0) return userMessage;
  const skillParts = skills.map((s) => `## ${s.label}\n\n${s.promptTemplate}`);
  const combined = skillParts.join("\n\n---\n\n");
  if (!userMessage.trim()) return combined;
  return `${combined}\n\n---\n\nAdditional context:\n${userMessage}`;
}

export function ChatInput({
  onSend,
  onStop,
  isStreaming = false,
  initialMessage,
  activeSkills = [],
  onDismissSkill,
  onAddSkill,
  onSlashSkillSelect,
  chatDomain,
  placeholder = "Ask anything...",
  models = DEFAULT_MODELS,
  defaultModel,
  className,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [selectedModel, setSelectedModel] = useState(
    defaultModel ?? models[0]?.id ?? ""
  );
  const [thinkingEnabled, setThinkingEnabled] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set());

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initialMessage prop into local state using key-based reset pattern
  const [lastInitial, setLastInitial] = useState(initialMessage);
  if (initialMessage != null && initialMessage !== lastInitial) {
    setLastInitial(initialMessage);
    setMessage(initialMessage);
  }

  const hasSkills = activeSkills.length > 0;
  const canSend = message.trim().length > 0 || files.length > 0 || hasSkills;

  const handleSlashSelect = useCallback(
    (skill: SkillWithPlacements) => onSlashSkillSelect?.(skill),
    [onSlashSkillSelect],
  );
  const clearSlash = useCallback(() => setMessage(""), []);

  const slashMenu = useSlashCommandMenu({
    message,
    domain: chatDomain,
    disabledSkillIds: activeSkills.map((s) => s.skillId),
    onSelect: handleSlashSelect,
    onClearSlash: clearSlash,
  });

  function toggleSkillExpanded(skillId: string) {
    setExpandedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skillId)) next.delete(skillId);
      else next.add(skillId);
      return next;
    });
  }

  function handleSend() {
    if (!canSend || isStreaming) return;
    const finalMessage = buildMultiSkillMessage(activeSkills, message);
    onSend?.(finalMessage, files, { model: selectedModel, thinking: thinkingEnabled });
    setMessage("");
    setFiles([]);
    // Dismiss all active skills
    for (const s of activeSkills) {
      onDismissSkill?.(s.skillId);
    }
  }

  function handleStop() {
    onStop?.();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Let slash command menu consume keyboard events first
    if (slashMenu.handleKeyDown(e)) return;

    if (e.key === "Enter") {
      if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) {
        // Modifier+Enter inserts a newline (default textarea behavior)
        return;
      }
      e.preventDefault();
      handleSend();
    }
  }

  // Drag and drop
  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    // Only reset if leaving the container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  }

  function handleFileSelect() {
    fileInputRef.current?.click();
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length > 0) {
      setFiles((prev) => [...prev, ...selected]);
    }
    // Reset so same file can be selected again
    e.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div
      className={cn(
        "relative rounded-2xl border bg-white shadow-[var(--shadow-soft)] transition-all duration-200",
        isDragOver
          ? "border-sapphire-40 shadow-[var(--shadow-glow)]"
          : "border-onyx-20",
        className
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-sapphire-10/60 backdrop-blur-[2px]">
          <div className="flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-sm font-medium text-sapphire-70 shadow-[var(--shadow-md)]">
            <Paperclip className="h-4 w-4" />
            Drop files here
          </div>
        </div>
      )}

      {/* Skill context banners */}
      {hasSkills && (
        <div className="mx-3 mt-3 space-y-2">
          {activeSkills.map((skill) => {
            const isExpanded = expandedSkills.has(skill.skillId);
            return (
              <div key={skill.skillId} className="rounded-xl border border-onyx-15 bg-onyx-5">
                <div className="flex items-center gap-2 px-3 py-2">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-sapphire-50" />
                  <span className="flex-1 truncate text-xs font-medium text-onyx-70">
                    {skill.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleSkillExpanded(skill.skillId)}
                    className="inline-flex h-5 w-5 items-center justify-center rounded text-onyx-40 hover:text-onyx-70"
                    aria-label={isExpanded ? "Collapse skill prompt" : "Expand skill prompt"}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDismissSkill?.(skill.skillId)}
                    className="inline-flex h-5 w-5 items-center justify-center rounded text-onyx-40 hover:text-onyx-70"
                    aria-label={`Dismiss ${skill.label}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {isExpanded && (
                  <div className="max-h-48 overflow-y-auto border-t border-onyx-15 px-3 py-2">
                    <MarkdownRenderer
                      content={skill.promptTemplate}
                      className="text-xs"
                    />
                  </div>
                )}
              </div>
            );
          })}
          {onAddSkill && chatDomain && (
            <button
              type="button"
              onClick={onAddSkill}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-onyx-20 py-1.5 text-xs text-onyx-50 transition-colors hover:border-onyx-30 hover:text-onyx-70"
            >
              <Sparkles className="h-3 w-3" />
              Add skill
            </button>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
        aria-label="Attach files"
      />

      {/* File chips */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pt-3">
          {files.map((file, i) => {
            const Icon = getFileIcon(file.type);
            return (
              <div
                key={`${file.name}-${i}`}
                className="animate-fade-in-scale inline-flex items-center gap-2 rounded-lg bg-onyx-10 px-3 py-1.5 text-sm"
              >
                <Icon className="h-3.5 w-3.5 text-onyx-50" />
                <span className="max-w-[150px] truncate font-medium text-onyx-80">
                  {file.name}
                </span>
                <span className="text-xs text-onyx-50">
                  {formatFileSize(file.size)}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-onyx-40 transition-colors hover:bg-onyx-20 hover:text-onyx-80"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Slash command menu */}
      {slashMenu.isOpen && (
        <div className="relative">
          <SlashCommandMenu
            skills={slashMenu.filteredSkills}
            highlightedIndex={slashMenu.highlightedIndex}
            disabledSkillIds={activeSkills.map((s) => s.skillId)}
            onSelect={(skill) => {
              onSlashSkillSelect?.(skill);
              setMessage("");
            }}
            onHover={slashMenu.setHighlightedIndex}
          />
        </div>
      )}

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Delay so click events on menu items fire first
          setTimeout(() => slashMenu.close(), 150);
        }}
        placeholder={hasSkills ? "Add your context or instructions..." : placeholder}
        aria-label="Message input"
        rows={3}
        className="field-sizing-content min-h-[4.75rem] w-full resize-none border-none bg-transparent px-4 py-3 text-base text-onyx-100 outline-none max-h-[200px] overflow-y-auto placeholder:text-onyx-40"
      />

      {/* Bottom toolbar */}
      <div className="flex items-center justify-between gap-3 px-3 pb-3">
        {/* Left controls */}
        <div className="flex items-center gap-2">
          {/* Attachment button */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleFileSelect}
            className="text-onyx-40 hover:text-onyx-70"
          >
            <Paperclip className="h-4 w-4" />
            <span className="sr-only">Attach file</span>
          </Button>

          {/* Model selector */}
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger size="sm" className="w-auto gap-2 border-none bg-onyx-10 text-xs shadow-none hover:bg-onyx-20 focus-visible:shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={4}>
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <span className="text-onyx-50">{model.provider}</span>{" "}
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Thinking toggle */}
          <div className="flex h-8 items-center gap-2 rounded-lg bg-onyx-10 px-2.5">
            <Brain className={cn(
              "h-3.5 w-3.5 transition-colors",
              thinkingEnabled ? "text-amethyst-60" : "text-onyx-40"
            )} />
            <span className="text-xs font-medium text-onyx-60">Think</span>
            <Switch
              size="sm"
              checked={thinkingEnabled}
              onCheckedChange={setThinkingEnabled}
            />
            {thinkingEnabled && (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amethyst-60" />
            )}
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Shortcut hint */}
          {!isStreaming && (
            <kbd className="hidden select-none items-center gap-0.5 rounded-md bg-onyx-10 px-2 py-0.5 font-mono text-[10px] text-onyx-40 sm:inline-flex">
              ↵
            </kbd>
          )}

          {/* Send / Stop button */}
          {isStreaming ? (
            <Button
              size="icon-sm"
              variant="destructive"
              onClick={handleStop}
              className="rounded-lg"
            >
              <Square className="h-3.5 w-3.5" fill="currentColor" />
              <span className="sr-only">Stop generating</span>
            </Button>
          ) : (
            <Button
              size="icon-sm"
              onClick={handleSend}
              disabled={!canSend}
              className="rounded-lg"
            >
              <ArrowUp className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
