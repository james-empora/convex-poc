import { z } from "zod";
import { EntityTypeSchema, FilePartyRoleSchema } from "@/lib/validators/enums";

const uuid = z.string().uuid();

export const RemoveFilePartyInput = z.object({
  filePartyId: uuid.optional(),
  fileId: uuid.optional(),
  entityType: EntityTypeSchema.optional(),
  entityId: uuid.optional(),
  role: FilePartyRoleSchema.optional(),
}).refine(
  (value) => value.filePartyId || (value.fileId && value.entityType && value.entityId && value.role),
  { message: "filePartyId or composite file/entity/role fields are required" },
);
