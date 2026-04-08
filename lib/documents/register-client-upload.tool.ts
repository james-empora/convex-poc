import { defineTool } from "@/lib/tools/define-tool";

export const registerClientUploadTool = defineTool({
  gatewayName: "register_document",
  group: "documents",
  legacyToolNames: ["registerClientUpload"],
  gatewayDescription:
    "Register a document that was uploaded to blob storage. " +
    "Creates a database record and triggers text extraction for supported " +
    "file types (pdf, png, jpg, tiff). Use this after a user uploads a file in chat.",
  ui: {
    label: "Upload Document",
    icon: "upload",
    detailKind: "register",
  },
});
