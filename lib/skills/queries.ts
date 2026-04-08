"use client";

import { api } from "@/convex/_generated/api";
import { useConvexQueryResult } from "@/lib/convex/hooks";

export function useSkills(domain?: string, subDomain?: string) {
  return useConvexQueryResult(api.skills.listSkills, {
    domain,
    subDomain,
    enabledOnly: true,
  });
}
