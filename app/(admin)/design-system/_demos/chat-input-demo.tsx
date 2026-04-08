"use client";

import { ChatInput } from "@/components/composite/chat-input";

export function ChatInputDemo() {
  return (
    <ChatInput
      onSend={(message, files) => {
        console.log("Send:", message, files);
      }}
    />
  );
}
