import { defineTool } from "@/lib/tools/define-tool";

export const getSkillTool = defineTool({
  gatewayName: "get_skill",
  group: "skills",
  gatewayDescription:
    "Get a single AI skill by ID, including all its domain placements.",
});
