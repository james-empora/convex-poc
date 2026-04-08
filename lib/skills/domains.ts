/**
 * Skill domain registry — defines where skills can be placed in the UI.
 * Client-safe: no server-only imports.
 */
export const SKILL_DOMAINS = {
  coordinator: { label: "Coordinator", subDomains: [] as const },
  finances: { label: "Finances", subDomains: ["ledger", "payments"] as const },
  documents: { label: "Documents", subDomains: [] as const },
  entities: { label: "Entities", subDomains: [] as const },
} as const;

export type SkillDomain = keyof typeof SKILL_DOMAINS;

export type SkillSubDomain<D extends SkillDomain> =
  (typeof SKILL_DOMAINS)[D]["subDomains"][number];

/** Flat list of all domain keys, useful for validation. */
export const SKILL_DOMAIN_KEYS = Object.keys(SKILL_DOMAINS) as SkillDomain[];

/** Lightweight skill context passed to the ChatInput for the two-part compose UX. */
export interface SkillContext {
  skillId: string;
  label: string;
  promptTemplate: string;
}
