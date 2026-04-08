"use client";

import { api } from "@/convex/_generated/api";
import { useConvexQueryResult } from "@/lib/convex/hooks";

export function useFindings(fileId: string | null) {
  return useConvexQueryResult(api.findings.listFindings, fileId ? { fileId } : "skip");
}
