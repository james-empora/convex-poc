"use client";

import { useEffect } from "react";
import { usePreloadedQuery, type Preloaded } from "convex/react";
import { useSetAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import {
  Group,
  Panel,
  HorizontalSeparator,
  useDefaultLayout,
  useSafeStorage,
  useIsMounted,
} from "@/components/composite/resizable-panels";
import type { api } from "@/convex/_generated/api";
import type { SkillWithPlacements } from "@/lib/skills/list-skills";
import { skillsAtom } from "../_lib/atoms";
import { SkillsRail } from "./skills-rail";
import { SkillsContentWell } from "./skills-content-well";

const PANEL_IDS = ["skills-rail", "skills-content"] as const;

interface SkillsLayoutShellProps {
  preloadedSkills: Preloaded<typeof api.skills.listSkills>;
}

export function SkillsLayoutShell({ preloadedSkills }: SkillsLayoutShellProps) {
  const { skills } = usePreloadedQuery(preloadedSkills) as { skills: SkillWithPlacements[] };
  useHydrateAtoms([[skillsAtom, skills]]);

  // Keep atom in sync when RSC re-renders after router.refresh()
  const setSkills = useSetAtom(skillsAtom);
  useEffect(() => {
    setSkills(skills);
  }, [skills, setSkills]);

  const mounted = useIsMounted();
  const storage = useSafeStorage();

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: "skills-workspace",
    panelIds: [...PANEL_IDS],
    storage,
  });

  if (!mounted) {
    return <div className="h-full bg-onyx-5" />;
  }

  return (
    <Group
      orientation="horizontal"
      defaultLayout={
        defaultLayout ?? { "skills-rail": 22, "skills-content": 78 }
      }
      onLayoutChanged={onLayoutChanged}
      className="h-full"
    >
      <Panel id="skills-rail" minSize="16%" maxSize="35%">
        <div className="flex h-full flex-col overflow-hidden border-r border-onyx-20 bg-white">
          <SkillsRail />
        </div>
      </Panel>

      <HorizontalSeparator />

      <Panel id="skills-content" minSize="50%">
        <div className="flex h-full flex-col overflow-hidden bg-onyx-5">
          <SkillsContentWell />
        </div>
      </Panel>
    </Group>
  );
}
