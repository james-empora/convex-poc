import { describe, it, expect } from "vitest";
import { createStore } from "jotai";
import {
  skillsAtom,
  selectedSkillIdAtom,
  selectedSkillAtom,
  skillsSearchQueryAtom,
  filteredSkillsAtom,
  skillsActiveTabAtom,
} from "./atoms";
import type { SkillWithPlacements } from "@/lib/skills/list-skills";

function makeSkill(overrides: Partial<SkillWithPlacements> = {}): SkillWithPlacements {
  return {
    id: "00000000-0000-4000-a000-000000000001",
    slug: "what-if-analysis",
    label: "What-if Analysis",
    description: "Run a what-if scenario",
    promptTemplate: "Analyze the ledger...",
    autoSend: true,
    enabled: true,
    createdAt: "2026-01-15T12:00:00Z",
    updatedAt: "2026-01-15T12:00:00Z",
    placements: [],
    ...overrides,
  };
}

const SKILL_A = makeSkill({
  id: "00000000-0000-4000-a000-000000000001",
  slug: "what-if-analysis",
  label: "What-if Analysis",
});

const SKILL_B = makeSkill({
  id: "00000000-0000-4000-a000-000000000002",
  slug: "ledger-review",
  label: "Ledger Review",
  description: "Review the ledger for issues",
});

const SKILL_C = makeSkill({
  id: "00000000-0000-4000-a000-000000000003",
  slug: "entity-lookup",
  label: "Entity Lookup",
  enabled: false,
});

describe("skills atoms", () => {
  describe("selectedSkillAtom", () => {
    it("returns null when no skill is selected", () => {
      const store = createStore();
      store.set(skillsAtom, [SKILL_A, SKILL_B]);
      expect(store.get(selectedSkillAtom)).toBeNull();
    });

    it("returns the selected skill by ID", () => {
      const store = createStore();
      store.set(skillsAtom, [SKILL_A, SKILL_B]);
      store.set(selectedSkillIdAtom, SKILL_B.id);
      expect(store.get(selectedSkillAtom)).toEqual(SKILL_B);
    });

    it("returns null when selected ID does not match any skill", () => {
      const store = createStore();
      store.set(skillsAtom, [SKILL_A]);
      store.set(selectedSkillIdAtom, "nonexistent-id");
      expect(store.get(selectedSkillAtom)).toBeNull();
    });
  });

  describe("filteredSkillsAtom", () => {
    it("returns all skills when search query is empty", () => {
      const store = createStore();
      store.set(skillsAtom, [SKILL_A, SKILL_B, SKILL_C]);
      expect(store.get(filteredSkillsAtom)).toHaveLength(3);
    });

    it("filters by label", () => {
      const store = createStore();
      store.set(skillsAtom, [SKILL_A, SKILL_B, SKILL_C]);
      store.set(skillsSearchQueryAtom, "ledger");
      expect(store.get(filteredSkillsAtom)).toEqual([SKILL_B]);
    });

    it("filters by slug", () => {
      const store = createStore();
      store.set(skillsAtom, [SKILL_A, SKILL_B, SKILL_C]);
      store.set(skillsSearchQueryAtom, "entity-lookup");
      expect(store.get(filteredSkillsAtom)).toEqual([SKILL_C]);
    });

    it("filters by description", () => {
      const store = createStore();
      store.set(skillsAtom, [SKILL_A, SKILL_B, SKILL_C]);
      store.set(skillsSearchQueryAtom, "issues");
      expect(store.get(filteredSkillsAtom)).toEqual([SKILL_B]);
    });

    it("is case-insensitive", () => {
      const store = createStore();
      store.set(skillsAtom, [SKILL_A, SKILL_B]);
      store.set(skillsSearchQueryAtom, "WHAT-IF");
      expect(store.get(filteredSkillsAtom)).toEqual([SKILL_A]);
    });

    it("returns empty array when nothing matches", () => {
      const store = createStore();
      store.set(skillsAtom, [SKILL_A, SKILL_B]);
      store.set(skillsSearchQueryAtom, "nonexistent");
      expect(store.get(filteredSkillsAtom)).toEqual([]);
    });
  });

  describe("skillsActiveTabAtom", () => {
    it("defaults to overview", () => {
      const store = createStore();
      expect(store.get(skillsActiveTabAtom)).toBe("overview");
    });

    it("can be set to other tabs", () => {
      const store = createStore();
      store.set(skillsActiveTabAtom, "usage");
      expect(store.get(skillsActiveTabAtom)).toBe("usage");
      store.set(skillsActiveTabAtom, "history");
      expect(store.get(skillsActiveTabAtom)).toBe("history");
    });
  });
});
