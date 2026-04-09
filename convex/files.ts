import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { auditedInsert, auditedPatch } from "./lib/audit";

const entityTypeValidator = v.union(
  v.literal("individual"),
  v.literal("organization"),
  v.literal("brokerage"),
  v.literal("lender"),
);

const fileTypeValidator = v.union(
  v.literal("purchase"),
  v.literal("refinance"),
  v.literal("wholesale"),
);

const fileStatusValidator = v.union(
  v.literal("pending"),
  v.literal("in_progress"),
  v.literal("clear_to_close"),
  v.literal("closed"),
  v.literal("funded"),
  v.literal("recorded"),
  v.literal("cancelled"),
);

const filePartyRoleValidator = v.union(
  v.literal("buyer"),
  v.literal("seller"),
  v.literal("lender"),
  v.literal("buyer_agent"),
  v.literal("seller_agent"),
  v.literal("title_agent"),
  v.literal("escrow_officer"),
  v.literal("notary"),
  v.literal("titleholder"),
  v.literal("signer"),
  v.literal("settlement_agent"),
);

const filePartySideValidator = v.union(
  v.literal("buyer_side"),
  v.literal("seller_side"),
  v.literal("internal"),
);

const propertyTypeValidator = v.union(
  v.literal("single_family"),
  v.literal("condo"),
  v.literal("multi_family"),
  v.literal("commercial"),
  v.literal("land"),
  v.literal("manufactured"),
);

const financingTypeValidator = v.union(
  v.literal("conventional"),
  v.literal("fha"),
  v.literal("va"),
  v.literal("usda"),
  v.literal("cash"),
  v.literal("other"),
);

const roleToSide: Record<string, "buyer_side" | "seller_side" | "internal" | null> = {
  buyer: "buyer_side",
  buyer_agent: "buyer_side",
  lender: "buyer_side",
  seller: "seller_side",
  seller_agent: "seller_side",
  title_agent: "internal",
  escrow_officer: "internal",
  notary: "internal",
  settlement_agent: "internal",
  titleholder: null,
  signer: null,
};

function inferSideFromRole(role: string) {
  return roleToSide[role] ?? null;
}

function legacy(doc: { legacyId?: string; _id: string }) {
  return doc.legacyId ?? doc._id;
}

async function findIndividualByLegacyId(ctx: QueryCtx | MutationCtx, legacyId: string) {
  return await ctx.db
    .query("individuals")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", legacyId))
    .unique();
}

async function findOrganizationByLegacyId(ctx: QueryCtx | MutationCtx, legacyId: string) {
  return await ctx.db
    .query("organizations")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", legacyId))
    .unique();
}

async function findBrokerageByLegacyId(ctx: QueryCtx | MutationCtx, legacyId: string) {
  return await ctx.db
    .query("brokerages")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", legacyId))
    .unique();
}

async function findLenderByLegacyId(ctx: QueryCtx | MutationCtx, legacyId: string) {
  return await ctx.db
    .query("lenders")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", legacyId))
    .unique();
}

async function findFileByLegacyId(ctx: QueryCtx | MutationCtx, legacyId: string) {
  return await ctx.db
    .query("files")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", legacyId))
    .unique();
}

async function findFilePartyByLegacyId(ctx: QueryCtx | MutationCtx, legacyId: string) {
  return await ctx.db
    .query("file_parties")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", legacyId))
    .unique();
}

async function findDocumentByLegacyId(ctx: QueryCtx | MutationCtx, legacyId: string) {
  return await ctx.db
    .query("documents")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", legacyId))
    .unique();
}

type EntityLookup =
  | { type: "individual"; doc: Doc<"individuals"> | null }
  | { type: "organization"; doc: Doc<"organizations"> | null }
  | { type: "brokerage"; doc: Doc<"brokerages"> | null }
  | { type: "lender"; doc: Doc<"lenders"> | null };

