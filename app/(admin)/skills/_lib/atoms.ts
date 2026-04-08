"use client";

import { atom } from "jotai";
import type { SkillWithPlacements } from "@/lib/skills/list-skills";

// Hydrated from RSC
export const skillsAtom = atom<SkillWithPlacements[]>([]);

// UI selection
export const selectedSkillIdAtom = atom<string | null>(null);

// Derived: selected skill
export const selectedSkillAtom = atom((get) => {
  const id = get(selectedSkillIdAtom);
  return id ? get(skillsAtom).find((s) => s.id === id) ?? null : null;
});

// Search filter
export const skillsSearchQueryAtom = atom("");

// Derived: filtered skills
export const filteredSkillsAtom = atom((get) => {
  const skills = get(skillsAtom);
  const query = get(skillsSearchQueryAtom).toLowerCase();
  if (!query) return skills;
  return skills.filter(
    (s) =>
      s.label.toLowerCase().includes(query) ||
      s.slug.toLowerCase().includes(query) ||
      s.description?.toLowerCase().includes(query),
  );
});

// Tab selection for content well
export type SkillTab = "overview" | "usage" | "history";
export const skillsActiveTabAtom = atom<SkillTab>("overview");
