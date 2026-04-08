import { z } from "zod";
import {
  AttachmentResourceTypeSchema,
  DocumentFiletypeSchema,
  DocumentOriginSchema,
  DocumentTypeSchema,
} from "@/lib/validators/enums";

// ---------------------------------------------------------------------------
// Schema — resourceType and resourceId are either both present or both absent
// ---------------------------------------------------------------------------

const BaseFields = {
  name: z.string().min(1).meta({ title: "Document Name" }).describe("Display name, e.g. 'Purchase Contract.pdf'"),
  documentType: DocumentTypeSchema.meta({ title: "Document Type" }),
  filetype: DocumentFiletypeSchema.meta({ title: "File Type" }),
  storagePath: z.string().meta({ title: "Storage Path" }).describe("Vercel Blob URL from client upload"),
  fileSizeBytes: z.number().int().min(0).meta({ title: "File Size (bytes)" }),
  origin: DocumentOriginSchema.default("upload").meta({ title: "Origin" }),
};

const WithoutAttachment = z.object(BaseFields);

const WithAttachment = z.object({
  ...BaseFields,
  resourceType: AttachmentResourceTypeSchema.meta({ title: "Resource Type" }).describe("Type of resource to attach the document to"),
  resourceId: z.string().uuid().meta({ title: "Resource ID" }).describe("ID of the resource to attach the document to"),
});

export const RegisterClientUploadInput = z.union([
  WithAttachment,
  WithoutAttachment,
]).describe("Register an uploaded document. If attaching to a resource, both resourceType and resourceId are required.");
export type RegisterClientUploadInput = z.infer<typeof RegisterClientUploadInput>;
