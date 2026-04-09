import { defineTool } from "@/lib/tools/define-tool";
import { CreateFindingInput } from "@/lib/findings/tool-inputs.input";

export const createFindingTool = defineTool({
  gatewayName: "create_finding",
  group: "findings",
  inputSchema: CreateFindingInput,
  gatewayDescription:
    "Create a new title finding with an initial source document reference. " +
    "Use this when the extracted text reveals a finding that does not already " +
    "exist for the file. Always check list_findings first to avoid duplicates.",
});
