import { defineTool } from "@/lib/tools/define-tool";

export const getActionItemTool = defineTool({
  gatewayName: "get_action_item",
  group: "action-items",
  gatewayDescription:
    "Get a single action item by ID, including its full dependency graph " +
    "(both blockers and dependents) and blocked status.",
});
