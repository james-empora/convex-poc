import { callAdminTool } from "@/lib/mcp/admin-client";
import type { DealSnapshot } from "./types";

async function safeCall<T>(tool: string, args: Record<string, unknown>): Promise<T | null> {
  try {
    return await callAdminTool<T>(tool, args);
  } catch {
    return null;
  }
}

export async function fetchSnapshot(dealId: string): Promise<DealSnapshot> {
  const [
    dealInfo,
    titleholders,
    documents,
    ledgerStatus,
    lineItems,
    paymentStatus,
    fundingStatus,
    workflow,
    ctcPlan,
    signing,
    recording,
    actionItems,
    notes,
    messages,
  ] = await Promise.all([
    callAdminTool<Record<string, unknown>>("get_deal_info", { deal_id: dealId }),
    callAdminTool<Record<string, unknown>>("get_titleholders", { deal_id: dealId }),
    callAdminTool<Record<string, unknown>>("get_documents", { deal_id: dealId }),
    safeCall<Record<string, unknown>>("get_ledger_status", { deal_id: dealId }),
    safeCall<unknown>("get_line_items", { deal_id: dealId }),
    safeCall<Record<string, unknown>>("get_payment_status", { deal_id: dealId }),
    safeCall<Record<string, unknown>>("get_funding_status", { deal_id: dealId }),
    safeCall<Record<string, unknown>>("get_workflow_status", { deal_id: dealId }),
    safeCall<Record<string, unknown>>("get_ctc_plan_status", { deal_id: dealId }),
    safeCall<Record<string, unknown>>("get_signing_status", { deal_id: dealId }),
    safeCall<Record<string, unknown>>("get_recording_status", { deal_id: dealId }),
    safeCall<Record<string, unknown>>("get_action_items", { deal_id: dealId }),
    safeCall<Record<string, unknown>>("get_notes", { deal_id: dealId }),
    safeCall<Record<string, unknown>>("get_messages", { deal_id: dealId }),
  ]);

  return {
    dealInfo,
    titleholders,
    documents,
    ledgerStatus,
    lineItems: Array.isArray(lineItems)
      ? (lineItems as Array<Record<string, unknown>>)
      : ((lineItems as Record<string, unknown> | null) ?? null),
    paymentStatus,
    fundingStatus,
    workflow,
    ctcPlan,
    signing,
    recording,
    actionItems,
    notes,
    messages,
    fetchedAt: new Date().toISOString(),
  };
}
