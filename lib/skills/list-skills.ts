export type SkillPlacement = {
  id: string;
  domain: string;
  subDomain: string | null;
  sortOrder: number;
};

export type SkillWithPlacements = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  promptTemplate: string;
  autoSend: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  placements: SkillPlacement[];
};

export type ListSkillsResult = {
  skills: SkillWithPlacements[];
};
