import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

/** Which ledger is selected (primary by default) */
export const activeLedgerIdAtom = atom<string | null>(null);

/** Statement view mode — persisted to localStorage */
export type StatementViewMode = "hud" | "cd" | "net_sheet";
export const statementViewModeAtom = atomWithStorage<StatementViewMode>(
  "finances:statementViewMode",
  "cd",
);

/** Set when hovering a proposal item — highlights the corresponding row in the statement */
export const highlightedLineItemIdAtom = atom<string | null>(null);

/** Set when clicking a statement row — scrolls to the related proposal */
export const highlightedProposalIdAtom = atom<string | null>(null);

/** Which line item context card is open (null = none) */
export const expandedLineItemIdAtom = atom<string | null>(null);

/** Which statement sections are expanded (default: all expanded) */
export const expandedSectionIdsAtom = atom<Set<string>>(new Set<string>());

