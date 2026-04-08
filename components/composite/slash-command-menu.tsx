"use client";

import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "./markdown-renderer";
import type { SkillWithPlacements } from "@/lib/skills/list-skills";

interface SlashCommandMenuProps {
  skills: SkillWithPlacements[];
  highlightedIndex: number;
  disabledSkillIds?: string[];
  onSelect: (skill: SkillWithPlacements) => void;
  onHover: (index: number) => void;
}

export function SlashCommandMenu({
  skills,
  highlightedIndex,
  disabledSkillIds = [],
  onSelect,
  onHover,
}: SlashCommandMenuProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll highlighted item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[highlightedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  return (
    <div
      ref={listRef}
      className="absolute bottom-full left-0 z-30 mb-1 w-72 max-h-[280px] overflow-y-auto rounded-xl border border-onyx-20 bg-white py-1 shadow-lg"
    >
      <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-onyx-40">
        Skills
      </p>
      {skills.map((skill, i) => {
        const isDisabled = disabledSkillIds.includes(skill.id);
        const isHighlighted = i === highlightedIndex;
        return (
          <div
            key={skill.id}
            role="option"
            aria-selected={isHighlighted}
            aria-disabled={isDisabled || undefined}
            onMouseEnter={() => onHover(i)}
            onClick={
              isDisabled
                ? undefined
                : () => onSelect(skill)
            }
            className={cn(
              "flex w-full cursor-pointer items-start gap-2.5 px-3 py-2 text-left transition-colors",
              isHighlighted && "bg-onyx-5",
              isDisabled && "cursor-not-allowed opacity-40",
            )}
          >
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sapphire-50" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-onyx-80">{skill.label}</p>
              {skill.description && (
                <div className="line-clamp-1 text-xs text-onyx-40">
                  <MarkdownRenderer
                    content={skill.description}
                    className="text-xs"
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
