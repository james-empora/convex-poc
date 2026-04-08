import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { auditedInsert } from "./lib/audit";

const documentTypeValidator = v.union(
  v.literal("purchase_contract"),
  v.literal("deed"),
  v.literal("mortgage"),
  v.literal("title_commitment"),
  v.literal("title_search"),
  v.literal("survey"),
  v.literal("payoff_letter"),
  v.literal("closing_disclosure"),
  v.literal("settlement_statement"),
  v.literal("power_of_attorney"),
  v.literal("operating_agreement"),
  v.literal("tax_certificate"),
  v.literal("estoppel_letter"),
  v.literal("id_verification"),
  v.literal("vesting_deed"),
  v.literal("promissory_note"),
  v.literal("closing_instruction"),
  v.literal("wire_instruction"),
  v.literal("insurance_binder"),
  v.literal("transcript"),
  v.literal("other"),
);

const documentFiletypeValidator = v.union(
  v.literal("pdf"),
  v.literal("png"),
  v.literal("jpg"),
  v.literal("tiff"),
  v.literal("docx"),
  v.literal("xlsx"),
);

const documentOriginValidator = v.union(
  v.literal("upload"),
  v.literal("generated"),
  v.literal("e_recording"),
  v.literal("vendor"),
  v.literal("email_attachment"),
  v.literal("fax"),
);

const attachmentResourceTypeValidator = v.union(
  v.literal("file"),
  v.literal("property"),
  v.literal("encumbrance"),
  v.literal("vendor_order"),
  v.literal("workflow"),
  v.literal("work_item"),
  v.literal("line_item"),
  v.literal("appointment"),
);

const extractedPageValidator = v.object({
  pageNumber: v.number(),
  text: v.string(),
});

const EXTRACTABLE_FILETYPES = new Set(["pdf", "png", "jpg", "jpeg", "tiff"]);

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

async function currentUploader(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject) {
    return { uploadedBy: { type: "system" as const, id: "system" }, user: null };
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_auth0_sub", (q) => q.eq("auth0Sub", identity.subject))
    .unique();

  if (user?.entity) {
    return { uploadedBy: user.entity, user };
  }

  return {
    uploadedBy: { type: "system" as const, id: identity.subject },
    user,
  };
}

export const getExtractedText = query({
  args: { documentId: v.string() },
  returns: v.object({
    success: v.boolean(),
    totalPages: v.number(),
    pages: v.array(extractedPageValidator),
  }),
  handler: async (ctx, args) => {
    const document = await findDocumentByLegacyId(ctx, args.documentId);
    if (!document) {
      throw new ConvexError({ code: "NotFound", message: `Document not found: ${args.documentId}` });
    }

    if (document.extractedText) {
      const extracted = document.extractedText as { pages?: Array<{ pageNumber: number; text: string }> };
      if (!extracted.pages) {
        throw new ConvexError({ code: "InvalidState", message: "No text content in extraction results." });
      }
      return {
        success: true,
        totalPages: extracted.pages.length,
        pages: extracted.pages,
      };
    }

    const associations = await ctx.db
      .query("thread_associations")
      .withIndex("by_resource", (q) => q.eq("resource.type", "document").eq("resource.id", args.documentId))
      .collect();

    const workflowRuns = [];
    for (const association of associations) {
      const runs = await ctx.db
        .query("workflow_runs")
        .withIndex("by_thread_id", (q) => q.eq("threadId", association.threadId))
        .collect();
      workflowRuns.push(...runs.filter((run) => run.workflowType === "document_extraction"));
    }

    const latestRun = workflowRuns.sort((a, b) => b.createdAt - a.createdAt)[0];
    if (!latestRun) {
      throw new ConvexError({ code: "NotFound", message: "No processing job found for this document." });
    }
    if (latestRun.status === "failed") {
      throw new ConvexError({
        code: "ExtractionFailed",
        message: `Extraction failed: ${latestRun.errorMessage ?? "unknown error"}`,
      });
    }

    throw new ConvexError({
      code: "ProcessingNotReady",
      message: `Extraction status is ${latestRun.status}. Use getProcessingStatus or retry later.`,
    });
  },
});

