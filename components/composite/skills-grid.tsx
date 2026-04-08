"use client";

import { useSkills } from "@/lib/skills/queries";
import type { SkillDomain } from "@/lib/skills/domains";
import type { SkillWithPlacements } from "@/lib/skills/list-skills";
import { MarkdownRenderer } from "./markdown-renderer";

interface SkillsGridProps {
  domain: SkillDomain;
  subDomain?: string;
  onSkillClick: (skill: SkillWithPlacements) => void;
}

export function SkillsGrid({ domain, subDomain, onSkillClick }: SkillsGridProps) {
  const { data } = useSkills(domain, subDomain);
  const skills = data?.skills ?? [];

  if (skills.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {skills.map((skill) => (
        <button
          key={skill.id}
          type="button"
          onClick={() => onSkillClick(skill)}
          className="group flex flex-col items-start gap-2 rounded-xl border border-onyx-15 bg-white p-4 text-left transition-all hover:border-sapphire-30 hover:shadow-[var(--shadow-soft)]"
        >
          <div>
            <p className="text-sm font-medium text-onyx-90">{skill.label}</p>
            {skill.description && (
              <div className="line-clamp-2 text-xs text-onyx-50">
                <MarkdownRenderer content={skill.description} className="text-xs" />
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