async function findEntity(
  ctx: QueryCtx | MutationCtx,
  entityType: "individual" | "organization" | "brokerage" | "lender",
  entityId: string,
): Promise<EntityLookup> {
  switch (entityType) {
    case "individual":
      return { type: "individual", doc: await findIndividualByLegacyId(ctx, entityId) };
    case "organization":
      return { type: "organization", doc: await findOrganizationByLegacyId(ctx, entityId) };
    case "brokerage":
      return { type: "brokerage", doc: await findBrokerageByLegacyId(ctx, entityId) };
    case "lender":
      return { type: "lender", doc: await findLenderByLegacyId(ctx, entityId) };
  }
}

async function entityName(
  ctx: QueryCtx | MutationCtx,
  entityType: "individual" | "organization" | "brokerage" | "lender",
  entityId: string,
) {
  const resolved = await findEntity(ctx, entityType, entityId);
  if (!resolved.doc) return null;

  if (resolved.type === "individual") {
    return `${resolved.doc.firstName} ${resolved.doc.lastName}`;
  }
  return resolved.doc.legalName;
}

async function entityContactMap(ctx: QueryCtx | MutationCtx) {
  const identifiers = await ctx.db.query("entity_identifiers").collect();
  const map = new Map<string, { email: string | null; phone: string | null }>();

  for (const identifier of identifiers) {
    const key = `${identifier.entity.type}:${identifier.entity.id}`;
    const current = map.get(key) ?? { email: null, phone: null };
    if (identifier.identifierType === "email") current.email = identifier.value;
    if (identifier.identifierType === "phone") current.phone = identifier.value;
    map.set(key, current);
  }

  return map;
}

async function filePartiesFor(ctx: QueryCtx | MutationCtx, fileDocId: string) {
  return await ctx.db
    .query("file_parties")
    .withIndex("by_file_id", (q: any) => q.eq("fileId", fileDocId))
    .collect();
}

async function resolvePartyEntity(
  ctx: QueryCtx | MutationCtx,
  contactMap: Map<string, { email: string | null; phone: string | null }>,
  party: Doc<"file_parties">,
) {
  const entityId = await legacyIdForDocId(ctx, party.entity.type, party.entity.id);
  const name = await entityName(ctx, party.entity.type, entityId);
  const contact = contactMap.get(`${party.entity.type}:${party.entity.id}`) ?? {
    email: null,
    phone: null,
  };

  return {
    filePartyId: legacy(party),
    entityType: party.entity.type,
    entityId,
    name: name ?? "Unknown",
    email: contact.email,
    phone: contact.phone,
  };
}

async function legacyIdForDocId(
  ctx: QueryCtx | MutationCtx,
  table: "individual" | "organization" | "brokerage" | "lender",
  docId: string,
) {
  switch (table) {
    case "individual": {
      const doc = await ctx.db.get(docId as Id<"individuals">);
      if (!doc) throw new Error(`Missing individual ${docId}`);
      return legacy(doc as any);
    }
    case "organization": {
      const doc = await ctx.db.get(docId as Id<"organizations">);
      if (!doc) throw new Error(`Missing organization ${docId}`);
      return legacy(doc as any);
    }
    case "brokerage": {
      const doc = await ctx.db.get(docId as Id<"brokerages">);
      if (!doc) throw new Error(`Missing brokerage ${docId}`);
      return legacy(doc as any);
    }
    case "lender": {
      const doc = await ctx.db.get(docId as Id<"lenders">);
      if (!doc) throw new Error(`Missing lender ${docId}`);
      return legacy(doc as any);
    }
  }
}

function normalizeAddress(doc: Doc<"addresses">) {
  return `${doc.addressLine1}${doc.addressLine2 ? ` ${doc.addressLine2}` : ""}, ${doc.city}, ${doc.state} ${doc.zip}`;
}

