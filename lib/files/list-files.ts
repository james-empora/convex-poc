export type FileFilters = {
  status?:
    | "pending"
    | "in_progress"
    | "clear_to_close"
    | "closed"
    | "funded"
    | "recorded"
    | "cancelled";
  fileType?: "purchase" | "refinance" | "wholesale";
};

export type FileSummary = {
  id: string;
  fileNumber: string | null;
  fileType: string;
  status: string;
  propertyAddress?: string | null;
  city?: string | null;
  state?: string | null;
  county?: string | null;
  parcelNumber?: string | null;
  closingDate?: string | null;
  openedAt?: string | null;
  financingType?: string | null;
  salesPrice?: number | null;
  loanAmount?: number | null;
  titleSearchStatus?: string | null;
  fileSubType?: string | null;
  disburseDate?: string | null;
  flags?: string[];
  progressPercent?: number;
  team?: Array<{ role: string; name: string }>;
  parties?: Array<{
    role: string;
    side: string | null;
    entities: Array<{
      entityType: string;
      entityId: string;
      name: string;
      email: string | null;
      phone: string | null;
    }>;
  }>;
  buyerNames?: string[];
  sellerNames?: string[];
  closerName?: string | null;
  closerInitials?: string | null;
};

export type ListFilesInput = FileFilters;
export type ListFilesResult = {
  items: FileSummary[];
  nextCursor?: string | null;
};
