import { describe, it, expect } from "vitest";
import { createStore } from "jotai";
import {
  selectedToolNameAtom,
  selectedToolAtom,
  selectedToolGroupAtom,
  searchQueryAtom,
  filteredGroupedToolsAtom,
  visibleToolCountAtom,
  activeToolTabAtom,
} from "./atoms";

describe("tools catalog atoms", () => {
  describe("selectedToolAtom", () => {
    it("returns null when no tool is selected", () => {
      const store = createStore();
      expect(store.get(selectedToolAtom)).toBeNull();
    });

    it("returns the tool matching the selected gateway name", () => {
      const store = createStore();
      store.set(selectedToolNameAtom, "open_file");
      const tool = store.get(selectedToolAtom);
      expect(tool).not.toBeNull();
      expect(tool!.gatewayName).toBe("open_file");
    });

    it("returns null when selected name does not match any tool", () => {
      const store = createStore();
      store.set(selectedToolNameAtom, "nonexistent_tool");
      expect(store.get(selectedToolAtom)).toBeNull();
    });
  });

  describe("selectedToolGroupAtom", () => {
    it("returns null when no tool is selected", () => {
      const store = createStore();
      expect(store.get(selectedToolGroupAtom)).toBeNull();
    });

    it("returns the group id for the selected tool", () => {
      const store = createStore();
      store.set(selectedToolNameAtom, "open_file");
      expect(store.get(selectedToolGroupAtom)).toBe("files");
    });

    it("returns the correct group for a finance tool", () => {
      const store = createStore();
      store.set(selectedToolNameAtom, "get_ledger_summary");
      expect(store.get(selectedToolGroupAtom)).toBe("finances");
    });
  });

  describe("filteredGroupedToolsAtom", () => {
    it("returns all groups when search is empty", () => {
      const store = createStore();
      const groups = store.get(filteredGroupedToolsAtom);
      expect(groups.length).toBeGreaterThanOrEqual(7);

      const groupIds = groups.map((g) => g.id);
      expect(groupIds).toContain("files");
      expect(groupIds).toContain("documents");
      expect(groupIds).toContain("entities");
      expect(groupIds).toContain("finances");
      expect(groupIds).toContain("findings");
      expect(groupIds).toContain("skills");
      expect(groupIds).toContain("action-items");
      expect(groupIds).toContain("audit");
    });

    it("filters by gateway name", () => {
      const store = createStore();
      store.set(searchQueryAtom, "open_file");
      const groups = store.get(filteredGroupedToolsAtom);
      const allTools = groups.flatMap((g) => g.tools);
      expect(allTools.length).toBeGreaterThanOrEqual(1);
      expect(allTools.some((t) => t.gatewayName === "open_file")).toBe(true);
    });

    it("filters by UI label", () => {
      const store = createStore();
      store.set(searchQueryAtom, "Open File");
      const groups = store.get(filteredGroupedToolsAtom);
      const allTools = groups.flatMap((g) => g.tools);
      expect(allTools.some((t) => t.gatewayName === "open_file")).toBe(true);
    });

    it("filters by description", () => {
      const store = createStore();
      store.set(searchQueryAtom, "escrow");
      const groups = store.get(filteredGroupedToolsAtom);
      const allTools = groups.flatMap((g) => g.tools);
      expect(allTools.length).toBeGreaterThanOrEqual(1);
    });

    it("is case-insensitive", () => {
      const store = createStore();
      store.set(searchQueryAtom, "OPEN_FILE");
      const groups = store.get(filteredGroupedToolsAtom);
      const allTools = groups.flatMap((g) => g.tools);
      expect(allTools.some((t) => t.gatewayName === "open_file")).toBe(true);
    });

    it("returns empty groups when nothing matches", () => {
      const store = createStore();
      store.set(searchQueryAtom, "zzz_nonexistent_zzz");
      const groups = store.get(filteredGroupedToolsAtom);
      expect(groups).toEqual([]);
    });

    it("excludes empty groups from results", () => {
      const store = createStore();
      store.set(searchQueryAtom, "open_file");
      const groups = store.get(filteredGroupedToolsAtom);
      for (const group of groups) {
        expect(group.tools.length).toBeGreaterThan(0);
      }
    });
  });

  describe("visibleToolCountAtom", () => {
    it("counts all tools when search is empty", () => {
      const store = createStore();
      const count = store.get(visibleToolCountAtom);
      expect(count).toBeGreaterThanOrEqual(35);
    });

    it("counts only matching tools when search is active", () => {
      const store = createStore();
      const totalCount = store.get(visibleToolCountAtom);
      store.set(searchQueryAtom, "open_file");
      const filteredCount = store.get(visibleToolCountAtom);
      expect(filteredCount).toBeGreaterThanOrEqual(1);
      expect(filteredCount).toBeLessThan(totalCount);
    });
  });

  describe("activeToolTabAtom", () => {
    it("defaults to overview", () => {
      const store = createStore();
      expect(store.get(activeToolTabAtom)).toBe("overview");
    });
  });
});
