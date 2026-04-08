import type { Metadata } from "next";
import { preloadQuery } from "convex/nextjs";
import { SkillsLayoutShell } from "./_components/skills-layout-shell";
import { api } from "@/convex/_generated/api";
import { createAuthenticatedConvexNextjsOptions } from "@/lib/convex/client";

export const metadata: Metadata = {
  title: "Skills | Empora",
};

export default async function SkillsPage() {
  const preloadedSkills = await preloadQuery(
    api.skills.listSkills,
    {},
    await createAuthenticatedConvexNextjsOptions(),
  );

  return (
    <div className="h-full overflow-hidden">
      <SkillsLayoutShell preloadedSkills={preloadedSkills} />
    </div>
  );
}
