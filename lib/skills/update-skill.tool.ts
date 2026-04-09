import { defineTool } from "@/lib/tools/define-tool";
import { UpdateSkillInput } from "@/lib/skills/tool-inputs.input";

export const updateSkillTool = defineTool({
  gatewayName: "update_skill",
  group: "skills",
  inputSchema: UpdateSkillInput,
  gatewayDescription:
    "Update an existing AI skill's metadata, prompt template, or domain placements.",
});
