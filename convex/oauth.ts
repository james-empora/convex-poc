import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getClientByClientId = query({
  args: { clientId: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const client = await ctx.db
      .query("mcp_oauth_clients")
      .withIndex("by_client_id", (q) => q.eq("clientId", args.clientId))
      .unique();

    if (!client) return null;

    return {
      id: client.legacyId ?? client._id,
      clientId: client.clientId,
      clientSecretDigest: client.clientSecretDigest,
      clientName: client.clientName ?? null,
      redirectUris: client.redirectUris,
      createdAt: new Date(client.createdAt).toISOString(),
      updatedAt: new Date(client.updatedAt).toISOString(),
    };
  },
});

export const getGrantByTokenDigest = query({
  args: { tokenDigest: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const grant = await ctx.db
      .query("mcp_oauth_grants")
      .withIndex("by_token_digest", (q) => q.eq("tokenDigest", args.tokenDigest))
      .unique();

    if (!grant || grant.revokedAt) return null;

    const client = await ctx.db.get(grant.oauthClientId);

    return {
      id: grant.legacyId ?? grant._id,
      oauthClientId: client?.legacyId ?? grant.oauthClientId,
      userId: grant.userId,
      userEmail: grant.userEmail,
      grantType: grant.grantType,
      tokenDigest: grant.tokenDigest,
      codeChallengeS256: grant.codeChallengeS256 ?? null,
      redirectUri: grant.redirectUri ?? null,
      expiresAt: new Date(grant.expiresAt).toISOString(),
      revokedAt: grant.revokedAt ? new Date(grant.revokedAt).toISOString() : null,
      createdAt: new Date(grant.createdAt).toISOString(),
      updatedAt: new Date(grant.updatedAt).toISOString(),
    };
  },
});

export const createClient = mutation({
  args: {
    clientId: v.string(),
    clientSecretDigest: v.string(),
    clientName: v.optional(v.string()),
    redirectUris: v.array(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("mcp_oauth_clients")
      .withIndex("by_client_id", (q) => q.eq("clientId", args.clientId))
      .unique();

    if (existing) {
      throw new ConvexError({ code: "Conflict", message: "OAuth client already exists" });
    }

    const legacyId = crypto.randomUUID();
    await ctx.db.insert("mcp_oauth_clients", {
      legacyId,
      clientId: args.clientId,
      clientSecretDigest: args.clientSecretDigest,
      clientName: args.clientName,
      redirectUris: args.redirectUris,
      createdAt: now,
      updatedAt: now,
    });

    return legacyId;
  },
});

export const createGrant = mutation({
  args: {
    oauthClientId: v.string(),
    userId: v.string(),
    userEmail: v.string(),
    grantType: v.union(
      v.literal("authorization_code"),
      v.literal("access_token"),
      v.literal("refresh_token"),
    ),
    tokenDigest: v.string(),
    expiresAt: v.number(),
    codeChallengeS256: v.optional(v.string()),
    redirectUri: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const client = await ctx.db
      .query("mcp_oauth_clients")
      .withIndex("by_client_id", (q) => q.eq("clientId", args.oauthClientId))
      .unique();

    if (!client) {
      throw new ConvexError({ code: "NotFound", message: "OAuth client not found" });
    }

    const now = Date.now();
    const legacyId = crypto.randomUUID();
    await ctx.db.insert("mcp_oauth_grants", {
      legacyId,
      oauthClientId: client._id,
      userId: args.userId,
      userEmail: args.userEmail,
      grantType: args.grantType,
      tokenDigest: args.tokenDigest,
      codeChallengeS256: args.codeChallengeS256,
      redirectUri: args.redirectUri,
      expiresAt: args.expiresAt,
      revokedAt: undefined,
      createdAt: now,
      updatedAt: now,
    });

    return legacyId;
  },
});

export const revokeGrant = mutation({
  args: { grantId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const grant = await ctx.db
      .query("mcp_oauth_grants")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.grantId))
      .unique();

    if (!grant) {
      throw new ConvexError({ code: "NotFound", message: "OAuth grant not found" });
    }

    await ctx.db.patch(grant._id, {
      revokedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return null;
  },
});
