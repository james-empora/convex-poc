import { defineTool } from "@/lib/tools/define-tool";

export const createEntityTool = defineTool({
  gatewayName: "create_entity",
  group: "entities",
  gatewayDescription:
    "Create a new entity (individual, organization, brokerage, or lender) with " +
    "optional email and phone. Use this when search_entities finds no match and " +
    "you need to create the entity before adding them as a party to a file.",
  ui: {
    label: "Create Entity",
    loadingLabel: "Creating entity...",
    icon: "user-plus",
    detailKind: "create-entity",
  },
});
