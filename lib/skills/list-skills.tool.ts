import { defineTool } from "@/lib/tools/define-tool";

export const listSkillsTool = defineTool({
  gatewayName: "list_skills",
  group: "skills",
  gatewayDescription:
    "List available AI skills, optionally filtered by domain and sub-domain. " +
    "Returns skills with their placements indicating where they appear in the UI.",
});
