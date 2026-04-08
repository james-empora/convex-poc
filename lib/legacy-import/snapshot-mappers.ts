import type { DealSnapshot } from "./types";

type FileType = "purchase" | "refinance" | "wholesale";
type FileStatus =
  | "pending"
  | "in_progress"
  | "clear_to_close"
  | "closed"
  | "funded"
  | "recorded"
  | "cancelled";
type FilePartyRole =
  | "buyer"
  | "seller"
  | "lender"
  | "buyer_agent"
  | "seller_agent"
  | "title_agent"
  | "escrow_officer"
  | "notary"
  | "titleholder"
  | "signer"
  | "settlement_agent";

export interface ExtractedAddress {
  addressLine1: string;
  addressLine2: string | undefined;
  city: string;
  state: string;
  zip: string;
  county: string | undefined;
  parcelNumber: string | undefined;
  legalDescription: string | undefined;
}

export function extractAddress(info: Record<string, unknown>): ExtractedAddress {
  const properties = Array.isArray(info.properties)
    ? (info.properties as Array<Record<string, unknown>>)
    : [];
  const property = properties[0] ?? ((info.property ?? info) as Record<string, unknown>);
  const address = ((property.address ?? property) as Record<string, unknown>) ?? {};
  const parcels = Array.isArray(property.parcels)
    ? (property.parcels as Array<Record<string, unknown>>)
    : [];
  const parcelNumber = parcels[0]?.parcel_number ?? property.parcel_number ?? property.apn;

  return {
    addressLine1: String(
      address.street ?? address.address_line_1 ?? address.street_address ?? address.address ?? "Unknown",
    ),
    addressLine2: address.street2 || address.address_line_2
      ? String(address.street2 ?? address.address_line_2)
      : undefined,
    city: String(address.city ?? "Unknown"),
    state: String(address.state ?? "GA"),
    zip: String(address.zipcode ?? address.zip ?? address.zip_code ?? address.postal_code ?? "00000"),
    county: address.county ? String(address.county) : undefined,
    parcelNumber: parcelNumber ? String(parcelNumber) : undefined,
    legalDescription: property.legal_description ? String(property.legal_description) : undefined,
  };
}

const FILE_TYPE_MAP: Record<string, FileType> = {
  purchase: "purchase",
  sale: "purchase",
  refinance: "refinance",
  refi: "refinance",
  wholesale: "wholesale",
};

export function mapFileType(info: Record<string, unknown>): FileType {
  const raw = String(info.deal_type ?? info.file_type ?? info.transaction_type ?? "purchase").toLowerCase();
  if (raw === "pasa") return "purchase";
  return FILE_TYPE_MAP[raw] ?? "purchase";
}

const FILE_STATUS_MAP: Record<string, FileStatus> = {
  new: "pending",
  pending: "pending",
  open: "in_progress",
  in_progress: "in_progress",
  active: "in_progress",
  clear_to_close: "clear_to_close",
  ctc: "clear_to_close",
  closed: "closed",
  closing: "closed",
  completed: "recorded",
  funded: "funded",
  recorded: "recorded",
  cancelled: "cancelled",
  canceled: "cancelled",
  "on hold": "pending",
};

export function mapFileStatus(info: Record<string, unknown>): FileStatus {
  const statusField = info.status;
  const raw =
    typeof statusField === "object" && statusField !== null
      ? String((statusField as Record<string, unknown>).status ?? "pending")
      : String(statusField ?? info.deal_status ?? "pending");
  return FILE_STATUS_MAP[raw.toLowerCase()] ?? "pending";
}

export interface ExtractedParty {
  railsPartyId: string;
  entityName: string;
  sourceType: "individual" | "entity" | "unknown";
  role: string;
  side: string | null;
  orderIndex: number;
  email?: string;
  phone?: string;
}

const ROLE_MAP: Record<string, FilePartyRole> = {
  buyer: "buyer",
  purchaser: "buyer",
  seller: "seller",
  vendor: "seller",
  lender: "lender",
  mortgage_company: "lender",
  buyer_agent: "buyer_agent",
  buyers_agent: "buyer_agent",
  listing_agent: "seller_agent",
  seller_agent: "seller_agent",
  sellers_agent: "seller_agent",
  title_agent: "title_agent",
  escrow_officer: "escrow_officer",
  closer: "escrow_officer",
  notary: "notary",
  titleholder: "titleholder",
  signer: "signer",
  settlement_agent: "settlement_agent",
};

