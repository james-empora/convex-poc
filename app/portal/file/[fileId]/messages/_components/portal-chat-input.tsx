"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useAtomValue } from "jotai";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chatBarPortalAtom } from "@/app/portal/_lib/atoms";

interface PortalChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function PortalChatInput({ onSend, disabled }: PortalChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const portalTarget = useAtomValue(chatBarPortalAtom);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const content = (
    <div className="border-t border-onyx-20 bg-white">
      <div className="mx-auto max-w-2xl px-4 py-3 sm:px-6">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            rows={1}
            className="flex-1 resize-none rounded-lg border border-onyx-20 bg-onyx-5 px-3 py-2 text-sm text-onyx-100 placeholder:text-onyx-40 focus:border-sapphire-40 focus:outline-none focus:ring-1 focus:ring-sapphire-40/30 disabled:opacity-50"
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!value.trim() || disabled}
            className="h-9 w-9 shrink-0 rounded-lg"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </div>
  );

  // Portal into the shell's bar target (outside overflow-hidden + max-w-2xl)
  if (portalTarget) return createPortal(content, portalTarget);
  return content;
}
