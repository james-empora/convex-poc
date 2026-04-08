"use server";

import { z } from "zod";
import { api } from "@/convex/_generated/api";
import { createAuthenticatedConvexHttpClient } from "@/lib/convex/client";
import { runSkillAction } from "@/lib/skills/run-skill.server";

const GenerateMapInput = z.object({
  fileId: z.string().uuid(),
});

export async function generateMapAction(input: unknown) {
  const decoded = GenerateMapInput.parse(input);
  const convex = await createAuthenticatedConvexHttpClient();
  const skills = await convex.query(api.skills.listSkills, { enabledOnly: true });
  const skill = skills.skills.find((entry) => entry.slug === "generate-action-items");
  if (!skill) {
    throw new Error("Action items skill not configured");
  }

  return await runSkillAction({
    skillId: skill.id,
    fileId: decoded.fileId,
  });
}
