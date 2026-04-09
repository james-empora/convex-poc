import { z } from "zod";

const uuid = z.string().uuid();

export const CreateFindingInput = z.object({
  fileId: uuid,
  findingType: z.string(),
  summary: z.string(),
  data: z.record(z.string(), z.unknown()).optional(),
  source: z.object({
    documentId: uuid,
    excerpt: z.string().optional(),
    pageNumber: z.coerce.number().optional(),
  }),
});

export const AddFindingSourceInput = z.object({
  findingId: uuid,
  sourceType: z.literal("document"),
  sourceId: uuid,
  excerpt: z.string().optional(),
  pageNumber: z.coerce.number().optional(),
});
