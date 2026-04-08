/* ------------------------------------------------------------------ */
/*  Fake data for the buyer/seller portal (frontend prototyping only) */
/* ------------------------------------------------------------------ */

export interface PortalEscrowOfficer {
  name: string;
  email: string;
  phone: string;
}

export interface PortalParty {
  name: string;
  role: string;
  side: "buyer_side" | "seller_side" | "internal";
}

export interface PortalFile {
  id: string;
  fileNumber: string;
  fileType: "purchase" | "refinance";
  status: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    county: string;
  };
  closingDate: string | null;
  purchasePriceCents: number | null;
  loanAmountCents: number | null;
  openedAt: string;
  escrowOfficer: PortalEscrowOfficer;
  parties: PortalParty[];
}

export type PortalDocumentGroup = "closing" | "title" | "contract";

export interface PortalDocument {
  id: string;
  name: string;
  documentType: string;
  filetype: "pdf" | "png" | "jpg" | "docx" | "xlsx";
  fileSizeBytes: number;
  createdAt: string;
  uploadedByMe: boolean;
  group: PortalDocumentGroup;
}

/* ------------------------------------------------------------------ */
/*  Title Tracker                                                      */
/* ------------------------------------------------------------------ */

export type TitleFindingStatus =
  | "action_required"
  | "in_progress"
  | "cleared"
  | "standard_exception";

export interface TitleFinding {
  id: string;
  title: string;
  description: string;
  legalReference?: string;
  status: TitleFindingStatus;
  responsibleParty: string | null;
  clearedDate?: string;
  foundDate: string;
  actionLabel?: string;
}

export interface TitleTrackerData {
  searchOrderedDate: string;
  searchCompletedDate: string | null;
  commitmentIssuedDate: string | null;
  findings: TitleFinding[];
}

/* ------------------------------------------------------------------ */
/*  Live Ledger                                                        */
/* ------------------------------------------------------------------ */

export type LedgerLineStatus = "estimated" | "final";

export interface LedgerLineItem {
  id: string;
  label: string;
  description: string;
  amountCents: number; // positive = debit, negative = credit
  status: LedgerLineStatus;
}

export interface LedgerCategory {
  id: string;
  label: string;
  items: LedgerLineItem[];
}

export interface LedgerData {
  categories: LedgerCategory[];
  asOfDate: string;
}

export type PortalMessageRole = "user" | "assistant" | "escrow_officer";

export interface PortalMessage {
  id: string;
  role: PortalMessageRole;
  senderName: string;
  content: string;
  timestamp: string;
}

/* ------------------------------------------------------------------ */
/*  Files                                                              */
/* ------------------------------------------------------------------ */

