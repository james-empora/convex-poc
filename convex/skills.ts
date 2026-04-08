import { ConvexError, v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { auditedDelete, auditedInsert, auditedPatch } from "./lib/audit";

const placementValidator = v.object({
  domain: v.string(),
  subDomain: v.optional(v.string()),
  sortOrder: v.optional(v.number()),
});

function skillId(doc: { legacyId?: string; _id: string }) {
  return doc.legacyId ?? doc._id;
}

function placementId(doc: { legacyId?: string; _id: string }) {
  return doc.legacyId ?? doc._id;
}

function normalizePlacement(doc: {
  legacyId?: string;
  _id: string;
  domain: string;
  subDomain?: string;
  sortOrder: number;
}) {
  return {
    id: placementId(doc),
    domain: doc.domain,
    subDomain: doc.subDomain ?? null,
    sortOrder: doc.sortOrder,
  };
}

function normalizeSkill(
  skill: {
    legacyId?: string;
    _id: string;
    slug: string;
    label: string;
    description?: string;
    promptTemplate: string;
    autoSend: boolean;
    enabled: boolean;
    createdAt: number;
    updatedAt: number;
  },
  placements: Array<{
    legacyId?: string;
    _id: string;
    domain: string;
    subDomain?: string;
    sortOrder: number;
  }>,
) {
  return {
    id: skillId(skill),
    slug: skill.slug,
    label: skill.label,
    description: skill.description ?? null,
    promptTemplate: skill.promptTemplate,
    autoSend: skill.autoSend,
    enabled: skill.enabled,
    createdAt: new Date(skill.createdAt).toISOString(),
    updatedAt: new Date(skill.updatedAt).toISOString(),
    placements: placements
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(normalizePlacement),
  };
}

async function placementsBySkillIds(
  ctx: QueryCtx | MutationCtx,
  skillIds: string[],
) {
  const placementRows = await ctx.db.query("skill_placements").collect();
  const bySkillId = new Map<string, typeof placementRows>();

  for (const placement of placementRows) {
    if (!skillIds.includes(placement.skillId)) continue;
    const existing = bySkillId.get(placement.skillId) ?? [];
    existing.push(placement);
    bySkillId.set(placement.skillId, existing);
  }

  return bySkillId;
}

async function findSkillByLegacyId(
  ctx: QueryCtx | MutationCtx,
  legacyId: string,
) {
  return await ctx.db
    .query("skills")
    .withIndex("by_legacy_id", (q: any) => q.eq("legacyId", legacyId))
    .unique();
}

export const listSkills = query({
  args: {
    domain: v.optional(v.string()),
    subDomain: v.optional(v.string()),
    enabledOnly: v.optional(v.boolean()),
  },
  returns: v.object({
    skills: v.array(v.any()),
  }),
  handler: async (ctx, args) => {
    const allSkills = await ctx.db.query("skills").collect();
    const activeSkills = allSkills.filter((skill) => !skill.deletedAt);
    const filteredSkills = args.enabledOnly
      ? activeSkills.filter((skill) => skill.enabled)
      : activeSkills;

    const allPlacements = await ctx.db.query("skill_placements").collect();
    const placementsBySkill = new Map<string, typeof allPlacements>();
    for (const placement of allPlacements) {
      const existing = placementsBySkill.get(placement.skillId) ?? [];
      existing.push(placement);
      placementsBySkill.set(placement.skillId, existing);
    }

    const selectedSkills = args.domain
      ? filteredSkills.filter((skill) => {
          const placements = placementsBySkill.get(skill._id) ?? [];
          if (!args.subDomain) {
            return placements.some((placement) => placement.domain === args.domain);
          }
          return placements.some(
            (placement) =>
              placement.domain === args.domain &&
              (placement.subDomain === args.subDomain || placement.subDomain === undefined),
          );
        })
      : filteredSkills;

    const normalized = selectedSkills
      .map((skill) => normalizeSkill(skill, placementsBySkill.get(skill._id) ?? []))
      .sort((a, b) => a.label.localeCompare(b.label));

    return { skills: normalized };
  },
});

export const getSkill = query({
  args: {
    skillId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const skill = await findSkillByLegacyId(ctx, args.skillId);
    if (!skill || skill.deletedAt) {
      throw new ConvexError({ code: "NotFound", message: "Skill not found" });
    }

    const placements = (await placementsBySkillIds(ctx, [skill._id])).get(skill._id) ?? [];
    return normalizeSkill(skill, placements);
  },
});

export const createSkill = mutation({
  args: {
    slug: v.string(),
    label: v.string(),
    description: v.optional(v.string()),
    promptTemplate: v.string(),
    autoSend: v.optional(v.boolean()),
    enabled: v.optional(v.boolean()),
    placements: v.array(placementValidator),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
      const now = Date.now();
      const existing = await ctx.db
        .query("skills")
        .withIndex("by_slug", (q) => q.eq("slug", args.slug))
        .first();
      if (existing && !existing.deletedAt) {
        throw new ConvexError({ code: "Conflict", message: "Skill slug already exists" });
      }

      const skill = await auditedInsert(
        ctx,
        "skills",
        {
          legacyId: crypto.randomUUID(),
          slug: args.slug,
          label: args.label,
          description: args.description,
          promptTemplate: args.promptTemplate,
          autoSend: args.autoSend ?? true,
          enabled: args.enabled ?? true,
          createdAt: now,
          updatedAt: now,
          deletedAt: undefined,
        },
      );

      const placements = [];
      for (const [index, placement] of args.placements.entries()) {
        placements.push(
          await auditedInsert(
            ctx,
            "skill_placements",
            {
              legacyId: crypto.randomUUID(),
              skillId: skill._id,
              domain: placement.domain,
              subDomain: placement.subDomain,
              sortOrder: placement.sortOrder ?? index,
              createdAt: now,
            },
          ),
        );
      }

      return normalizeSkill(skill, placements);
    },
});

export const updateSkill = mutation({
  args: {
    skillId: v.string(),
    label: v.optional(v.string()),
    description: v.optional(v.string()),
    promptTemplate: v.optional(v.string()),
    autoSend: v.optional(v.boolean()),
    enabled: v.optional(v.boolean()),
    placements: v.optional(v.array(placementValidator)),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
      const skill = await findSkillByLegacyId(ctx, args.skillId);
      if (!skill || skill.deletedAt) {
        throw new ConvexError({ code: "NotFound", message: "Skill not found" });
      }

      const updatedSkill = await auditedPatch(
        ctx,
        "skills",
        skill._id,
        {
          label: args.label ?? skill.label,
          description: args.description ?? skill.description,
          promptTemplate: args.promptTemplate ?? skill.promptTemplate,
          autoSend: args.autoSend ?? skill.autoSend,
          enabled: args.enabled ?? skill.enabled,
          updatedAt: Date.now(),
        },
      );

      if (args.placements !== undefined) {
        const existingPlacements = (await placementsBySkillIds(ctx, [skill._id])).get(skill._id) ?? [];
        for (const placement of existingPlacements) {
          await auditedDelete(ctx, "skill_placements", placement._id);
        }

        for (const [index, placement] of args.placements.entries()) {
          await auditedInsert(
            ctx,
            "skill_placements",
            {
              legacyId: crypto.randomUUID(),
              skillId: skill._id,
              domain: placement.domain,
              subDomain: placement.subDomain,
              sortOrder: placement.sortOrder ?? index,
              createdAt: Date.now(),
            },
          );
        }
      }

      const placements = (await placementsBySkillIds(ctx, [skill._id])).get(skill._id) ?? [];
      return normalizeSkill(updatedSkill, placements);
    },
});

export const deleteSkill = mutation({
  args: {
    skillId: v.string(),
  },
  returns: v.object({
    id: v.string(),
    deletedAt: v.string(),
  }),
  handler: async (ctx, args) => {
      const skill = await findSkillByLegacyId(ctx, args.skillId);
      if (!skill || skill.deletedAt) {
        throw new ConvexError({ code: "NotFound", message: "Skill not found" });
      }

      const deletedAt = Date.now();
      const updated = await auditedPatch(
        ctx,
        "skills",
        skill._id,
        {
          deletedAt,
          updatedAt: deletedAt,
        },
      );

      return {
        id: skillId(updated),
        deletedAt: new Date(deletedAt).toISOString(),
      };
  },
});

export const getUsage = query({
  args: {
    skillId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const runs = (await ctx.db.query("workflow_runs").collect())
      .filter(
        (run) =>
          run.workflowType === "skill_run" &&
          typeof run.input === "object" &&
          run.input !== null &&
          "skillId" in run.input &&
          (run.input as { skillId?: unknown }).skillId === args.skillId,
      )
      .sort((a, b) => b.createdAt - a.createdAt);

    let totalTokens = 0;
    const threadIds = runs
      .map((run) => run.threadId)
      .filter((threadId): threadId is NonNullable<typeof threadId> => !!threadId);
    const messages = await ctx.db.query("chat_messages").collect();

    const tokensByThread = new Map<string, number>();
    for (const message of messages) {
      if (!threadIds.includes(message.threadId)) continue;
      const tokenUsage =
        typeof message.tokenUsage === "object" && message.tokenUsage !== null
          ? (message.tokenUsage as Record<string, unknown>)
          : null;
      const inputTokens = Number(
        tokenUsage?.inputTokens ?? tokenUsage?.promptTokens ?? 0,
      );
      const outputTokens = Number(
        tokenUsage?.outputTokens ?? tokenUsage?.completionTokens ?? 0,
      );
      const current = tokensByThread.get(message.threadId) ?? 0;
      tokensByThread.set(message.threadId, current + inputTokens + outputTokens);
    }

    for (const run of runs) {
      if (run.threadId) {
        totalTokens += tokensByThread.get(run.threadId) ?? 0;
      }
    }

    const totalRuns = runs.length;
    const completedRuns = runs.filter((run) => run.status === "completed").length;
    const failedRuns = runs.filter((run) => run.status === "failed").length;

    return {
      totalRuns,
      completedRuns,
      failedRuns,
      successRate: totalRuns > 0 ? completedRuns / totalRuns : 0,
      totalTokens,
      avgTokensPerRun: totalRuns > 0 ? Math.round(totalTokens / totalRuns) : 0,
      lastRunAt: runs[0] ? new Date(runs[0].createdAt).toISOString() : null,
      recentRuns: runs.slice(0, 20).map((run) => ({
        id: skillId(run),
        status: run.status,
        tokens: run.threadId ? tokensByThread.get(run.threadId) ?? 0 : 0,
        startedAt: run.startedAt ? new Date(run.startedAt).toISOString() : null,
        completedAt: run.completedAt ? new Date(run.completedAt).toISOString() : null,
        createdAt: new Date(run.createdAt).toISOString(),
        errorMessage: run.errorMessage ?? null,
      })),
    };
  },
});

export const getRunContextByThread = query({
  args: {
    threadId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const thread = await ctx.db
      .query("chat_threads")
      .withIndex("by_chat_id", (q) => q.eq("id", args.threadId))
      .unique();
    if (!thread) {
      throw new ConvexError({ code: "NotFound", message: `No thread found for ${args.threadId}` });
    }

    const run = (
      await ctx.db
        .query("workflow_runs")
        .withIndex("by_thread_id", (q) => q.eq("threadId", thread._id))
        .collect()
    ).find((entry) => entry.workflowType === "skill_run");

    if (!run || !run.input || typeof run.input !== "object" || !("skillId" in run.input)) {
      throw new ConvexError({ code: "NotFound", message: `No skill_run workflow for ${args.threadId}` });
    }

    const input = run.input as {
      skillId: string;
      fileId: string;
      resourceType?: string;
      resourceId?: string;
      customPrompt?: string;
    };
    const skill = await findSkillByLegacyId(ctx, input.skillId);
    if (!skill || skill.deletedAt) {
      throw new ConvexError({ code: "NotFound", message: `Skill ${input.skillId} not found` });
    }

    return {
      workflowRunId: skillId(run),
      threadId: args.threadId,
      skillLabel: skill.label,
      promptTemplate: skill.promptTemplate,
      fileId: input.fileId,
      resourceType: input.resourceType ?? null,
      resourceId: input.resourceId ?? null,
      customPrompt: input.customPrompt ?? null,
    };
  },
});

export const startRun = mutation({
  args: {
    skillId: v.string(),
    fileId: v.string(),
    resourceType: v.optional(v.string()),
    resourceId: v.optional(v.string()),
    customPrompt: v.optional(v.string()),
  },
  returns: v.object({
    threadId: v.string(),
    runId: v.string(),
  }),
  handler: async (ctx, args) => {
    const skill = await findSkillByLegacyId(ctx, args.skillId);
    if (!skill || skill.deletedAt || !skill.enabled) {
      throw new ConvexError({ code: "NotFound", message: "Skill not found" });
    }

    const now = Date.now();
    const threadId = crypto.randomUUID();
    const threadDocId = await ctx.db.insert("chat_threads", {
      id: threadId,
      threadType: "system",
      userId: undefined,
      title: "Skill run",
      titleSource: "derived",
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("thread_associations", {
      legacyId: crypto.randomUUID(),
      threadId: threadDocId,
      resource: { type: "file", id: args.fileId },
      createdAt: now,
    });

    const runId = crypto.randomUUID();
    await ctx.db.insert("workflow_runs", {
      legacyId: runId,
      workflowType: "skill_run",
      threadId: threadDocId,
      status: "pending",
      input: {
        skillId: args.skillId,
        fileId: args.fileId,
        resourceType: args.resourceType,
        resourceId: args.resourceId,
        customPrompt: args.customPrompt,
      },
      errorMessage: undefined,
      startedAt: undefined,
      completedAt: undefined,
      createdAt: now,
    });

    return { threadId, runId };
  },
});

export const markRunRunning = mutation({
  args: { workflowRunId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db
      .query("workflow_runs")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.workflowRunId))
      .unique();
    if (!run) {
      throw new ConvexError({ code: "NotFound", message: "Workflow run not found" });
    }
    await ctx.db.patch(run._id, { status: "running", startedAt: Date.now() });
    return null;
  },
});

export const completeRun = mutation({
  args: {
    threadId: v.string(),
    promptTemplate: v.string(),
    aiText: v.string(),
    modelId: v.string(),
    tokenUsage: v.object({
      inputTokens: v.number(),
      outputTokens: v.number(),
    }),
    workflowRunId: v.string(),
    skillLabel: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const thread = await ctx.db
      .query("chat_threads")
      .withIndex("by_chat_id", (q) => q.eq("id", args.threadId))
      .unique();
    if (!thread) {
      throw new ConvexError({ code: "NotFound", message: "Chat thread not found" });
    }

    await ctx.db.insert("chat_messages", {
      legacyId: crypto.randomUUID(),
      threadId: thread._id,
      messageId: crypto.randomUUID(),
      role: "user",
      parts: [{ type: "text", text: args.promptTemplate }],
      model: undefined,
      tokenUsage: undefined,
      ordinal: 0,
      createdAt: now,
    });
    await ctx.db.insert("chat_messages", {
      legacyId: crypto.randomUUID(),
      threadId: thread._id,
      messageId: crypto.randomUUID(),
      role: "assistant",
      parts: [{ type: "text", text: args.aiText }],
      model: args.modelId,
      tokenUsage: args.tokenUsage,
      ordinal: 1,
      createdAt: now,
    });

    await ctx.db.patch(thread._id, {
      title: `Skill: ${args.skillLabel}`,
      lastMessageAt: now,
      updatedAt: now,
    });

    const run = await ctx.db
      .query("workflow_runs")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.workflowRunId))
      .unique();
    if (run) {
      await ctx.db.patch(run._id, {
        status: "completed",
        completedAt: now,
      });
    }

    return null;
  },
});

export const failRun = mutation({
  args: {
    workflowRunId: v.string(),
    errorMessage: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db
      .query("workflow_runs")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.workflowRunId))
      .unique();
    if (run) {
      await ctx.db.patch(run._id, {
        status: "failed",
        errorMessage: args.errorMessage,
        completedAt: Date.now(),
      });
    }
    return null;
  },
});
