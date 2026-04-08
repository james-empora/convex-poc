"use server";

import type { RailsAdminSearchResult } from "./types";
import { railsAdminSearch } from "./search-deals";

export async function railsAdminSearchAction(
  query: string,
): Promise<{ data: RailsAdminSearchResult[] } | { error: string }> {
  try {
    return { data: await railsAdminSearch(query) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Search failed" };
  }
}
