import type { UIMessage } from "ai";

export type ThreadType = "user_chat" | "system";

export type PersistedChatMessage = UIMessage;
export type ChatTitleSource = "derived" | "generated" | "manual";

export type ChatThreadDetail = {
  id: string;
  threadType: ThreadType;
  title: string;
  titleSource: ChatTitleSource;
  messages: PersistedChatMessage[];
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
};

export type FileChatSummary = {
  id: string;
  threadType: ThreadType;
  title: string;
  titleSource: ChatTitleSource;
  preview: string | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
};

export function createChatId() {
  return globalThis.crypto.randomUUID();
}

export function getMessageText(message: Pick<UIMessage, "parts">) {
  return message.parts
    .filter((part): part is Extract<UIMessage["parts"][number], { type: "text" }> => part.type === "text")
    .map((part) => part.text)
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

export function deriveChatTitle(messages: PersistedChatMessage[]) {
  const firstUserText = messages
    .filter((message) => message.role === "user")
    .map(getMessageText)
    .find(Boolean);

  if (!firstUserText) return "New chat";
  if (firstUserText.length <= 48) return firstUserText;
  return `${firstUserText.slice(0, 45).trimEnd()}...`;
}

export function deriveChatPreview(messages: PersistedChatMessage[]) {
  const previewText = [...messages]
    .reverse()
    .map(getMessageText)
    .find(Boolean);

  if (!previewText) return null;
  if (previewText.length <= 72) return previewText;
  return `${previewText.slice(0, 69).trimEnd()}...`;
}
