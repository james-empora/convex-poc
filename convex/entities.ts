import { ConvexError, v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { auditedInsert } from "./lib/audit";

const entityTypeValidator = v.union(
  v.literal("individual"),
  v.literal("organization"),
  v.literal("brokerage"),
  v.literal("lender"),
);

const maritalStatusValidator = v.union(
  v.literal("single"),
  v.literal("married"),
  v.literal("divorced"),
  v.literal("widowed"),
  v.literal("unknown"),
);

const formationTypeValidator = v.union(
  v.literal("llc"),
  v.literal("corporation"),
  v.literal("trust"),
  v.literal("partnership"),
  v.literal("sole_proprietorship"),
  v.literal("estate"),
  v.literal("government"),
);

const lenderTypeValidator = v.union(
  v.literal("bank"),
  v.literal("credit_union"),
  v.literal("mortgage_company"),
  v.literal("private"),
  v.literal("hard_money"),
);

function asEntityId(doc: { legacyId?: string; _id: string }) {
  return doc.legacyId ?? doc._id;
}

function normalizeIndividual(doc: {
  _id: string;
  legacyId?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  dateOfBirth?: string;
  maritalStatus?: string;
  citizenship?: string;
  title?: string;
  metadata?: unknown;
  createdAt: number;
  updatedAt: number;
}) {
  return {
    id: asEntityId(doc),
    firstName: doc.firstName,
    middleName: doc.middleName ?? null,
    lastName: doc.lastName,
    suffix: doc.suffix ?? null,
    dateOfBirth: doc.dateOfBirth ?? null,
    maritalStatus: doc.maritalStatus ?? null,
    citizenship: doc.citizenship ?? null,
    title: doc.title ?? null,
    metadata: doc.metadata ?? null,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

function normalizeOrgLike(doc: {
  _id: string;
  legacyId?: string;
  legalName: string;
  createdAt: number;
  updatedAt: number;
  [key: string]: unknown;
}) {
  return {
    id: asEntityId(doc),
    ...Object.fromEntries(
      Object.entries(doc)
        .filter(([key]) => !["_id", "_creationTime", "legacyId"].includes(key))
        .map(([key, value]) => {
          if (key === "createdAt" || key === "updatedAt") {
            return [key, new Date(value as number).toISOString()];
          }
          return [key, value ?? null];
        }),
    ),
  };
}

async function listEntityEmails(ctx: QueryCtx) {
  const identifiers = await ctx.db
    .query("entity_identifiers")
    .withIndex("by_type_value", (q: any) => q.eq("identifierType", "email"))
    .collect();

  const emailByEntity = new Map<string, string>();
  for (const identifier of identifiers) {
    emailByEntity.set(`${identifier.entity.type}:${identifier.entity.id}`, identifier.value);
  }
  return emailByEntity;
}

export const readEntities = query({
  args: {
    entityType: entityTypeValidator,
    id: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    items: v.array(v.any()),
    nextCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    switch (args.entityType) {
      case "individual": {
        if (args.id) {
          const doc = await ctx.db
            .query("individuals")
            .withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.id!))
            .unique();
          return { items: doc ? [normalizeIndividual(doc)] : [], nextCursor: null };
        }
        const rows = await ctx.db.query("individuals").withIndex("by_legacy_id").collect();
        const filtered = rows
          .filter((row) => !!row.legacyId)
          .filter((row) => !args.cursor || row.legacyId! > args.cursor)
          .sort((a, b) => a.legacyId!.localeCompare(b.legacyId!));
        return {
          items: filtered.slice(0, limit).map(normalizeIndividual),
          nextCursor: filtered.length > limit ? filtered[limit - 1].legacyId! : null,
        };
      }
      case "organization": {
        if (args.id) {
          const doc = await ctx.db
            .query("organizations")
            .withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.id!))
            .unique();
          return { items: doc ? [normalizeOrgLike(doc)] : [], nextCursor: null };
        }
        const rows = await ctx.db.query("organizations").withIndex("by_legacy_id").collect();
        const filtered = rows
          .filter((row) => !!row.legacyId)
          .filter((row) => !args.cursor || row.legacyId! > args.cursor)
          .sort((a, b) => a.legacyId!.localeCompare(b.legacyId!));
        return {
          items: filtered.slice(0, limit).map(normalizeOrgLike),
          nextCursor: filtered.length > limit ? filtered[limit - 1].legacyId! : null,
        };
      }
      case "brokerage": {
        if (args.id) {
          const doc = await ctx.db
            .query("brokerages")
            .withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.id!))
            .unique();
          return { items: doc ? [normalizeOrgLike(doc)] : [], nextCursor: null };
        }
        const rows = await ctx.db.query("brokerages").withIndex("by_legacy_id").collect();
        const filtered = rows
          .filter((row) => !!row.legacyId)
          .filter((row) => !args.cursor || row.legacyId! > args.cursor)
          .sort((a, b) => a.legacyId!.localeCompare(b.legacyId!));
        return {
          items: filtered.slice(0, limit).map(normalizeOrgLike),
          nextCursor: filtered.length > limit ? filtered[limit - 1].legacyId! : null,
        };
      }
      case "lender": {
        if (args.id) {
          const doc = await ctx.db
            .query("lenders")
            .withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.id!))
            .unique();
          return { items: doc ? [normalizeOrgLike(doc)] : [], nextCursor: null };
        }
        const rows = await ctx.db.query("lenders").withIndex("by_legacy_id").collect();
        const filtered = rows
          .filter((row) => !!row.legacyId)
          .filter((row) => !args.cursor || row.legacyId! > args.cursor)
          .sort((a, b) => a.legacyId!.localeCompare(b.legacyId!));
        return {
          items: filtered.slice(0, limit).map(normalizeOrgLike),
          nextCursor: filtered.length > limit ? filtered[limit - 1].legacyId! : null,
        };
      }
    }
  },
});