export const getFile = query({
  args: { fileId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const file = await findFileByLegacyId(ctx, args.fileId);
    if (!file) {
      throw new ConvexError({
        _tag: "FileNotFound",
        message: `File not found: ${args.fileId}`,
        fileId: args.fileId,
      } as any);
    }

    const property = await ctx.db.get(file.propertyId);
    const address = property ? await ctx.db.get(property.addressId) : null;
    const metadata = (file.metadata ?? null) as Record<string, unknown> | null;
    const parties = (await filePartiesFor(ctx, file._id)).filter((party) => party.active);
    const contactMap = await entityContactMap(ctx);

    const groupMap = new Map<string, { role: string; side: string | null; entities: any[] }>();
    for (const party of parties) {
      const entity = await resolvePartyEntity(ctx, contactMap, party);
      const group = groupMap.get(party.role) ?? {
        role: party.role,
        side: party.side ?? null,
        entities: [],
      };
      group.entities.push(entity);
      groupMap.set(party.role, group);
    }

    const groupedParties = [...groupMap.values()];
    const internalParties = parties.filter((party) => party.side === "internal");
    const team = [];
    for (const party of internalParties) {
      const entity = await resolvePartyEntity(ctx, contactMap, party);
      team.push({ role: party.role, name: entity.name });
    }
    const buyerNames = (groupMap.get("buyer")?.entities ?? []).map((entity) => entity.name);
    const sellerNames = (groupMap.get("seller")?.entities ?? []).map((entity) => entity.name);
    const closer = internalParties.find((party) => party.role === "escrow_officer");
    const closerEntity = closer ? await resolvePartyEntity(ctx, contactMap, closer as any) : null;
    const closerName = closerEntity?.name ?? null;
    const closerInitials = closerName
      ? closerName.split(" ").map((part) => part[0]).join("").toUpperCase()
      : null;

    return {
      id: legacy(file),
      fileNumber: file.fileNumber ?? null,
      fileType: file.fileType,
      status: file.status,
      propertyAddress: address?.addressLine1 ?? "",
      city: address?.city ?? null,
      state: address?.state ?? null,
      county: address?.county ?? null,
      parcelNumber: property?.parcelNumber ?? null,
      closingDate: (metadata?.closing_date as string) ?? null,
      openedAt: file.openedAt ? new Date(file.openedAt).toISOString() : null,
      financingType: (metadata?.financing_type as string) ?? null,
      salesPrice: (metadata?.purchase_price_cents as number) ?? null,
      loanAmount: (metadata?.loan_amount_cents as number) ?? null,
      titleSearchStatus: null,
      fileSubType: null,
      disburseDate: null,
      flags: [],
      progressPercent: 0,
      team,
      parties: groupedParties,
      buyerNames,
      sellerNames,
      closerName,
      closerInitials,
    };
  },
});

export const listFiles = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    status: v.optional(fileStatusValidator),
    fileType: v.optional(fileTypeValidator),
  },
  returns: v.object({
    items: v.array(v.any()),
    nextCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const allFiles = await ctx.db.query("files").collect();
    const filtered = allFiles
      .filter((file) => !args.status || file.status === args.status)
      .filter((file) => !args.fileType || file.fileType === args.fileType)
        .filter((file) => !args.cursor || new Date(file.createdAt).toISOString() < args.cursor)
        .sort((a, b) => b.createdAt - a.createdAt);

    const rows = filtered.slice(0, limit + 1);
    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const contactMap = await entityContactMap(ctx);

    const items = [];
    for (const file of pageRows) {
      const property = await ctx.db.get(file.propertyId);
      const address = property ? await ctx.db.get(property.addressId) : null;
      const parties = (await filePartiesFor(ctx, file._id)).filter((party) => party.active);
      const buyers = [];
      const sellers = [];
      let closerName: string | null = null;

      for (const party of parties) {
        const entity = await resolvePartyEntity(ctx, contactMap, party);
        if (party.role === "buyer") buyers.push(entity.name);
        if (party.role === "seller") sellers.push(entity.name);
        if (party.role === "escrow_officer" && party.side === "internal") {
          closerName = entity.name;
        }
      }

      items.push({
        id: legacy(file),
        fileNumber: file.fileNumber ?? null,
        fileType: file.fileType,
        status: file.status,
        propertyAddress: address?.addressLine1 ?? "",
        city: address?.city ?? null,
        state: address?.state ?? null,
        county: address?.county ?? null,
        closingDate: (file.metadata as Record<string, unknown> | null)?.closing_date as string ?? null,
        openedAt: file.openedAt ? new Date(file.openedAt).toISOString() : null,
        buyerNames: buyers,
        sellerNames: sellers,
        closerName,
        closerInitials: closerName
          ? closerName.split(" ").map((part: string) => part[0]).join("").toUpperCase()
          : null,
        progressPercent: 0,
      });
    }

    return {
      items,
      nextCursor: hasMore ? new Date(pageRows[pageRows.length - 1].createdAt).toISOString() : null,
    };
  },
});

