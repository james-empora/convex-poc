import { defineTool } from "@/lib/tools/define-tool";
import { ListSkillsInput } from "@/lib/skills/tool-inputs.input";

export const listSkillsTool = defineTool({
  gatewayName: "list_skills",
  group: "skills",
  inputSchema: ListSkillsInput,
  gatewayDescription:
    "List available AI skills, optionally filtered by domain and sub-domain. " +
    "Returns skills with their placements indicating where they appear in the UI.",
});