export const searchEntities = query({
  args: {
    query: v.string(),
    entityType: v.optional(entityTypeValidator),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      entityType: entityTypeValidator,
      entityId: v.string(),
      name: v.string(),
      email: v.union(v.string(), v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    const queryText = args.query.toLowerCase();
    const limit = args.limit ?? 20;
    const emailByEntity = await listEntityEmails(ctx);
    const results: Array<{
      entityType: "individual" | "organization" | "brokerage" | "lender";
      entityId: string;
      name: string;
      email: string | null;
    }> = [];
    const seen = new Set<string>();

    const add = (result: {
      entityType: "individual" | "organization" | "brokerage" | "lender";
      entityId: string;
      name: string;
      email: string | null;
    }) => {
      const key = `${result.entityType}:${result.entityId}`;
      if (seen.has(key)) return;
      seen.add(key);
      results.push(result);
    };

    const includeType = (type: "individual" | "organization" | "brokerage" | "lender") =>
      !args.entityType || args.entityType === type;

    if (includeType("individual")) {
      const rows = await ctx.db.query("individuals").collect();
      for (const row of rows) {
        const name = `${row.firstName} ${row.lastName}`;
        const email = emailByEntity.get(`individual:${row._id}`) ?? null;
        if (
          row.firstName.toLowerCase().includes(queryText) ||
          row.lastName.toLowerCase().includes(queryText) ||
          name.toLowerCase().includes(queryText) ||
          (email?.toLowerCase().includes(queryText) ?? false)
        ) {
          add({
            entityType: "individual",
            entityId: asEntityId(row),
            name,
            email,
          });
        }
      }
    }

    if (includeType("organization")) {
      const rows = await ctx.db.query("organizations").collect();
      for (const row of rows) {
        const email = emailByEntity.get(`organization:${row._id}`) ?? null;
        if (
          row.legalName.toLowerCase().includes(queryText) ||
          (email?.toLowerCase().includes(queryText) ?? false)
        ) {
          add({
            entityType: "organization",
            entityId: asEntityId(row),
            name: row.legalName,
            email,
          });
        }
      }
    }

    if (includeType("brokerage")) {
      const rows = await ctx.db.query("brokerages").collect();
      for (const row of rows) {
        const email = emailByEntity.get(`brokerage:${row._id}`) ?? null;
        if (
          row.legalName.toLowerCase().includes(queryText) ||
          (email?.toLowerCase().includes(queryText) ?? false)
        ) {
          add({
            entityType: "brokerage",
            entityId: asEntityId(row),
            name: row.legalName,
            email,
          });
        }
      }
    }

    if (includeType("lender")) {
      const rows = await ctx.db.query("lenders").collect();
      for (const row of rows) {
        const email = emailByEntity.get(`lender:${row._id}`) ?? null;
        if (
          row.legalName.toLowerCase().includes(queryText) ||
          (email?.toLowerCase().includes(queryText) ?? false)
        ) {
          add({
            entityType: "lender",
            entityId: asEntityId(row),
            name: row.legalName,
            email,
          });
        }
      }
    }

    return results.slice(0, limit);
  },
});

export const createEntity = mutation({
  args: {
    entityType: entityTypeValidator,
    firstName: v.optional(v.string()),
    middleName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    suffix: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    maritalStatus: v.optional(maritalStatusValidator),
    legalName: v.optional(v.string()),
    formationType: v.optional(formationTypeValidator),
    stateOfFormation: v.optional(v.string()),
    licenseNumber: v.optional(v.string()),
    licenseState: v.optional(v.string()),
    mlsId: v.optional(v.string()),
    nmlsId: v.optional(v.string()),
    lenderType: v.optional(lenderTypeValidator),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  returns: v.object({
    entityType: entityTypeValidator,
    entityId: v.string(),
    name: v.string(),
    email: v.union(v.string(), v.null()),
    phone: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
      const now = Date.now();
      const legacyId = crypto.randomUUID();

      switch (args.entityType) {
        case "individual": {
          if (!args.firstName || !args.lastName) {
            throw new ConvexError({ code: "ValidationError", message: "firstName and lastName are required" });
          }
          const individual = await auditedInsert(
            ctx,
            "individuals",
            {
              legacyId,
              firstName: args.firstName,
              middleName: args.middleName,
              lastName: args.lastName,
              suffix: args.suffix,
              dateOfBirth: args.dateOfBirth,
              maritalStatus: args.maritalStatus,
              citizenship: undefined,
              title: undefined,
              metadata: undefined,
              createdAt: now,
              updatedAt: now,
            },
          );

          if (args.email) {
            await auditedInsert(
              ctx,
              "entity_identifiers",
              {
                legacyId: crypto.randomUUID(),
                entity: { type: "individual", id: individual._id },
                identifierType: "email",
                value: args.email,
                verifiedAt: undefined,
                source: "manual",
                validDuring: undefined,
              },
            );
          }
          if (args.phone) {
            await auditedInsert(
              ctx,
              "entity_identifiers",
              {
                legacyId: crypto.randomUUID(),
                entity: { type: "individual", id: individual._id },
                identifierType: "phone",
                value: args.phone,
                verifiedAt: undefined,
                source: "manual",
                validDuring: undefined,
              },
            );
          }

          return {
            entityType: "individual" as const,
            entityId: asEntityId(individual),
            name: `${individual.firstName} ${individual.lastName}`,
            email: args.email ?? null,
            phone: args.phone ?? null,
          };
        }
        case "organization": {
          if (!args.legalName) {
            throw new ConvexError({ code: "ValidationError", message: "legalName is required" });
          }
          const organization = await auditedInsert(
            ctx,
            "organizations",
            {
              legacyId,
              legalName: args.legalName,
              formationType: args.formationType,
              stateOfFormation: args.stateOfFormation,
              formationDate: undefined,
              dissolutionDate: undefined,
              metadata: undefined,
              createdAt: now,
              updatedAt: now,
            },
          );
          if (args.email) {
            await auditedInsert(ctx, "entity_identifiers", {
              legacyId: crypto.randomUUID(),
              entity: { type: "organization", id: organization._id },
              identifierType: "email",
              value: args.email,
              verifiedAt: undefined,
              source: "manual",
              validDuring: undefined,
            });
          }
          if (args.phone) {
            await auditedInsert(ctx, "entity_identifiers", {
              legacyId: crypto.randomUUID(),
              entity: { type: "organization", id: organization._id },
              identifierType: "phone",
              value: args.phone,
              verifiedAt: undefined,
              source: "manual",
              validDuring: undefined,
            });
          }
          return {
            entityType: "organization" as const,
            entityId: asEntityId(organization),
            name: organization.legalName,
            email: args.email ?? null,
            phone: args.phone ?? null,
          };
        }
        case "brokerage": {
          if (!args.legalName) {
            throw new ConvexError({ code: "ValidationError", message: "legalName is required" });
          }
          const brokerage = await auditedInsert(
            ctx,
            "brokerages",
            {
              legacyId,
              legalName: args.legalName,
              licenseNumber: args.licenseNumber,
              licenseState: args.licenseState,
              mlsId: args.mlsId,
              stateOfFormation: args.stateOfFormation,
              metadata: undefined,
              createdAt: now,
              updatedAt: now,
            },
          );
          if (args.email) {
            await auditedInsert(ctx, "entity_identifiers", {
              legacyId: crypto.randomUUID(),
              entity: { type: "brokerage", id: brokerage._id },
              identifierType: "email",
              value: args.email,
              verifiedAt: undefined,
              source: "manual",
              validDuring: undefined,
            });
          }
          if (args.phone) {
            await auditedInsert(ctx, "entity_identifiers", {
              legacyId: crypto.randomUUID(),
              entity: { type: "brokerage", id: brokerage._id },
              identifierType: "phone",
              value: args.phone,
              verifiedAt: undefined,
              source: "manual",
              validDuring: undefined,
            });
          }
          return {
            entityType: "brokerage" as const,
            entityId: asEntityId(brokerage),
            name: brokerage.legalName,
            email: args.email ?? null,
            phone: args.phone ?? null,
          };
        }
        case "lender": {
          if (!args.legalName) {
            throw new ConvexError({ code: "ValidationError", message: "legalName is required" });
          }
          const lender = await auditedInsert(
            ctx,
            "lenders",
            {
              legacyId,
              legalName: args.legalName,
              nmlsId: args.nmlsId,
              lenderType: args.lenderType,
              stateOfFormation: args.stateOfFormation,
              metadata: undefined,
              createdAt: now,
              updatedAt: now,
            },
          );
          if (args.email) {
            await auditedInsert(ctx, "entity_identifiers", {
              legacyId: crypto.randomUUID(),
              entity: { type: "lender", id: lender._id },
              identifierType: "email",
              value: args.email,
              verifiedAt: undefined,
              source: "manual",
              validDuring: undefined,
            });
          }
          if (args.phone) {
            await auditedInsert(ctx, "entity_identifiers", {
              legacyId: crypto.randomUUID(),
              entity: { type: "lender", id: lender._id },
              identifierType: "phone",
              value: args.phone,
              verifiedAt: undefined,
              source: "manual",
              validDuring: undefined,
            });
          }
          return {
            entityType: "lender" as const,
            entityId: asEntityId(lender),
            name: lender.legalName,
            email: args.email ?? null,
            phone: args.phone ?? null,
          };
        }
      }
    },
});
