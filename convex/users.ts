import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { InternalPermission, UserType, defaultPermissionsForEmail, inferUserType } from "./lib/permissions";

async function getIdentityProfile(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject || !identity.email) {
    return null;
  }

  return {
    auth0Sub: identity.subject,
    email: identity.email.toLowerCase(),
    name: identity.name,
  };
}

export const ensureCurrentUser = mutation({
  args: {},
  returns: v.union(v.any(), v.null()),
  handler: async (ctx) => {
    const profile = await getIdentityProfile(ctx);
    if (!profile) {
      return null;
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_auth0_sub", (q) => q.eq("auth0Sub", profile.auth0Sub))
      .unique();

    if (existing) {
      const updatedFields: Partial<typeof existing> = {
        lastLoginAt: Date.now(),
      };

      if (profile.name && profile.name !== existing.displayName) {
        updatedFields.displayName = profile.name;
      }

      await ctx.db.patch(existing._id, updatedFields);
      return (await ctx.db.get(existing._id)) ?? existing;
    }

    const seeded = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", profile.email))
      .unique();

    if (seeded) {
      await ctx.db.patch(seeded._id, {
        auth0Sub: profile.auth0Sub,
        displayName: profile.name ?? seeded.displayName,
        lastLoginAt: Date.now(),
      });
      return await ctx.db.get(seeded._id);
    }

    const entityMatch = await ctx.db
      .query("entity_identifiers")
      .withIndex("by_type_value", (q) =>
        q.eq("identifierType", "email").eq("value", profile.email),
      )
      .first();

    const userId = await ctx.db.insert("users", {
      legacyId: crypto.randomUUID(),
      auth0Sub: profile.auth0Sub,
      email: profile.email,
      displayName: profile.name,
      userType: inferUserType(profile.email),
      entity: entityMatch?.entity,
      permissions: defaultPermissionsForEmail(profile.email),
      active: true,
      lastLoginAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(userId);
  },
});

export const current = query({
  args: {},
  returns: v.union(v.any(), v.null()),
  handler: async (ctx) => {
    const profile = await getIdentityProfile(ctx);
    if (!profile) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_auth0_sub", (q) => q.eq("auth0Sub", profile.auth0Sub))
      .unique();
  },
});

export const currentPermissions = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const profile = await getIdentityProfile(ctx);
    if (!profile) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_auth0_sub", (q) => q.eq("auth0Sub", profile.auth0Sub))
      .unique();

    return user?.permissions ?? [];
  },
});

export const getByLegacyId = query({
  args: {
    userId: v.string(),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.userId))
      .unique();

    return user ?? null;
  },
});

export const seedInternalAdmin = mutation({
  args: {
    email: v.string(),
    auth0Sub: v.string(),
    displayName: v.optional(v.string()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        auth0Sub: args.auth0Sub,
        displayName: args.displayName ?? existing.displayName,
        userType: UserType.INTERNAL,
        permissions: [InternalPermission.EMPLOYEE, InternalPermission.ADMIN],
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      legacyId: crypto.randomUUID(),
      auth0Sub: args.auth0Sub,
      email: args.email.toLowerCase(),
      displayName: args.displayName,
      userType: UserType.INTERNAL,
      entity: undefined,
      permissions: [InternalPermission.EMPLOYEE, InternalPermission.ADMIN],
      active: true,
      lastLoginAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
