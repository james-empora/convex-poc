import { defineTool } from "@/lib/tools/define-tool";
import { CheckMissingItemsInput } from "@/lib/finances/tool-inputs.input";

export const checkMissingItemsTool = defineTool({
  actionName: "checkMissingItems",
  gatewayName: "check_missing_items",
  group: "finances",
  gatewayDescription:
    "Check if commonly required line items are missing from the statement based on " +
    "the deal's state, county, and type. Returns suggestions for items to add.",
  inputSchema: CheckMissingItemsInput,
  ui: {
    label: "Check Missing Items",
    loadingLabel: "Checking for missing items...",
    icon: "search",
    detailKind: "line-items",
  },
});
