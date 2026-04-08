import { defineTool } from "@/lib/tools/define-tool";

export const reassignActionItemTool = defineTool({
  gatewayName: "reassign_action_item",
  group: "action-items",
  gatewayDescription:
    "Reassign an action item to a different entity (individual, organization, " +
    "etc.) with an optional file party role.",
});
