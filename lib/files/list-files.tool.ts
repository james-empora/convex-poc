import { defineTool } from "@/lib/tools/define-tool";

export const listFilesTool = defineTool({
  gatewayName: "list_files",
  group: "files",
  gatewayDescription:
    "List title/escrow files in the portfolio. Returns file summaries with " +
    "property address, status, parties, and closer. Supports filtering by " +
    "status and file type, with cursor-based pagination.",
});
