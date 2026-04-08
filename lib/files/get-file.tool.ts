import { defineTool } from "@/lib/tools/define-tool";

export const getFileTool = defineTool({
  gatewayName: "get_file",
  group: "files",
  gatewayDescription:
    "Get full details for a title/escrow file including property information, " +
    "all parties with contact details, team members, and financial metadata. " +
    "Use this after list_files to drill into a specific file.",
});
