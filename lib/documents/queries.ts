"use client";

import { api } from "@/convex/_generated/api";
import { useConvexQueryResult } from "@/lib/convex/hooks";

export function useFileDocuments(fileId: string | null) {
  return useConvexQueryResult(
    api.documents.listFileDocuments,
    fileId ? { fileId } : "skip",
  );
}

export function useDocument(documentId: string | null) {
  return useConvexQueryResult(
    api.documents.getDocument,
    documentId ? { documentId } : "skip",
  );
}
