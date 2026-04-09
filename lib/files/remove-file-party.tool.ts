import { defineTool } from "@/lib/tools/define-tool";
import { RemoveFilePartyInput } from "@/lib/files/remove-file-party.input";

export const removeFilePartyTool = defineTool({
  gatewayName: "remove_file_party",
  group: "files",
  inputSchema: RemoveFilePartyInput,
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
