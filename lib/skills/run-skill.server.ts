"use server";

import { start } from "workflow/api";
import { z } from "zod";
import { api } from "@/convex/_generated/api";
import { createAuthenticatedConvexHttpClient } from "@/lib/convex/client";
import { runSkillWorkflow } from "@/workflows/run-skill";

const RunSkillInput = z.object({
  skillId: z.string().uuid(),
  fileId: z.string().uuid(),
  resourceType: z.string().optional(),
  resourceId: z.string().uuid().optional(),
  customPrompt: z.string().optional(),
});

export async function runSkillAction(input: unknown) {
  const decoded = RunSkillInput.parse(input);
  const convex = await createAuthenticatedConvexHttpClient();
  const result = await convex.mutation(api.skills.startRun, decoded);
  await start(runSkillWorkflow, [result.threadId]);
  return result;
}
