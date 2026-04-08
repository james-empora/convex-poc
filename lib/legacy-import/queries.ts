"use client";

import { api } from "@/convex/_generated/api";
import { useConvexMutationResult, useConvexQueryResult } from "@/lib/convex/hooks";

export function useLegacyImports() {
  return useConvexQueryResult(api.legacyImports.listImports, {});
}

export function useImportSnapshot() {
  return useConvexMutationResult(api.legacyImports.importSnapshot);
}

export function useRefreshLegacyImport() {
  return useConvexMutationResult(api.legacyImports.refreshImport);
}

export function useDeleteLegacyImport() {
  return useConvexMutationResult(api.legacyImports.deleteImport);
}
