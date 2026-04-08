import type {
  TitleSearchStatus,
  FinancingType,
  FileFlag,
  VerificationStatus,
} from "@/types/title-file";

/* ---------- File status (shared with file-card.tsx) ---------- */
// Includes both UI-layer names (new, on_hold) and DB-layer names (pending, funded, recorded)

export const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  new: { label: "New", className: "bg-sapphire-10/80 text-sapphire-70 border-sapphire-30/50" },
  pending: { label: "New", className: "bg-sapphire-10/80 text-sapphire-70 border-sapphire-30/50" },
  in_progress: { label: "In Progress", className: "bg-amethyst-10/80 text-amethyst-70 border-amethyst-30/50" },
  clear_to_close: { label: "CTC", className: "bg-success-20/80 text-success-80 border-success-80/20" },
  closed: { label: "Closed", className: "bg-onyx-10/80 text-onyx-60 border-onyx-30/50" },
  funded: { label: "Funded", className: "bg-success-20/80 text-success-80 border-success-80/20" },
  recorded: { label: "Recorded", className: "bg-onyx-10/80 text-onyx-60 border-onyx-30/50" },
  on_hold: { label: "Hold", className: "bg-warning-20/80 text-warning-80 border-warning-80/20" },
  cancelled: { label: "Cancelled", className: "bg-danger-20/80 text-danger-80 border-danger-80/20" },
};

/* ---------- File type ---------- */

export const TYPE_CONFIG: Record<string, { className: string }> = {
  purchase: { className: "bg-sapphire-20/60 text-sapphire-80 border-sapphire-30/50" },
  refinance: { className: "bg-amethyst-20/60 text-amethyst-80 border-amethyst-30/50" },
  cash: { className: "bg-garnet-10/60 text-garnet-80 border-garnet-30/50" },
  wholesale: { className: "bg-warning-20/60 text-warning-80 border-warning-80/20" },
};

/* ---------- Title search status ---------- */

export const TITLE_SEARCH_STATUS_CONFIG: Record<TitleSearchStatus, { label: string; className: string }> = {
  not_started: { label: "Not Started", className: "bg-onyx-10/80 text-onyx-60 border-onyx-30/50" },
  ordered: { label: "Ordered", className: "bg-amethyst-10/80 text-amethyst-70 border-amethyst-30/50" },
  received: { label: "Received", className: "bg-sapphire-10/80 text-sapphire-70 border-sapphire-30/50" },
  returned: { label: "Returned", className: "bg-warning-20/80 text-warning-80 border-warning-80/20" },
  clear: { label: "Clear", className: "bg-success-20/80 text-success-80 border-success-80/20" },
};

/* ---------- Financing type ---------- */

export const FINANCING_TYPE_CONFIG: Record<FinancingType, { className: string }> = {
  loan: { className: "bg-sapphire-10/80 text-sapphire-70 border-sapphire-30/50" },
  cash: { className: "bg-garnet-10/60 text-garnet-80 border-garnet-30/50" },
  assumption: { className: "bg-amethyst-10/80 text-amethyst-70 border-amethyst-30/50" },
  subject_to: { className: "bg-warning-20/80 text-warning-80 border-warning-80/20" },
};

/* ---------- File flags ---------- */

export const FILE_FLAG_CONFIG: Record<FileFlag, { label: string; className: string }> = {
  subject_to: { label: "Subject To", className: "bg-amethyst-10/80 text-amethyst-70 border-amethyst-30/50" },
  payoffs_ordered: { label: "Payoffs Ordered", className: "bg-sapphire-10/80 text-sapphire-70 border-sapphire-30/50" },
  foreclosure: { label: "Foreclosure", className: "bg-danger-20/80 text-danger-80 border-danger-80/20" },
  hoa: { label: "HOA", className: "bg-warning-20/80 text-warning-80 border-warning-80/20" },
  rush: { label: "Rush", className: "bg-garnet-10/60 text-garnet-80 border-garnet-30/50" },
  poa: { label: "POA", className: "bg-amethyst-10/80 text-amethyst-70 border-amethyst-30/50" },
  emd_received: { label: "EMD Received", className: "bg-success-20/80 text-success-80 border-success-80/20" },
  emd_pending: { label: "EMD Pending", className: "bg-warning-20/80 text-warning-80 border-warning-80/20" },
  onboarded: { label: "Onboarded", className: "bg-success-20/80 text-success-80 border-success-80/20" },
  power_user: { label: "Power User", className: "bg-sapphire-10/80 text-sapphire-70 border-sapphire-30/50" },
};

/* ---------- Verification status ---------- */

export const VERIFICATION_CONFIG: Record<VerificationStatus, { className: string }> = {
  verified: { className: "text-success-80" },
  pending: { className: "text-warning-80" },
  failed: { className: "text-danger-80" },
  not_started: { className: "text-onyx-40" },
};
