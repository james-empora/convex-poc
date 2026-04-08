import { z } from "zod";
import { FORM_VARIANT_META_KEY } from "@/lib/forms/form-variant";
import { FORM_RELATION_META_KEY } from "@/lib/forms/relation";
import {
  EntityTypeSchema,
  FilePartyRoleSchema,
  FilePartySideSchema,
} from "@/lib/validators/enums";

export const AddFilePartyInput = z.object({
  fileId: z.string().uuid().meta({
    title: "File",
    [FORM_RELATION_META_KEY]: { domain: "files", displayField: "fileNumber" },
  }).describe("The file to add the party to"),
  entityType: EntityTypeSchema.meta({ title: "Entity Type" }).describe("Type of entity being added"),
  entityId: z.string().uuid().meta({
    title: "Entity",
    [FORM_RELATION_META_KEY]: { domain: "entities", displayField: "name", secondaryField: "email" },
  }).describe("Search by name or email"),
  role: FilePartyRoleSchema.meta({ title: "Role" }).describe("Role of the party on this file"),
  side: FilePartySideSchema.optional().meta({ title: "Side" }).describe("Side of the transaction (auto-inferred from role if omitted)"),
  orderIndex: z.number().int().min(0).default(0).meta({ title: "Order Index" }),
}).meta({ [FORM_VARIANT_META_KEY]: "editable" });
export type AddFilePartyInput = z.infer<typeof AddFilePartyInput>;
