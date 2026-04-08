import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { auditedInsert, auditedPatch } from "./lib/audit";

const actionItemPriorityValidator = v.union(
  v.literal("low"),
  v.literal("normal"),
  v.literal("high"),
  v.literal("urgent"),
);

const actionItemOriginValidator = v.union(v.literal("ai"), v.literal("manual"));
const actionItemDependencyTypeValidator = v.union(v.literal("hard"), v.literal("soft"));

function legacy(doc: { legacyId?: string; _id: string }) {
  return doc.legacyId ?? doc._id;
}

async function findFileByLegacyId(ctx: QueryCtx | MutationCtx, legacyId: string) {
  return await ctx.db
    .query("files")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", legacyId))
    .unique();
}

async function findActionItemByLegacyId(ctx: QueryCtx | MutationCtx, legacyId: string) {
  return await ctx.db
    .query("action_items")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", legacyId))
    .unique();
}

async function normalizeActionItemRow(ctx: QueryCtx | MutationCtx, item: Doc<"action_items">) {
  const file = await ctx.db.get(item.fileId);
  return {
    id: legacy(item),
    fileId: file ? legacy(file) : item.fileId,
    key: item.key,
    title: item.title,
    priority: item.priority,
    assigneeEntityId: item.assigneeEntity?.id ?? null,
    assigneeEntityType: item.assigneeEntity?.type ?? null,
    assigneeRole: item.assigneeRole ?? null,
    status: item.status,
    statusReason: item.statusReason ?? null,
    completedAt: item.completedAt ? new Date(item.completedAt).toISOString() : null,
    deletedAt: item.deletedAt ? new Date(item.deletedAt).toISOString() : null,
    dueDate: item.dueDate ?? null,
    completionRule: item.completionRule ?? null,
    origin: item.origin,
    threadId: item.threadId ?? null,
    createdAt: new Date(item.createdAt).toISOString(),
    updatedAt: new Date(item.updatedAt).toISOString(),
  };
}

function normalizeDependency(
  dependency: Doc<"action_item_dependencies">,
  relatedItem: Doc<"action_items"> | null,
) {
  return {
    id: legacy(dependency),
    fromItemId: dependency.fromItemId,
    toItemId: dependency.toItemId,
    type: dependency.type,
    toItemKey: relatedItem?.key ?? "unknown",
    toItemTitle: relatedItem?.title ?? "Unknown item",
    toItemStatus: relatedItem?.status ?? "unknown",
  };
}

async function hydrateItem(ctx: QueryCtx | MutationCtx, item: Doc<"action_items">) {
  const depsFrom = await ctx.db
    .query("action_item_dependencies")
    .withIndex("by_from_item_id", (q) => q.eq("fromItemId", item._id))
    .collect();
  const depsTo = await ctx.db
    .query("action_item_dependencies")
    .withIndex("by_to_item_id", (q) => q.eq("toItemId", item._id))
    .collect();

  const relatedIds = new Set<string>();
  for (const dependency of depsFrom) relatedIds.add(dependency.toItemId);
  for (const dependency of depsTo) relatedIds.add(dependency.fromItemId);

  const relatedMap = new Map<string, Doc<"action_items">>();
  for (const relatedId of relatedIds) {
    const related = await ctx.db.get(relatedId as Id<"action_items">);
    if (related) relatedMap.set(relatedId, related);
  }

  const dependencies = depsFrom.map((dependency) =>
    normalizeDependency(dependency, relatedMap.get(dependency.toItemId) ?? null)
  );
  const dependents = depsTo.map((dependency) =>
    normalizeDependency(dependency, relatedMap.get(dependency.fromItemId) ?? null)
  );
  const isBlocked = dependencies.some(
    (dependency) => dependency.type === "hard" && dependency.toItemStatus === "pending",
  );
  const softBlockers = dependencies.filter(
    (dependency) => dependency.type === "soft" && dependency.toItemStatus === "pending",
  );

  return {
    ...(await normalizeActionItemRow(ctx, item)),
    dependencies,
    dependents,
    isBlocked,
    softBlockers,
  };
}

export const listItems = query({
  args: { fileId: v.string() },
  returns: v.object({ items: v.array(v.any()) }),
  handler: async (ctx, args) => {
    const file = await findFileByLegacyId(ctx, args.fileId);
    if (!file) return { items: [] };

    const items = await ctx.db
      .query("action_items")
      .withIndex("by_file_id", (q) => q.eq("fileId", file._id))
      .collect();

    const activeItems = items.filter((item) => item.status !== "deleted");
    return {
      items: await Promise.all(activeItems.map((item) => hydrateItem(ctx, item))),
    };
  },
});

export const getItem = query({
  args: { id: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const item = await findActionItemByLegacyId(ctx, args.id);
    if (!item) {
      throw new ConvexError({ code: "NotFound", message: `Action item ${args.id} not found` });
    }
    return await hydrateItem(ctx, item);
  },
});

