"use client";

import { api } from "@/convex/_generated/api";
import { useConvexQueryResult } from "@/lib/convex/hooks";

export function useActionItems(fileId: string | null) {
  return useConvexQueryResult(api.actionItems.listItems, fileId ? { fileId } : "skip");
}