export function mapPartyRole(railsRole: string): FilePartyRole {
  return ROLE_MAP[railsRole.toLowerCase()] ?? "titleholder";
}

function sideToRole(dealSide: string): { role: string; side: string | null } {
  if (dealSide === "future") return { role: "buyer", side: "buyer_side" };
  if (dealSide === "current") return { role: "seller", side: "seller_side" };
  return { role: "titleholder", side: null };
}

export function extractParties(snapshot: DealSnapshot): ExtractedParty[] {
  const parties: ExtractedParty[] = [];
  const titleholders = snapshot.titleholders;
  let orderIndex = 0;

  const individuals = !Array.isArray(titleholders) && Array.isArray(titleholders.individual_titleholders)
    ? (titleholders.individual_titleholders as Array<Record<string, unknown>>)
    : [];
  const entities = !Array.isArray(titleholders) && Array.isArray(titleholders.entity_titleholders)
    ? (titleholders.entity_titleholders as Array<Record<string, unknown>>)
    : [];
  const flat = Array.isArray(titleholders)
    ? titleholders
    : Array.isArray(titleholders.titleholders)
      ? (titleholders.titleholders as Array<Record<string, unknown>>)
      : Array.isArray(titleholders.parties)
        ? (titleholders.parties as Array<Record<string, unknown>>)
        : [];

  for (const party of individuals) {
    const dealSide = String(party.deal_side ?? "");
    const { role, side } = sideToRole(dealSide);
    const firstName = String(party.first_name ?? "");
    const lastName = String(party.last_name ?? "");
    parties.push({
      railsPartyId: dealSide || `individual-${orderIndex}`,
      entityName: `${firstName} ${lastName}`.trim() || String(party.name ?? "Unknown"),
      sourceType: "individual",
      role,
      side,
      orderIndex: orderIndex++,
      email: party.email ? String(party.email) : undefined,
      phone: party.phone_number ? String(party.phone_number) : undefined,
    });
  }

  for (const party of entities) {
    const dealSide = String(party.deal_side ?? "");
    const { role, side } = sideToRole(dealSide);
    parties.push({
      railsPartyId: dealSide || `entity-${orderIndex}`,
      entityName: String(party.entity_name ?? party.name ?? "Unknown"),
      sourceType: "entity",
      role,
      side,
      orderIndex: orderIndex++,
      email: party.email ? String(party.email) : undefined,
      phone: party.phone_number ? String(party.phone_number) : undefined,
    });
  }

  for (const party of flat) {
    parties.push({
      railsPartyId: String(party.id ?? party.party_id ?? `party-${orderIndex}`),
      entityName: String(party.name ?? party.full_name ?? party.entity_name ?? "Unknown"),
      sourceType: "unknown",
      role: String(party.role ?? party.party_role ?? "titleholder"),
      side: party.side ? String(party.side) : null,
      orderIndex: orderIndex++,
      email: party.email ? String(party.email) : undefined,
      phone: party.phone_number ? String(party.phone_number) : undefined,
    });
  }

  const seen = new Set<string>();
  return parties.filter((party) => {
    if (seen.has(party.railsPartyId)) return false;
    seen.add(party.railsPartyId);
    return true;
  });
}

export interface ExtractedDocument {
  railsDocId: string;
  displayName: string;
  documentType: string;
  mimeType: string;
  sizeBytes: number;
}

const DOC_TYPE_MAP: Record<string, string> = {
  contract: "purchase_contract",
  purchase_contract: "purchase_contract",
  deed: "deed",
  mortgage: "mortgage",
  title_commitment: "title_commitment",
  title_search: "title_search",
  survey: "survey",
  payoff: "payoff_letter",
  payoff_letter: "payoff_letter",
  closing_disclosure: "closing_disclosure",
  settlement_statement: "settlement_statement",
  hud: "settlement_statement",
};

