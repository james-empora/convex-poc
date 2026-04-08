"use client";

import { api } from "@/convex/_generated/api";
import { useConvexMutationResult, useConvexQueryResult } from "@/lib/convex/hooks";
import type { FileFilters } from "@/lib/files/list-files";

export function useFiles(filters?: FileFilters) {
  return useConvexQueryResult(api.files.listFiles, {
    status: filters?.status,
    fileType: filters?.fileType,
  });
}

export function useFile(fileId: string | null) {
  return useConvexQueryResult(api.files.getFile, fileId ? { fileId } : "skip");
}

export function useAddFileParty() {
  return useConvexMutationResult(api.files.addFileParty);
}

export function useRemoveFileParty() {
  return useConvexMutationResult(api.files.removeFileParty);
}
