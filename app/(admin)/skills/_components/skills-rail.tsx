"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  skillsAtom,
  filteredSkillsAtom,
  selectedSkillIdAtom,
  skillsSearchQueryAtom,
  selectedSkillAtom,
  skillsActiveTabAtom,
} from "../_lib/atoms";
import { SkillFormModal } from "./skill-form-modal";
import type { SkillWithPlacements } from "@/lib/skills/list-skills";

/* ---------- selected skill panel ---------- */

function SelectedSkillPanel() {
  const skill = useAtomValue(selectedSkillAtom);

  if (!skill) {
    return (
      <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 border-b border-onyx-20 bg-onyx-5 px-4">
        <Sparkles className="h-6 w-6 text-onyx-30" />
        <p className="text-sm text-onyx-40">Select a skill</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[120px] flex-col gap-2 border-b border-onyx-20 bg-gradient-to-br from-sapphire-10/30 to-sapphire-10 p-4">
      <h3 className="font-display text-2xl font-semibold text-onyx-90">
        {skill.label}
      </h3>
      <p className="text-xs text-onyx-60">{skill.slug}</p>

      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <Badge variant={skill.enabled ? "default" : "secondary"}>
          {skill.enabled ? "Enabled" : "Disabled"}
        </Badge>
        {skill.autoSend && (
          <Badge variant="outline">Pre-fill</Badge>
        )}
        {skill.placements.map((p) => (
          <Badge key={p.id} variant="outline" className="text-[10px]">
            {p.domain}
            {p.subDomain ? ` / ${p.subDomain}` : ""}
          </Badge>
        ))}
      </div>
    </div>
  );
}

/* ---------- skill card ---------- */

function SkillCard({
  skill,
  isSelected,
  onClick,
}: {
  skill: SkillWithPlacements;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full border-l-2 px-3 py-2.5 text-left transition-colors",
        isSelected
          ? "border-l-sapphire-60 bg-sapphire-10/50"
          : "border-l-transparent hover:bg-onyx-10/60",
      )}
    >
      <p className="text-sm font-medium text-onyx-90">{skill.label}</p>
      <p className="text-xs text-onyx-50">{skill.slug}</p>
      {!skill.enabled && (
        <p className="mt-0.5 text-[10px] font-medium uppercase text-onyx-40">
          disabled
        </p>
      )}
    </button>
  );
}

/* ---------- skills rail ---------- */

export function SkillsRail() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const skills = useAtomValue(skillsAtom);
  const filteredSkills = useAtomValue(filteredSkillsAtom);
  const [selectedId, setSelectedId] = useAtom(selectedSkillIdAtom);
  const [searchQuery, setSearchQuery] = useAtom(skillsSearchQueryAtom);
  const setActiveTab = useSetAtom(skillsActiveTabAtom);

  const [creatingNew, setCreatingNew] = useState(false);

  // Restore selection from URL on mount
  useEffect(() => {
    const skillParam = searchParams.get("skill");
    if (skillParam && skills.length > 0) {
      const exists = skills.find((s) => s.id === skillParam);
      if (exists) {
        setSelectedId(skillParam);
      }
    }
    // Only run on mount / when skills load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skills]);

  // Scroll indicator
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 8);
  }, []);

  useEffect(() => {
    checkScroll();
  }, [filteredSkills, checkScroll]);

  function handleSelect(skill: SkillWithPlacements) {
    setSelectedId(skill.id);
    setActiveTab("overview");

    const params = new URLSearchParams(searchParams.toString());
    params.set("skill", skill.id);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <>
      {/* Rail header */}
      <div className="flex h-9 shrink-0 items-center border-b border-onyx-20 bg-onyx-10 px-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-onyx-70">
          Skills
        </h2>
        <span className="ml-1 text-xs tabular-nums text-onyx-60">
          {filteredSkills.length}
        </span>

        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-6 w-6 text-onyx-40 hover:text-onyx-70"
          onClick={() => setCreatingNew(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="sr-only">New skill</span>
        </Button>
      </div>

      {/* Selected skill summary */}
      <SelectedSkillPanel />

      {/* Search filter */}
      <div className="border-b border-onyx-20 px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-onyx-40" />
          <Input
            placeholder="Filter skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      {/* Skill list */}
      {skills.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 px-4 text-center">
          <p className="text-sm text-onyx-40">No skills yet</p>
          <p className="text-xs text-onyx-30">
            Create your first skill to get started
          </p>
        </div>
      ) : filteredSkills.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 px-4 text-center">
          <p className="text-sm text-onyx-40">No matching skills</p>
          <p className="text-xs text-onyx-30">
            Try a different search term
          </p>
        </div>
      ) : (
        <div className="relative flex-1 overflow-hidden">
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="h-full overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden"
          >
            {filteredSkills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                isSelected={skill.id === selectedId}
                onClick={() => handleSelect(skill)}
              />
            ))}
          </div>

          {/* Bottom fade + scroll indicator */}
          {canScrollDown && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center">
              <div className="h-10 w-full bg-gradient-to-t from-white to-transparent" />
              <div className="pointer-events-auto -mt-5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-onyx-40 shadow-[var(--shadow-soft)]">
                <ChevronDown className="h-3 w-3" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create skill modal */}
      {creatingNew && (
        <SkillFormModal
          onClose={() => setCreatingNew(false)}
          onSaved={() => {
            setCreatingNew(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