export const listFileDocuments = query({
  args: { fileId: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const attachments = await ctx.db
      .query("document_attachments")
      .withIndex("by_resource", (q) => q.eq("resource.type", "file").eq("resource.id", args.fileId))
      .collect();

    const documents = [];
    for (const attachment of attachments) {
      const document = await ctx.db.get(attachment.documentId);
      if (!document || document.deletedAt) continue;
      documents.push(document);
    }

    return documents
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((document) => ({
        id: legacy(document),
        name: document.name,
        documentType: document.documentType,
        filetype: document.filetype ?? null,
        storagePath: document.storagePath,
        fileSizeBytes: document.fileSizeBytes ?? null,
        pageCount: document.pageCount ?? null,
        origin: document.origin ?? null,
        createdAt: new Date(document.createdAt).toISOString(),
      }));
  },
});

export const getDocument = query({
  args: { documentId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const document = await findDocumentByLegacyId(ctx, args.documentId);
    if (!document || document.deletedAt) {
      throw new ConvexError({ code: "NotFound", message: `Document not found: ${args.documentId}` });
    }

    const attachment = (
      await ctx.db
        .query("document_attachments")
        .withIndex("by_document_id", (q) => q.eq("documentId", document._id))
        .collect()
    ).find((item) => item.resource.type === "file");

    return {
      id: legacy(document),
      name: document.name,
      documentType: document.documentType,
      filetype: document.filetype ?? null,
      storagePath: document.storagePath,
      fileSizeBytes: document.fileSizeBytes ?? null,
      createdAt: new Date(document.createdAt).toISOString(),
      fileId: attachment?.resource.id ?? null,
    };
  },
});

export const registerClientUpload = mutation({
  args: {
    name: v.string(),
    documentType: documentTypeValidator,
    filetype: documentFiletypeValidator,
    storagePath: v.string(),
    fileSizeBytes: v.number(),
    origin: v.optional(documentOriginValidator),
    resourceType: v.optional(attachmentResourceTypeValidator),
    resourceId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
      if ((args.resourceType && !args.resourceId) || (!args.resourceType && args.resourceId)) {
        throw new ConvexError({
          code: "ValidationError",
          message: "resourceType and resourceId must either both be present or both be absent",
        });
      }

      if (args.resourceType === "file" && args.resourceId) {
        const file = await findFileByLegacyId(ctx, args.resourceId);
        if (!file) {
          throw new ConvexError({
            code: "NotFound",
            message: `File not found: ${args.resourceId}`,
          });
        }
      }

      const now = Date.now();
      const uploader = await currentUploader(ctx);
      const document = await auditedInsert(
        ctx,
        "documents",
        {
          legacyId: crypto.randomUUID(),
          name: args.name,
          documentType: args.documentType,
          storagePath: args.storagePath,
          filetype: args.filetype,
          fileSizeBytes: args.fileSizeBytes,
          pageCount: undefined,
          versionMajor: 1,
          versionMinor: 0,
          origin: args.origin ?? "upload",
          uploadedBy: uploader.uploadedBy,
          extractedText: undefined,
          metadata: undefined,
          deletedAt: undefined,
          createdAt: now,
          updatedAt: now,
        },
      );

      if (args.resourceType && args.resourceId) {
        await auditedInsert(
          ctx,
          "document_attachments",
          {
            legacyId: crypto.randomUUID(),
            documentId: document._id,
            resource: { type: args.resourceType, id: args.resourceId },
            label: undefined,
            visibility: "private",
            status: "received",
            attributes: undefined,
            createdAt: now,
          },
        );
      }

      if (EXTRACTABLE_FILETYPES.has(args.filetype)) {
        const threadId = crypto.randomUUID();
        const chatThread = await auditedInsert(
          ctx,
          "chat_threads",
          {
            id: threadId,
            threadType: "system",
            userId: uploader.user?._id,
            title: `Processing: ${args.name}`,
            titleSource: "derived",
            lastMessageAt: now,
            createdAt: now,
            updatedAt: now,
          },
        );

        await auditedInsert(
          ctx,
          "workflow_runs",
          {
            legacyId: crypto.randomUUID(),
            workflowType: "document_extraction",
            threadId: chatThread._id,
            status: "pending",
            input: { documentId: legacy(document) },
            errorMessage: undefined,
            startedAt: now,
            completedAt: undefined,
            createdAt: now,
          },
        );

        await auditedInsert(
          ctx,
          "thread_associations",
          {
            legacyId: crypto.randomUUID(),
            threadId: chatThread._id,
            resource: { type: "document", id: legacy(document) },
            createdAt: now,
          },
        );

        if (args.resourceType === "file" && args.resourceId) {
          await auditedInsert(
            ctx,
            "thread_associations",
            {
              legacyId: crypto.randomUUID(),
              threadId: chatThread._id,
              resource: { type: "file", id: args.resourceId },
              createdAt: now,
            },
          );
        }
      }

      return document;
  },
});

