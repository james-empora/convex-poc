"use client";

import { useRef, useEffect } from "react";
import { PortalChatMessage } from "./portal-chat-message";
import { PortalEscalationBanner } from "./portal-escalation-banner";
import type { PortalMessage } from "@/lib/portal/fake-data";

interface PortalChatThreadProps {
  messages: PortalMessage[];
  escalatedTo?: string | null;
  isTyping?: boolean;
}

export function PortalChatThread({
  messages,
  escalatedTo,
  isTyping,
}: PortalChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isTyping]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
      <div className="space-y-4">
        {messages.map((msg) => (
          <PortalChatMessage
            key={msg.id}
            role={msg.role}
            senderName={msg.senderName}
            content={msg.content}
            timestamp={msg.timestamp}
          />
        ))}

        {escalatedTo && (
          <PortalEscalationBanner officerName={escalatedTo} />
        )}

        {isTyping && (
          <div className="flex gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sapphire-10">
              <div className="flex gap-0.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sapphire-40 [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sapphire-40 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sapphire-40 [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
