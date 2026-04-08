import { defineTool } from "@/lib/tools/define-tool";

export const readEntitiesTool = defineTool({
  gatewayName: "read_entities",
  group: "entities",
  ui: {
    label: "Search Records",
    icon: "search",
    detailKind: "search",
  },
});
