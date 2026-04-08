import { defineTool } from "@/lib/tools/define-tool";

export const listActionItemsTool = defineTool({
  gatewayName: "list_action_items",
  group: "action-items",
  gatewayDescription:
    "List all action items for a title/escrow file, including their " +
    "dependencies, blocked status, and completion rules. Returns pending " +
    "and completed items (excludes deleted).",
});
