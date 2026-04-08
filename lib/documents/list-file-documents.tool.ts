import { defineTool } from "@/lib/tools/define-tool";

export const listFileDocumentsTool = defineTool({
  gatewayName: "list_file_documents",
  group: "documents",
  gatewayDescription:
    "List all documents attached to a title/escrow file, ordered by most " +
    "recent first. Returns document name, type, size, and storage path.",
});
