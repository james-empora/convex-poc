import { defineTool } from "@/lib/tools/define-tool";

export const getLineItemsTool = defineTool({
  actionName: "getLineItems",
  gatewayName: "get_line_items",
  group: "finances",
  gatewayDescription:
    "Get settlement statement line items for a ledger, optionally filtered by section. " +
    "Returns amounts, charges, overrides, and linked resources.",
  ui: {
    label: "Line Items",
    loadingLabel: "Loading statement...",
    icon: "list",
    detailKind: "line-items",
  },
});
