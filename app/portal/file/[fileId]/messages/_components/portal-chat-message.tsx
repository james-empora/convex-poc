"use client";

import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/composite/user-avatar";
import { Bot, UserCircle } from "lucide-react";
import type { PortalMessageRole } from "@/lib/portal/fake-data";

interface PortalChatMessageProps {
  role: PortalMessageRole;
  senderName: string;
  content: string;
  timestamp: string;
}

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PortalChatMessage({
  role,
  senderName,
  content,
  timestamp,
}: PortalChatMessageProps) {
  const isUser = role === "user";
  const isAI = role === "assistant";

  return (
    <div
      className={cn(
        "flex gap-2.5",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar */}
      <div className="shrink-0 pt-0.5">
        {isAI ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sapphire-10">
            <Bot className="h-4 w-4 text-sapphire-60" />
          </div>
        ) : role === "escrow_officer" ? (
          <UserAvatar name={senderName} size="sm" />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-onyx-20">
            <UserCircle className="h-4 w-4 text-onyx-60" />
          </div>
        )}
      </div>

      {/* Message content */}
      <div className={cn("max-w-[80%] space-y-1", isUser && "items-end")}>
        {!isUser && (
          <p className="text-xs font-medium text-onyx-50">{senderName}</p>
        )}
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
            isUser
              ? "rounded-br-md bg-sapphire-60 text-white"
              : role === "escrow_officer"
                ? "rounded-bl-md bg-white text-onyx-100 shadow-soft"
                : "rounded-bl-md bg-onyx-10 text-onyx-100",
          )}
        >
          {content}
        </div>
        <p
          className={cn(
            "text-[10px] text-onyx-40",
            isUser && "text-right",
          )}
        >
          {formatTime(timestamp)}
        </p>
      </div>
    </div>
  );
}
