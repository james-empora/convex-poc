"use server";

import { api } from "@/convex/_generated/api";
import { createAuthenticatedConvexHttpClient } from "@/lib/convex/client";
import { UpdateChatTitleInput } from "./update-chat-title.input";

export async function updateChatTitleAction(input: unknown) {
  const decoded = UpdateChatTitleInput.parse(input);
  const convex = await createAuthenticatedConvexHttpClient();
  return await convex.mutation(api.chat.updateChatTitle, decoded);
}
