import { defineTool } from "@/lib/tools/define-tool";

export const removeFilePartyTool = defineTool({
  gatewayName: "remove_file_party",
  group: "files",
  gatewayDescription:
    "Remove a party from a title/escrow file (soft-delete). Accepts either " +
    "the filePartyId directly, or the combination of fileId + entityType + " +
    "entityId + role.",
  ui: {
    label: "Remove Party",
    loadingLabel: "Removing party...",
    icon: "user-minus",
    detailKind: "remove-party",
  },
});
