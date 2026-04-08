import { defineTool } from "@/lib/tools/define-tool";

export const createActionItemTool = defineTool({
  gatewayName: "create_action_item",
  group: "action-items",
  gatewayDescription:
    "Create a new action item for a title/escrow file. Requires a semantic " +
    "key (slug), title, and file ID. Optionally set priority, assignment, " +
    "due date, and completion rule.",
  ui: {
    label: "Create Action Item",
    loadingLabel: "Creating...",
    icon: "plus-circle",
    detailKind: "register",
  },
});
