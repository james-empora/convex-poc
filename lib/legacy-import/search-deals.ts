import { callAdminTool } from "@/lib/mcp/admin-client";
import type { RailsAdminSearchResult } from "./types";

function buildSearchArgs(query: string): Record<string, unknown> {
  const value = query.trim();

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    return { deal_id: value };
  }

  if (/^\d{3,6}$/.test(value) || /^[A-Z]{1,4}-\d{2,4}-?\d{2,6}$/i.test(value)) {
    return { file_number: value };
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return { email: value };
  }

  if (
    /\d/.test(value) &&
    /\b(st|rd|ave|dr|ln|ct|blvd|way|pl|cir|pkwy|ter|hwy|street|road|avenue|drive|lane|court|boulevard|place|circle|parkway|terrace|highway)\b/i.test(value)
  ) {
    return { property_address: value };
  }

  if (/^\d+\s/.test(value) || value.includes(",")) {
    return { property_address: value };
  }

  return { name: value, property_address: value };
}

export async function railsAdminSearch(query: string): Promise<RailsAdminSearchResult[]> {
  const raw = await callAdminTool<{ deals: Array<Record<string, unknown>> }>(
    "search_deals",
    buildSearchArgs(query),
  );

  if (!raw?.deals || !Array.isArray(raw.deals)) {
    return [];
  }

  return raw.deals.map((deal) => ({
    railsDealId: String(deal.id ?? deal.deal_id ?? ""),
    fileNumber: String(deal.file_number ?? ""),
    propertyAddress: String(deal.property_address ?? deal.address ?? ""),
    city: String(deal.city ?? ""),
    state: String(deal.state ?? ""),
    dealStatus: String(deal.status ?? deal.deal_status ?? ""),
    fileType: String(deal.file_type ?? deal.transaction_type ?? "purchase"),
    partiesSummary: String(deal.parties_summary ?? deal.parties ?? ""),
  }));
}
