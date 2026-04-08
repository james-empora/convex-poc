import { defineTool } from "@/lib/tools/define-tool";

export const getHistoryTool = defineTool({
  gatewayName: "get_history",
  group: "audit",
  gatewayDescription:
    "Look up the audit history for any record by its ID. Returns a paginated " +
    "list of changes (INSERT, UPDATE, DELETE) with before/after data, changed " +
    "fields, and who made the change. Optionally filter by table name.",
});