export const createItem = mutation({
  args: {
    fileId: v.string(),
    key: v.string(),
    title: v.string(),
    priority: v.optional(actionItemPriorityValidator),
    assigneeEntityId: v.optional(v.string()),
    assigneeEntityType: v.optional(v.string()),
    assigneeRole: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    completionRule: v.optional(v.any()),
    origin: v.optional(actionItemOriginValidator),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
      const file = await findFileByLegacyId(ctx, args.fileId);
      if (!file) {
        throw new ConvexError({ code: "NotFound", message: `File not found: ${args.fileId}` });
      }

      const item = await auditedInsert(
        ctx,
        "action_items",
        {
          legacyId: crypto.randomUUID(),
          fileId: file._id,
          key: args.key,
          title: args.title,
          priority: args.priority ?? "normal",
          assigneeEntity: args.assigneeEntityId && args.assigneeEntityType
            ? { id: args.assigneeEntityId, type: args.assigneeEntityType }
            : undefined,
          assigneeRole: args.assigneeRole,
          status: "pending",
          statusReason: undefined,
          completedAt: undefined,
          deletedAt: undefined,
          dueDate: args.dueDate,
          completionRule: args.completionRule,
          origin: args.origin ?? "manual",
          threadId: undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      );

      return await normalizeActionItemRow(ctx, item);
    },
});

export const completeItem = mutation({
  args: { id: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
      const item = await findActionItemByLegacyId(ctx, args.id);
      if (!item) {
        throw new ConvexError({ code: "NotFound", message: `Action item ${args.id} not found` });
      }
      if (item.status !== "pending") {
        throw new ConvexError({ code: "InvalidState", message: `Action item is already ${item.status}` });
      }

      const blockers = await ctx.db
        .query("action_item_dependencies")
        .withIndex("by_from_item_id", (q) => q.eq("fromItemId", item._id))
        .collect();

      for (const blocker of blockers) {
        if (blocker.type !== "hard") continue;
        const blockerItem = await ctx.db.get(blocker.toItemId);
        if (blockerItem?.status === "pending") {
          throw new ConvexError({
            code: "Blocked",
            message: "Cannot complete: item has pending hard dependencies",
          });
        }
      }

      const updated = await auditedPatch(
        ctx,
        "action_items",
        item._id,
        {
          status: "completed",
          completedAt: Date.now(),
          statusReason: "manual: user marked complete",
          updatedAt: Date.now(),
        },
      );
      return await normalizeActionItemRow(ctx, updated);
    },
});

export const uncompleteItem = mutation({
  args: { id: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
      const item = await findActionItemByLegacyId(ctx, args.id);
      if (!item) {
        throw new ConvexError({ code: "NotFound", message: `Action item ${args.id} not found` });
      }
      if (item.status !== "completed") {
        throw new ConvexError({ code: "InvalidState", message: `Action item is ${item.status}, not completed` });
      }

      const updated = await auditedPatch(
        ctx,
        "action_items",
        item._id,
        {
          status: "pending",
          completedAt: undefined,
          statusReason: "manual: user unmarked",
          updatedAt: Date.now(),
        },
      );
      return await normalizeActionItemRow(ctx, updated);
    },
});

export const deleteItem = mutation({
  args: { id: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
      const item = await findActionItemByLegacyId(ctx, args.id);
      if (!item) {
        throw new ConvexError({ code: "NotFound", message: `Action item ${args.id} not found` });
      }

      const updated = await auditedPatch(
        ctx,
        "action_items",
        item._id,
        {
          status: "deleted",
          deletedAt: Date.now(),
          statusReason: "manual: user deleted",
          updatedAt: Date.now(),
        },
      );
      return await normalizeActionItemRow(ctx, updated);
    },
});

export const reassignItem = mutation({
  args: {
    id: v.string(),
    assigneeEntityId: v.string(),
    assigneeEntityType: v.string(),
    assigneeRole: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const item = await findActionItemByLegacyId(ctx, args.id);
    if (!item) {
      throw new ConvexError({ code: "NotFound", message: `Action item ${args.id} not found` });
    }

    const updated = await auditedPatch(ctx, "action_items", item._id, {
      assigneeEntity: { id: args.assigneeEntityId, type: args.assigneeEntityType },
      assigneeRole: args.assigneeRole,
      updatedAt: Date.now(),
    });

    return await normalizeActionItemRow(ctx, updated);
  },
});

const reconcileDependencyValidator = v.object({
  key: v.string(),
  type: actionItemDependencyTypeValidator,
});

const completionConditionValidator = v.any();

const completionRuleValidator = v.object({
  events: v.array(v.string()),
  conditions: v.array(completionConditionValidator),
});

const reconcileMapItemValidator = v.object({
  key: v.string(),
  existingId: v.optional(v.string()),
  title: v.string(),
  priority: actionItemPriorityValidator,
  assigneeEntityId: v.optional(v.string()),
  assigneeEntityType: v.optional(v.string()),
  assigneeRole: v.optional(v.string()),
  assignmentRationale: v.optional(v.string()),
  dueDate: v.optional(v.string()),
  dependsOn: v.optional(v.array(reconcileDependencyValidator)),
  completionRule: v.optional(completionRuleValidator),
  action: v.union(
    v.literal("create"),
    v.literal("update"),
    v.literal("complete"),
    v.literal("delete"),
    v.literal("no_change"),
  ),
  actionReason: v.optional(v.string()),
});

export const reconcileActionItemMap = mutation({
  args: {
    fileId: v.string(),
    items: v.array(reconcileMapItemValidator),
    reasoning: v.string(),
    threadId: v.optional(v.string()),
  },
  returns: v.object({
    stats: v.object({
      created: v.number(),
      updated: v.number(),
      completed: v.number(),
      deleted: v.number(),
      unchanged: v.number(),
    }),
    totalDeps: v.number(),
  }),
  handler: async (ctx, args) => {
    const file = await findFileByLegacyId(ctx, args.fileId);
    if (!file) {
      throw new ConvexError({ code: "NotFound", message: `File not found: ${args.fileId}` });
    }

    const existing = await ctx.db
      .query("action_items")
      .withIndex("by_file_id", (q) => q.eq("fileId", file._id))
      .collect();
    const existingByKey = new Map(existing.map((item) => [item.key, item]));
    const existingById = new Map(existing.map((item) => [legacy(item), item]));
    const keyToId = new Map(existing.map((item) => [item.key, item._id]));
    const stats = { created: 0, updated: 0, completed: 0, deleted: 0, unchanged: 0 };
    const now = Date.now();

    for (const entry of args.items) {
      const existingItem = entry.existingId
        ? existingById.get(entry.existingId)
        : existingByKey.get(entry.key);

      if (entry.action === "create" || (entry.action === "update" && !existingItem)) {
        const created = await auditedInsert(ctx, "action_items", {
          legacyId: crypto.randomUUID(),
          fileId: file._id,
          key: entry.key,
          title: entry.title,
          priority: entry.priority,
          assigneeEntity: entry.assigneeEntityId && entry.assigneeEntityType
            ? { id: entry.assigneeEntityId, type: entry.assigneeEntityType }
            : undefined,
          assigneeRole: entry.assigneeRole,
          status: "pending",
          statusReason: undefined,
          completedAt: undefined,
          deletedAt: undefined,
          dueDate: entry.dueDate,
          completionRule: entry.completionRule,
          origin: "ai",
          threadId: undefined,
          createdAt: now,
          updatedAt: now,
        });
        keyToId.set(entry.key, created._id);
        if (entry.action === "create") stats.created++;
        else stats.updated++;
        continue;
      }

      if (!existingItem) {
        stats.unchanged++;
        continue;
      }

      if (entry.action === "update") {
        await auditedPatch(ctx, "action_items", existingItem._id, {
          title: entry.title,
          priority: entry.priority,
          assigneeEntity: entry.assigneeEntityId && entry.assigneeEntityType
            ? { id: entry.assigneeEntityId, type: entry.assigneeEntityType }
            : undefined,
          assigneeRole: entry.assigneeRole,
          dueDate: entry.dueDate,
          completionRule: entry.completionRule,
          updatedAt: now,
        });
        keyToId.set(entry.key, existingItem._id);
        stats.updated++;
        continue;
      }

      if (entry.action === "complete") {
        await auditedPatch(ctx, "action_items", existingItem._id, {
          status: "completed",
          completedAt: now,
          statusReason: `ai_regen: ${entry.actionReason ?? "completed by AI"}`,
          updatedAt: now,
        });
        keyToId.set(entry.key, existingItem._id);
        stats.completed++;
        continue;
      }

      if (entry.action === "delete") {
        await auditedPatch(ctx, "action_items", existingItem._id, {
          status: "deleted",
          deletedAt: now,
          statusReason: `ai_regen: ${entry.actionReason ?? "removed by AI"}`,
          updatedAt: now,
        });
        stats.deleted++;
        continue;
      }

      keyToId.set(entry.key, existingItem._id);
      stats.unchanged++;
    }

    const activeItems = (await ctx.db
      .query("action_items")
      .withIndex("by_file_id", (q) => q.eq("fileId", file._id))
      .collect())
      .filter((item) => item.status === "pending");
    for (const item of activeItems) {
      const existingDeps = await ctx.db
        .query("action_item_dependencies")
        .withIndex("by_from_item_id", (q) => q.eq("fromItemId", item._id))
        .collect();
      for (const dependency of existingDeps) {
        await ctx.db.delete(dependency._id);
      }
    }

    let totalDeps = 0;
    for (const entry of args.items) {
      if (!entry.dependsOn?.length) continue;
      const fromItemId = keyToId.get(entry.key);
      if (!fromItemId) continue;

      for (const dependency of entry.dependsOn) {
        const toItemId = keyToId.get(dependency.key);
        if (!toItemId || toItemId === fromItemId) continue;
        await auditedInsert(ctx, "action_item_dependencies", {
          legacyId: crypto.randomUUID(),
          fromItemId,
          toItemId,
          type: dependency.type,
          createdAt: now,
        });
        totalDeps++;
      }
    }

    return { stats, totalDeps };
  },
});
