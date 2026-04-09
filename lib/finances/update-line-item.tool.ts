import { defineTool } from "@/lib/tools/define-tool";
import { UpdateLineItemInput } from "@/lib/finances/tool-inputs.input";

export const updateLineItemTool = defineTool({
  actionName: "updateLineItem",
  gatewayName: "update_line_item",
  group: "finances",
  gatewayDescription:
    "Update an existing line item's amount, label, or party allocation. " +
    "Provide the line item ID and the fields to change with a reason.",
  inputSchema: UpdateLineItemInput,
  ui: {
    label: "Update Line Item",
    loadingLabel: "Updating...",
    icon: "pencil",
    detailKind: "update-line-item",
  },
});
