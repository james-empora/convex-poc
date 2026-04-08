import { z } from "zod";
import { FORM_VARIANT_META_KEY } from "@/lib/forms/form-variant";
import { EntityTypeSchema } from "@/lib/validators/enums";

export const SearchEntitiesInput = z.object({
  query: z.string().min(1).meta({ title: "Search Query" }).describe("Name or email to search for"),
  entityType: EntityTypeSchema.optional().meta({ title: "Entity Type" }).describe("Filter to a specific entity type"),
  limit: z.number().int().min(1).max(50).default(20).meta({ title: "Limit" }).describe("Maximum number of results"),
}).meta({ [FORM_VARIANT_META_KEY]: "inline" });
export type SearchEntitiesInput = z.infer<typeof SearchEntitiesInput>;
