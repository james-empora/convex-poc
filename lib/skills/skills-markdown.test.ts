import { describe, it, expect } from "vitest";
import type { SkillContext } from "./domains";
import { SKILL_DOMAINS, SKILL_DOMAIN_KEYS } from "./domains";
import { buildMultiSkillMessage } from "@/components/composite/chat-input";

// ---------------------------------------------------------------------------
// SkillContext type tests
// ---------------------------------------------------------------------------

describe("SkillContext", () => {
  it("satisfies the interface shape", () => {
    const ctx: SkillContext = {
      skillId: "abc-123",
      label: "What-if analysis",
      promptTemplate: "# Analyze\n\nRun a what-if scenario on the **ledger**.",
    };
    expect(ctx.skillId).toBe("abc-123");
    expect(ctx.label).toBe("What-if analysis");
    expect(ctx.promptTemplate).toContain("**ledger**");
  });
});

// ---------------------------------------------------------------------------
// Skill prompt message building (mirrors ChatInput logic)
// ---------------------------------------------------------------------------

/**
 * Replicates the message-building logic from ChatInput.handleSend
 * when an activeSkill is present.
 */
function buildSkillMessage(
  activeSkill: SkillContext | null,
  userMessage: string,
): string {
  if (!activeSkill) return userMessage;
  return userMessage.trim()
    ? `${activeSkill.promptTemplate}\n\n---\n\nAdditional context:\n${userMessage}`
    : activeSkill.promptTemplate;
}

describe("buildSkillMessage", () => {
  const skill: SkillContext = {
    skillId: "s1",
    label: "Funding QC",
    promptTemplate: "# Funding QC\n\nReview all **disbursements** for accuracy.",
  };

  it("sends just the skill prompt when user adds nothing", () => {
    const msg = buildSkillMessage(skill, "");
    expect(msg).toBe(skill.promptTemplate);
  });

  it("sends just the skill prompt when user input is whitespace only", () => {
    const msg = buildSkillMessage(skill, "   \n  ");
    expect(msg).toBe(skill.promptTemplate);
  });

  it("combines skill prompt and user additions with separator", () => {
    const msg = buildSkillMessage(skill, "Focus on party B only");
    expect(msg).toContain(skill.promptTemplate);
    expect(msg).toContain("---");
    expect(msg).toContain("Additional context:");
    expect(msg).toContain("Focus on party B only");
  });

  it("preserves markdown in the skill prompt", () => {
    const msg = buildSkillMessage(skill, "Check the wire instructions");
    expect(msg).toContain("# Funding QC");
    expect(msg).toContain("**disbursements**");
  });

  it("returns raw user message when no skill is active", () => {
    const msg = buildSkillMessage(null, "Hello world");
    expect(msg).toBe("Hello world");
  });

  it("handles multi-line user additions", () => {
    const userInput = "1. Check party A\n2. Check party B\n3. Verify totals";
    const msg = buildSkillMessage(skill, userInput);
    expect(msg).toContain("1. Check party A");
    expect(msg).toContain("3. Verify totals");
    // Verify structure: prompt, then separator, then user input
    const parts = msg.split("---");
    expect(parts).toHaveLength(2);
    expect(parts[0].trim()).toBe(skill.promptTemplate);
    expect(parts[1]).toContain(userInput);
  });
});

// ---------------------------------------------------------------------------
// Domain registry
// ---------------------------------------------------------------------------

