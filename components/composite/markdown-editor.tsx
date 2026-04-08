"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownRenderer } from "./markdown-renderer";

interface MarkdownEditorProps {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  className?: string;
  /** Use monospace font in the write tab (e.g. for prompt templates). */
  mono?: boolean;
}

export function MarkdownEditor({
  value,
  onChange,
  rows = 10,
  placeholder,
  className,
  mono = false,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<"write" | "preview">("write");

  return (
    <div className={cn("space-y-0", className)}>
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-onyx-20 pb-0">
        <button
          type="button"
          onClick={() => setTab("write")}
          className={cn(
            "px-3 py-1.5 text-xs font-medium transition-colors rounded-t-md",
            tab === "write"
              ? "border-b-2 border-sapphire-60 text-sapphire-70"
              : "text-onyx-50 hover:text-onyx-80",
          )}
        >
          Write
        </button>
        <button
          type="button"
          onClick={() => setTab("preview")}
          className={cn(
            "px-3 py-1.5 text-xs font-medium transition-colors rounded-t-md",
            tab === "preview"
              ? "border-b-2 border-sapphire-60 text-sapphire-70"
              : "text-onyx-50 hover:text-onyx-80",
          )}
        >
          Preview
        </button>
      </div>

      {/* Content */}
      {tab === "write" ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={cn("mt-1.5 rounded-t-none", mono && "font-mono text-xs")}
        />
      ) : (
        <div
          className="mt-1.5 min-h-[120px] rounded-lg border border-onyx-20 bg-onyx-5 p-3 overflow-y-auto"
          style={{ maxHeight: `${rows * 1.75}rem` }}
        >
          {value.trim() ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-xs text-onyx-40 italic">Nothing to preview</p>
          )}
        </div>
      )}
    </div>
  );
}
