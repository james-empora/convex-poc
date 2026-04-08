import type { Metadata } from "next";
import { CoordinatorChat } from "../_components/coordinator-chat";
import { createAuthenticatedConvexHttpClient } from "@/lib/convex/client";
import { api } from "@/convex/_generated/api";
import type { PersistedChatMessage } from "@/lib/chat/threads";

export const metadata: Metadata = {
  title: "Coordinator | Empora",
};

export default async function CoordinatorChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;
  const convex = await createAuthenticatedConvexHttpClient();
  const chat = await convex.query(api.chat.getChat, { chatId });

  return (
    <CoordinatorChat
      chatId={chatId}
      initialMessages={chat?.messages as PersistedChatMessage[] ?? []}
    />
  );
}
