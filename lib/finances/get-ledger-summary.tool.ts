import { defineTool } from "@/lib/tools/define-tool";

export const getLedgerSummaryTool = defineTool({
  actionName: "getLedgerSummary",
  gatewayName: "get_ledger_summary",
  group: "finances",
  gatewayDescription:
    "Get the financial summary for a file's ledger including party balances, " +
    "funding status, pending proposals count, and drift indicators.",
  ui: {
    label: "Ledger Summary",
    loadingLabel: "Fetching balances...",
    icon: "bar-chart",
    detailKind: "ledger-summary",
  },
});
