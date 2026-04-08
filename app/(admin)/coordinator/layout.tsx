import { CoordinatorShell } from "./_components/coordinator-shell";
import { createAuthenticatedConvexHttpClient } from "@/lib/convex/client";
import { api } from "@/convex/_generated/api";

export default async function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const convex = await createAuthenticatedConvexHttpClient();
  const chats = await convex.query(api.chat.listCoordinatorChats, {});

  return <CoordinatorShell chats={chats}>{children}</CoordinatorShell>;
}
