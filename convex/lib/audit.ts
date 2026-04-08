import type { MutationCtx } from "../_generated/server";
import type { Doc, TableNames } from "../_generated/dataModel";

export type AuditableTable =
  Exclude<TableNames, "audit_log">;

export type AuditActor = {
  userId?: string;
  userEmail?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stableJson(value: unknown): unknown {
  if (value === undefined) return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return { _serializationError: true };
  }
}

function docRowId(doc: { _id: string; legacyId?: string | null }): string {
  return doc.legacyId ?? doc._id;
}

function changedFields(
  oldDoc: Record<string, unknown>,
  newDoc: Record<string, unknown>,
): string[] {
  const keys = new Set([...Object.keys(oldDoc), ...Object.keys(newDoc)]);
  return [...keys].filter((key) => {
    const before = stableJson(oldDoc[key]);
    const after = stableJson(newDoc[key]);
    return JSON.stringify(before) !== JSON.stringify(after);
  });
}

async function getAuditActor(ctx: MutationCtx): Promise<AuditActor> {
  const identity = await ctx.auth.getUserIdentity();
  return {
    userId: identity?.subject ?? identity?.tokenIdentifier,
    userEmail: identity?.email,
  };
}

async function insertAuditEntry(
  ctx: MutationCtx,
  {
    tableName,
    rowId,
    operation,
    oldData,
    newData,
    changed,
    actor,
  }: {
    tableName: AuditableTable;
    rowId: string;
    operation: "INSERT" | "UPDATE" | "DELETE";
    oldData?: Record<string, unknown>;
    newData?: Record<string, unknown>;
    changed?: string[];
    actor: AuditActor;
  },
) {
  await ctx.db.insert("audit_log", {
    tableName,
    rowId,
    operation,
    oldData: oldData ? stableJson(oldData) : undefined,
    newData: newData ? stableJson(newData) : undefined,
    changedFields: changed && changed.length > 0 ? changed : undefined,
    userId: actor.userId,
    userEmail: actor.userEmail,
    occurredAt: Date.now(),
  });
}

export async function auditedInsert<TableName extends AuditableTable>(
  ctx: MutationCtx,
  tableName: TableName,
  value: Omit<Doc<TableName>, "_id" | "_creationTime">,
) {
  const id = await ctx.db.insert(tableName, value as never);
  const inserted = await ctx.db.get(id);
  if (!inserted) {
    throw new Error(`Failed to load inserted ${tableName} row ${id}`);
  }
  const actor = await getAuditActor(ctx);

  await insertAuditEntry(ctx, {
    tableName,
    rowId: docRowId(inserted as { _id: string; legacyId?: string | null }),
    operation: "INSERT",
    newData: inserted as Record<string, unknown>,
    actor,
  });

  return inserted;
}

export async function auditedPatch<TableName extends AuditableTable>(
  ctx: MutationCtx,
  tableName: TableName,
  id: Doc<TableName>["_id"],
  patch: Partial<Omit<Doc<TableName>, "_id" | "_creationTime">>,
) {
  const before = await ctx.db.get(id);
  if (!before) {
    throw new Error(`Cannot patch missing ${tableName} row ${id}`);
  }

  await ctx.db.patch(id, patch as never);
  const after = await ctx.db.get(id);
  if (!after) {
    throw new Error(`Patched ${tableName} row ${id} disappeared`);
  }

  const changed = isRecord(before) && isRecord(after)
    ? changedFields(before, after)
    : [];

  if (changed.length > 0) {
    const actor = await getAuditActor(ctx);
    await insertAuditEntry(ctx, {
      tableName,
      rowId: docRowId(after as { _id: string; legacyId?: string | null }),
      operation: "UPDATE",
      oldData: before as Record<string, unknown>,
      newData: after as Record<string, unknown>,
      changed,
      actor,
    });
  }

  return after;
}

export async function auditedReplace<TableName extends AuditableTable>(
  ctx: MutationCtx,
  tableName: TableName,
  id: Doc<TableName>["_id"],
  value: Omit<Doc<TableName>, "_id" | "_creationTime">,
) {
  const before = await ctx.db.get(id);
  if (!before) {
    throw new Error(`Cannot replace missing ${tableName} row ${id}`);
  }

  await ctx.db.replace(id, value as never);
  const after = await ctx.db.get(id);
  if (!after) {
    throw new Error(`Replaced ${tableName} row ${id} disappeared`);
  }

  const changed = isRecord(before) && isRecord(after)
    ? changedFields(before, after)
    : [];

  if (changed.length > 0) {
    const actor = await getAuditActor(ctx);
    await insertAuditEntry(ctx, {
      tableName,
      rowId: docRowId(after as { _id: string; legacyId?: string | null }),
      operation: "UPDATE",
      oldData: before as Record<string, unknown>,
      newData: after as Record<string, unknown>,
      changed,
      actor,
    });
  }

  return after;
}

export async function auditedDelete<TableName extends AuditableTable>(
  ctx: MutationCtx,
  tableName: TableName,
  id: Doc<TableName>["_id"],
) {
  const before = await ctx.db.get(id);
  if (!before) {
    throw new Error(`Cannot delete missing ${tableName} row ${id}`);
  }

  await ctx.db.delete(id);
  const actor = await getAuditActor(ctx);
  await insertAuditEntry(ctx, {
    tableName,
    rowId: docRowId(before as { _id: string; legacyId?: string | null }),
    operation: "DELETE",
    oldData: before as Record<string, unknown>,
    actor,
  });
}
