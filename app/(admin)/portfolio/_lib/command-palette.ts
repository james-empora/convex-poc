import { atom } from "jotai";
import type { CommandItem } from "@/components/composite/command-palette";

/* ---------- types ---------- */

export interface CommandGroup {
  /** Heading displayed above the group's items */
  label: string;
  /** Lower number = higher in list */
  priority: number;
  /** Items belonging to this group */
  items: CommandItem[];
}

export interface CommandFallback {
  /** Prefix shown before the query text, e.g. "Chat about" */
  prefix: string;
  /** Icon shown to the left */
  icon?: React.ReactNode;
  /** Called with the raw query text when the user selects the fallback */
  onSelect: (query: string) => void;
}

/* ---------- atoms ---------- */

/** Whether the Cmd+K command palette is open */
export const commandPaletteOpenAtom = atom(false);

/** Registry of command groups — workspaces write here via useEffect */
export const commandPaletteGroupsAtom = atom<Map<string, CommandGroup>>(
  new Map(),
);

/** Fallback action shown when no items match — the active workspace owns this */
export const commandPaletteFallbackAtom = atom<CommandFallback | null>(null);

/** Derived read-only atom: merges all groups into a flat item list sorted by priority */
export const commandPaletteItemsAtom = atom<CommandItem[]>((get) => {
  const groups = get(commandPaletteGroupsAtom);
  const sorted = [...groups.values()].sort((a, b) => a.priority - b.priority);
  return sorted.flatMap((group) =>
    group.items.map((item) => ({ ...item, group: group.label })),
  );
});
