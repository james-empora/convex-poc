import { defineTool } from "@/lib/tools/define-tool";

export const updateSkillTool = defineTool({
  gatewayName: "update_skill",
  group: "skills",
  gatewayDescription:
    "Update an existing AI skill's metadata, prompt template, or domain placements.",
});