export const openFile = mutation({
  args: {
    fileType: fileTypeValidator,
    addressLine1: v.string(),
    addressLine2: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    zip: v.string(),
    county: v.optional(v.string()),
    parcelNumber: v.optional(v.string()),
    legalDescription: v.optional(v.string()),
    propertyType: v.optional(propertyTypeValidator),
    documentId: v.optional(v.string()),
    purchasePriceCents: v.optional(v.number()),
    earnestMoneyCents: v.optional(v.number()),
    contractDate: v.optional(v.string()),
    closingDate: v.optional(v.string()),
    financingType: v.optional(financingTypeValidator),
    loanAmountCents: v.optional(v.number()),
    isCashOut: v.optional(v.boolean()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
      if (args.fileType === "purchase" && args.purchasePriceCents === undefined) {
        throw new ConvexError({ code: "ValidationError", message: "purchasePriceCents is required" });
      }
      if (args.fileType === "refinance" && args.loanAmountCents === undefined) {
        throw new ConvexError({ code: "ValidationError", message: "loanAmountCents is required" });
      }

      const now = Date.now();
      const address = await auditedInsert(
        ctx,
        "addresses",
        {
          legacyId: crypto.randomUUID(),
          addressLine1: args.addressLine1,
          addressLine2: args.addressLine2,
          city: args.city,
          state: args.state,
          zip: args.zip,
          county: args.county,
          country: "US",
          geom: undefined,
          createdAt: now,
        },
      );

      const property = await auditedInsert(
        ctx,
        "properties",
        {
          legacyId: crypto.randomUUID(),
          addressId: address._id,
          parcelNumber: args.parcelNumber,
          legalDescription: args.legalDescription,
          propertyType: args.propertyType,
          zoning: undefined,
          createdAt: now,
        },
      );

      const year = new Date().getUTCFullYear();
      const fileCount = (await ctx.db.query("files").collect()).filter((file) =>
        new Date(file.createdAt).getUTCFullYear() === year,
      ).length;
      const fileNumber = `EM-${year}-${String(fileCount + 1).padStart(4, "0")}`;

      let metadata: Record<string, unknown> | undefined;
      if (args.fileType === "purchase") {
        metadata = {
          purchase_price_cents: args.purchasePriceCents,
          earnest_money_cents: args.earnestMoneyCents,
          contract_date: args.contractDate,
          closing_date: args.closingDate,
          financing_type: args.financingType,
        };
      } else if (args.fileType === "refinance") {
        metadata = {
          loan_amount_cents: args.loanAmountCents,
          is_cash_out: args.isCashOut,
          closing_date: args.closingDate,
        };
      }

      const file = await auditedInsert(
        ctx,
        "files",
        {
          legacyId: crypto.randomUUID(),
          fileNumber,
          propertyId: property._id,
          fileType: args.fileType,
          status: "pending",
          openedAt: now,
          closedAt: undefined,
          metadata,
          createdAt: now,
          updatedAt: now,
        },
      );

      if (args.documentId) {
        const document = await findDocumentByLegacyId(ctx, args.documentId);
        if (document) {
          await auditedInsert(
            ctx,
            "document_attachments",
            {
              legacyId: crypto.randomUUID(),
              documentId: document._id,
              resource: { type: "file", id: legacy(file) },
              label: undefined,
              visibility: "private",
              status: "received",
              attributes: undefined,
              createdAt: now,
            },
          );
        }
      }

      return {
        fileId: legacy(file),
        fileNumber: file.fileNumber,
        propertyId: legacy(property),
        addressId: legacy(address),
        fileType: file.fileType,
        status: file.status,
        address: normalizeAddress(address),
      };
    },
});

export const addFileParty = mutation({
  args: {
    fileId: v.string(),
    entityType: entityTypeValidator,
    entityId: v.string(),
    role: filePartyRoleValidator,
    side: v.optional(filePartySideValidator),
    orderIndex: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
      const file = await findFileByLegacyId(ctx, args.fileId);
      if (!file) {
        throw new ConvexError({
          _tag: "FileNotFound",
          message: `File not found: ${args.fileId}`,
          fileId: args.fileId,
        } as any);
      }

      const entity = await findEntity(ctx, args.entityType, args.entityId);
      if (!entity.doc) {
        throw new ConvexError({
          _tag: "EntityNotFound",
          message: `Entity not found: ${args.entityType} ${args.entityId}`,
          entityType: args.entityType,
          entityId: args.entityId,
        } as any);
      }
      const existing = await ctx.db
        .query("file_parties")
        .withIndex("by_file_entity_role", (q: any) =>
          q
            .eq("fileId", file._id)
            .eq("entity.type", args.entityType)
            .eq("entity.id", entity.doc!._id)
            .eq("role", args.role),
        )
        .first();
      if (existing && existing.active) {
        throw new ConvexError({
          _tag: "DuplicateFileParty",
          message: `This entity is already assigned the role '${args.role}' on this file`,
          role: args.role,
        } as any);
      }

      const side = args.side ?? inferSideFromRole(args.role);
      let entityResolvedName: string;
      switch (entity.type) {
        case "individual":
          entityResolvedName = `${entity.doc.firstName} ${entity.doc.lastName}`;
          break;
        case "organization":
        case "brokerage":
        case "lender":
          entityResolvedName = entity.doc.legalName;
          break;
      }

      const fileParty = await auditedInsert(
        ctx,
        "file_parties",
        {
          legacyId: crypto.randomUUID(),
          fileId: file._id,
          entity: { type: args.entityType, id: entity.doc!._id },
          role: args.role,
          side: side ?? undefined,
          orderIndex: args.orderIndex ?? 0,
          active: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      );

      return {
        filePartyId: legacy(fileParty),
        fileId: legacy(file),
        entityType: args.entityType,
        entityId: args.entityId,
        entityName: entityResolvedName,
        role: fileParty.role,
        side: fileParty.side ?? null,
        orderIndex: fileParty.orderIndex,
      };
    },
});

export const removeFileParty = mutation({
  args: {
    filePartyId: v.optional(v.string()),
    fileId: v.optional(v.string()),
    entityType: v.optional(entityTypeValidator),
    entityId: v.optional(v.string()),
    role: v.optional(filePartyRoleValidator),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
      let fileParty: Doc<"file_parties"> | null = null;

      if (args.filePartyId) {
        fileParty = await findFilePartyByLegacyId(ctx, args.filePartyId);
      } else {
        if (!args.fileId || !args.entityType || !args.entityId || !args.role) {
          throw new ConvexError({ code: "ValidationError", message: "Missing composite key fields" });
        }
        const file = await findFileByLegacyId(ctx, args.fileId);
        const entity = await findEntity(ctx, args.entityType, args.entityId);
        const entityDoc = entity.doc;
        if (file && entityDoc) {
          fileParty = await ctx.db
            .query("file_parties")
            .withIndex("by_file_entity_role", (q: any) =>
              q
                .eq("fileId", file._id)
                .eq("entity.type", args.entityType)
                .eq("entity.id", entityDoc._id)
                .eq("role", args.role),
            )
            .first();
        }
      }

      if (!fileParty) {
        throw new ConvexError({
          _tag: "FilePartyNotFound",
          message: "File party not found",
        } as any);
      }
      if (!fileParty.active) {
        throw new ConvexError({
          _tag: "FilePartyInactive",
          message: "File party is already inactive",
        } as any);
      }

      const deactivatedAt = Date.now();
      const updated = await auditedPatch(
        ctx,
        "file_parties",
        fileParty._id,
        {
          active: false,
          updatedAt: deactivatedAt,
        },
      );
      const filePartyFile = await ctx.db.get(updated.fileId);
      if (!filePartyFile) {
        throw new Error(`Missing file ${updated.fileId} for file party ${updated._id}`);
      }

      return {
        filePartyId: legacy(updated),
        fileId: legacy(filePartyFile),
        entityType: updated.entity.type,
        entityId: await legacyIdForDocId(ctx, updated.entity.type, updated.entity.id),
        role: updated.role,
        deactivatedAt: new Date(deactivatedAt).toISOString(),
      };
    },
});
