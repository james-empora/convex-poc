import { defineTool } from "@/lib/tools/define-tool";

export const checkDriftTool = defineTool({
  actionName: "checkDrift",
  gatewayName: "check_drift",
  group: "finances",
  gatewayDescription:
    "Check for line items where the actual amount has drifted from the computed amount. " +
    "Returns items that may need re-syncing.",
  ui: {
    label: "Check Drift",
    loadingLabel: "Checking for drift...",
    icon: "list",
    detailKind: "line-items",
  },
});
