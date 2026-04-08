import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { auditedInsert, auditedPatch } from "./lib/audit";
import { deriveChatPreview, deriveChatTitle, type PersistedChatMessage } from "../lib/chat/threads";

const titleSourceValidator = v.union(
  v.literal("derived"),
  v.literal("generated"),
  v.literal("manual"),
);

function toIso(value: number) {
  return new Date(value).toISOString();
}

async function currentUserDoc(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_auth0_sub", (q) => q.eq("auth0Sub", identity.subject))
    .unique();
}

async function findThreadByChatId(ctx: QueryCtx | MutationCtx, chatId: string) {
  return await ctx.db
    .query("chat_threads")
    .withIndex("by_chat_id", (q) => q.eq("id", chatId))
    .unique();
}

async function fileByLegacyId(ctx: QueryCtx | MutationCtx, fileId: string) {
  return await ctx.db
    .query("files")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", fileId))
    .unique();
}

function normalizeThread(
  row: Doc<"chat_threads">,
  messages: Array<{ id: string; role: string; parts: PersistedChatMessage["parts"]; createdAt?: string }>,
) {
  return {
    id: row.id,
    threadType: row.threadType,
    title: row.title,
    titleSource: row.titleSource,
    messages,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
    lastMessageAt: toIso(row.lastMessageAt),
  };
}

function normalizeSummary(
  row: Doc<"chat_threads">,
  messages: Array<{ id: string; role: string; parts: PersistedChatMessage["parts"]; createdAt?: string }>,
) {
  return {
    id: row.id,
    threadType: row.threadType,
    title: row.title,
    titleSource: row.titleSource,
    preview: deriveChatPreview(messages as PersistedChatMessage[]),
    messageCount: messages.length,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
    lastMessageAt: toIso(row.lastMessageAt),
  };
}

async function loadMessages(ctx: QueryCtx | MutationCtx, threadId: Doc<"chat_threads">["_id"]) {
  const rows = await ctx.db
    .query("chat_messages")
    .withIndex("by_thread_ordinal", (q) => q.eq("threadId", threadId))
    .collect();

  return rows
    .slice()
    .sort((a, b) => a.ordinal - b.ordinal)
    .map((row) => ({
      id: row.messageId,
      role: row.role,
      parts: row.parts as PersistedChatMessage["parts"],
      createdAt: toIso(row.createdAt),
    }));
}

export const saveChat = mutation({
  args: {
    chatId: v.string(),
    fileId: v.optional(v.union(v.string(), v.null())),
    messages: v.array(v.any()),
    model: v.optional(v.union(v.string(), v.null())),
    tokenUsage: v.optional(v.union(v.any(), v.null())),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
      const now = Date.now();
      const user = await currentUserDoc(ctx);
      const messages = args.messages as PersistedChatMessage[];
      const derivedTitle = deriveChatTitle(messages);
      const existing = await findThreadByChatId(ctx, args.chatId);
      const titleSource = existing?.titleSource ?? "derived";
      const title = titleSource === "derived" ? derivedTitle : (existing?.title ?? derivedTitle);

      let thread = existing;
      if (!thread) {
        thread = await auditedInsert(ctx, "chat_threads", {
          id: args.chatId,
          threadType: "user_chat",
          userId: user?._id,
          title,
          titleSource,
          lastMessageAt: now,
          createdAt: now,
          updatedAt: now,
        });
      } else {
        thread = await auditedPatch(ctx, "chat_threads", thread._id, {
          userId: user?._id ?? thread.userId,
          title,
          titleSource,
          lastMessageAt: now,
          updatedAt: now,
        });
      }

      if (args.fileId) {
        const file = await fileByLegacyId(ctx, args.fileId);
        if (file) {
          const existingAssoc = await ctx.db
            .query("thread_associations")
            .withIndex("by_thread_resource", (q) =>
              q.eq("threadId", thread._id).eq("resource.type", "file").eq("resource.id", args.fileId!),
            )
            .unique();
          if (!existingAssoc) {
            await auditedInsert(ctx, "thread_associations", {
              legacyId: crypto.randomUUID(),
              threadId: thread._id,
              resource: { type: "file", id: args.fileId },
              createdAt: now,
            });
          }
        }
      }

      const existingMessages = await ctx.db
        .query("chat_messages")
        .withIndex("by_thread_ordinal", (q) => q.eq("threadId", thread._id))
        .collect();
      const existingMeta = new Map<string, { model: string | null; tokenUsage: unknown }>();
      for (const row of existingMessages) {
        if (row.model || row.tokenUsage) {
          existingMeta.set(row.messageId, { model: row.model ?? null, tokenUsage: row.tokenUsage });
        }
      }

      for (const row of existingMessages) {
        await ctx.db.delete(row._id);
      }

      const lastNewAssistantIdx = messages.reduce(
        (acc, message, idx) => (message.role === "assistant" && !existingMeta.has(message.id) ? idx : acc),
        -1,
      );

      for (const [idx, message] of messages.entries()) {
        await auditedInsert(ctx, "chat_messages", {
          legacyId: crypto.randomUUID(),
          threadId: thread._id,
          messageId: message.id,
          role: message.role,
          parts: message.parts as never,
          model: message.role === "assistant"
            ? (existingMeta.get(message.id)?.model ?? args.model ?? undefined)
            : undefined,
          tokenUsage: existingMeta.get(message.id)?.tokenUsage
            ?? (idx === lastNewAssistantIdx && args.tokenUsage ? args.tokenUsage : undefined),
          ordinal: idx,
          createdAt: "createdAt" in message && message.createdAt
            ? new Date(message.createdAt as string).getTime()
            : now,
        });
      }

      return normalizeThread(thread, messages);
    },
});

