import { defineTool } from "@/lib/tools/define-tool";

export const completeActionItemTool = defineTool({
  gatewayName: "complete_action_item",
  group: "action-items",
  gatewayDescription:
    "Mark an action item as completed. Validates that the item is pending " +
    "and has no unresolved hard dependencies (blockers).",
  ui: {
    label: "Complete Item",
    loadingLabel: "Completing...",
    icon: "check-circle",
    detailKind: "register",
  },
});
