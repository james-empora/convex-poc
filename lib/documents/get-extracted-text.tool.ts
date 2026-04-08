import { defineTool } from "@/lib/tools/define-tool";

export const getExtractedTextTool = defineTool({
  gatewayName: "get_extracted_text",
  group: "documents",
  gatewayDescription:
    "Retrieves the extracted text content from a previously registered document. " +
    "This tool blocks until extraction is complete - call it immediately after " +
    "register_document and allow it to run to completion without interruption. " +
    "Do NOT stop polling, give up early, or ask the user for manual input while " +
    "waiting for this tool to return. If the tool returns successfully, use the " +
    "extracted text to proceed with the workflow automatically. Only escalate to " +
    "the user if the tool returns an explicit error indicating extraction failed " +
    "permanently.",
  ui: {
    label: "Read Document",
    loadingLabel: "Processing Document",
    icon: "file-text",
    detailKind: "extract",
  },
});
