/* ── Financial layer types ──────────────────────────────────────────────── */

/** Settlement statement sections (HUD-1 layout) */
export type StatementSection =
  | "sale_price_and_credits"
  | "title_charges"
  | "government_recording_and_transfer"
  | "lender_charges"
  | "prepaid_items"
  | "escrow_reserves"
  | "adjustments_and_prorations"
  | "payoffs_and_liens"
  | "commissions"
  | "additional_charges"
  | "deposits_and_earnest_money"
  | "totals";

export const STATEMENT_SECTION_LABELS: Record<StatementSection, string> = {
  sale_price_and_credits: "Sale Price & Credits",
  title_charges: "Title Charges",
  government_recording_and_transfer: "Government Recording & Transfer",
  lender_charges: "Lender Charges",
  prepaid_items: "Prepaid Items",
  escrow_reserves: "Escrow Reserves",
  adjustments_and_prorations: "Adjustments & Prorations",
  payoffs_and_liens: "Payoffs & Liens",
  commissions: "Commissions",
  additional_charges: "Additional Charges",
  deposits_and_earnest_money: "Deposits & Earnest Money",
  totals: "Totals",
};

/** The order sections appear in the HUD view */
export const STATEMENT_SECTION_ORDER: StatementSection[] = [
  "sale_price_and_credits",
  "deposits_and_earnest_money",
  "title_charges",
  "government_recording_and_transfer",
  "lender_charges",
  "prepaid_items",
  "escrow_reserves",
  "commissions",
  "adjustments_and_prorations",
  "payoffs_and_liens",
  "additional_charges",
  "totals",
];

/* ── Closing Disclosure sections ───────────────────────────────────── */

export type CDSection =
  | "cd_origination_charges"
  | "cd_services_no_shop"
  | "cd_services_shop"
  | "cd_taxes_and_government"
  | "cd_prepaids"
  | "cd_escrow"
  | "cd_other_costs"
  | "cd_total_closing_costs"
  | "cd_loan_terms"
  | "cd_summaries";

export const CD_SECTION_LABELS: Record<CDSection, string> = {
  cd_origination_charges: "A. Origination Charges",
  cd_services_no_shop: "B. Services You Cannot Shop For",
  cd_services_shop: "C. Services You Can Shop For",
  cd_taxes_and_government: "D. Taxes & Government Fees",
  cd_prepaids: "E. Prepaids",
  cd_escrow: "F. Initial Escrow at Closing",
  cd_other_costs: "G. Other Costs",
  cd_total_closing_costs: "H. Total Closing Costs",
  cd_loan_terms: "Loan Terms",
  cd_summaries: "Summaries of Transactions",
};

export const CD_SECTION_ORDER: CDSection[] = [
  "cd_origination_charges",
  "cd_services_no_shop",
  "cd_services_shop",
  "cd_taxes_and_government",
  "cd_prepaids",
  "cd_escrow",
  "cd_other_costs",
  "cd_total_closing_costs",
  "cd_loan_terms",
  "cd_summaries",
];

/* ── Net Sheet sections ────────────────────────────────────────────── */

export type NetSheetSection =
  | "ns_sale_price"
  | "ns_loan"
  | "ns_closing_costs"
  | "ns_prorations"
  | "ns_payoffs"
  | "ns_net_proceeds";

export const NET_SHEET_SECTION_LABELS: Record<NetSheetSection, string> = {
  ns_sale_price: "Sale Price",
  ns_loan: "Loan",
  ns_closing_costs: "Closing Costs",
  ns_prorations: "Prorations & Adjustments",
  ns_payoffs: "Payoffs",
  ns_net_proceeds: "Net Proceeds / Due",
};

export const NET_SHEET_SECTION_ORDER: NetSheetSection[] = [
  "ns_sale_price",
  "ns_loan",
  "ns_closing_costs",
  "ns_prorations",
  "ns_payoffs",
  "ns_net_proceeds",
];

/** Mapping from HUD section → CD section (for view mode switching) */
export const HUD_TO_CD: Record<StatementSection, CDSection> = {
  sale_price_and_credits: "cd_summaries",
  title_charges: "cd_services_shop",
  government_recording_and_transfer: "cd_taxes_and_government",
  lender_charges: "cd_origination_charges",
  prepaid_items: "cd_prepaids",
  escrow_reserves: "cd_escrow",
  adjustments_and_prorations: "cd_other_costs",
  payoffs_and_liens: "cd_summaries",
  commissions: "cd_other_costs",
  additional_charges: "cd_other_costs",
  deposits_and_earnest_money: "cd_summaries",
  totals: "cd_total_closing_costs",
};

/** Mapping from HUD section → Net Sheet section */
export const HUD_TO_NET_SHEET: Record<StatementSection, NetSheetSection> = {
  sale_price_and_credits: "ns_sale_price",
  title_charges: "ns_closing_costs",
  government_recording_and_transfer: "ns_closing_costs",
  lender_charges: "ns_loan",
  prepaid_items: "ns_closing_costs",
  escrow_reserves: "ns_closing_costs",
  adjustments_and_prorations: "ns_prorations",
  payoffs_and_liens: "ns_payoffs",
  commissions: "ns_closing_costs",
  additional_charges: "ns_closing_costs",
  deposits_and_earnest_money: "ns_sale_price",
  totals: "ns_net_proceeds",
};

