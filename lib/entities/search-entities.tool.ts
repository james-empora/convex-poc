import { defineTool } from "@/lib/tools/define-tool";
import { SearchEntitiesInput } from "@/lib/entities/search-entities.input";

export const searchEntitiesTool = defineTool({
  gatewayName: "search_entities",
  group: "entities",
  gatewayDescription:
    "Search for entities (individuals, organizations, brokerages, lenders) by name or email. " +
    "Use this to find an existing entity before adding them as a party to a file.",
  inputSchema: SearchEntitiesInput,
  ui: {
    label: "Search Entities",
    icon: "search",
    detailKind: "search",
  },
});
