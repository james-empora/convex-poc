import { defineTool } from "@/lib/tools/define-tool";

export const deleteActionItemTool = defineTool({
  gatewayName: "delete_action_item",
  group: "action-items",
  gatewayDescription:
    "Soft-delete an action item. The item remains in the database with " +
    "status 'deleted' for audit purposes but is hidden from active views.",
});
