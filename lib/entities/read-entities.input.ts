import { z } from "zod";
import { EntityTypeSchema } from "@/lib/validators/enums";

export const ReadEntitiesInput = z.object({
  entityType: EntityTypeSchema,
  id: z.string().uuid().optional(),
  limit: z.coerce.number().optional(),
  cursor: z.string().optional(),
});
