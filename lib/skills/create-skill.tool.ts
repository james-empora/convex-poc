import { defineTool } from "@/lib/tools/define-tool";
import { CreateSkillInput } from "@/lib/skills/tool-inputs.input";

export const createSkillTool = defineTool({
  gatewayName: "create_skill",
  group: "skills",
  inputSchema: CreateSkillInput,
  gatewayDescription:
    "Create a new AI skill with a prompt template and domain placements. " +
    "Skills appear as selectable actions in the UI for the specified domains.",
});
