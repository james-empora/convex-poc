import { defineTool } from "@/lib/tools/define-tool";
import { ReadEntitiesInput } from "@/lib/entities/read-entities.input";

export const readEntitiesTool = defineTool({
  gatewayName: "read_entities",
  group: "entities",
  inputSchema: ReadEntitiesInput,
  ui: {
    label: "Search Records",
    icon: "search",
    detailKind: "search",
  },
});
