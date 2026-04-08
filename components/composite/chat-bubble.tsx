"use client";

import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "./markdown-renderer";

/* ---------- types ---------- */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatBubbleProps {
  message: ChatMessage;
  className?: string;
}

/* ---------- typing indicator ---------- */

export function TypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1 py-1", className)}>
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-onyx-40 [animation-delay:0ms]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-onyx-40 [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-onyx-40 [animation-delay:300ms]" />
    </div>
  );
}

/* ---------- component ---------- */

export function ChatBubble({ message, className }: ChatBubbleProps) {
  const isUser = message.role === "user";

  const timeLabel = message.timestamp.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (isUser) {
    return (
      <div className={cn("flex flex-col items-end gap-1", className)}>
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-sapphire-60 px-4 py-2.5">
          <MarkdownRenderer content={message.content} dark />
        </div>
        <span className="px-1 text-[10px] text-onyx-40">{timeLabel}</span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <MarkdownRenderer content={message.content} />
      <span className="text-[10px] text-onyx-40">{timeLabel}</span>
    </div>
  );
}
