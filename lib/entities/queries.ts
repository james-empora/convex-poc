"use client";

import { api } from "@/convex/_generated/api";
import { useConvexMutationResult, useConvexQueryResult } from "@/lib/convex/hooks";

type EntityType = "individual" | "organization" | "brokerage" | "lender";

export function useSearchEntities(query: string, entityType?: EntityType) {
  return useConvexQueryResult(
    api.entities.searchEntities,
    query.length > 0 ? { query, entityType } : "skip",
  );
}

export function useCreateEntity() {
  return useConvexMutationResult(api.entities.createEntity);
}
