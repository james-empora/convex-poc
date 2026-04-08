import { v } from "convex/values";
import { query } from "./_generated/server";

export const getHistory = query({
  args: {
    rowId: v.string(),
    tableName: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    items: v.array(v.any()),
    nextCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const rows = args.tableName
      ? await ctx.db
          .query("audit_log")
          .withIndex("by_table_row", (q) => q.eq("tableName", args.tableName!).eq("rowId", args.rowId))
          .collect()
      : await ctx.db
          .query("audit_log")
          .withIndex("by_row_id", (q) => q.eq("rowId", args.rowId))
          .collect();

    const filtered = rows
      .filter((row) => !args.cursor || new Date(row.occurredAt).toISOString() < args.cursor)
      .sort((a, b) => b.occurredAt - a.occurredAt);
    const page = filtered.slice(0, limit + 1);
    const hasMore = page.length > limit;
    const items = (hasMore ? page.slice(0, limit) : page).map((row) => ({
      id: row.legacyId ?? row._id,
      tableName: row.tableName,
      rowId: row.rowId,
      operation: row.operation,
      oldData: row.oldData ?? null,
      newData: row.newData ?? null,
      changedFields: row.changedFields ?? null,
      userId: row.userId ?? null,
      userEmail: row.userEmail ?? null,
      occurredAt: new Date(row.occurredAt).toISOString(),
    }));

    return {
      items,
      nextCursor: hasMore ? new Date(items[items.length - 1].occurredAt).toISOString() : null,
    };
  },
});
