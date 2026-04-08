"use client";

import { useState, useMemo, useCallback } from "react";
import { useSkills } from "./queries";
import type { SkillDomain } from "./domains";
import type { SkillWithPlacements } from "./list-skills";

interface UseSlashCommandMenuOptions {
  message: string;
  domain?: SkillDomain;
  disabledSkillIds?: string[];
  onSelect: (skill: SkillWithPlacements) => void;
  onClearSlash: () => void;
}

export interface SlashCommandMenuState {
  isOpen: boolean;
  filteredSkills: SkillWithPlacements[];
  highlightedIndex: number;
  setHighlightedIndex: (index: number) => void;
  /** Call from textarea onKeyDown. Returns true if the event was consumed. */
  handleKeyDown: (e: React.KeyboardEvent) => boolean;
  close: () => void;
}

/**
 * dismissKey tracks which filterText the user pressed Escape on.
 * When filterText changes (user keeps typing), the menu re-opens automatically.
 */
export function useSlashCommandMenu({
  message,
  domain,
  disabledSkillIds = [],
  onSelect,
  onClearSlash,
}: UseSlashCommandMenuOptions): SlashCommandMenuState {
  // Track which filter value was dismissed so re-typing re-opens the menu
  const [dismissedFilter, setDismissedFilter] = useState<string | null>(null);
  // highlightedIndex is keyed off the filter — we store the pair so it auto-resets
  const [highlight, setHighlight] = useState<{ filter: string; index: number }>({
    filter: "",
    index: 0,
  });

  const { data } = useSkills(domain);
  const allSkills = useMemo(() => data?.skills ?? [], [data?.skills]);

  // Slash menu is active when message starts with "/" with no newlines
  const slashActive =
    !!domain && message.startsWith("/") && !message.includes("\n");
  const filterText = slashActive ? message.slice(1).toLowerCase() : "";

  const filteredSkills = useMemo(() => {
    if (!slashActive) return [];
    if (!filterText) return allSkills;
    return allSkills.filter(
      (s) =>
        s.label.toLowerCase().includes(filterText) ||
        s.slug.toLowerCase().includes(filterText),
    );
  }, [slashActive, filterText, allSkills]);

  // Derive highlightedIndex: reset to 0 when filter changes
  const highlightedIndex =
    highlight.filter === filterText ? highlight.index : 0;

  // Dismissed only applies to the current filter text
  const isDismissed = dismissedFilter === filterText;
  const isOpen = slashActive && !isDismissed && filteredSkills.length > 0;

  const setHighlightedIndex = useCallback(
    (index: number) => setHighlight({ filter: filterText, index }),
    [filterText],
  );

  const close = useCallback(() => {
    setDismissedFilter(filterText);
  }, [filterText]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): boolean => {
      if (!isOpen) return false;

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const next =
            highlightedIndex >= filteredSkills.length - 1
              ? 0
              : highlightedIndex + 1;
          setHighlightedIndex(next);
          return true;
        }
        case "ArrowUp": {
          e.preventDefault();
          const next =
            highlightedIndex <= 0
              ? filteredSkills.length - 1
              : highlightedIndex - 1;
          setHighlightedIndex(next);
          return true;
        }
        case "Enter": {
          e.preventDefault();
          const skill = filteredSkills[highlightedIndex];
          if (skill && !disabledSkillIds.includes(skill.id)) {
            onSelect(skill);
            onClearSlash();
          }
          return true;
        }
        case "Escape": {
          e.preventDefault();
          close();
          return true;
        }
        case "Tab": {
          close();
          return false;
        }
        default:
          return false;
      }
    },
    [isOpen, filteredSkills, highlightedIndex, disabledSkillIds, onSelect, onClearSlash, close, setHighlightedIndex],
  );

  return {
    isOpen,
    filteredSkills,
    highlightedIndex,
    setHighlightedIndex,
    handleKeyDown,
    close,
  };
}
