import { defineTool } from "@/lib/tools/define-tool";

export const getPaymentsTool = defineTool({
  actionName: "getPayments",
  gatewayName: "get_payments",
  group: "finances",
  gatewayDescription:
    "Get receipts and disbursements for a ledger with their status " +
    "(pending, posted, cleared, reconciled, voided).",
  ui: {
    label: "Payments",
    loadingLabel: "Loading payments...",
    icon: "credit-card",
    detailKind: "payments",
  },
});
