import { defineTool } from "@/lib/tools/define-tool";

export const createSkillTool = defineTool({
  gatewayName: "create_skill",
  group: "skills",
  gatewayDescription:
    "Create a new AI skill with a prompt template and domain placements. " +
    "Skills appear as selectable actions in the UI for the specified domains.",
});
