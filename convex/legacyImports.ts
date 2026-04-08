import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { auditedDelete, auditedInsert, auditedPatch } from "./lib/audit";
import { deriveMilestoneProgress } from "../lib/legacy-import/deal-progress";
import {
  extractAddress,
  extractDocuments,
  extractLineItems,
  extractParties,
  extractPayments,
  mapFileStatus,
  mapFileType,
  mapPartyRole,
  type ExtractedParty,
} from "../lib/legacy-import/snapshot-mappers";
import type {
  ActualMilestoneProgress,
  DealImportRecord,
  DealSnapshot,
  FinanceImportStats,
  RailsAdminSearchResult,
} from "../lib/legacy-import/types";

type EntityType = "individual" | "organization" | "brokerage" | "lender";
type FilePartySide = "buyer_side" | "seller_side" | "internal";

type StoredProgress = {
  milestoneId: string;
  status: string;
  actualDate?: string;
  actualDurationDays?: number;
};

const ROLE_TO_SIDE: Record<string, FilePartySide | null> = {
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

const ROLE_KEY_DEFAULTS: Record<string, { name: string; role: string; side: FilePartySide }> = {
  future: { name: "Buyer", role: "buyer", side: "buyer_side" },
  current: { name: "Seller", role: "seller", side: "seller_side" },
  settlement_agent: { name: "Settlement Agent", role: "settlement_agent", side: "internal" },
  underwriter: { name: "Underwriter", role: "title_agent", side: "internal" },
  assignor: { name: "Assignor", role: "seller", side: "seller_side" },
  escrow: { name: "Escrow", role: "escrow_officer", side: "internal" },
  recording_bank_account: { name: "Recording", role: "settlement_agent", side: "internal" },
};

function legacy(doc: { legacyId?: string; _id: string }) {
  return doc.legacyId ?? doc._id;
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildPropertyAddress(address: ReturnType<typeof extractAddress>) {
  return `${address.addressLine1}, ${address.city}, ${address.state} ${address.zip}`;
}

function toStoredProgress(progress: ActualMilestoneProgress[]): StoredProgress[] {
  return progress.map((item) => ({
    milestoneId: item.milestoneId,
    status: item.status,
    actualDate: item.actualDate,
    actualDurationDays: item.actualDurationDays,
  }));
}

function toUnmodeledData(snapshot: DealSnapshot) {
  return {
    workflow: snapshot.workflow ?? undefined,
    ctcPlan: snapshot.ctcPlan ?? undefined,
    signing: snapshot.signing ?? undefined,
    recording: snapshot.recording ?? undefined,
    actionItems: snapshot.actionItems ?? undefined,
    notes: snapshot.notes ?? undefined,
    messages: snapshot.messages ?? undefined,
  };
}

function inferEntityType(party: ExtractedParty): EntityType {
  if (party.role === "lender") return "lender";
  if (party.sourceType === "individual") return "individual";
  if (party.sourceType === "entity") return "organization";

  const name = party.entityName;
  if (/\b(bank|mortgage|lending|credit union)\b/i.test(name)) return "lender";
  if (/\b(llc|inc|corp|company|co\.|l\.p\.|lp|trust)\b/i.test(name)) return "organization";
  return "individual";
}

function metadataForFile(info: Record<string, unknown>, fileType: ReturnType<typeof mapFileType>) {
  if (fileType === "purchase") {
    return {
      purchase_price_cents: Number(info.purchase_price_cents ?? info.sale_price_cents ?? 0),
      earnest_money_cents: info.earnest_money_cents ? Number(info.earnest_money_cents) : undefined,
      contract_date: info.contract_date ? String(info.contract_date) : undefined,
      closing_date: info.closing_date ? String(info.closing_date) : undefined,
      financing_type: info.financing_type ? String(info.financing_type) : undefined,
    };
  }

  if (fileType === "refinance") {
    return {
      loan_amount_cents: Number(info.loan_amount_cents ?? 0),
      is_cash_out: info.is_cash_out ? Boolean(info.is_cash_out) : undefined,
      closing_date: info.closing_date ? String(info.closing_date) : undefined,
    };
  }

  return undefined;
}

function documentFiletypeFromMime(mimeType: string): "pdf" | "png" | "jpg" | "tiff" | "docx" | "xlsx" {
  const value = mimeType.toLowerCase();
  if (value.includes("png")) return "png";
  if (value.includes("jpeg") || value.includes("jpg")) return "jpg";
  if (value.includes("tiff")) return "tiff";
  if (value.includes("word")) return "docx";
  if (value.includes("sheet") || value.includes("excel")) return "xlsx";
  return "pdf";
}

async function findImportByRailsDealId(ctx: QueryCtx | MutationCtx, railsDealId: string) {
  return await ctx.db
    .query("legacy_imports")
    .withIndex("by_rails_deal_id", (q) => q.eq("railsDealId", railsDealId))
    .unique();
}

async function findFileByLegacyId(ctx: QueryCtx | MutationCtx, fileId: string) {
  return await ctx.db
    .query("files")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", fileId))
    .unique();
}

async function findLedgerByLegacyId(ctx: QueryCtx | MutationCtx, ledgerId: string) {
  return await ctx.db
    .query("ledgers")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", ledgerId))
    .unique();
}

async function findFilePartyByLegacyId(ctx: QueryCtx | MutationCtx, filePartyId: string) {
  return await ctx.db
    .query("file_parties")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", filePartyId))
    .unique();
}

async function findExistingEntityByName(
  ctx: MutationCtx,
  entityType: EntityType,
  entityName: string,
) {
  const name = normalizeName(entityName);

  switch (entityType) {
    case "individual": {
      const rows = await ctx.db.query("individuals").collect();
      return rows.find((row) => normalizeName(`${row.firstName} ${row.lastName}`) === name) ?? null;
    }
    case "organization": {
      const rows = await ctx.db.query("organizations").collect();
      return rows.find((row) => normalizeName(row.legalName) === name) ?? null;
    }
    case "brokerage": {
      const rows = await ctx.db.query("brokerages").collect();
      return rows.find((row) => normalizeName(row.legalName) === name) ?? null;
    }
    case "lender": {
      const rows = await ctx.db.query("lenders").collect();
      return rows.find((row) => normalizeName(row.legalName) === name) ?? null;
    }
  }
}

async function ensureEntityIdentifiers(
  ctx: MutationCtx,
  entity: { type: EntityType; id: string },
  email?: string,
  phone?: string,
) {
  const existing = await ctx.db
    .query("entity_identifiers")
    .withIndex("by_entity", (q) => q.eq("entity.type", entity.type).eq("entity.id", entity.id))
    .collect();

  if (email && !existing.some((identifier) => identifier.identifierType === "email" && identifier.value === email)) {
    await auditedInsert(ctx, "entity_identifiers", {
      legacyId: crypto.randomUUID(),
      entity,
      identifierType: "email",
      value: email,
      verifiedAt: undefined,
      source: "legacy_import",
      validDuring: undefined,
    });
  }

  if (phone && !existing.some((identifier) => identifier.identifierType === "phone" && identifier.value === phone)) {
    await auditedInsert(ctx, "entity_identifiers", {
      legacyId: crypto.randomUUID(),
      entity,
      identifierType: "phone",
      value: phone,
      verifiedAt: undefined,
      source: "legacy_import",
      validDuring: undefined,
    });
  }
}

async function ensureEntity(
  ctx: MutationCtx,
  party: ExtractedParty,
  entityType: EntityType,
) {
  const existing = await findExistingEntityByName(ctx, entityType, party.entityName);
  if (existing) {
    await ensureEntityIdentifiers(ctx, { type: entityType, id: existing._id }, party.email, party.phone);
    return { type: entityType, id: existing._id, legacyId: legacy(existing) };
  }

  const now = Date.now();

  switch (entityType) {
    case "individual": {
      const nameParts = party.entityName.trim().split(/\s+/).filter(Boolean);
      const firstName = nameParts[0] ?? "Unknown";
      const lastName = nameParts.slice(1).join(" ") || "Unknown";
      const individual = await auditedInsert(ctx, "individuals", {
        legacyId: crypto.randomUUID(),
        firstName,
        middleName: undefined,
        lastName,
        suffix: undefined,
        dateOfBirth: undefined,
        maritalStatus: undefined,
        citizenship: undefined,
        title: undefined,
        metadata: undefined,
        createdAt: now,
        updatedAt: now,
      });
      await ensureEntityIdentifiers(ctx, { type: entityType, id: individual._id }, party.email, party.phone);
      return { type: entityType, id: individual._id, legacyId: legacy(individual) };
    }
    case "organization": {
      const organization = await auditedInsert(ctx, "organizations", {
        legacyId: crypto.randomUUID(),
        legalName: party.entityName,
        formationType: undefined,
        stateOfFormation: undefined,
        formationDate: undefined,
        dissolutionDate: undefined,
        metadata: undefined,
        createdAt: now,
        updatedAt: now,
      });
      await ensureEntityIdentifiers(ctx, { type: entityType, id: organization._id }, party.email, party.phone);
      return { type: entityType, id: organization._id, legacyId: legacy(organization) };
    }
    case "brokerage": {
      const brokerage = await auditedInsert(ctx, "brokerages", {
        legacyId: crypto.randomUUID(),
        legalName: party.entityName,
        licenseNumber: undefined,
        licenseState: undefined,
        mlsId: undefined,
        stateOfFormation: undefined,
        metadata: undefined,
        createdAt: now,
        updatedAt: now,
      });
      await ensureEntityIdentifiers(ctx, { type: entityType, id: brokerage._id }, party.email, party.phone);
      return { type: entityType, id: brokerage._id, legacyId: legacy(brokerage) };
    }
    case "lender": {
      const lender = await auditedInsert(ctx, "lenders", {
        legacyId: crypto.randomUUID(),
        legalName: party.entityName,
        nmlsId: undefined,
        lenderType: undefined,
        stateOfFormation: undefined,
        metadata: undefined,
        createdAt: now,
        updatedAt: now,
      });
      await ensureEntityIdentifiers(ctx, { type: entityType, id: lender._id }, party.email, party.phone);
      return { type: entityType, id: lender._id, legacyId: legacy(lender) };
    }
  }
}

async function createFileParty(
  ctx: MutationCtx,
  fileId: Id<"files">,
  entity: { type: EntityType; id: string; legacyId: string },
  role: string,
  side: FilePartySide | null,
  orderIndex: number,
) {
  const now = Date.now();
  const fileParty = await auditedInsert(ctx, "file_parties", {
    legacyId: crypto.randomUUID(),
    fileId,
    entity: { type: entity.type, id: entity.id },
    role: mapPartyRole(role),
    side: side ?? undefined,
    orderIndex,
    active: true,
    createdAt: now,
    updatedAt: now,
  });

  return { filePartyId: legacy(fileParty), filePartyDocId: fileParty._id };
}

async function ensurePlaceholderParty(
  ctx: MutationCtx,
  file: Doc<"files">,
  railsPartyId: string,
  partyName: string,
  resolvedPartyIds: Map<string, string>,
) {
  const existing = resolvedPartyIds.get(railsPartyId);
  if (existing) return existing;

  const defaults = ROLE_KEY_DEFAULTS[railsPartyId] ?? {
    name: partyName || railsPartyId,
    role: "settlement_agent",
    side: "internal" as FilePartySide,
  };

  const entity = await ensureEntity(
    ctx,
    {
      railsPartyId,
      entityName: defaults.name,
      sourceType: "entity",
      role: defaults.role,
      side: defaults.side,
      orderIndex: resolvedPartyIds.size,
    },
    "organization",
  );

  const fileParty = await createFileParty(
    ctx,
    file._id,
    entity,
    defaults.role,
    defaults.side,
    resolvedPartyIds.size,
  );
  resolvedPartyIds.set(railsPartyId, fileParty.filePartyId);
  return fileParty.filePartyId;
}

async function importFinanceData(
  ctx: MutationCtx,
  file: Doc<"files">,
  snapshot: DealSnapshot,
  resolvedPartyIds: Map<string, string>,
) {
  const lineItems = extractLineItems(snapshot);
  const payments = extractPayments(snapshot);
  const hasFinanceData =
    lineItems.length > 0 ||
    payments.length > 0 ||
    snapshot.ledgerStatus !== null ||
    snapshot.paymentStatus !== null ||
    snapshot.fundingStatus !== null;

  if (!hasFinanceData) {
    return { ledgerId: null, financeStats: null };
  }

  const now = Date.now();
  const ledger = await auditedInsert(ctx, "ledgers", {
    legacyId: crypto.randomUUID(),
    fileId: file._id,
    ledgerType: "deal",
    name: "Primary",
    isPrimary: true,
    templateVersion: "imported-v1",
    metadata: {
      importedFromRails: true,
      importedAt: snapshot.fetchedAt,
      railsLedgerStatus: snapshot.ledgerStatus,
      railsFundingStatus: snapshot.fundingStatus,
    },
    createdAt: now,
    updatedAt: now,
  });

  let chargeCount = 0;

  for (const lineItem of lineItems) {
    const row = await auditedInsert(ctx, "line_items", {
      legacyId: crypto.randomUUID(),
      ledgerId: ledger._id,
      templateKey: lineItem.templateKey,
      label: lineItem.label,
      labelOverride: undefined,
      section: lineItem.section as Doc<"line_items">["section"],
      computedAmountCents: lineItem.computedAmountCents,
      actualAmountCents: lineItem.actualAmountCents,
      manuallyAdjusted: false,
      adjustedByUserId: undefined,
      adjustedByName: undefined,
      adjustedAt: undefined,
      adjustmentReason: undefined,
      paidOutsideOfClosing: lineItem.paidOutsideOfClosing,
      verified: lineItem.verified,
      sortOrder: lineItem.sortOrder,
      resource: undefined,
      resourceLabel: undefined,
      metadata: { importedFromRails: true },
      deletedAt: undefined,
      createdAt: now,
      updatedAt: now,
    });

    for (const charge of lineItem.charges) {
      const filePartyId =
        resolvedPartyIds.get(charge.railsPartyId) ??
        (await ensurePlaceholderParty(ctx, file, charge.railsPartyId, charge.partyName, resolvedPartyIds));
      const fileParty = await findFilePartyByLegacyId(ctx, filePartyId);
      if (!fileParty) continue;

      await auditedInsert(ctx, "charges", {
        legacyId: crypto.randomUUID(),
        lineItemId: row._id,
        partyId: fileParty._id,
        partySide: charge.partySide as FilePartySide,
        partyName: charge.partyName,
        debitCents: charge.debitCents,
        creditCents: charge.creditCents,
        createdAt: now,
        updatedAt: now,
      });
      chargeCount += 1;
    }
  }

  for (const payment of payments) {
    const filePartyId =
      resolvedPartyIds.get(payment.railsPartyId) ??
      (await ensurePlaceholderParty(ctx, file, payment.railsPartyId, payment.partyName, resolvedPartyIds));
    const fileParty = await findFilePartyByLegacyId(ctx, filePartyId);
    if (!fileParty) continue;

    await auditedInsert(ctx, "payments", {
      legacyId: crypto.randomUUID(),
      ledgerId: ledger._id,
      partyId: fileParty._id,
      partyName: payment.partyName,
      paymentType: payment.paymentType as Doc<"payments">["paymentType"],
      method: payment.method as Doc<"payments">["method"],
      amountCents: payment.amountCents,
      status: payment.status as Doc<"payments">["status"],
      memo: payment.memo ?? undefined,
      instrumentNumber: undefined,
      bankName: payment.bankName ?? undefined,
      maskedAccount: payment.maskedAccount ?? undefined,
      postedAt: undefined,
      clearedAt: undefined,
      reconciledAt: undefined,
      voidedAt: undefined,
      voidedByUserId: undefined,
      voidReason: undefined,
      metadata: { importedFromRails: true },
      createdAt: now,
      updatedAt: now,
    });
  }

  return {
    ledgerId: legacy(ledger),
    financeStats: {
      lineItemCount: lineItems.length,
      paymentCount: payments.length,
      chargeCount,
      snapshotCount: 0,
    } satisfies FinanceImportStats,
  };
}

async function createImportedFile(
  ctx: MutationCtx,
  deal: RailsAdminSearchResult,
  snapshot: DealSnapshot,
) {
  const info = snapshot.dealInfo;
  const address = extractAddress(info);
  const now = Date.now();
  const addressRow = await auditedInsert(ctx, "addresses", {
    legacyId: crypto.randomUUID(),
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    city: address.city,
    state: address.state.slice(0, 2).toUpperCase(),
    zip: address.zip,
    county: address.county,
    country: "US",
    geom: undefined,
    createdAt: now,
  });

  const propertyRow = await auditedInsert(ctx, "properties", {
    legacyId: crypto.randomUUID(),
    addressId: addressRow._id,
    parcelNumber: address.parcelNumber,
    legalDescription: address.legalDescription,
    propertyType: undefined,
    zoning: undefined,
    createdAt: now,
  });

  const fileType = mapFileType(info);
  const file = await auditedInsert(ctx, "files", {
    legacyId: crypto.randomUUID(),
    fileNumber: deal.fileNumber || String(info.file_number ?? info.fileNumber ?? ""),
    propertyId: propertyRow._id,
    fileType,
    status: mapFileStatus(info),
    openedAt: info.opened_at ? new Date(String(info.opened_at)).getTime() : now,
    closedAt: undefined,
    metadata: metadataForFile(info, fileType),
    createdAt: now,
    updatedAt: now,
  });

  return { file, address, property: propertyRow };
}

async function importParties(ctx: MutationCtx, file: Doc<"files">, snapshot: DealSnapshot) {
  const resolvedPartyIds = new Map<string, string>();

  for (const party of extractParties(snapshot)) {
    const entityType = inferEntityType(party);
    const entity = await ensureEntity(ctx, party, entityType);
    const fileParty = await createFileParty(
      ctx,
      file._id,
      entity,
      party.role,
      (party.side as FilePartySide | null) ?? ROLE_TO_SIDE[mapPartyRole(party.role)] ?? null,
      party.orderIndex,
    );
    resolvedPartyIds.set(party.railsPartyId, fileParty.filePartyId);
  }

  return resolvedPartyIds;
}

async function importDocuments(
  ctx: MutationCtx,
  file: Doc<"files">,
  railsDealId: string,
  snapshot: DealSnapshot,
) {
  const now = Date.now();
  const fileId = legacy(file);

  for (const document of extractDocuments(snapshot)) {
    const documentRow = await auditedInsert(ctx, "documents", {
      legacyId: crypto.randomUUID(),
      name: document.displayName,
      documentType: document.documentType as Doc<"documents">["documentType"],
      storagePath: `legacy-import/${railsDealId}/${document.railsDocId}`,
      filetype: documentFiletypeFromMime(document.mimeType),
      fileSizeBytes: document.sizeBytes,
      pageCount: undefined,
      versionMajor: 1,
      versionMinor: 0,
      origin: "vendor",
      uploadedBy: { type: "system", id: "legacy-import" },
      extractedText: undefined,
      metadata: { importedFromRails: true, railsDocumentId: document.railsDocId },
      deletedAt: undefined,
      createdAt: now,
      updatedAt: now,
    });

    await auditedInsert(ctx, "document_attachments", {
      legacyId: crypto.randomUUID(),
      documentId: documentRow._id,
      resource: { type: "file", id: fileId },
      label: undefined,
      visibility: "private",
      status: "received",
      attributes: undefined,
      createdAt: now,
    });
  }
}

async function refreshImportedFile(
  ctx: MutationCtx,
  record: Doc<"legacy_imports">,
  snapshot: DealSnapshot,
) {
  const file = await findFileByLegacyId(ctx, record.fileId);
  if (!file) return;

  const info = snapshot.dealInfo;
  const address = extractAddress(info);
  const property = await ctx.db.get(file.propertyId);
  const addressRow = property ? await ctx.db.get(property.addressId) : null;
  const now = Date.now();

  if (addressRow) {
    await auditedPatch(ctx, "addresses", addressRow._id, {
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state.slice(0, 2).toUpperCase(),
      zip: address.zip,
      county: address.county,
    });
  }

  if (property) {
    await auditedPatch(ctx, "properties", property._id, {
      parcelNumber: address.parcelNumber,
      legalDescription: address.legalDescription,
    });
  }

  const fileType = mapFileType(info);
  await auditedPatch(ctx, "files", file._id, {
    fileNumber: record.fileNumber,
    fileType,
    status: mapFileStatus(info),
    metadata: metadataForFile(info, fileType),
    updatedAt: now,
  });
}

function toImportRecord(record: Doc<"legacy_imports">): DealImportRecord {
  return {
    railsDealId: record.railsDealId,
    fileNumber: record.fileNumber,
    fileId: record.fileId,
    ledgerId: record.ledgerId ?? null,
    propertyAddress: record.propertyAddress,
    state: record.state,
    dealStatus: record.dealStatus,
    fileType: record.fileType,
    unmodeledData: {
      workflow: record.unmodeledData.workflow ?? null,
      ctcPlan: record.unmodeledData.ctcPlan ?? null,
      signing: record.unmodeledData.signing ?? null,
      recording: record.unmodeledData.recording ?? null,
      actionItems: record.unmodeledData.actionItems ?? null,
      notes: record.unmodeledData.notes ?? null,
      messages: record.unmodeledData.messages ?? null,
    },
    financeStats: record.financeStats ?? null,
    actualProgress: record.actualProgress as ActualMilestoneProgress[],
    importedAt: new Date(record.importedAt).toISOString(),
    refreshedAt: record.refreshedAt ? new Date(record.refreshedAt).toISOString() : null,
  };
}

export const listImports = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const rows = await ctx.db.query("legacy_imports").collect();
    return rows
      .slice()
      .sort((a, b) => b.importedAt - a.importedAt)
      .map(toImportRecord);
  },
});

