import { z } from "zod";

const uuid = z.string().uuid();

const placementInput = z.object({
  domain: z.string(),
  subDomain: z.string().optional(),
  sortOrder: z.coerce.number().optional(),
});

export const ListSkillsInput = z.object({
  domain: z.string().optional(),
  subDomain: z.string().optional(),
  enabledOnly: z.boolean().optional(),
});

export const CreateSkillInput = z.object({
  slug: z.string(),
  label: z.string(),
  description: z.string().optional(),
  promptTemplate: z.string(),
  autoSend: z.boolean().optional(),
  enabled: z.boolean().optional(),
  placements: z.array(placementInput),
});

export const UpdateSkillInput = z.object({
  skillId: uuid,
  label: z.string().optional(),
  description: z.string().optional(),
  promptTemplate: z.string().optional(),
  autoSend: z.boolean().optional(),
  enabled: z.boolean().optional(),
  placements: z.array(placementInput).optional(),
});