describe("SKILL_DOMAINS", () => {
  it("contains expected domains", () => {
    expect(SKILL_DOMAIN_KEYS).toContain("coordinator");
    expect(SKILL_DOMAIN_KEYS).toContain("finances");
    expect(SKILL_DOMAIN_KEYS).toContain("documents");
    expect(SKILL_DOMAIN_KEYS).toContain("entities");
  });

  it("finances has ledger and payments sub-domains", () => {
    const subs = SKILL_DOMAINS.finances.subDomains;
    expect(subs).toContain("ledger");
    expect(subs).toContain("payments");
  });

  it("coordinator has no sub-domains", () => {
    expect(SKILL_DOMAINS.coordinator.subDomains).toHaveLength(0);
  });

  it("every domain has a label", () => {
    for (const [, meta] of Object.entries(SKILL_DOMAINS)) {
      expect(typeof meta.label).toBe("string");
      expect(meta.label.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Markdown content validation
// ---------------------------------------------------------------------------

describe("markdown prompt templates", () => {
  it("can store markdown with headers, bold, lists, and code blocks", () => {
    const template = `# File Open QC

Review the following items:

1. **Parties** — verify all names match
2. **Property** — confirm address and legal description
3. Check \`file_number\` is set

\`\`\`
Expected format: YYYY-NNNNN
\`\`\`

> Important: flag any discrepancies immediately.
`;
    // Verify it's valid string content (would be stored in promptTemplate column)
    expect(typeof template).toBe("string");
    expect(template).toContain("# File Open QC");
    expect(template).toContain("**Parties**");
    expect(template).toContain("`file_number`");
    expect(template).toContain("```");
    expect(template).toContain("> Important:");
  });

  it("concatenated message preserves all markdown formatting", () => {
    const skill: SkillContext = {
      skillId: "s2",
      label: "CTC QC",
      promptTemplate: "## CTC Plan Review\n\n- Check all **liens**\n- Verify `status` fields",
    };
    const userAddition = "Also check **judgment** entries for _party C_";
    const combined = buildSkillMessage(skill, userAddition);

    // Both skill markdown and user markdown are preserved
    expect(combined).toContain("## CTC Plan Review");
    expect(combined).toContain("**liens**");
    expect(combined).toContain("`status`");
    expect(combined).toContain("**judgment**");
    expect(combined).toContain("_party C_");
  });
});

// ---------------------------------------------------------------------------
// Multi-skill message building (buildMultiSkillMessage from ChatInput)
// ---------------------------------------------------------------------------

describe("buildMultiSkillMessage", () => {
  const skillA: SkillContext = {
    skillId: "a1",
    label: "Ledger QC",
    promptTemplate: "Review all **ledger entries** for accuracy.",
  };
  const skillB: SkillContext = {
    skillId: "b2",
    label: "Payment Verify",
    promptTemplate: "Verify all **disbursements** match the ledger.",
  };

  it("returns raw user message when no skills are provided", () => {
    const msg = buildMultiSkillMessage([], "Hello world");
    expect(msg).toBe("Hello world");
  });

  it("returns single skill prompt when one skill and empty user input", () => {
    const msg = buildMultiSkillMessage([skillA], "");
    expect(msg).toContain("## Ledger QC");
    expect(msg).toContain(skillA.promptTemplate);
    expect(msg).not.toContain("Additional context:");
  });

  it("combines single skill with user additions", () => {
    const msg = buildMultiSkillMessage([skillA], "Focus on party B");
    expect(msg).toContain("## Ledger QC");
    expect(msg).toContain(skillA.promptTemplate);
    expect(msg).toContain("---");
    expect(msg).toContain("Additional context:");
    expect(msg).toContain("Focus on party B");
  });

  it("stacks multiple skills separated by ---", () => {
    const msg = buildMultiSkillMessage([skillA, skillB], "");
    expect(msg).toContain("## Ledger QC");
    expect(msg).toContain("## Payment Verify");
    expect(msg).toContain(skillA.promptTemplate);
    expect(msg).toContain(skillB.promptTemplate);
    // Skills separated by ---
    const parts = msg.split("---");
    expect(parts.length).toBeGreaterThanOrEqual(2);
  });

  it("stacks multiple skills with user additions at the end", () => {
    const msg = buildMultiSkillMessage([skillA, skillB], "Check wire instructions");
    expect(msg).toContain("## Ledger QC");
    expect(msg).toContain("## Payment Verify");
    expect(msg).toContain("Additional context:");
    expect(msg).toContain("Check wire instructions");
    // User additions come after the last ---
    const lastSeparator = msg.lastIndexOf("---");
    const afterLast = msg.slice(lastSeparator);
    expect(afterLast).toContain("Check wire instructions");
  });

  it("ignores whitespace-only user input", () => {
    const msg = buildMultiSkillMessage([skillA], "   \n  ");
    expect(msg).not.toContain("Additional context:");
  });

  it("preserves markdown in all skill prompts", () => {
    const msg = buildMultiSkillMessage([skillA, skillB], "");
    expect(msg).toContain("**ledger entries**");
    expect(msg).toContain("**disbursements**");
  });
});
