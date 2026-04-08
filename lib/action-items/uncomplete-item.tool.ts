import { defineTool } from "@/lib/tools/define-tool";

export const uncompleteActionItemTool = defineTool({
  gatewayName: "uncomplete_action_item",
  group: "action-items",
  gatewayDescription:
    "Revert a completed action item back to pending status. Only works " +
    "on items that are currently marked as completed.",
  ui: {
    label: "Uncomplete Item",
    loadingLabel: "Reverting...",
    icon: "x-circle",
    detailKind: "register",
  },
});
