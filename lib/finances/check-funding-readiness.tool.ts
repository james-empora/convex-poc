import { defineTool } from "@/lib/tools/define-tool";

export const checkFundingReadinessTool = defineTool({
  actionName: "checkFundingReadiness",
  gatewayName: "check_funding_readiness",
  group: "finances",
  gatewayDescription:
    "Check funding readiness for all parties — compares balances owed vs payments received. " +
    "Returns funding gaps and alerts for parties close to or fully funded.",
  ui: {
    label: "Funding Readiness",
    loadingLabel: "Checking funding...",
    icon: "bar-chart",
    detailKind: "ledger-summary",
  },
});
