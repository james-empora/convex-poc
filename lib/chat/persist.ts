import type { UIMessage } from "ai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { generateChatTitle, shouldGenerateChatTitle } from "@/lib/chat/title-generator";

type PersistChatCompletionInput = {
  convex: ConvexHttpClient;
  chatId: string;
  fileId?: string | null;
  messages: UIMessage[];
  model: string | null;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
  } | null;
};

export async function persistChatCompletion(input: PersistChatCompletionInput) {
  const saved = await input.convex.mutation(api.chat.saveChat, {
    chatId: input.chatId,
    fileId: input.fileId ?? null,
    messages: input.messages as unknown as Record<string, unknown>[],
    model: input.model,
    tokenUsage: input.tokenUsage ?? null,
  });

  if (
    saved.titleSource !== "derived" ||
    !shouldGenerateChatTitle(input.messages)
  ) {
    return saved;
  }

  const generatedTitle = await generateChatTitle(input.messages);
  if (!generatedTitle) return saved;

  await input.convex.mutation(api.chat.updateChatTitle, {
    chatId: input.chatId,
    title: generatedTitle,
    fileId: input.fileId ?? null,
    source: "generated",
  });

  return {
    ...saved,
    title: generatedTitle,
    titleSource: "generated" as const,
  };
}
