"use server";

import type { DealSnapshot } from "./types";
import { fetchSnapshot } from "./fetch-snapshot";

export async function fetchSnapshotAction(
  dealId: string,
): Promise<{ data: DealSnapshot } | { error: string }> {
  try {
    return { data: await fetchSnapshot(dealId) };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to fetch deal snapshot",
    };
  }
}
