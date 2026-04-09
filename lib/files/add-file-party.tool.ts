import { defineTool } from "@/lib/tools/define-tool";
import { AddFilePartyInput } from "@/lib/files/add-file-party.input";

export const addFilePartyTool = defineTool({
  gatewayName: "add_file_party",
  group: "files",
  gatewayDescription:
    "Add a party (individual, organization, brokerage, or lender) to a " +
    "title/escrow file with a specific role. The side (buyer_side, seller_side, " +
    "internal) is auto-inferred from the role if not provided. Use search_entities " +
    "to find the entity first, or create_entity if they don't exist yet.",
  inputSchema: AddFilePartyInput,
  ui: {
    label: "Add Party",
    loadingLabel: "Adding party...",
    icon: "user-plus",
    detailKind: "add-party",
  },
});
