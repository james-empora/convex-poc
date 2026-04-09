import { ConvexError, v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { auditedInsert, auditedPatch } from "./lib/audit";
import { computeTemplateAmount, getTemplatesForDeal, type FeeTemplate } from "../lib/finances/fee-templates";

const ledgerTypeValidator = v.union(v.literal("deal"), v.literal("register"));
const statementSectionValidator = v.union(
  v.literal("sale_price_and_credits"),
  v.literal("title_charges"),
  v.literal("government_recording_and_transfer"),
  v.literal("lender_charges"),
  v.literal("prepaid_items"),
  v.literal("escrow_reserves"),
  v.literal("adjustments_and_prorations"),
  v.literal("payoffs_and_liens"),
  v.literal("commissions"),
  v.literal("additional_charges"),
  v.literal("deposits_and_earnest_money"),
  v.literal("totals"),
);
const paymentTypeValidator = v.union(v.literal("receipt"), v.literal("disbursement"));
const paymentMethodValidator = v.union(
  v.literal("wire"),
  v.literal("check"),
  v.literal("ach"),
  v.literal("internal_transfer"),
);
const proposalTriggerValidator = v.union(
  v.literal("document_uploaded"),
  v.literal("date_changed"),
  v.literal("resource_updated"),
  v.literal("resource_created"),
  v.literal("user_request"),
  v.literal("system_check"),
  v.literal("balance_error"),
  v.literal("drift_detected"),
);
const proposalActionValidator = v.union(v.literal("update"), v.literal("create"), v.literal("delete"));
const hypotheticalChangeValidator = v.object({
  lineItemId: v.optional(v.string()),
  label: v.string(),
  newAmountCents: v.number(),
});

function legacy(doc: { legacyId?: string; _id: string }) {
  return doc.legacyId ?? doc._id;
}

async function findFileByLegacyId(ctx: QueryCtx | MutationCtx, legacyId: string) {
  return await ctx.db
    .query("files")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", legacyId))
    .unique();
}

async function findLedgerByLegacyId(ctx: QueryCtx | MutationCtx, legacyId: string) {
  return await ctx.db
    .query("ledgers")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", legacyId))
    .unique();
}

async function findLineItemByLegacyId(ctx: QueryCtx | MutationCtx, legacyId: string) {
  return await ctx.db
    .query("line_items")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", legacyId))
    .unique();
}

async function findFilePartyById(ctx: QueryCtx | MutationCtx, id: string) {
  const party = await ctx.db.get(id as Doc<"file_parties">["_id"]);
  return party && "role" in party ? (party as Doc<"file_parties">) : null;
}

async function findFilePartyByLegacyId(ctx: QueryCtx | MutationCtx, legacyId: string) {
  return await ctx.db
    .query("file_parties")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", legacyId))
    .unique();
}

async function partyLegacyId(ctx: QueryCtx | MutationCtx, partyId: string) {
  const party = await findFilePartyById(ctx, partyId);
  return party ? legacy(party) : partyId;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function computeManualOrTemplate(
  template: FeeTemplate,
  params: {
    salesPriceCents: number;
    loanAmountCents: number;
    annualTaxCents: number;
    closingDate?: string;
    metadata?: Record<string, unknown>;
  },
) {
  if (template.computeMethod === "manual") {
    if (template.templateKey === "contract_sales_price") return params.salesPriceCents;
    if (template.templateKey === "earnest_money_deposit") return Number(params.metadata?.earnest_money_cents ?? 0);
    if (template.templateKey === "loan_proceeds") return params.loanAmountCents;
    if (template.templateKey === "mortgage_payoff") return Number(params.metadata?.mortgage_payoff_cents ?? 0);
    return 0;
  }

  return computeTemplateAmount(template, {
    salesPriceCents: params.salesPriceCents,
    loanAmountCents: params.loanAmountCents,
    annualTaxCents: params.annualTaxCents,
    closingDate: params.closingDate,
  });
}

type StatementPartyRef = Doc<"file_parties"> | undefined;

function buildCharges(
  template: FeeTemplate,
  amount: number,
  ctx: {
    buyerParty: StatementPartyRef;
    sellerParty: StatementPartyRef;
    agentParty: StatementPartyRef;
    lenderParty: StatementPartyRef;
  },
) {
  const charges: Array<{
    partyId: Doc<"file_parties">["_id"];
    partyName: string;
    partySide: "buyer_side" | "seller_side" | "internal";
    debitCents: number;
    creditCents: number;
  }> = [];

  const name = (party: StatementPartyRef) => {
    if (!party) return "Unknown";
    return party.role.replace(/_/g, " ");
  };

  const side = (party: StatementPartyRef) => (party?.side ?? "internal") as "buyer_side" | "seller_side" | "internal";

  if (template.defaultDebit === "buyer" && ctx.buyerParty) {
    charges.push({ partyId: ctx.buyerParty._id, partyName: name(ctx.buyerParty), partySide: side(ctx.buyerParty), debitCents: amount, creditCents: 0 });
  } else if (template.defaultDebit === "seller" && ctx.sellerParty) {
    charges.push({ partyId: ctx.sellerParty._id, partyName: name(ctx.sellerParty), partySide: side(ctx.sellerParty), debitCents: amount, creditCents: 0 });
  } else if (template.defaultDebit === "split" && ctx.buyerParty && ctx.sellerParty) {
    const half = Math.floor(amount / 2);
    charges.push({ partyId: ctx.buyerParty._id, partyName: name(ctx.buyerParty), partySide: side(ctx.buyerParty), debitCents: half, creditCents: 0 });
    charges.push({ partyId: ctx.sellerParty._id, partyName: name(ctx.sellerParty), partySide: side(ctx.sellerParty), debitCents: amount - half, creditCents: 0 });
  }

  if (template.defaultCredit === "settlement_agent" && ctx.agentParty) {
    charges.push({ partyId: ctx.agentParty._id, partyName: name(ctx.agentParty), partySide: side(ctx.agentParty), debitCents: 0, creditCents: amount });
  } else if (template.defaultCredit === "lender" && ctx.lenderParty) {
    charges.push({ partyId: ctx.lenderParty._id, partyName: name(ctx.lenderParty), partySide: side(ctx.lenderParty), debitCents: 0, creditCents: amount });
  } else if (template.defaultCredit === "counterparty") {
    const counterparty = template.defaultDebit === "buyer" ? ctx.sellerParty : ctx.buyerParty;
    if (counterparty) {
      charges.push({ partyId: counterparty._id, partyName: name(counterparty), partySide: side(counterparty), debitCents: 0, creditCents: amount });
    }
  }

  return charges;
}

async function actorDisplayName(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.email ?? identity?.name ?? "system";
}

async function actorUser(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_auth0_sub", (q) => q.eq("auth0Sub", identity.subject))
    .unique();
}

async function computeLedgerSummary(ctx: QueryCtx | MutationCtx, file: Doc<"files">, ledger: Doc<"ledgers">) {
  const lineItems = (await ctx.db
    .query("line_items")
    .withIndex("by_ledger_id", (q) => q.eq("ledgerId", ledger._id))
    .collect())
    .filter((item) => !item.deletedAt);

  const charges = await ctx.db.query("charges").collect();
  const ledgerCharges = charges.filter((charge) =>
    lineItems.some((item) => item._id === charge.lineItemId)
  );

  const payments = (await ctx.db
    .query("payments")
    .withIndex("by_ledger_id", (q) => q.eq("ledgerId", ledger._id))
    .collect())
    .filter((payment) => payment.status !== "voided");

  const fileParties = await ctx.db
    .query("file_parties")
    .withIndex("by_file_id", (q) => q.eq("fileId", file._id))
    .collect();
  const roleMap = new Map(fileParties.map((party) => [party._id.toString(), party.role]));

  const partyChargeMap = new Map<string, typeof ledgerCharges>();
  for (const charge of ledgerCharges) {
    const current = partyChargeMap.get(charge.partyId) ?? [];
    current.push(charge);
    partyChargeMap.set(charge.partyId, current);
  }

  const paymentMap = new Map<string, { receipts: number; disbursements: number }>();
  for (const payment of payments) {
    const current = paymentMap.get(payment.partyId) ?? { receipts: 0, disbursements: 0 };
    if (payment.paymentType === "receipt") current.receipts += payment.amountCents;
    else current.disbursements += payment.amountCents;
    paymentMap.set(payment.partyId, current);
  }

  const partyBalances = await Promise.all(
    [...partyChargeMap.entries()].map(async ([partyId, partyCharges]) => {
      const paymentsForParty = paymentMap.get(partyId) ?? { receipts: 0, disbursements: 0 };
      const totalDebit = sum(partyCharges.map((charge) => charge.debitCents));
      const totalCredit = sum(partyCharges.map((charge) => charge.creditCents));
      const balanceCents = totalDebit - totalCredit;

      return {
        partyId: await partyLegacyId(ctx, partyId),
        partyName: partyCharges[0]?.partyName ?? "Unknown",
        partySide: partyCharges[0]?.partySide ?? "internal",
        role: roleMap.get(partyId.toString()) ?? "unknown",
        balanceCents,
        totalReceiptsCents: paymentsForParty.receipts,
        totalDisbursementsCents: paymentsForParty.disbursements,
        isFunded: balanceCents <= 0 || paymentsForParty.receipts >= balanceCents,
      };
    }),
  );

  const snapshots = await ctx.db
    .query("ledger_snapshots")
    .withIndex("by_ledger_id", (q) => q.eq("ledgerId", ledger._id))
    .collect();
  const latestSnapshot = snapshots.sort((a, b) => b.createdAt - a.createdAt)[0];

  return {
    id: legacy(ledger),
    fileId: legacy(file),
    name: ledger.name,
    ledgerType: ledger.ledgerType satisfies typeof ledgerTypeValidator.type,
    isPrimary: ledger.isPrimary,
    partyBalances,
    totalLineItems: lineItems.length,
    driftCount: lineItems.filter((item) => item.computedAmountCents !== item.actualAmountCents).length,
    lastSnapshotAt: latestSnapshot ? new Date(latestSnapshot.createdAt).toISOString() : null,
    lastSnapshotMilestone: latestSnapshot?.milestone ?? null,
  };
}

export const createLedger = mutation({
  args: { fileId: v.string() },
  returns: v.object({ id: v.string(), fileId: v.string() }),
  handler: async (ctx, args) => {
      const file = await findFileByLegacyId(ctx, args.fileId);
      if (!file) {
        throw new ConvexError({ code: "NotFound", message: `File not found: ${args.fileId}` });
      }

      const existing = await ctx.db
        .query("ledgers")
        .withIndex("by_file_id", (q) => q.eq("fileId", file._id))
        .collect();
      if (existing.some((ledger) => ledger.isPrimary)) {
        throw new ConvexError({
          code: "Conflict",
          message: `A primary ledger already exists for file: ${args.fileId}`,
        });
      }

      const now = Date.now();
      const ledger = await auditedInsert(
        ctx,
        "ledgers",
        {
          legacyId: crypto.randomUUID(),
          fileId: file._id,
          ledgerType: "deal",
          name: "Primary",
          isPrimary: true,
          templateVersion: "v1",
          metadata: undefined,
          createdAt: now,
          updatedAt: now,
        },
      );

      return { id: legacy(ledger), fileId: legacy(file) };
    },
});

export const getLedger = query({
  args: {
    fileId: v.optional(v.string()),
    ledgerId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    let file: Doc<"files"> | null = null;
    let ledger: Doc<"ledgers"> | null = null;

    if (args.ledgerId) {
      ledger = await findLedgerByLegacyId(ctx, args.ledgerId);
      if (!ledger) {
        throw new ConvexError({ code: "NotFound", message: `Ledger not found: ${args.ledgerId}` });
      }
      file = await ctx.db.get(ledger.fileId);
    } else if (args.fileId) {
      file = await findFileByLegacyId(ctx, args.fileId);
      if (file) {
        const fileDocId = file._id;
        const ledgers = await ctx.db
          .query("ledgers")
          .withIndex("by_file_id", (q) => q.eq("fileId", fileDocId))
          .collect();
        ledger = ledgers.find((candidate) => candidate.isPrimary) ?? null;
      }
    } else {
      throw new ConvexError({ code: "ValidationError", message: "fileId or ledgerId is required" });
    }

    if (!file) {
      throw new ConvexError({ code: "NotFound", message: `File not found: ${args.fileId ?? args.ledgerId}` });
    }
    if (!ledger) {
      return null;
    }

    return await computeLedgerSummary(ctx, file, ledger);
  },
});

export const getLineItems = query({
  args: { ledgerId: v.string() },
  returns: v.object({ items: v.array(v.any()) }),
  handler: async (ctx, args) => {
    const ledger = await findLedgerByLegacyId(ctx, args.ledgerId);
    if (!ledger) {
      return { items: [] };
    }

    const rows = (await ctx.db
      .query("line_items")
      .withIndex("by_ledger_id", (q) => q.eq("ledgerId", ledger._id))
      .collect())
      .filter((row) => !row.deletedAt)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const charges = await ctx.db.query("charges").collect();
    const items = await Promise.all(
      rows.map(async (row) => ({
        id: legacy(row),
        ledgerId: legacy(ledger),
        label: row.label,
        labelOverride: row.labelOverride ?? null,
        templateKey: row.templateKey,
        section: row.section,
        computedAmountCents: row.computedAmountCents,
        actualAmountCents: row.actualAmountCents,
        manuallyAdjusted: row.manuallyAdjusted,
        adjustedByName: row.adjustedByName ?? null,
        adjustedAt: row.adjustedAt ? new Date(row.adjustedAt).toISOString() : null,
        adjustmentReason: row.adjustmentReason ?? null,
        paidOutsideOfClosing: row.paidOutsideOfClosing,
        verified: row.verified,
        charges: await Promise.all(
          charges
            .filter((charge) => charge.lineItemId === row._id)
            .map(async (charge) => ({
              id: legacy(charge),
              partyId: await partyLegacyId(ctx, charge.partyId),
              partyName: charge.partyName,
              partySide: charge.partySide,
              debitCents: charge.debitCents,
              creditCents: charge.creditCents,
            })),
        ),
        resourceType: row.resource?.type ?? null,
        resourceLabel: row.resourceLabel ?? null,
      })),
    );

    return { items };
  },
});

export const getPayments = query({
  args: { ledgerId: v.string() },
  returns: v.object({ payments: v.array(v.any()) }),
  handler: async (ctx, args) => {
    const ledger = await findLedgerByLegacyId(ctx, args.ledgerId);
    if (!ledger) {
      return { payments: [] };
    }

    const rows = (await ctx.db
      .query("payments")
      .withIndex("by_ledger_id", (q) => q.eq("ledgerId", ledger._id))
      .collect())
      .filter((payment) => payment.status !== "voided")
      .sort((a, b) => a.createdAt - b.createdAt);

    const payments = await Promise.all(
      rows.map(async (row) => ({
        id: legacy(row),
        ledgerId: legacy(ledger),
        partyId: await partyLegacyId(ctx, row.partyId),
        partyName: row.partyName,
        paymentType: row.paymentType,
        method: row.method,
        amountCents: row.amountCents,
        status: row.status,
        memo: row.memo ?? null,
        instrumentNumber: row.instrumentNumber ?? null,
        bankName: row.bankName ?? null,
        maskedAccount: row.maskedAccount ?? null,
        createdAt: new Date(row.createdAt).toISOString(),
        postedAt: row.postedAt ? new Date(row.postedAt).toISOString() : null,
        clearedAt: row.clearedAt ? new Date(row.clearedAt).toISOString() : null,
      })),
    );

    return { payments };
  },
});

export const addLineItem = mutation({
  args: {
    ledgerId: v.string(),
    label: v.string(),
    section: statementSectionValidator,
    templateKey: v.optional(v.string()),
    amountCents: v.number(),
    charges: v.array(v.object({
      partyId: v.string(),
      partyName: v.string(),
      partySide: v.union(v.literal("buyer_side"), v.literal("seller_side"), v.literal("internal")),
      debitCents: v.number(),
      creditCents: v.number(),
    })),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
      const ledger = await findLedgerByLegacyId(ctx, args.ledgerId);
      if (!ledger) {
        throw new ConvexError({ code: "NotFound", message: `Ledger not found: ${args.ledgerId}` });
      }

      const existingItems = (await ctx.db
        .query("line_items")
        .withIndex("by_ledger_id", (q) => q.eq("ledgerId", ledger._id))
        .collect())
        .filter((item) => !item.deletedAt);
      const maxSortOrder = existingItems.reduce((max, item) => Math.max(max, item.sortOrder), -1);
      const now = Date.now();

      const lineItem = await auditedInsert(
        ctx,
        "line_items",
        {
          legacyId: crypto.randomUUID(),
          ledgerId: ledger._id,
          templateKey: args.templateKey ?? "custom",
          label: args.label,
          labelOverride: undefined,
          section: args.section,
          computedAmountCents: args.amountCents,
          actualAmountCents: args.amountCents,
          manuallyAdjusted: false,
          adjustedByUserId: undefined,
          adjustedByName: undefined,
          adjustedAt: undefined,
          adjustmentReason: undefined,
          paidOutsideOfClosing: false,
          verified: false,
          sortOrder: maxSortOrder + 1,
          resource: undefined,
          resourceLabel: undefined,
          metadata: undefined,
          deletedAt: undefined,
          createdAt: now,
          updatedAt: now,
        },
      );

      const charges = [];
      for (const charge of args.charges) {
        const party = await findFilePartyByLegacyId(ctx, charge.partyId);
        if (!party) {
          throw new ConvexError({ code: "NotFound", message: `Party not found: ${charge.partyId}` });
        }
        charges.push(
          await auditedInsert(
            ctx,
            "charges",
            {
              legacyId: crypto.randomUUID(),
              lineItemId: lineItem._id,
              partyId: party._id,
              partySide: charge.partySide,
              partyName: charge.partyName,
              debitCents: charge.debitCents,
              creditCents: charge.creditCents,
              createdAt: now,
              updatedAt: now,
            },
          ),
        );
      }

      return {
        id: legacy(lineItem),
        ledgerId: legacy(ledger),
        label: lineItem.label,
        labelOverride: lineItem.labelOverride ?? null,
        templateKey: lineItem.templateKey,
        section: lineItem.section,
        computedAmountCents: lineItem.computedAmountCents,
        actualAmountCents: lineItem.actualAmountCents,
        manuallyAdjusted: lineItem.manuallyAdjusted,
        adjustedByName: lineItem.adjustedByName ?? null,
        adjustedAt: lineItem.adjustedAt ? new Date(lineItem.adjustedAt).toISOString() : null,
        adjustmentReason: lineItem.adjustmentReason ?? null,
        paidOutsideOfClosing: lineItem.paidOutsideOfClosing,
        verified: lineItem.verified,
        charges: await Promise.all(
          charges.map(async (charge) => ({
            id: legacy(charge),
            partyId: await partyLegacyId(ctx, charge.partyId),
            partyName: charge.partyName,
            partySide: charge.partySide,
            debitCents: charge.debitCents,
            creditCents: charge.creditCents,
          })),
        ),
        resourceType: lineItem.resource?.type ?? null,
        resourceLabel: lineItem.resourceLabel ?? null,
      };
    },
});

export const createPayment = mutation({
  args: {
    ledgerId: v.string(),
    partyId: v.string(),
    partyName: v.string(),
    paymentType: paymentTypeValidator,
    method: paymentMethodValidator,
    amountCents: v.number(),
    memo: v.optional(v.string()),
    instrumentNumber: v.optional(v.string()),
    bankName: v.optional(v.string()),
    maskedAccount: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
      const ledger = await findLedgerByLegacyId(ctx, args.ledgerId);
      if (!ledger) {
        throw new ConvexError({ code: "NotFound", message: `Ledger not found: ${args.ledgerId}` });
      }
      const party = await findFilePartyByLegacyId(ctx, args.partyId);
      if (!party) {
        throw new ConvexError({ code: "NotFound", message: `Party not found: ${args.partyId}` });
      }

      const now = Date.now();
      const payment = await auditedInsert(
        ctx,
        "payments",
        {
          legacyId: crypto.randomUUID(),
          ledgerId: ledger._id,
          partyId: party._id,
          partyName: args.partyName,
          paymentType: args.paymentType,
          method: args.method,
          amountCents: args.amountCents,
          status: "pending",
          memo: args.memo,
          instrumentNumber: args.instrumentNumber,
          bankName: args.bankName,
          maskedAccount: args.maskedAccount,
          postedAt: undefined,
          clearedAt: undefined,
          reconciledAt: undefined,
          voidedAt: undefined,
          voidedByUserId: undefined,
          voidReason: undefined,
          metadata: undefined,
          createdAt: now,
          updatedAt: now,
        },
      );

      return {
        id: legacy(payment),
        ledgerId: legacy(ledger),
        partyId: legacy(party),
        partyName: payment.partyName,
        paymentType: payment.paymentType,
        method: payment.method,
        amountCents: payment.amountCents,
        status: payment.status,
        memo: payment.memo ?? null,
        instrumentNumber: payment.instrumentNumber ?? null,
        bankName: payment.bankName ?? null,
        maskedAccount: payment.maskedAccount ?? null,
        createdAt: new Date(payment.createdAt).toISOString(),
        postedAt: payment.postedAt ? new Date(payment.postedAt).toISOString() : null,
        clearedAt: payment.clearedAt ? new Date(payment.clearedAt).toISOString() : null,
      };
    },
});

export const updateLineItem = mutation({
  args: {
    lineItemId: v.string(),
    actualAmountCents: v.optional(v.number()),
    label: v.optional(v.string()),
    adjustmentReason: v.optional(v.string()),
    paidOutsideOfClosing: v.optional(v.boolean()),
    verified: v.optional(v.boolean()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
      const existing = await findLineItemByLegacyId(ctx, args.lineItemId);
      if (!existing || existing.deletedAt) {
        throw new ConvexError({ code: "NotFound", message: `Line item not found: ${args.lineItemId}` });
      }

      const actorName = await actorDisplayName(ctx);
      const patch: Partial<Omit<Doc<"line_items">, "_id" | "_creationTime">> = {
        updatedAt: Date.now(),
      };

      if (args.actualAmountCents !== undefined) {
        patch.actualAmountCents = args.actualAmountCents;
        patch.manuallyAdjusted = args.actualAmountCents !== existing.computedAmountCents;
        patch.adjustedByName = actorName;
        patch.adjustedAt = Date.now();
      }
      if (args.label !== undefined) patch.labelOverride = args.label;
      if (args.adjustmentReason !== undefined) patch.adjustmentReason = args.adjustmentReason;
      if (args.paidOutsideOfClosing !== undefined) patch.paidOutsideOfClosing = args.paidOutsideOfClosing;
      if (args.verified !== undefined) patch.verified = args.verified;

      const row = await auditedPatch(ctx, "line_items", existing._id, patch);
      const ledger = await ctx.db.get(row.ledgerId);

      return {
        id: legacy(row),
        ledgerId: ledger ? legacy(ledger) : row.ledgerId,
        label: row.labelOverride ?? row.label,
        actualAmountCents: row.actualAmountCents,
        computedAmountCents: row.computedAmountCents,
        manuallyAdjusted: row.manuallyAdjusted,
        adjustedByName: row.adjustedByName ?? null,
        adjustedAt: row.adjustedAt ? new Date(row.adjustedAt).toISOString() : null,
        message: "Line item updated.",
      };
    },
});

export const voidPayment = mutation({
  args: { paymentId: v.string(), reason: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
      const payment = await ctx.db
        .query("payments")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.paymentId))
        .unique();
      if (!payment) {
        throw new ConvexError({ code: "NotFound", message: `Payment not found: ${args.paymentId}` });
      }
      if (payment.status === "voided") {
        throw new ConvexError({ code: "InvalidState", message: `Payment already voided: ${args.paymentId}` });
      }

      const user = await actorUser(ctx);
      const updated = await auditedPatch(
        ctx,
        "payments",
        payment._id,
        {
          status: "voided",
          voidedAt: Date.now(),
          voidedByUserId: user?._id,
          voidReason: args.reason,
          updatedAt: Date.now(),
        },
      );

      return {
        id: legacy(updated),
        status: "voided",
        voidReason: args.reason,
        message: "Payment voided.",
      };
    },
});

export const preparePayment = query({
  args: { ledgerId: v.string(), partyId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const ledger = await findLedgerByLegacyId(ctx, args.ledgerId);
    if (!ledger) {
      throw new ConvexError({ code: "NotFound", message: `Ledger not found: ${args.ledgerId}` });
    }
    const party = await findFilePartyByLegacyId(ctx, args.partyId);
    if (!party) {
      throw new ConvexError({ code: "NotFound", message: `No charges found for party: ${args.partyId}` });
    }

    const lineItems = (await ctx.db
      .query("line_items")
      .withIndex("by_ledger_id", (q) => q.eq("ledgerId", ledger._id))
      .collect())
      .filter((item) => !item.deletedAt);
    const charges = (await ctx.db.query("charges").withIndex("by_party_id", (q) => q.eq("partyId", party._id)).collect())
      .filter((charge) => lineItems.some((item) => item._id === charge.lineItemId));
    if (charges.length === 0) {
      throw new ConvexError({ code: "NotFound", message: `No charges found for party: ${args.partyId}` });
    }
    const payments = (await ctx.db
      .query("payments")
      .withIndex("by_party_id", (q) => q.eq("partyId", party._id))
      .collect())
      .filter((payment) => payment.ledgerId === ledger._id && payment.status !== "voided");

    const balance = sum(charges.map((c) => c.debitCents)) - sum(charges.map((c) => c.creditCents));
    const receipts = sum(payments.filter((p) => p.paymentType === "receipt").map((p) => p.amountCents));
    const disbursements = sum(payments.filter((p) => p.paymentType === "disbursement").map((p) => p.amountCents));
    const suggestedType = balance > 0 ? "receipt" : "disbursement";
    const suggestedAmount = balance > 0 ? Math.max(0, balance - receipts) : Math.max(0, Math.abs(balance) - disbursements);

    return {
      ledgerId: args.ledgerId,
      partyId: args.partyId,
      partyName: charges[0]?.partyName ?? "Unknown",
      partySide: charges[0]?.partySide ?? "internal",
      balanceCents: balance,
      existingReceiptsCents: receipts,
      existingDisbursementsCents: disbursements,
      suggestedPaymentType: suggestedType,
      suggestedAmountCents: suggestedAmount,
      suggestedMethod: "wire",
      message: `Draft: ${suggestedType} of $${(suggestedAmount / 100).toFixed(2)} for ${charges[0]?.partyName ?? "Unknown"}`,
    };
  },
});

export const checkFundingReadiness = query({
  args: { ledgerId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const ledger = await findLedgerByLegacyId(ctx, args.ledgerId);
    if (!ledger) {
      throw new ConvexError({ code: "NotFound", message: `Ledger not found: ${args.ledgerId}` });
    }
    const file = await ctx.db.get(ledger.fileId);
    if (!file) {
      throw new ConvexError({ code: "NotFound", message: `Ledger not found: ${args.ledgerId}` });
    }
    const summary = await computeLedgerSummary(ctx, file, ledger);
    const parties = summary.partyBalances.map((party) => ({
      partyId: party.partyId,
      partyName: party.partyName,
      partySide: party.partySide,
      balanceCents: party.balanceCents,
      receiptsCents: party.totalReceiptsCents,
      disbursementsCents: party.totalDisbursementsCents,
      fundingGapCents: party.isFunded ? 0 : Math.max(0, party.balanceCents - party.totalReceiptsCents),
      isFunded: party.isFunded,
    }));
    const allFunded = parties.every((party) => party.isFunded);
    const totalGap = sum(parties.map((party) => party.fundingGapCents));
    return {
      ledgerId: args.ledgerId,
      allPartiesFunded: allFunded,
      totalFundingGapCents: totalGap,
      parties,
      message: allFunded
        ? "All parties are fully funded."
        : `${parties.filter((party) => !party.isFunded).length} party/parties have funding gaps totaling $${(totalGap / 100).toFixed(2)}.`,
    };
  },
});

export const checkDrift = query({
  args: { ledgerId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const ledger = await findLedgerByLegacyId(ctx, args.ledgerId);
    if (!ledger) {
      return { ledgerId: args.ledgerId, driftCount: 0, items: [] };
    }
    const rows = (await ctx.db
      .query("line_items")
      .withIndex("by_ledger_id", (q) => q.eq("ledgerId", ledger._id))
      .collect())
      .filter((row) => !row.deletedAt && row.computedAmountCents !== row.actualAmountCents);
    return {
      ledgerId: args.ledgerId,
      driftCount: rows.length,
      items: rows.map((row) => ({
        id: legacy(row),
        label: row.label,
        templateKey: row.templateKey,
        section: row.section,
        computedAmountCents: row.computedAmountCents,
        actualAmountCents: row.actualAmountCents,
        driftCents: row.actualAmountCents - row.computedAmountCents,
        adjustedByName: row.adjustedByName ?? null,
        adjustedAt: row.adjustedAt ? new Date(row.adjustedAt).toISOString() : null,
        adjustmentReason: row.adjustmentReason ?? null,
      })),
    };
  },
});

export const checkMissingItems = query({
  args: {
    fileId: v.optional(v.string()),
    ledgerId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    let file: Doc<"files"> | null = null;
    let ledger: Doc<"ledgers"> | null = null;

    if (args.ledgerId) {
      ledger = await findLedgerByLegacyId(ctx, args.ledgerId);
      if (!ledger) {
        throw new ConvexError({ code: "NotFound", message: `Ledger not found: ${args.ledgerId}` });
      }
      file = await ctx.db.get(ledger.fileId);
    } else if (args.fileId) {
      file = await findFileByLegacyId(ctx, args.fileId);
    } else {
      throw new ConvexError({ code: "ValidationError", message: "fileId or ledgerId is required" });
    }

    if (!file) {
      throw new ConvexError({ code: "NotFound", message: `File not found: ${args.fileId ?? args.ledgerId}` });
    }
    const property = await ctx.db.get(file.propertyId);
    const address = property ? await ctx.db.get(property.addressId) : null;
    if (!ledger) {
      const ledgers = await ctx.db
        .query("ledgers")
        .withIndex("by_file_id", (q) => q.eq("fileId", file._id))
        .collect();
      ledger = ledgers.find((candidate) => candidate.isPrimary) ?? null;
    }
    if (!ledger) {
      return { fileId: legacy(file), missingCount: 0, missing: [], message: "No ledger exists yet." };
    }
    const items = (await ctx.db
      .query("line_items")
      .withIndex("by_ledger_id", (q) => q.eq("ledgerId", ledger._id))
      .collect())
      .filter((item) => !item.deletedAt);
    const existingKeys = new Set(items.map((item) => item.templateKey));
    const templates = getTemplatesForDeal(address?.state ?? "OH", file.fileType);
    const missing = templates
      .filter((template) => template.required && !existingKeys.has(template.templateKey))
      .map((template) => ({
        templateKey: template.templateKey,
        label: template.label,
        section: template.section,
        computeMethod: template.computeMethod,
      }));
    return {
      fileId: legacy(file),
      ledgerId: legacy(ledger),
      missingCount: missing.length,
      missing,
      message: missing.length === 0 ? "All required items are present." : `Found ${missing.length} missing required item(s).`,
    };
  },
});

export const whatIfAnalysis = query({
  args: {
    ledgerId: v.string(),
    changes: v.array(hypotheticalChangeValidator),
    description: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const ledger = await findLedgerByLegacyId(ctx, args.ledgerId);
    if (!ledger) {
      throw new ConvexError({ code: "NotFound", message: `Ledger not found: ${args.ledgerId}` });
    }

    const lineItems = (await ctx.db
      .query("line_items")
      .withIndex("by_ledger_id", (q) => q.eq("ledgerId", ledger._id))
      .collect())
      .filter((item) => !item.deletedAt);
    const lineItemMap = new Map(lineItems.map((item) => [legacy(item), item]));
    const charges = await ctx.db.query("charges").collect();
    const ledgerCharges = charges.filter((charge) => lineItems.some((item) => item._id === charge.lineItemId));
    const groupedCharges = new Map<string, typeof ledgerCharges>();
    for (const charge of ledgerCharges) {
      const current = groupedCharges.get(charge.partyId) ?? [];
      current.push(charge);
      groupedCharges.set(charge.partyId, current);
    }

    const itemDeltas = args.changes.map((change) => {
      const existing = change.lineItemId ? lineItemMap.get(change.lineItemId) : null;
      const currentAmount = existing?.actualAmountCents ?? 0;
      return {
        label: change.label,
        lineItemId: change.lineItemId ?? null,
        currentAmountCents: currentAmount,
        projectedAmountCents: change.newAmountCents,
        deltaCents: change.newAmountCents - currentAmount,
      };
    });

    const totalDelta = sum(itemDeltas.map((delta) => delta.deltaCents));

    return {
      ledgerId: args.ledgerId,
      description: args.description ?? "What-if analysis",
      itemDeltas,
      totalDeltaCents: totalDelta,
      currentPartyBalances: await Promise.all(
        [...groupedCharges.entries()].map(async ([partyId, partyCharges]) => ({
          partyId: await partyLegacyId(ctx, partyId),
          partyName: partyCharges[0]?.partyName ?? "Unknown",
          currentBalanceCents: sum(partyCharges.map((charge) => charge.debitCents))
            - sum(partyCharges.map((charge) => charge.creditCents)),
        })),
      ),
      message: `Scenario would change the total by $${(totalDelta / 100).toFixed(2)}.`,
    };
  },
});

export const generateStatement = mutation({
  args: { fileId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const file = await findFileByLegacyId(ctx, args.fileId);
    if (!file) {
      throw new ConvexError({ code: "NotFound", message: `File not found: ${args.fileId}` });
    }

    let ledger = (await ctx.db
      .query("ledgers")
      .withIndex("by_file_id", (q) => q.eq("fileId", file._id))
      .collect())
      .find((item) => item.isPrimary);

    if (!ledger) {
      const created = await auditedInsert(ctx, "ledgers", {
        legacyId: crypto.randomUUID(),
        fileId: file._id,
        ledgerType: "deal",
        name: "Primary",
        isPrimary: true,
        templateVersion: "v1",
        metadata: undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      ledger = created;
    }

    const property = await ctx.db.get(file.propertyId);
    const address = property ? await ctx.db.get(property.addressId) : null;
    const metadata = (file.metadata ?? {}) as Record<string, unknown>;
    const templates = getTemplatesForDeal(address?.state ?? "OH", file.fileType);
    const parties = (await ctx.db
      .query("file_parties")
      .withIndex("by_file_id", (q) => q.eq("fileId", file._id))
      .collect())
      .filter((party) => party.active);

    const buyerParty = parties.find((party) => party.role === "buyer");
    const sellerParty = parties.find((party) => party.role === "seller");
    const agentParty = parties.find((party) => party.role === "settlement_agent" || party.role === "title_agent");
    const lenderParty = parties.find((party) => party.role === "lender");
    const salesPriceCents = Number(metadata.purchase_price_cents ?? 0);
    const loanAmountCents = Number(metadata.loan_amount_cents ?? 0);
    const annualTaxCents = Number(metadata.annual_tax_cents ?? 0);
    const closingDate = typeof metadata.closing_date === "string" ? metadata.closing_date : undefined;
    const existingItems = (await ctx.db
      .query("line_items")
      .withIndex("by_ledger_id", (q) => q.eq("ledgerId", ledger._id))
      .collect())
      .filter((item) => !item.deletedAt);
    let sortOrder = existingItems.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1;
    let created = 0;

    for (const template of templates) {
      if (existingItems.some((item) => item.templateKey === template.templateKey)) continue;
      if (template.computeMethod === "manual") {
        if (template.templateKey === "contract_sales_price" && salesPriceCents <= 0) continue;
        if (template.templateKey === "earnest_money_deposit" && Number(metadata.earnest_money_cents ?? 0) <= 0) continue;
        if (template.templateKey === "loan_proceeds" && loanAmountCents <= 0) continue;
        if (template.templateKey === "mortgage_payoff" && Number(metadata.mortgage_payoff_cents ?? 0) <= 0) continue;
      }

      const amount = computeManualOrTemplate(template, {
        salesPriceCents,
        loanAmountCents,
        annualTaxCents,
        closingDate,
        metadata,
      });
      if (amount <= 0 && template.computeMethod !== "manual") continue;

      const lineItem = await auditedInsert(ctx, "line_items", {
        legacyId: crypto.randomUUID(),
        ledgerId: ledger._id,
        templateKey: template.templateKey,
        label: template.label,
        labelOverride: undefined,
        section: template.section as Doc<"line_items">["section"],
        computedAmountCents: amount,
        actualAmountCents: amount,
        manuallyAdjusted: false,
        adjustedByUserId: undefined,
        adjustedByName: undefined,
        adjustedAt: undefined,
        adjustmentReason: undefined,
        paidOutsideOfClosing: false,
        verified: false,
        sortOrder: sortOrder++,
        resource: undefined,
        resourceLabel: undefined,
        metadata: undefined,
        deletedAt: undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const charges = buildCharges(template, amount, {
        buyerParty,
        sellerParty,
        agentParty,
        lenderParty,
      });

      for (const charge of charges) {
        await auditedInsert(ctx, "charges", {
          legacyId: crypto.randomUUID(),
          lineItemId: lineItem._id,
          partyId: charge.partyId,
          partyName: charge.partyName,
          partySide: charge.partySide,
          debitCents: charge.debitCents,
          creditCents: charge.creditCents,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      created++;
    }

    return {
      ledgerId: legacy(ledger),
      lineItemsCreated: created,
      message: `Generated ${created} line items from deal terms.`,
    };
  },
});

export const createProposal = mutation({
  args: {
    ledgerId: v.string(),
    trigger: proposalTriggerValidator,
    triggerDetail: v.string(),
    items: v.array(v.object({
      lineItemId: v.optional(v.string()),
      lineItemLabel: v.string(),
      action: proposalActionValidator,
      field: v.string(),
      oldValue: v.optional(v.string()),
      newValue: v.string(),
      oldAmountCents: v.optional(v.number()),
      newAmountCents: v.number(),
    })),
    netImpact: v.object({
      parties: v.array(v.object({ partyId: v.string(), partyName: v.string(), deltaCents: v.number() })),
      totalDeltaCents: v.number(),
    }),
    chatMessageId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
      const ledger = await findLedgerByLegacyId(ctx, args.ledgerId);
      if (!ledger) throw new ConvexError({ code: "NotFound", message: `Ledger not found: ${args.ledgerId}` });
      const now = Date.now();
      const proposal = await auditedInsert(ctx, "ledger_proposals", {
        legacyId: crypto.randomUUID(),
        ledgerId: ledger._id,
        trigger: args.trigger,
        triggerDetail: args.triggerDetail,
        netImpact: args.netImpact,
        status: "pending",
        appliedByUserId: undefined,
        appliedByName: undefined,
        appliedAt: undefined,
        dismissedByUserId: undefined,
        dismissedByName: undefined,
        dismissedAt: undefined,
        chatMessageId: args.chatMessageId,
        metadata: undefined,
        createdAt: now,
        updatedAt: now,
      });
      for (const item of args.items) {
        const lineItem = item.lineItemId ? await findLineItemByLegacyId(ctx, item.lineItemId) : null;
        await auditedInsert(ctx, "ledger_proposal_items", {
          legacyId: crypto.randomUUID(),
          proposalId: proposal._id,
          lineItemId: lineItem?._id,
          lineItemLabel: item.lineItemLabel,
          action: item.action,
          field: item.field,
          oldValue: item.oldValue,
          newValue: item.newValue,
          oldAmountCents: item.oldAmountCents,
          newAmountCents: item.newAmountCents,
          status: "pending",
          overrideValue: undefined,
          createdAt: now,
          updatedAt: now,
        });
      }
      return { id: legacy(proposal), ledgerId: legacy(ledger), status: "pending", itemCount: args.items.length, message: `Proposal created with ${args.items.length} item(s).` };
    },
});

export const applyProposal = mutation({
  args: { proposalId: v.string(), itemIds: v.optional(v.array(v.string())) },
  returns: v.any(),
  handler: async (ctx, args) => {
      const proposal = await ctx.db.query("ledger_proposals").withIndex("by_legacy_id", (q) => q.eq("legacyId", args.proposalId)).unique();
      if (!proposal) throw new ConvexError({ code: "NotFound", message: `Proposal not found: ${args.proposalId}` });
      if (proposal.status !== "pending" && proposal.status !== "partially_applied") throw new ConvexError({ code: "InvalidState", message: `Proposal is ${proposal.status}, not pending` });
      const allItems = await ctx.db.query("ledger_proposal_items").withIndex("by_proposal_id", (q) => q.eq("proposalId", proposal._id)).collect();
      const targetIds = new Set(args.itemIds ?? []);
      const items = allItems.filter((item) => item.status === "pending" && (!args.itemIds || targetIds.has(legacy(item))));
      const actor = await actorDisplayName(ctx);
      let applied = 0;
      for (const item of items) {
        if (item.action === "update" && item.lineItemId) {
          await auditedPatch(ctx, "line_items", item.lineItemId, {
            actualAmountCents: item.overrideValue ? Number.parseInt(item.overrideValue, 10) : item.newAmountCents,
            manuallyAdjusted: true,
            adjustedByName: actor,
            adjustedAt: Date.now(),
            adjustmentReason: `Applied from proposal: ${proposal.triggerDetail}`,
            updatedAt: Date.now(),
          });
        }
        await auditedPatch(ctx, "ledger_proposal_items", item._id, { status: "applied", updatedAt: Date.now() });
        applied++;
      }
      const remaining = (await ctx.db.query("ledger_proposal_items").withIndex("by_proposal_id", (q) => q.eq("proposalId", proposal._id)).collect()).filter((item) => item.status === "pending");
      const user = await actorUser(ctx);
      const newStatus = remaining.length === 0 ? "applied" : "partially_applied";
      await auditedPatch(ctx, "ledger_proposals", proposal._id, {
        status: newStatus,
        appliedByUserId: user?._id,
        appliedByName: actor,
        appliedAt: Date.now(),
        updatedAt: Date.now(),
      });
      return { id: legacy(proposal), status: newStatus, appliedCount: applied, message: `Applied ${applied} item(s) from proposal.` };
    },
});

export const dismissProposal = mutation({
  args: { proposalId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
      const proposal = await ctx.db.query("ledger_proposals").withIndex("by_legacy_id", (q) => q.eq("legacyId", args.proposalId)).unique();
      if (!proposal) throw new ConvexError({ code: "NotFound", message: `Proposal not found: ${args.proposalId}` });
      if (proposal.status !== "pending") throw new ConvexError({ code: "InvalidState", message: `Proposal is ${proposal.status}, not pending` });
      const items = await ctx.db.query("ledger_proposal_items").withIndex("by_proposal_id", (q) => q.eq("proposalId", proposal._id)).collect();
      for (const item of items.filter((item) => item.status === "pending")) {
        await auditedPatch(ctx, "ledger_proposal_items", item._id, { status: "skipped", updatedAt: Date.now() });
      }
      const user = await actorUser(ctx);
      const actor = await actorDisplayName(ctx);
      await auditedPatch(ctx, "ledger_proposals", proposal._id, {
        status: "dismissed",
        dismissedByUserId: user?._id,
        dismissedByName: actor,
        dismissedAt: Date.now(),
        updatedAt: Date.now(),
      });
      return { id: legacy(proposal), status: "dismissed", message: "Proposal dismissed." };
    },
});
