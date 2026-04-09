import { defineTool } from "@/lib/tools/define-tool";
import { OpenFileInput } from "@/lib/files/open-file.input";

export const openFileTool = defineTool({
  gatewayName: "open_file",
  group: "files",
  gatewayDescription:
    "Open a new title/escrow file. Creates the property address, property record, " +
    "and file in one step. Use this after extracting information from a purchase " +
    "agreement, refinance application, or other intake document.",
  inputSchema: OpenFileInput,
  ui: {
    label: "Open File",
    icon: "folder-open",
    detailKind: "open-file",
  },
});
