import { defineTool } from "@/lib/tools/define-tool";
import { AddLineItemInput } from "@/lib/finances/tool-inputs.input";

export const addLineItemTool = defineTool({
  actionName: "addLineItem",
  gatewayName: "add_line_item",
  group: "finances",
  gatewayDescription:
    "Add a new line item to the settlement statement (charge, credit, or fee). " +
    "Specify the label, section, amount in cents, and which parties are debited/credited.",
  inputSchema: AddLineItemInput,
  ui: {
    label: "Add Line Item",
    loadingLabel: "Adding line item...",
    icon: "plus-circle",
    detailKind: "add-line-item",
  },
});
