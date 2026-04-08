import { defineTool } from "@/lib/tools/define-tool";

export const deleteSkillTool = defineTool({
  gatewayName: "delete_skill",
  group: "skills",
  gatewayDescription: "Soft-delete an AI skill so it no longer appears in any UI.",
});
