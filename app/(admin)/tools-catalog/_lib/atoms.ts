"use client";

import { atom } from "jotai";
import type { ToolDefinition, ToolGroupId } from "@/lib/tools/define-tool";
import { listToolDefinitions } from "@/lib/tools/catalog";
import { GROUPS } from "./groups";

// All tool definitions (stable reference)
const ALL_TOOLS = listToolDefinitions();

// UI state
export const selectedToolNameAtom = atom<string | null>(null);
export const searchQueryAtom = atom<string>("");

// Content well tab
export type ToolTab = "overview";
export const activeToolTabAtom = atom<ToolTab>("overview");

// Derived: selected tool definition
export const selectedToolAtom = atom<ToolDefinition | null>((get) => {
  const name = get(selectedToolNameAtom);
  if (!name) return null;
  return ALL_TOOLS.find((t) => t.gatewayName === name) ?? null;
});

// Derived: group id of the selected tool
export const selectedToolGroupAtom = atom<ToolGroupId | null>((get) => {
  const tool = get(selectedToolAtom);
  if (!tool) return null;
  return tool.group;
});

export type ToolGroupEntry = {
  id: ToolGroupId | "uncategorized";
  label: string;
  description: string;
  tools: ToolDefinition[];
};

// Derived: tools grouped by group, filtered by search
export const filteredGroupedToolsAtom = atom<ToolGroupEntry[]>((get) => {
  const query = get(searchQueryAtom).toLowerCase();

  const filtered = query
    ? ALL_TOOLS.filter(
        (t) =>
          t.gatewayName.includes(query) ||
          t.toolName.toLowerCase().includes(query) ||
          (t.gatewayDescription?.toLowerCase().includes(query) ?? false) ||
          (t.ui?.label?.toLowerCase().includes(query) ?? false),
      )
    : ALL_TOOLS;

  const groups: ToolGroupEntry[] = GROUPS.map((group) => ({
    ...group,
    tools: filtered.filter((t) => t.group === group.id),
  }));

  return groups.filter((g) => g.tools.length > 0);
});

// Derived: total visible tool count
export const visibleToolCountAtom = atom<number>((get) =>
  get(filteredGroupedToolsAtom).reduce((sum, g) => sum + g.tools.length, 0),
);
