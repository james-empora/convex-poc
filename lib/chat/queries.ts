"use client";

import { api } from "@/convex/_generated/api";
import { useConvexQueryResult } from "@/lib/convex/hooks";

export function useChatThread(chatId: string | null) {
  return useConvexQueryResult(api.chat.getChat, chatId ? { chatId } : "skip");
}
