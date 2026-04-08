import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CoordinatorChat } from "./_components/coordinator-chat";
import { createAuthenticatedConvexHttpClient } from "@/lib/convex/client";
import { api } from "@/convex/_generated/api";

export const metadata: Metadata = {
  title: "Coordinator | Empora",
};

export default async function CoordinatorPage() {
  const convex = await createAuthenticatedConvexHttpClient();
  const chats = await convex.query(api.chat.listCoordinatorChats, {});

  if (chats.length > 0) {
    redirect(`/coordinator/${chats[0].id}`);
  }

  // No saved chats — render a draft chat
  return <CoordinatorChat chatId={crypto.randomUUID()} isNew />;
}
