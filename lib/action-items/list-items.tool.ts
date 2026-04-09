import { defineTool } from "@/lib/tools/define-tool";
import { ListActionItemsInput } from "@/lib/action-items/tool-inputs.input";

export const listActionItemsTool = defineTool({
  gatewayName: "list_action_items",
  group: "action-items",
  inputSchema: ListActionItemsInput,
  gatewayDescription:
    "List all action items for a title/escrow file, including their " +
    "dependencies, blocked status, and completion rules. Returns pending " +
    "and completed items (excludes deleted).",
});
