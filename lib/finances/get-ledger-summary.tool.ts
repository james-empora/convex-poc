import { defineTool } from "@/lib/tools/define-tool";
import { GetLedgerSummaryInput } from "@/lib/finances/tool-inputs.input";

export const getLedgerSummaryTool = defineTool({
  actionName: "getLedgerSummary",
  gatewayName: "get_ledger_summary",
  group: "finances",
  gatewayDescription:
    "Get the financial summary for a file's ledger including party balances, " +
    "funding status, pending proposals count, and drift indicators.",
  inputSchema: GetLedgerSummaryInput,
  ui: {
    label: "Ledger Summary",
    loadingLabel: "Fetching balances...",
    icon: "bar-chart",
    detailKind: "ledger-summary",
  },
});