export function extractDocuments(snapshot: DealSnapshot): ExtractedDocument[] {
  const documents = snapshot.documents;
  const list = Array.isArray(documents)
    ? documents
    : Array.isArray(documents.documents)
      ? (documents.documents as Array<Record<string, unknown>>)
      : [];

  return list.map((document) => ({
    railsDocId: String(document.id ?? document.document_id ?? ""),
    displayName: String(document.name ?? document.display_name ?? document.filename ?? "Untitled"),
    documentType: DOC_TYPE_MAP[String(document.document_type ?? document.type ?? "").toLowerCase()] ?? "other",
    mimeType: String(document.mime_type ?? document.content_type ?? "application/pdf"),
    sizeBytes: Number(document.size_bytes ?? document.file_size ?? 0),
  }));
}

export interface ExtractedLineItem {
  label: string;
  section: string;
  templateKey: string;
  computedAmountCents: number;
  actualAmountCents: number;
  verified: boolean;
  paidOutsideOfClosing: boolean;
  sortOrder: number;
  charges: Array<{
    railsPartyId: string;
    partyName: string;
    partySide: string;
    debitCents: number;
    creditCents: number;
  }>;
}

const SECTION_MAP: Record<string, string> = {
  primary: "sale_price_and_credits",
  loan_charges: "lender_charges",
  other_loan_charges: "lender_charges",
  prepaids: "prepaid_items",
  impounds: "escrow_reserves",
  government_charges: "government_recording_and_transfer",
  prorations: "adjustments_and_prorations",
  misc: "additional_charges",
  escrow_adjustment: "additional_charges",
  title_charges: "title_charges",
  lender_charges: "lender_charges",
  prepaid_items: "prepaid_items",
  escrow_reserves: "escrow_reserves",
  government_recording_and_transfer: "government_recording_and_transfer",
  adjustments_and_prorations: "adjustments_and_prorations",
  payoffs_and_liens: "payoffs_and_liens",
  commissions: "commissions",
  additional_charges: "additional_charges",
  sale_price_and_credits: "sale_price_and_credits",
  deposits_and_earnest_money: "deposits_and_earnest_money",
  totals: "totals",
  title: "title_charges",
  recording: "government_recording_and_transfer",
  government: "government_recording_and_transfer",
  government_recording: "government_recording_and_transfer",
  lender: "lender_charges",
  prepaid: "prepaid_items",
  escrow: "escrow_reserves",
  adjustments: "adjustments_and_prorations",
  payoffs: "payoffs_and_liens",
  commission: "commissions",
  additional: "additional_charges",
  sale_price: "sale_price_and_credits",
  deposits: "deposits_and_earnest_money",
  earnest_money: "deposits_and_earnest_money",
};

function mapSection(raw: string): string {
  return SECTION_MAP[raw.toLowerCase()] ?? "additional_charges";
}

function guessPartySideFromKey(key: string): string {
  if (key === "future") return "buyer";
  if (key === "current") return "seller";
  return "internal";
}

function mapPartySide(raw: string): string {
  const value = raw.toLowerCase();
  if (value.includes("buyer")) return "buyer_side";
  if (value.includes("seller")) return "seller_side";
  return "internal";
}

export function extractLineItems(snapshot: DealSnapshot): ExtractedLineItem[] {
  const data = snapshot.lineItems;
  if (!data) return [];

  const list = Array.isArray(data)
    ? data
    : Array.isArray(data.line_items)
      ? (data.line_items as Array<Record<string, unknown>>)
      : [];

  return list.map((lineItem, index) => {
    const charges = Array.isArray(lineItem.charges)
      ? (lineItem.charges as Array<Record<string, unknown>>)
      : [];

    return {
      label: String(lineItem.label ?? lineItem.description ?? "Unknown"),
      section: mapSection(String(lineItem.settlement_statement_section ?? lineItem.section ?? lineItem.category ?? "additional")),
      templateKey: String(lineItem.line_item_type ?? lineItem.template_key ?? lineItem.code ?? `imported-${index}`),
      computedAmountCents: Number(lineItem.computed_amount_cents ?? lineItem.amount_cents ?? 0),
      actualAmountCents: Number(lineItem.actual_amount_cents ?? lineItem.amount_cents ?? 0),
      verified: Boolean(lineItem.verified ?? false),
      paidOutsideOfClosing: Boolean(lineItem.paid_outside_of_closing ?? lineItem.poc ?? false),
      sortOrder: index,
      charges: charges.map((charge) => ({
        railsPartyId: String(charge.party_key ?? charge.party_id ?? charge.id ?? ""),
        partyName: String(charge.party_name ?? charge.name ?? "Unknown"),
        partySide: mapPartySide(
          String(charge.party_side ?? charge.side ?? guessPartySideFromKey(String(charge.party_key ?? ""))),
        ),
        debitCents: Number(charge.debit_cents ?? charge.debit ?? 0),
        creditCents: Number(charge.credit_cents ?? charge.credit ?? 0),
      })),
    };
  });
}

