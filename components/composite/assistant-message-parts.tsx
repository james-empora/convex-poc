"use client";

import type { ReactNode } from "react";
import type { UIMessage } from "@ai-sdk/react";
import { ToolCallCard } from "@/components/composite/tool-call-card";
import { MarkdownRenderer } from "@/components/composite/markdown-renderer";
import { isToolPart, getToolPartName, type ToolPartLike } from "@/lib/chat/ui-helpers";

/**
 * Renders assistant message parts in chronological order — text and tool
 * call cards interleaved as they actually occurred, rather than grouping
 * all tool calls at the top.
 */
export function AssistantMessageParts({
  parts,
}: {
  parts: UIMessage["parts"];
}) {
  const groups: ReactNode[] = [];
  let textBuffer = "";
  let keyIndex = 0;

  for (const part of parts) {
    if (part.type === "text") {
      textBuffer += (part as { text: string }).text;
      continue;
    }

    // Flush accumulated text before a non-text part
    if (textBuffer.trim()) {
      groups.push(
        <MarkdownRenderer key={`text-${keyIndex++}`} content={textBuffer} />,
      );
      textBuffer = "";
    }

    if (isToolPart(part)) {
      const tp = part as ToolPartLike;
      groups.push(
        <ToolCallCard
          key={tp.toolCallId}
          toolName={getToolPartName(tp)}
          state={tp.state}
          input={tp.input}
          output={tp.output}
        />,
      );
    }
  }

  // Flush trailing text
  if (textBuffer.trim()) {
    groups.push(
      <MarkdownRenderer key={`text-${keyIndex}`} content={textBuffer} />,
    );
  }

  return <div className="flex flex-col gap-2">{groups}</div>;
}
