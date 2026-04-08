import { defineTool } from "@/lib/tools/define-tool";

export const updateLineItemTool = defineTool({
  actionName: "updateLineItem",
  gatewayName: "update_line_item",
  group: "finances",
  gatewayDescription:
    "Update an existing line item's amount, label, or party allocation. " +
    "Provide the line item ID and the fields to change with a reason.",
  ui: {
    label: "Update Line Item",
    loadingLabel: "Updating...",
    icon: "pencil",
    detailKind: "update-line-item",
  },
});
