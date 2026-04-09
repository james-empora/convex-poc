import { defineTool } from "@/lib/tools/define-tool";
import { ReassignActionItemInput } from "@/lib/action-items/tool-inputs.input";

export const reassignActionItemTool = defineTool({
  gatewayName: "reassign_action_item",
  group: "action-items",
  inputSchema: ReassignActionItemInput,
  gatewayDescription:
    "Reassign an action item to a different entity (individual, organization, " +
    "etc.) with an optional file party role.",
});
