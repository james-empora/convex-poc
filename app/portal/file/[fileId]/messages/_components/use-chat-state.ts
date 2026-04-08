"use client";

import { useState, useCallback } from "react";
import type { PortalMessage, PortalMessageRole } from "@/lib/portal/fake-data";

const ESCALATION_KEYWORDS = [
  "talk to a human",
  "talk to someone",
  "escrow officer",
  "speak to someone",
  "real person",
  "need help",
  "reschedule",
];

const AI_RESPONSES: Record<string, string> = {
  "closing date":
    "Your closing is scheduled for **April 15, 2026** at the Empora Austin office. Please bring a valid government-issued photo ID.",
  "wire instructions":
    "Wire instructions will be sent to your email 24-48 hours before closing. Never wire funds based on instructions received via email alone — always verify by calling our office.",
  documents:
    "You can view and download all your shared documents in the Documents section. If you need to upload anything, use the upload area at the bottom of that page.",
  status:
    "Your file is currently **Clear to Close**, which means all title requirements have been satisfied and we're ready to schedule your closing.",
};

function findAIResponse(message: string): string | null {
  const lower = message.toLowerCase();
  for (const [trigger, response] of Object.entries(AI_RESPONSES)) {
    if (lower.includes(trigger)) return response;
  }
  return null;
}

function isEscalation(message: string): boolean {
  const lower = message.toLowerCase();
  return ESCALATION_KEYWORDS.some((kw) => lower.includes(kw));
}

export function useChatState(
  initialMessages: PortalMessage[],
  escrowOfficerName: string,
) {
  const [messages, setMessages] = useState<PortalMessage[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [escalatedTo, setEscalatedTo] = useState<string | null>(null);

  const addMessage = useCallback(
    (role: PortalMessageRole, senderName: string, content: string) => {
      const msg: PortalMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role,
        senderName,
        content,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, msg]);
      return msg;
    },
    [],
  );

  const handleSend = useCallback(
    (content: string) => {
      addMessage("user", "You", content);
      setIsTyping(true);

      setTimeout(() => {
        setIsTyping(false);

        if (isEscalation(content)) {
          addMessage(
            "assistant",
            "Empora Assistant",
            `I've notified your escrow officer, **${escrowOfficerName}**. They'll respond to help you.`,
          );
          setEscalatedTo(escrowOfficerName);

          setTimeout(() => {
            setEscalatedTo(null);
            addMessage(
              "escrow_officer",
              escrowOfficerName,
              "Hi there! I got your message. How can I help?",
            );
          }, 3000);
        } else {
          const aiReply = findAIResponse(content);
          addMessage(
            "assistant",
            "Empora Assistant",
            aiReply ??
              "I'm not sure about that. Would you like me to connect you with your escrow officer? Just say \"talk to someone\" and I'll notify them.",
          );
        }
      }, 1000);
    },
    [addMessage, escrowOfficerName],
  );

  return { messages, isTyping, escalatedTo, handleSend };
}