export const FAKE_FILES: PortalFile[] = [
  {
    id: "file-001",
    fileNumber: "EM-2026-0042",
    fileType: "purchase",
    status: "clear_to_close",
    address: {
      street: "123 Main St",
      city: "Austin",
      state: "TX",
      zip: "78701",
      county: "Travis",
    },
    closingDate: "2026-04-15",
    purchasePriceCents: 42500000,
    loanAmountCents: 34000000,
    openedAt: "2026-03-01",
    escrowOfficer: {
      name: "Sarah Johnson",
      email: "sarah@emporatitle.com",
      phone: "(512) 555-0123",
    },
    parties: [
      { name: "David Landreman", role: "buyer", side: "buyer_side" },
      { name: "Maria Rodriguez", role: "seller", side: "seller_side" },
      { name: "James Park", role: "buyer_agent", side: "buyer_side" },
      { name: "Lisa Chen", role: "seller_agent", side: "seller_side" },
      { name: "Sarah Johnson", role: "escrow_officer", side: "internal" },
    ],
  },
  {
    id: "file-002",
    fileNumber: "EM-2026-0058",
    fileType: "refinance",
    status: "in_progress",
    address: {
      street: "456 Oak Ave",
      city: "Dallas",
      state: "TX",
      zip: "75201",
      county: "Dallas",
    },
    closingDate: "2026-05-01",
    purchasePriceCents: null,
    loanAmountCents: 28000000,
    openedAt: "2026-03-15",
    escrowOfficer: {
      name: "Michael Torres",
      email: "michael@emporatitle.com",
      phone: "(214) 555-0456",
    },
    parties: [
      { name: "David Landreman", role: "buyer", side: "buyer_side" },
      { name: "Michael Torres", role: "escrow_officer", side: "internal" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Documents                                                          */
/* ------------------------------------------------------------------ */

export const FAKE_DOCUMENTS: Record<string, PortalDocument[]> = {
  "file-001": [
    {
      id: "doc-001",
      name: "Closing Disclosure",
      documentType: "closing_disclosure",
      filetype: "pdf",
      fileSizeBytes: 2_457_600,
      createdAt: "2026-03-20",
      uploadedByMe: false,
      group: "closing",
    },
    {
      id: "doc-008",
      name: "Settlement Statement",
      documentType: "settlement_statement",
      filetype: "pdf",
      fileSizeBytes: 1_843_200,
      createdAt: "2026-03-20",
      uploadedByMe: false,
      group: "closing",
    },
    {
      id: "doc-004",
      name: "ID Verification - Front",
      documentType: "id_verification",
      filetype: "jpg",
      fileSizeBytes: 3_276_800,
      createdAt: "2026-03-10",
      uploadedByMe: true,
      group: "closing",
    },
    {
      id: "doc-002",
      name: "Title Commitment",
      documentType: "title_commitment",
      filetype: "pdf",
      fileSizeBytes: 1_126_400,
      createdAt: "2026-03-15",
      uploadedByMe: false,
      group: "title",
    },
    {
      id: "doc-009",
      name: "Title Search Report",
      documentType: "title_search",
      filetype: "pdf",
      fileSizeBytes: 4_300_800,
      createdAt: "2026-03-12",
      uploadedByMe: false,
      group: "title",
    },
    {
      id: "doc-010",
      name: "Property Survey",
      documentType: "survey",
      filetype: "pdf",
      fileSizeBytes: 9_113_600,
      createdAt: "2026-03-10",
      uploadedByMe: false,
      group: "title",
    },
    {
      id: "doc-003",
      name: "Purchase Contract",
      documentType: "purchase_contract",
      filetype: "pdf",
      fileSizeBytes: 3_891_200,
      createdAt: "2026-03-05",
      uploadedByMe: false,
      group: "contract",
    },
    {
      id: "doc-011",
      name: "Amendment No. 1",
      documentType: "amendment",
      filetype: "pdf",
      fileSizeBytes: 409_600,
      createdAt: "2026-03-08",
      uploadedByMe: false,
      group: "contract",
    },
    {
      id: "doc-005",
      name: "Proof of Insurance",
      documentType: "insurance_binder",
      filetype: "pdf",
      fileSizeBytes: 819_200,
      createdAt: "2026-03-12",
      uploadedByMe: true,
      group: "contract",
    },
  ],
  "file-002": [
    {
      id: "doc-006",
      name: "Loan Application",
      documentType: "other",
      filetype: "pdf",
      fileSizeBytes: 1_638_400,
      createdAt: "2026-03-18",
      uploadedByMe: false,
      group: "closing",
    },
    {
      id: "doc-007",
      name: "Title Search",
      documentType: "title_search",
      filetype: "pdf",
      fileSizeBytes: 2_048_000,
      createdAt: "2026-03-22",
      uploadedByMe: false,
      group: "title",
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  Messages                                                           */
/* ------------------------------------------------------------------ */

export const FAKE_MESSAGES: Record<string, PortalMessage[]> = {
  "file-001": [
    {
      id: "msg-001",
      role: "assistant",
      senderName: "Empora Assistant",
      content:
        "Hi David! I'm your Empora assistant. I can help with questions about your closing at 123 Main St. Ask me about your closing date, documents, next steps, or anything else.",
      timestamp: "2026-03-20T10:00:00Z",
    },
    {
      id: "msg-002",
      role: "user",
      senderName: "David Landreman",
      content: "When is my closing date?",
      timestamp: "2026-03-20T10:05:00Z",
    },
    {
      id: "msg-003",
      role: "assistant",
      senderName: "Empora Assistant",
      content:
        "Your closing is scheduled for **April 15, 2026**. The closing will take place at the Empora Austin office. Make sure to bring a valid government-issued photo ID.",
      timestamp: "2026-03-20T10:05:15Z",
    },
    {
      id: "msg-004",
      role: "user",
      senderName: "David Landreman",
      content: "I need to reschedule. Can I talk to someone?",
      timestamp: "2026-03-20T10:10:00Z",
    },
    {
      id: "msg-005",
      role: "assistant",
      senderName: "Empora Assistant",
      content:
        "I've notified your escrow officer, **Sarah Johnson**. She'll respond to help you with rescheduling.",
      timestamp: "2026-03-20T10:10:10Z",
    },
    {
      id: "msg-006",
      role: "escrow_officer",
      senderName: "Sarah Johnson",
      content:
        "Hi David! Happy to help with rescheduling. What dates work better for you? We have availability on April 18th and April 22nd.",
      timestamp: "2026-03-20T11:30:00Z",
    },
  ],
  "file-002": [
    {
      id: "msg-007",
      role: "assistant",
      senderName: "Empora Assistant",
      content:
        "Welcome! I'm here to help with your refinance at 456 Oak Ave. What can I help you with?",
      timestamp: "2026-03-22T09:00:00Z",
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  Title Tracker Data                                                 */
/* ------------------------------------------------------------------ */

export const FAKE_TITLE_TRACKER: Record<string, TitleTrackerData> = {
  "file-001": {
    searchOrderedDate: "2026-03-05",
    searchCompletedDate: "2026-03-12",
    commitmentIssuedDate: "2026-03-20",
    findings: [
      {
        id: "tf-001",
        title: "Proof of Homeowner's Insurance",
        description:
          "Your lender requires proof of homeowner's insurance before closing. Upload your insurance binder showing the property address and an effective date on or before the closing date.",
        status: "action_required",
        responsibleParty: "You (buyer)",
        foundDate: "2026-03-12",
        actionLabel: "Upload Document",
      },
      {
        id: "tf-002",
        title: "Judgment Lien Release",
        description:
          "A prior judgment lien was identified against a party with a similar name to the seller. Empora is working to confirm this is a different individual and obtain a release affidavit.",
        legalReference:
          'Abstract of Judgment, Cause No. 2021-CV-4567, Travis County District Court, "State of Texas v. M. Rodriguez," filed August 12, 2021. Recorded in Official Public Records of Travis County, Document No. 2021-087654.',
        status: "in_progress",
        responsibleParty: "Empora",
        foundDate: "2026-03-12",
      },
      {
        id: "tf-003",
        title: "Existing Mortgage (Deed of Trust)",
        description:
          "The seller has an existing mortgage on the property. It will be paid off from the sale proceeds at closing, and a release will be recorded afterward.",
        legalReference:
          "Deed of Trust dated June 15, 2019, executed by Maria Rodriguez to First National Bank, securing an original principal amount of $285,000.00. Recorded in Official Public Records of Travis County, Texas, as Document No. 2019-123456.",
        status: "cleared",
        responsibleParty: "Seller's lender",
        foundDate: "2026-03-12",
        clearedDate: "2026-03-18",
      },
      {
        id: "tf-004",
        title: "Property Tax Lien",
        description:
          "2025 property taxes have been paid in full with no delinquency. 2026 taxes will be prorated between buyer and seller at closing.",
        legalReference:
          "Ad valorem taxes for the year 2025, Travis County Tax Assessor-Collector, Account No. 01-2345-0678-0000. Amount: $7,842.00 — paid in full. 2026 taxes not yet assessed; will be prorated as of the date of closing.",
        status: "cleared",
        responsibleParty: "Empora",
        foundDate: "2026-03-12",
        clearedDate: "2026-03-15",
      },
      {
        id: "tf-005",
        title: "HOA Transfer & Assessment",
        description:
          "The HOA transfer fee has been ordered and current assessments are confirmed paid through March 2026. The transfer package will be delivered before closing.",
        legalReference:
          "Declaration of Covenants, Conditions, and Restrictions for Riverside Estates, recorded as Document No. 2005-034567 in the Official Public Records of Travis County, Texas. Current quarterly assessment: $425.00.",
        status: "cleared",
        responsibleParty: "Empora",
        foundDate: "2026-03-12",
        clearedDate: "2026-03-19",
      },
      {
        id: "tf-006",
        title: "Utility Easement",
        description:
          "A standard utility easement exists along the rear 10 feet of the property. This is typical for residential lots and allows utility companies to maintain infrastructure. No action is required.",
        legalReference:
          "Easement to Austin Energy, a department of the City of Austin, recorded as Document No. 1987-045678 in the Official Public Records of Travis County, Texas, granting a 10-foot utility easement along the south boundary of the property.",
        status: "standard_exception",
        responsibleParty: null,
        foundDate: "2026-03-12",
      },
      {
        id: "tf-007",
        title: "Mineral Rights Reservation",
        description:
          "A prior mineral rights reservation exists on the property. This is common in Texas and does not affect your use of the surface. No action is required.",
        legalReference:
          'Reservation of mineral interests by J.T. Harmon in deed dated March 3, 1952, recorded in Volume 1842, Page 312, Deed Records of Travis County, Texas, reserving "all oil, gas, and other minerals in and under the herein described land."',
        status: "standard_exception",
        responsibleParty: null,
        foundDate: "2026-03-12",
      },
    ],
  },
  "file-002": {
    searchOrderedDate: "2026-03-18",
    searchCompletedDate: "2026-03-22",
    commitmentIssuedDate: null,
    findings: [
      {
        id: "tf-008",
        title: "Updated Survey Required",
        description:
          "Your lender requires an updated survey for the refinance. If you have a recent survey, upload it here. Otherwise, Empora can order one on your behalf.",
        status: "action_required",
        responsibleParty: "You (borrower)",
        foundDate: "2026-03-22",
        actionLabel: "Upload Survey",
      },
      {
        id: "tf-009",
        title: "Existing Mortgage Payoff",
        description:
          "Your current mortgage will be paid off with the new loan proceeds at closing. Empora has requested a payoff statement from your lender.",
        legalReference:
          "Deed of Trust dated September 10, 2022, executed by David Landreman to Wells Fargo Home Mortgage, securing an original principal amount of $320,000.00. Recorded in Official Public Records of Dallas County, Texas, as Document No. 2022-098765.",
        status: "in_progress",
        responsibleParty: "Empora",
        foundDate: "2026-03-22",
      },
      {
        id: "tf-010",
        title: "Property Tax Verification",
        description:
          "2025 property taxes confirmed paid. 2026 taxes will be prorated at closing.",
        legalReference:
          "Ad valorem taxes for the year 2025, Dallas County Tax Assessor-Collector, Account No. 65-4321-0987-0000. Amount: $6,210.00 — paid in full.",
        status: "cleared",
        responsibleParty: "Empora",
        foundDate: "2026-03-22",
        clearedDate: "2026-03-25",
      },
      {
        id: "tf-011",
        title: "Utility Easement",
        description:
          "A standard utility easement exists along the east property line. No action is required.",
        legalReference:
          "Easement to Oncor Electric Delivery, recorded as Document No. 1995-012345 in the Official Public Records of Dallas County, Texas.",
        status: "standard_exception",
        responsibleParty: null,
        foundDate: "2026-03-22",
      },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  Live Ledger Data                                                   */
/* ------------------------------------------------------------------ */

export const FAKE_LEDGER: Record<string, LedgerData> = {
  "file-001": {
    asOfDate: "2026-03-28",
    categories: [
      {
        id: "purchase-financing",
        label: "Purchase & Financing",
        items: [
          {
            id: "ll-001",
            label: "Purchase Price",
            description:
              "The agreed-upon price for the property as stated in your purchase contract.",
            amountCents: 42_500_000,
            status: "final",
          },
          {
            id: "ll-002",
            label: "Loan Amount",
            description:
              "The amount your lender is financing. This is applied as a credit, reducing what you owe at closing.",
            amountCents: -34_000_000,
            status: "final",
          },
          {
            id: "ll-003",
            label: "Earnest Money Deposit",
            description:
              "The deposit you made when your offer was accepted. This is credited toward your cash to close.",
            amountCents: -850_000,
            status: "final",
          },
        ],
      },
      {
        id: "title-escrow",
        label: "Title & Escrow Fees",
        items: [
          {
            id: "ll-004",
            label: "Owner's Title Insurance",
            description:
              "A one-time policy that protects you against title defects or ownership disputes for as long as you own the property.",
            amountCents: 210_000,
            status: "final",
          },
          {
            id: "ll-005",
            label: "Escrow Fee (Buyer Portion)",
            description:
              "Empora's fee for managing the closing process — holding funds, coordinating documents, and ensuring a smooth transaction.",
            amountCents: 89_500,
            status: "final",
          },
          {
            id: "ll-006",
            label: "Title Search & Examination",
            description:
              "The cost of searching public records to verify the property's ownership history and identify any liens or encumbrances.",
            amountCents: 45_000,
            status: "final",
          },
        ],
      },
      {
        id: "lender-charges",
        label: "Lender Charges",
        items: [
          {
            id: "ll-007",
            label: "Loan Origination Fee (1%)",
            description:
              "Your lender's fee for processing and underwriting your mortgage. Calculated as a percentage of the loan amount.",
            amountCents: 340_000,
            status: "estimated",
          },
          {
            id: "ll-008",
            label: "Appraisal Fee",
            description:
              "The cost of a professional appraisal to confirm the property's market value for your lender.",
            amountCents: 55_000,
            status: "final",
          },
          {
            id: "ll-009",
            label: "Credit Report",
            description:
              "Your lender's cost to pull your credit history as part of the loan approval process.",
            amountCents: 6_500,
            status: "final",
          },
          {
            id: "ll-010",
            label: "Flood Certification",
            description:
              "A check to determine whether the property is in a FEMA-designated flood zone, required by your lender.",
            amountCents: 2_500,
            status: "final",
          },
        ],
      },
      {
        id: "government-recording",
        label: "Government & Recording",
        items: [
          {
            id: "ll-011",
            label: "Recording Fee (Deed)",
            description:
              "The county clerk's fee to officially record the transfer of ownership in public records.",
            amountCents: 4_500,
            status: "final",
          },
          {
            id: "ll-012",
            label: "Recording Fee (Deed of Trust)",
            description:
              "The county clerk's fee to record your mortgage lien in public records.",
            amountCents: 9_500,
            status: "final",
          },
        ],
      },
      {
        id: "prorations",
        label: "Prorations & Adjustments",
        items: [
          {
            id: "ll-013",
            label: "Property Tax Proration",
            description:
              "The seller reimburses you for the portion of 2026 property taxes covering the period after closing (Apr 15 – Dec 31). This is a credit to you.",
            amountCents: -561_200,
            status: "estimated",
          },
          {
            id: "ll-014",
            label: "HOA Dues Proration",
            description:
              "The seller reimburses you for the portion of HOA dues already paid that cover the period after closing.",
            amountCents: -21_200,
            status: "estimated",
          },
        ],
      },
      {
        id: "prepaids",
        label: "Prepaid Items",
        items: [
          {
            id: "ll-015",
            label: "Homeowner's Insurance (12 months)",
            description:
              "Your first year of homeowner's insurance, required to be prepaid at closing.",
            amountCents: 240_000,
            status: "estimated",
          },
          {
            id: "ll-016",
            label: "Prepaid Interest (15 days)",
            description:
              "Daily interest on your mortgage from the closing date to the end of the month. Your first regular payment starts the following month.",
            amountCents: 68_000,
            status: "estimated",
          },
          {
            id: "ll-017",
            label: "Tax Escrow Reserve (3 months)",
            description:
              "An initial cushion in your escrow account so your lender can pay property taxes on your behalf when they come due.",
            amountCents: 196_100,
            status: "estimated",
          },
          {
            id: "ll-018",
            label: "Insurance Escrow Reserve (2 months)",
            description:
              "An initial cushion in your escrow account so your lender can renew your homeowner's insurance when it comes due.",
            amountCents: 40_000,
            status: "estimated",
          },
        ],
      },
    ],
  },
  "file-002": {
    asOfDate: "2026-03-26",
    categories: [
      {
        id: "loan-payoff",
        label: "Loan & Payoff",
        items: [
          {
            id: "ll-019",
            label: "New Loan Amount",
            description:
              "The amount of your new mortgage. This funds the payoff of your existing loan and covers closing costs.",
            amountCents: -28_000_000,
            status: "final",
          },
          {
            id: "ll-020",
            label: "Existing Mortgage Payoff",
            description:
              "The remaining balance on your current mortgage, including any accrued interest through the payoff date.",
            amountCents: 26_450_000,
            status: "estimated",
          },
        ],
      },
      {
        id: "title-escrow-refi",
        label: "Title & Escrow Fees",
        items: [
          {
            id: "ll-021",
            label: "Lender's Title Insurance",
            description:
              "A policy protecting your new lender against title defects. Required for the new mortgage.",
            amountCents: 95_000,
            status: "final",
          },
          {
            id: "ll-022",
            label: "Escrow Fee",
            description:
              "Empora's fee for managing the refinance closing process.",
            amountCents: 65_000,
            status: "final",
          },
          {
            id: "ll-023",
            label: "Title Search & Examination",
            description:
              "The cost of searching public records to verify clear title for your new lender.",
            amountCents: 35_000,
            status: "final",
          },
        ],
      },
      {
        id: "lender-charges-refi",
        label: "Lender Charges",
        items: [
          {
            id: "ll-024",
            label: "Loan Origination Fee (0.5%)",
            description:
              "Your lender's fee for processing the new mortgage.",
            amountCents: 140_000,
            status: "estimated",
          },
          {
            id: "ll-025",
            label: "Appraisal Fee",
            description:
              "A professional appraisal to confirm the current market value of your property.",
            amountCents: 55_000,
            status: "final",
          },
        ],
      },
      {
        id: "government-recording-refi",
        label: "Government & Recording",
        items: [
          {
            id: "ll-026",
            label: "Recording Fee (Deed of Trust)",
            description:
              "The county clerk's fee to record your new mortgage lien.",
            amountCents: 9_500,
            status: "final",
          },
        ],
      },
      {
        id: "prorations-refi",
        label: "Prorations & Adjustments",
        items: [
          {
            id: "ll-027",
            label: "Prepaid Interest (20 days)",
            description:
              "Daily interest on your new mortgage from the closing date to the end of the month.",
            amountCents: 56_000,
            status: "estimated",
          },
        ],
      },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

export function getFakeFile(fileId: string): PortalFile | null {
  return FAKE_FILES.find((f) => f.id === fileId) ?? null;
}

export function getFakeFiles(): PortalFile[] {
  return FAKE_FILES;
}

export function getFakeDocuments(fileId: string): PortalDocument[] {
  return FAKE_DOCUMENTS[fileId] ?? [];
}

export function getFakeMessages(fileId: string): PortalMessage[] {
  return FAKE_MESSAGES[fileId] ?? [];
}

export function getFakeTitleTracker(fileId: string): TitleTrackerData | null {
  return FAKE_TITLE_TRACKER[fileId] ?? null;
}

export function getFakeLedger(fileId: string): LedgerData | null {
  return FAKE_LEDGER[fileId] ?? null;
}

/* ------------------------------------------------------------------ */
/*  Formatting helpers                                                 */
/* ------------------------------------------------------------------ */

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = today.getTime() - date.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays <= 7) return `${diffDays} days ago`;
  return formatDate(dateStr);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  clear_to_close: "Clear to Close",
  closed: "Closed",
  funded: "Funded",
  recorded: "Recorded",
  cancelled: "Cancelled",
};

export function formatStatus(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
