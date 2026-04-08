export interface RailsAdminSearchResult {
  railsDealId: string;
  fileNumber: string;
  propertyAddress: string;
  city: string;
  state: string;
  dealStatus: string;
  fileType: string;
  partiesSummary: string;
}

export interface DealSnapshot {
  dealInfo: Record<string, unknown>;
  titleholders: Record<string, unknown> | Array<Record<string, unknown>>;
  documents: Record<string, unknown> | Array<Record<string, unknown>>;
  ledgerStatus: Record<string, unknown> | null;
  lineItems: Record<string, unknown> | Array<Record<string, unknown>> | null;
  paymentStatus: Record<string, unknown> | null;
  fundingStatus: Record<string, unknown> | null;
  workflow: Record<string, unknown> | null;
  ctcPlan: Record<string, unknown> | null;
  signing: Record<string, unknown> | null;
  recording: Record<string, unknown> | null;
  actionItems: Record<string, unknown> | null;
  notes: Record<string, unknown> | null;
  messages: Record<string, unknown> | null;
  fetchedAt: string;
}

export type MilestoneId =
  | "opening"
  | "title_returned"
  | "clear_to_close"
  | "signing_complete"
  | "funded";

export const MILESTONE_LABELS: Record<MilestoneId, string> = {
  opening: "Opening",
  title_returned: "Title Returned",
  clear_to_close: "Clear to Close",
  signing_complete: "Signing Complete",
  funded: "Funded",
};

export const MILESTONE_ORDER: MilestoneId[] = [
  "opening",
  "title_returned",
  "clear_to_close",
  "signing_complete",
  "funded",
];

export type MilestoneStatus = "completed" | "in_progress" | "not_started";

export interface ActualMilestoneProgress {
  milestoneId: MilestoneId;
  status: MilestoneStatus;
  actualDate?: string;
  actualDurationDays?: number;
}

export interface DataGap {
  domain: string;
  description: string;
  dataPointCount: number;
  rawData: unknown;
}

export interface FinanceImportStats {
  lineItemCount: number;
  paymentCount: number;
  chargeCount: number;
  snapshotCount: number;
}

export interface DealImportRecord {
  railsDealId: string;
  fileNumber: string;
  fileId: string;
  ledgerId: string | null;
  propertyAddress: string;
  state: string;
  dealStatus: string;
  fileType: string;
  unmodeledData: {
    workflow: unknown;
    ctcPlan: unknown;
    signing: unknown;
    recording: unknown;
    actionItems: unknown;
    notes: unknown;
    messages: unknown;
  };
  financeStats: FinanceImportStats | null;
  actualProgress: ActualMilestoneProgress[];
  importedAt: string;
  refreshedAt: string | null;
}