export const getChat = query({
  args: { chatId: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const thread = await findThreadByChatId(ctx, args.chatId);
    if (!thread) return null;

    const user = await currentUserDoc(ctx);
    if (thread.threadType !== "system" && user && thread.userId && thread.userId !== user._id) {
      return null;
    }

    const messages = await loadMessages(ctx, thread._id);
    return normalizeThread(thread, messages);
  },
});

export const listFileChats = query({
  args: {
    fileId: v.string(),
    includeSystem: v.optional(v.boolean()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const associations = await ctx.db
      .query("thread_associations")
      .withIndex("by_resource", (q) => q.eq("resource.type", "file").eq("resource.id", args.fileId))
      .collect();
    const user = await currentUserDoc(ctx);
    const threads = [];
    for (const association of associations) {
      const thread = await ctx.db.get(association.threadId);
      if (!thread) continue;
      if (!args.includeSystem && thread.threadType !== "user_chat") continue;
      if (user && !args.includeSystem && thread.userId && thread.userId !== user._id) continue;
      threads.push(thread);
    }
    const unique = new Map(threads.map((thread) => [thread._id, thread]));
    const sorted = [...unique.values()].sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    const items = [];
    for (const thread of sorted) {
      const messages = await loadMessages(ctx, thread._id);
      items.push(normalizeSummary(thread, messages));
    }
    return items;
  },
});

export const listCoordinatorChats = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const user = await currentUserDoc(ctx);
    const threads = await ctx.db
      .query("chat_threads")
      .withIndex("by_type_last_message_at", (q) => q.eq("threadType", "user_chat"))
      .collect();
    const filtered = [];
    for (const thread of threads) {
      if (user && thread.userId && thread.userId !== user._id) continue;
      const hasFile = (await ctx.db
        .query("thread_associations")
        .withIndex("by_thread_resource", (q) => q.eq("threadId", thread._id))
        .collect())
        .some((assoc) => assoc.resource.type === "file");
      if (hasFile) continue;
      filtered.push(thread);
    }
    const sorted = filtered.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    const items = [];
    for (const thread of sorted) {
      const messages = await loadMessages(ctx, thread._id);
      items.push(normalizeSummary(thread, messages));
    }
    return items;
  },
});

export const updateChatTitle = mutation({
  args: {
    chatId: v.string(),
    title: v.string(),
    fileId: v.optional(v.union(v.string(), v.null())),
    source: v.optional(titleSourceValidator),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
      const now = Date.now();
      const user = await currentUserDoc(ctx);
      const existing = await findThreadByChatId(ctx, args.chatId);
      const source = args.source ?? "manual";
      let thread = existing;
      if (!thread) {
        thread = await auditedInsert(ctx, "chat_threads", {
          id: args.chatId,
          threadType: "user_chat",
          userId: user?._id,
          title: args.title,
          titleSource: source,
          lastMessageAt: now,
          createdAt: now,
          updatedAt: now,
        });
      } else {
        thread = await auditedPatch(ctx, "chat_threads", thread._id, {
          userId: user?._id ?? thread.userId,
          title: args.title,
          titleSource: source,
          updatedAt: now,
        });
      }

      if (args.fileId) {
        const existingAssoc = await ctx.db
          .query("thread_associations")
          .withIndex("by_thread_resource", (q) =>
            q.eq("threadId", thread._id).eq("resource.type", "file").eq("resource.id", args.fileId!),
          )
          .unique();
        if (!existingAssoc) {
          await auditedInsert(ctx, "thread_associations", {
            legacyId: crypto.randomUUID(),
            threadId: thread._id,
            resource: { type: "file", id: args.fileId },
            createdAt: now,
          });
        }
      }

      return { id: thread.id, title: thread.title, titleSource: thread.titleSource };
    },
});
