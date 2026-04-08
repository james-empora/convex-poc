/* ---------- File ---------- */

export type FileStatus =
  | "new"
  | "in_progress"
  | "clear_to_close"
  | "closed"
  | "on_hold"
  | "cancelled";

export type FileType = "purchase" | "refinance" | "cash";

export type TitleSearchStatus =
  | "not_started"
  | "ordered"
  | "received"
  | "returned"
  | "clear";

export type FinancingType = "loan" | "cash" | "assumption" | "subject_to";

export type FileSubType =
  | "wholesale"
  | "retail"
  | "short_sale"
  | "foreclosure"
  | "new_construction";

export type VerificationStatus = "verified" | "pending" | "failed" | "not_started";

export type FileFlag =
  | "subject_to"
  | "payoffs_ordered"
  | "foreclosure"
  | "hoa"
  | "rush"
  | "poa"
  | "emd_received"
  | "emd_pending"
  | "onboarded"
  | "power_user";

/* ---------- Party / Contact ---------- */

export interface ContactInfo {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
}

export interface Titleholder {
  name: string;
  email?: string;
  phone?: string;
  verificationStatus: VerificationStatus;
  isPoa?: boolean;
  spouse?: string;
}

export interface AgentInfo extends ContactInfo {
  role: "listing" | "selling";
  commission?: string;
}

export interface LenderInfo extends ContactInfo {
  loanOfficer?: string;
}

export type PartyRole = "seller" | "buyer" | "borrower" | "assignor";

export interface FileParty {
  role: PartyRole;
  titleholders: Titleholder[];
  agent?: AgentInfo;
  lender?: LenderInfo;
  transactionCoordinator?: ContactInfo;
  flags: FileFlag[];
  missingItems?: string[];
}

export interface TeamMember {
  role: string;
  name: string;
}

/* ---------- TitleFile interface ---------- */

export interface TitleFile {
  id: string;
  fileNumber: string;
  propertyAddress: string;
  city: string;
  state: string;
  closingDate: string; // ISO date
  fileType: FileType;
  status: FileStatus;
  buyerNames: string[];
  sellerNames: string[];
  closerName: string;
  closerInitials: string;
  closerAvatarUrl?: string;
  progressPercent: number; // 0-100

  // Rich file overview fields (optional for backward compat)
  titleSearchStatus?: TitleSearchStatus;
  financingType?: FinancingType;
  fileSubType?: FileSubType;
  salesPrice?: number; // cents
  loanAmount?: number; // cents
  openDate?: string; // ISO date
  disburseDate?: string; // ISO date
  parcelNumber?: string;
  county?: string;
  flags?: FileFlag[];
  team?: TeamMember[];
  parties?: FileParty[];
}

/* ---------- Document ---------- */

export type DocumentType = "pdf" | "docx" | "image" | "xlsx" | "other";

export interface FileDocument {
  id: string;
  fileId: string;
  name: string;
  type: DocumentType;
  uploadedAt: string; // ISO datetime
  uploadedBy: string;
  size: number; // bytes
}

/* ---------- Helpers ---------- */

export const FILE_STATUS_LABELS: Record<FileStatus, string> = {
  new: "New",
  in_progress: "In Progress",
  clear_to_close: "Clear to Close",
  closed: "Closed",
  on_hold: "On Hold",
  cancelled: "Cancelled",
};

export const FILE_TYPE_LABELS: Record<FileType, string> = {
  purchase: "Purchase",
  refinance: "Refi",
  cash: "Cash",
};

export const TITLE_SEARCH_STATUS_LABELS: Record<TitleSearchStatus, string> = {
  not_started: "Not Started",
  ordered: "Ordered",
  received: "Received",
  returned: "Returned",
  clear: "Clear",
};

export const FINANCING_TYPE_LABELS: Record<FinancingType, string> = {
  loan: "Loan",
  cash: "Cash",
  assumption: "Assumption",
  subject_to: "Subject To",
};

export const FILE_FLAG_LABELS: Record<FileFlag, string> = {
  subject_to: "Subject To",
  payoffs_ordered: "Payoffs Ordered",
  foreclosure: "Foreclosure",
  hoa: "HOA",
  rush: "Rush",
  poa: "POA",
  emd_received: "EMD Received",
  emd_pending: "EMD Pending",
  onboarded: "Onboarded",
  power_user: "Power User",
};

export const PARTY_ROLE_LABELS: Record<PartyRole, string> = {
  seller: "Seller",
  buyer: "Buyer",
  borrower: "Borrower",
  assignor: "Assignor",
};