export const importSnapshot = mutation({
  args: {
    deal: v.any(),
    snapshot: v.any(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const deal = args.deal as RailsAdminSearchResult;
    const snapshot = args.snapshot as DealSnapshot;
    const existing = await findImportByRailsDealId(ctx, deal.railsDealId);
    if (existing) {
      return toImportRecord(existing);
    }

    const { file } = await createImportedFile(ctx, deal, snapshot);
    const resolvedPartyIds = await importParties(ctx, file, snapshot);
    await importDocuments(ctx, file, deal.railsDealId, snapshot);
    const finance = await importFinanceData(ctx, file, snapshot, resolvedPartyIds);
    const address = extractAddress(snapshot.dealInfo);
    const now = Date.now();

    const record = await auditedInsert(ctx, "legacy_imports", {
      legacyId: crypto.randomUUID(),
      railsDealId: deal.railsDealId,
      fileId: legacy(file),
      ledgerId: finance.ledgerId ?? undefined,
      fileNumber: file.fileNumber ?? deal.fileNumber,
      propertyAddress: buildPropertyAddress(address),
      state: address.state,
      dealStatus: mapFileStatus(snapshot.dealInfo),
      fileType: mapFileType(snapshot.dealInfo),
      unmodeledData: toUnmodeledData(snapshot),
      financeStats: finance.financeStats ?? undefined,
      actualProgress: toStoredProgress(deriveMilestoneProgress(snapshot)),
      importedAt: now,
      refreshedAt: undefined,
    });

    return toImportRecord(record);
  },
});

export const refreshImport = mutation({
  args: {
    railsDealId: v.string(),
    snapshot: v.any(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const record = await findImportByRailsDealId(ctx, args.railsDealId);
    if (!record) {
      throw new ConvexError({ code: "NotFound", message: `Import not found: ${args.railsDealId}` });
    }

    const snapshot = args.snapshot as DealSnapshot;
    if (!isRecord(snapshot.dealInfo)) {
      throw new ConvexError({ code: "ValidationError", message: "Snapshot is missing dealInfo" });
    }

    await refreshImportedFile(ctx, record, snapshot);

    const address = extractAddress(snapshot.dealInfo);
    const refreshed = await auditedPatch(ctx, "legacy_imports", record._id, {
      fileNumber: String(snapshot.dealInfo.file_number ?? record.fileNumber),
      propertyAddress: buildPropertyAddress(address),
      state: address.state,
      dealStatus: mapFileStatus(snapshot.dealInfo),
      fileType: mapFileType(snapshot.dealInfo),
      unmodeledData: toUnmodeledData(snapshot),
      actualProgress: toStoredProgress(deriveMilestoneProgress(snapshot)),
      refreshedAt: Date.now(),
    });

    return toImportRecord(refreshed);
  },
});

export const deleteImport = mutation({
  args: { railsDealId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const record = await findImportByRailsDealId(ctx, args.railsDealId);
    if (!record) {
      return null;
    }

    await auditedDelete(ctx, "legacy_imports", record._id);
    return null;
  },
});