/* ── Line items ─────────────────────────────────────────────────────── */

export interface LineItemCharge {
  id: string;
  partyId: string;
  partyName: string;
  partySide: "buyer_side" | "seller_side" | "internal";
  debitCents: number;
  creditCents: number;
}

export interface LineItem {
  id: string;
  ledgerId: string;
  label: string;
  labelOverride: string | null;
  templateKey: string;
  section: StatementSection;
  computedAmountCents: number;
  actualAmountCents: number;
  manuallyAdjusted: boolean;
  adjustedByName: string | null;
  adjustedAt: string | null;
  adjustmentReason: string | null;
  paidOutsideOfClosing: boolean;
  verified: boolean;
  charges: LineItemCharge[];
  resourceType: string | null;
  resourceLabel: string | null;
  prorationDetail?: {
    strategy: "365" | "360";
    periodStart: string;
    periodEnd: string;
    annualAmountCents: number;
    perDiemCents: number;
    days: number;
  };
}

/* ── Ledger ──────────────────────────────────────────────────────────── */

export type LedgerType = "deal" | "register";

export interface PartyBalance {
  partyId: string;
  partyName: string;
  partySide: "buyer_side" | "seller_side" | "internal";
  role: string;
  balanceCents: number; // positive = owes, negative = is owed
  totalReceiptsCents: number;
  totalDisbursementsCents: number;
  isFunded: boolean;
}

export interface LedgerSummary {
  id: string;
  fileId: string;
  name: string;
  ledgerType: LedgerType;
  isPrimary: boolean;
  partyBalances: PartyBalance[];
  totalLineItems: number;
  driftCount: number; // line items where computed != actual
  lastSnapshotAt: string | null;
  lastSnapshotMilestone: string | null;
}

/** Lightweight ledger entry for the switcher dropdown */
export interface LedgerListItem {
  id: string;
  name: string;
  isPrimary: boolean;
  totalLineItems: number;
}

/* ── Payments ────────────────────────────────────────────────────────── */

export type PaymentType = "receipt" | "disbursement";
export type PaymentMethod = "wire" | "check" | "ach" | "internal_transfer";
export type PaymentStatus = "pending" | "posted" | "cleared" | "reconciled" | "voided";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  posted: "Posted",
  cleared: "Cleared",
  reconciled: "Reconciled",
  voided: "Voided",
};

export interface Payment {
  id: string;
  ledgerId: string;
  partyId: string;
  partyName: string;
  paymentType: PaymentType;
  method: PaymentMethod;
  amountCents: number;
  status: PaymentStatus;
  memo: string | null;
  instrumentNumber: string | null; // check number
  bankName: string | null;
  maskedAccount: string | null; // ****4521
  createdAt: string;
  postedAt: string | null;
  clearedAt: string | null;
}

/* ── Proposals ──────────────────────────────────────────────────────── */

export type ProposalTrigger =
  | "document_uploaded"
  | "date_changed"
  | "resource_updated"
  | "resource_created"
  | "user_request"
  | "system_check"
  | "balance_error"
  | "drift_detected";

export const PROPOSAL_TRIGGER_LABELS: Record<ProposalTrigger, string> = {
  document_uploaded: "Document uploaded",
  date_changed: "Date changed",
  resource_updated: "Resource updated",
  resource_created: "New resource",
  user_request: "User request",
  system_check: "System check",
  balance_error: "Balance error",
  drift_detected: "Drift detected",
};

export type ProposalStatus =
  | "pending"
  | "applied"
  | "partially_applied"
  | "dismissed";

export type ProposalItemStatus =
  | "pending"
  | "applied"
  | "skipped"
  | "overridden";

export interface ProposalItem {
  id: string;
  lineItemId: string | null;
  lineItemLabel: string;
  action: "update" | "create" | "delete";
  field: string;
  oldValue: string | null;
  newValue: string;
  oldAmountCents: number | null;
  newAmountCents: number;
  status: ProposalItemStatus;
  overrideValue: string | null;
}

export interface ProposalPartyImpact {
  partyId: string;
  partyName: string;
  deltaCents: number;
}

export interface Proposal {
  id: string;
  ledgerId: string;
  trigger: ProposalTrigger;
  triggerDetail: string;
  items: ProposalItem[];
  netImpact: {
    parties: ProposalPartyImpact[];
    totalDeltaCents: number;
  };
  status: ProposalStatus;
  appliedByName: string | null;
  appliedAt: string | null;
  dismissedByName: string | null;
  dismissedAt: string | null;
  chatMessageId: string | null;
  createdAt: string;
}

/* ── Snapshots ───────────────────────────────────────────────────────── */

export type SnapshotMilestone = "clear_to_close" | "signing" | "funding" | "recording";

export interface LedgerSnapshot {
  id: string;
  ledgerId: string;
  milestone: SnapshotMilestone;
  createdByName: string;
  createdAt: string;
}
