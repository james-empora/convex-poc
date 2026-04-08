import { generateText } from "ai";
import { resolveModel } from "@/lib/ai/model";
import {
  getMessageText,
  type PersistedChatMessage,
} from "@/lib/chat/threads";

const TITLE_MODEL = "anthropic/claude-3.5-haiku";

function sanitizeTitle(value: string) {
  return value.replace(/^['\"\s]+|['\"\s]+$/g, "").replace(/\s+/g, " ").trim();
}

function getConversationSeed(messages: PersistedChatMessage[]) {
  const firstUser = messages.find((message) => message.role === "user");
  const firstAssistant = messages.find((message) => message.role === "assistant");

  const userText = firstUser ? getMessageText(firstUser) : "";
  const assistantText = firstAssistant ? getMessageText(firstAssistant) : "";

  if (!userText || !assistantText) return null;

  return { userText, assistantText };
}

export async function generateChatTitle(messages: PersistedChatMessage[]) {
  const seed = getConversationSeed(messages);
  if (!seed) return null;

  const result = await generateText({
    model: resolveModel(TITLE_MODEL),
    prompt: [
      "Write a short title for this chat.",
      "Use the first user message and first assistant reply.",
      "Return only the title, no quotes or punctuation at the ends.",
      "Keep it under 6 words and prefer title case.",
      `User: ${seed.userText}`,
      `Assistant: ${seed.assistantText}`,
    ].join("\n"),
    temperature: 0,
    maxOutputTokens: 20,
  });

  const title = sanitizeTitle(result.text);
  return title || null;
}

export function shouldGenerateChatTitle(messages: PersistedChatMessage[]) {
  return getConversationSeed(messages) !== null;
}
