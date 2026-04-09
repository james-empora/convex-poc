import { z } from "zod";
import { FILE_PARTY_SIDES } from "@/lib/validators/enums";

const uuid = z.string().uuid();

const statementSections = [
  "sale_price_and_credits",
  "title_charges",
  "government_recording_and_transfer",
  "lender_charges",
  "prepaid_items",
  "escrow_reserves",
  "adjustments_and_prorations",
  "payoffs_and_liens",
  "commissions",
  "additional_charges",
  "deposits_and_earnest_money",
  "totals",
] as const;

const paymentTypes = ["receipt", "disbursement"] as const;
const paymentMethods = ["wire", "check", "ach", "internal_transfer"] as const;
const proposalTriggers = [
  "document_uploaded",
  "date_changed",
  "resource_updated",
  "resource_created",
  "user_request",
  "system_check",
  "balance_error",
  "drift_detected",
] as const;
const proposalActions = ["update", "create", "delete"] as const;

const chargeInput = z.object({
  partyId: uuid,
  partyName: z.string(),
  partySide: z.enum(FILE_PARTY_SIDES),
  debitCents: z.coerce.number(),
  creditCents: z.coerce.number(),
});

export const GetLedgerSummaryInput = z.object({
  fileId: uuid.optional(),
  ledgerId: uuid.optional(),
}).refine((value) => value.fileId || value.ledgerId, {
  message: "fileId or ledgerId is required",
});

export const AddLineItemInput = z.object({
  ledgerId: uuid,
  label: z.string(),
  section: z.enum(statementSections),
  templateKey: z.string().optional(),
  amountCents: z.coerce.number(),
  charges: z.array(chargeInput),
});

export const UpdateLineItemInput = z.object({
  lineItemId: uuid,
  actualAmountCents: z.coerce.number().optional(),
  label: z.string().optional(),
  adjustmentReason: z.string().optional(),
  paidOutsideOfClosing: z.boolean().optional(),
  verified: z.boolean().optional(),
});

export const CreateProposalInput = z.object({
  ledgerId: uuid,
  trigger: z.enum(proposalTriggers),
  triggerDetail: z.string(),
  items: z.array(z.object({
    lineItemId: uuid.optional(),
    lineItemLabel: z.string(),
    action: z.enum(proposalActions),
    field: z.string(),
    oldValue: z.string().optional(),
    newValue: z.string(),
    oldAmountCents: z.coerce.number().optional(),
    newAmountCents: z.coerce.number(),
  })),
  netImpact: z.object({
    parties: z.array(z.object({
      partyId: uuid,
      partyName: z.string(),
      deltaCents: z.coerce.number(),
    })),
    totalDeltaCents: z.coerce.number(),
  }),
  chatMessageId: z.string().optional(),
});

export const WhatIfAnalysisInput = z.object({
  ledgerId: uuid,
  changes: z.array(z.object({
    lineItemId: uuid.optional(),
    label: z.string(),
    newAmountCents: z.coerce.number(),
  })),
  description: z.string().optional(),
});

export const CheckMissingItemsInput = z.object({
  fileId: uuid.optional(),
  ledgerId: uuid.optional(),
}).refine((value) => value.fileId || value.ledgerId, {
  message: "fileId or ledgerId is required",
});

export const PreparePaymentInput = z.object({
  ledgerId: uuid,
  partyId: uuid,
});

export const CreatePaymentInput = z.object({
  ledgerId: uuid,
  partyId: uuid,
  partyName: z.string(),
  paymentType: z.enum(paymentTypes),
  method: z.enum(paymentMethods),
  amountCents: z.coerce.number(),
  memo: z.string().optional(),
  instrumentNumber: z.string().optional(),
  bankName: z.string().optional(),
  maskedAccount: z.string().optional(),
});

export const VoidPaymentInput = z.object({
  paymentId: uuid,
  reason: z.string(),
});
