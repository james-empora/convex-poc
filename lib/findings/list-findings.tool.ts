import { defineTool } from "@/lib/tools/define-tool";

export const listFindingsTool = defineTool({
  gatewayName: "list_findings",
  group: "findings",
  gatewayDescription:
    "List all findings for a file, including their source evidence. " +
    "Returns findings with type, status, data payload, and linked document sources.",
});
