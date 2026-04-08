import { ConvexError, v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { auditedInsert } from "./lib/audit";

const findingSourceTypeValidator = v.literal("document");
const findingStatusValidator = v.union(
  v.literal("draft"),
  v.literal("confirmed"),
  v.literal("dismissed"),
);

function legacy(doc: { legacyId?: string; _id: string }) {
  return doc.legacyId ?? doc._id;
}

async function findFileByLegacyId(ctx: QueryCtx | MutationCtx, legacyId: string) {
  return await ctx.db
    .query("files")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", legacyId))
    .unique();
}

async function findDocumentByLegacyId(ctx: QueryCtx | MutationCtx, legacyId: string) {
  return await ctx.db
    .query("documents")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", legacyId))
    .unique();
}

async function findFindingByLegacyId(ctx: QueryCtx | MutationCtx, legacyId: string) {
  return await ctx.db
    .query("findings")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", legacyId))
    .unique();
}

function normalizeSource(source: {
  _id: string;
  legacyId?: string;
  findingId: string;
  source: { type: "document"; id: string };
  excerpt?: string;
  pageNumber?: number;
  createdAt: number;
}, findingId: string) {
  return {
    id: legacy(source),
    findingId,
    sourceType: source.source.type,
    sourceId: source.source.id,
    excerpt: source.excerpt ?? null,
    pageNumber: source.pageNumber ?? null,
    createdAt: new Date(source.createdAt).toISOString(),
  };
}

export const listFindings = query({
  args: { fileId: v.string() },
  returns: v.object({
    findings: v.array(v.any()),
  }),
  handler: async (ctx, args) => {
    const file = await findFileByLegacyId(ctx, args.fileId);
    if (!file) {
      return { findings: [] };
    }

    const findings = await ctx.db
      .query("findings")
      .withIndex("by_file_id", (q) => q.eq("fileId", file._id))
      .collect();
    const sources = await ctx.db.query("finding_sources").collect();
    const sourceMap = new Map<string, typeof sources>();

    for (const source of sources) {
      const current = sourceMap.get(source.findingId) ?? [];
      current.push(source);
      sourceMap.set(source.findingId, current);
    }

    return {
      findings: findings.map((finding) => ({
        id: legacy(finding),
        fileId: file.legacyId ?? file._id,
        findingType: finding.findingType,
        summary: finding.summary,
        data: finding.data ?? null,
        status: finding.status,
        createdAt: new Date(finding.createdAt).toISOString(),
        updatedAt: new Date(finding.updatedAt).toISOString(),
        sources: (sourceMap.get(finding._id) ?? []).map((source) => normalizeSource(source, legacy(finding))),
      })),
    };
  },
});

export const createFinding = mutation({
  args: {
    fileId: v.string(),
    findingType: v.string(),
    summary: v.string(),
    data: v.optional(v.record(v.string(), v.any())),
    source: v.object({
      documentId: v.string(),
      excerpt: v.optional(v.string()),
      pageNumber: v.optional(v.number()),
    }),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
      const file = await findFileByLegacyId(ctx, args.fileId);
      if (!file) {
        throw new ConvexError({ code: "NotFound", message: `File not found: ${args.fileId}` });
      }

      const document = await findDocumentByLegacyId(ctx, args.source.documentId);
      if (!document) {
        throw new ConvexError({
          code: "NotFound",
          message: `Document not found: ${args.source.documentId}`,
        });
      }

      const now = Date.now();
      const finding = await auditedInsert(
        ctx,
        "findings",
        {
          legacyId: crypto.randomUUID(),
          fileId: file._id,
          findingType: args.findingType,
          summary: args.summary,
          data: args.data,
          status: "draft",
          createdAt: now,
          updatedAt: now,
        },
      );

      const source = await auditedInsert(
        ctx,
        "finding_sources",
        {
          legacyId: crypto.randomUUID(),
          findingId: finding._id,
          source: { type: "document", id: legacy(document) },
          excerpt: args.source.excerpt,
          pageNumber: args.source.pageNumber,
          createdAt: now,
        },
      );

      return {
        id: legacy(finding),
        fileId: legacy(file),
        findingType: finding.findingType,
        summary: finding.summary,
        data: finding.data ?? null,
        status: finding.status satisfies typeof findingStatusValidator.type,
        createdAt: new Date(finding.createdAt).toISOString(),
        updatedAt: new Date(finding.updatedAt).toISOString(),
        sources: [normalizeSource(source, legacy(finding))],
      };
    },
});

export const addFindingSource = mutation({
  args: {
    findingId: v.string(),
    sourceType: findingSourceTypeValidator,
    sourceId: v.string(),
    excerpt: v.optional(v.string()),
    pageNumber: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
      const finding = await findFindingByLegacyId(ctx, args.findingId);
      if (!finding) {
        throw new ConvexError({ code: "NotFound", message: `Finding not found: ${args.findingId}` });
      }

      const document = await findDocumentByLegacyId(ctx, args.sourceId);
      if (!document) {
        throw new ConvexError({ code: "NotFound", message: `Document not found: ${args.sourceId}` });
      }

      const source = await auditedInsert(
        ctx,
        "finding_sources",
        {
          legacyId: crypto.randomUUID(),
          findingId: finding._id,
          source: { type: args.sourceType, id: legacy(document) },
          excerpt: args.excerpt,
          pageNumber: args.pageNumber,
          createdAt: Date.now(),
        },
      );

      return normalizeSource(source, legacy(finding));
    },
});
