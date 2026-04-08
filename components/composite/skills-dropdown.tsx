"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSkills } from "@/lib/skills/queries";
import type { SkillDomain } from "@/lib/skills/domains";
import type { SkillWithPlacements } from "@/lib/skills/list-skills";
import { MarkdownRenderer } from "./markdown-renderer";

interface SkillsDropdownProps {
  domain: SkillDomain;
  subDomain?: string;
  onSkillClick: (skill: SkillWithPlacements) => void;
  /** Skill IDs that are already selected — shown as disabled/grayed in the list. */
  disabledSkillIds?: string[];
  /** Called when user clicks "Run now" on an autoSend skill to execute it in the background. */
  onRunInBackground?: (skill: SkillWithPlacements, customPrompt?: string) => void;
}

export function SkillsDropdown({ domain, subDomain, onSkillClick, disabledSkillIds = [], onRunInBackground }: SkillsDropdownProps) {
  const [open, setOpen] = useState(false);
  const [openAbove, setOpenAbove] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data } = useSkills(domain, subDomain);

  const skills = data?.skills ?? [];

  useEffect(() => {
    if (!open || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    setOpenAbove(spaceBelow < 320);

    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (skills.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        onClick={() => setOpen(!open)}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Skills
      </Button>

      {open && (
        <div className={cn(
          "absolute right-0 z-20 w-72 max-h-[320px] overflow-y-auto rounded-xl border border-onyx-20 bg-white py-1 shadow-lg",
          openAbove ? "bottom-full mb-1" : "top-full mt-1",
        )}>
          {skills.map((skill) => {
            const isDisabled = disabledSkillIds.includes(skill.id);
            return (
              <div
                key={skill.id}
                role="button"
                tabIndex={isDisabled ? -1 : 0}
                aria-disabled={isDisabled || undefined}
                onClick={isDisabled ? undefined : () => {
                  onSkillClick(skill);
                  setOpen(false);
                }}
                onKeyDown={isDisabled ? undefined : (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSkillClick(skill);
                    setOpen(false);
                  }
                }}
                className={cn(
                  "flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors",
                  isDisabled
                    ? "cursor-not-allowed opacity-40"
                    : "cursor-pointer hover:bg-onyx-5",
                )}
              >
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sapphire-50" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-onyx-80">{skill.label}</p>
                  {skill.description && (
                    <div className="line-clamp-2 text-xs text-onyx-40">
                      <MarkdownRenderer content={skill.description} className="text-xs" />
                    </div>
                  )}
                </div>
                {onRunInBackground && skill.autoSend && !isDisabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRunInBackground(skill);
                      setOpen(false);
                    }}
                    className="mt-0.5 shrink-0 cursor-pointer rounded p-1 text-onyx-40 transition-colors hover:bg-onyx-10 hover:text-onyx-70"
                    title="Run in background"
                  >
                    <Play className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
