import { defineTool } from "@/lib/tools/define-tool";

export const addFindingSourceTool = defineTool({
  gatewayName: "add_finding_source",
  group: "findings",
  gatewayDescription:
    "Add a document source to an existing finding. Use this when a document " +
    "provides additional evidence for a finding that already exists on the file.",
});