export interface ExtractedPayment {
  railsPartyId: string;
  partyName: string;
  paymentType: string;
  method: string;
  amountCents: number;
  status: string;
  memo: string | null;
  bankName: string | null;
  maskedAccount: string | null;
}

const PAYMENT_STATUS_MAP: Record<string, string> = {
  pending: "pending",
  posted: "posted",
  cleared: "cleared",
  reconciled: "reconciled",
  voided: "voided",
  void: "voided",
  complete: "cleared",
  completed: "cleared",
};

const PAYMENT_METHOD_MAP: Record<string, string> = {
  wire: "wire",
  wire_transfer: "wire",
  check: "check",
  business: "check",
  ach: "ach",
  aggregate: "internal_transfer",
  internal: "internal_transfer",
  internal_transfer: "internal_transfer",
  transfer: "internal_transfer",
};

function flattenByStatus(group: unknown): Array<Record<string, unknown>> {
  if (!group || typeof group !== "object") return [];
  if (Array.isArray(group)) return group as Array<Record<string, unknown>>;

  const byStatus = ((group as Record<string, unknown>).by_status ?? group) as Record<string, unknown>;
  const items: Array<Record<string, unknown>> = [];

  for (const statusGroup of Object.values(byStatus)) {
    if (statusGroup && typeof statusGroup === "object" && !Array.isArray(statusGroup)) {
      const nested = statusGroup as Record<string, unknown>;
      if (Array.isArray(nested.items)) {
        items.push(...(nested.items as Array<Record<string, unknown>>));
      }
    }
  }

  return items;
}

function mapPayment(payment: Record<string, unknown>, defaultType: string): ExtractedPayment {
  return {
    railsPartyId: String(payment.party_key ?? payment.party_id ?? payment.id ?? ""),
    partyName: String(payment.party_name ?? payment.description ?? "Unknown"),
    paymentType: String(payment.payment_type ?? payment.type ?? defaultType),
    method:
      PAYMENT_METHOD_MAP[String(payment.payment_method ?? payment.method ?? "wire").toLowerCase()] ??
      "wire",
    amountCents: Number(payment.amount_cents ?? payment.amount ?? 0),
    status: PAYMENT_STATUS_MAP[String(payment.status ?? "pending").toLowerCase()] ?? "pending",
    memo: payment.memo ?? payment.description ? String(payment.memo ?? payment.description) : null,
    bankName: payment.bank_name ? String(payment.bank_name) : null,
    maskedAccount: payment.masked_account ?? payment.instrument_number
      ? String(payment.masked_account ?? payment.instrument_number)
      : null,
  };
}

export function extractPayments(snapshot: DealSnapshot): ExtractedPayment[] {
  const data = snapshot.paymentStatus;
  if (!data) return [];

  const rawPayments = data.payments;
  if (Array.isArray(rawPayments)) {
    return rawPayments.map((payment) =>
      mapPayment(
        payment as Record<string, unknown>,
        String((payment as Record<string, unknown>).payment_type ?? (payment as Record<string, unknown>).type ?? "receipt"),
      ),
    );
  }

  const payments = ((rawPayments ?? data) as Record<string, unknown>) ?? {};
  const receiptItems = flattenByStatus(payments.receipts);
  const disbursementItems = flattenByStatus(payments.disbursements);
  const flat = Array.isArray(payments.items)
    ? (payments.items as Array<Record<string, unknown>>)
    : Array.isArray(data.items)
      ? (data.items as Array<Record<string, unknown>>)
      : [];

  return [
    ...receiptItems.map((payment) => mapPayment(payment, "receipt")),
    ...disbursementItems.map((payment) => mapPayment(payment, "disbursement")),
    ...flat.map((payment) => mapPayment(payment, String(payment.payment_type ?? payment.type ?? "receipt"))),
  ];
}