export const getExtractionContext = query({
  args: { documentId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const doc = await findDocumentByLegacyId(ctx, args.documentId);
    if (!doc) {
      throw new ConvexError({ code: "NotFound", message: `Document ${args.documentId} not found` });
    }

    const associations = await ctx.db
      .query("thread_associations")
      .withIndex("by_resource", (q) => q.eq("resource.type", "document").eq("resource.id", args.documentId))
      .collect();
    const workflowRuns = [];
    for (const association of associations) {
      const runs = await ctx.db
        .query("workflow_runs")
        .withIndex("by_thread_id", (q) => q.eq("threadId", association.threadId))
        .collect();
      workflowRuns.push(...runs.filter((run) => run.workflowType === "document_extraction"));
    }
    const run = workflowRuns[0];
    if (!run) {
      throw new ConvexError({ code: "NotFound", message: `No workflow run for document ${args.documentId}` });
    }

    const thread = run.threadId ? await ctx.db.get(run.threadId) : null;
    return {
      workflowRunId: legacy(run),
      threadId: thread?.id ?? null,
      storagePath: doc.storagePath,
      filetype: doc.filetype ?? null,
    };
  },
});

export const markExtractionRunning = mutation({
  args: { workflowRunId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db
      .query("workflow_runs")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.workflowRunId))
      .unique();
    if (run) {
      await ctx.db.patch(run._id, { status: "running", startedAt: Date.now() });
    }
    return null;
  },
});

export const completeExtraction = mutation({
  args: {
    documentId: v.string(),
    workflowRunId: v.string(),
    extraction: v.object({
      pages: v.array(v.object({
        pageNumber: v.number(),
        text: v.string(),
      })),
      totalPages: v.number(),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await findDocumentByLegacyId(ctx, args.documentId);
    if (doc) {
      await ctx.db.patch(doc._id, {
        extractedText: args.extraction,
        pageCount: args.extraction.totalPages > 0 ? args.extraction.totalPages : doc.pageCount,
      });
    }

    const run = await ctx.db
      .query("workflow_runs")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.workflowRunId))
      .unique();
    if (run) {
      await ctx.db.patch(run._id, { status: "completed", completedAt: Date.now() });
    }

    return null;
  },
});

export const appendThreadMessages = mutation({
  args: {
    threadId: v.string(),
    messages: v.array(v.object({
      role: v.string(),
      content: v.string(),
      model: v.optional(v.union(v.string(), v.null())),
      tokenUsage: v.optional(v.union(v.object({
        inputTokens: v.number(),
        outputTokens: v.number(),
      }), v.null())),
    })),
    startOrdinal: v.number(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const thread = await ctx.db
      .query("chat_threads")
      .withIndex("by_chat_id", (q) => q.eq("id", args.threadId))
      .unique();
    if (!thread) {
      return args.startOrdinal;
    }

    let nextOrdinal = args.startOrdinal;
    for (const message of args.messages) {
      await ctx.db.insert("chat_messages", {
        legacyId: crypto.randomUUID(),
        threadId: thread._id,
        messageId: crypto.randomUUID(),
        role: message.role as any,
        parts: [{ type: "text", text: message.content }],
        model: message.model ?? undefined,
        tokenUsage: message.tokenUsage ?? undefined,
        ordinal: nextOrdinal,
        createdAt: Date.now(),
      });
      nextOrdinal += 1;
    }

    await ctx.db.patch(thread._id, { lastMessageAt: Date.now(), updatedAt: Date.now() });
    return nextOrdinal;
  },
});

export const resolveAttachedFileId = query({
  args: { documentId: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const doc = await findDocumentByLegacyId(ctx, args.documentId);
    if (!doc) return null;
    const attachment = (
      await ctx.db
        .query("document_attachments")
        .withIndex("by_document_id", (q) => q.eq("documentId", doc._id))
        .collect()
    ).find((item) => item.resource.type === "file");

    return attachment?.resource.id ?? null;
  },
});

export const failExtraction = mutation({
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
