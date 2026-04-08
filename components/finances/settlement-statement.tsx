"use client";

import { useState, useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/app/(admin)/portfolio/_components/format-utils";
import { LineItemRow, type LineItemMutationCallbacks } from "./line-item-row";
import {
  highlightedLineItemIdAtom,
  highlightedProposalIdAtom,
  statementViewModeAtom,
} from "@/app/(admin)/portfolio/_lib/finances";
import type { LineItem, Proposal } from "@/types/finance";
import {
  STATEMENT_SECTION_LABELS,
  STATEMENT_SECTION_ORDER,
  CD_SECTION_LABELS,
  CD_SECTION_ORDER,
  NET_SHEET_SECTION_LABELS,
  NET_SHEET_SECTION_ORDER,
  HUD_TO_CD,
  HUD_TO_NET_SHEET,
} from "@/types/finance";

/* ---------- helpers ---------- */

function computePartyNet(
  item: LineItem,
  side: "buyer_side" | "seller_side",
): number {
  return item.charges
    .filter((c) => c.partySide === side)
    .reduce((sum, c) => sum + c.debitCents - c.creditCents, 0);
}

interface SectionGroup {
  section: string;
  label: string;
  items: LineItem[];
  buyerSubtotalCents: number;
  sellerSubtotalCents: number;
}

/* ---------- section component ---------- */

function StatementSectionGroup({
  group,
  defaultExpanded,
  highlightedLineItemId,
  proposalLineItemIds,
  onClickLineItem,
  callbacks,
}: {
  group: SectionGroup;
  defaultExpanded: boolean;
  highlightedLineItemId: string | null;
  callbacks?: LineItemMutationCallbacks;
  proposalLineItemIds: Set<string>;
  onClickLineItem: (lineItemId: string) => void;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasHighlightedItem =
    highlightedLineItemId !== null &&
    group.items.some((i) => i.id === highlightedLineItemId);

  return (
    <div>
      {/* Section header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex w-full items-center gap-1.5 border-b border-onyx-20 bg-onyx-5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-onyx-60 transition-colors hover:text-onyx-80",
          hasHighlightedItem && !expanded && "bg-sapphire-5",
        )}
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="flex-1 text-left">{group.label}</span>
        <span className="w-24 text-right tabular-nums">
          {group.buyerSubtotalCents !== 0
            ? group.buyerSubtotalCents > 0
              ? formatCurrency(group.buyerSubtotalCents)
              : `(${formatCurrency(Math.abs(group.buyerSubtotalCents))})`
            : ""}
        </span>
        <span className="w-24 text-right tabular-nums">
          {group.sellerSubtotalCents !== 0
            ? group.sellerSubtotalCents > 0
              ? formatCurrency(group.sellerSubtotalCents)
              : `(${formatCurrency(Math.abs(group.sellerSubtotalCents))})`
            : ""}
        </span>
      </button>

      {/* Line items */}
      {expanded && (
        <div className="divide-y divide-onyx-10">
          {group.items.map((item) => (
            <LineItemRow
              key={item.id}
              item={item}
              buyerNetCents={computePartyNet(item, "buyer_side")}
              sellerNetCents={computePartyNet(item, "seller_side")}
              hasProposal={proposalLineItemIds.has(item.id)}
              callbacks={callbacks}
              isHighlighted={item.id === highlightedLineItemId}
              onClickLineItem={onClickLineItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- component ---------- */

export function SettlementStatement({
  lineItems,
  proposals = [],
  className,
  callbacks,
}: {
  lineItems: LineItem[];
  proposals?: Proposal[];
  className?: string;
  callbacks?: LineItemMutationCallbacks;
}) {
  const highlightedLineItemId = useAtomValue(highlightedLineItemIdAtom);
  const setHighlightedProposal = useSetAtom(highlightedProposalIdAtom);
  const viewMode = useAtomValue(statementViewModeAtom);

  // Build set of line item IDs that have pending proposals
  const proposalLineItemIds = useMemo(() => {
    const ids = new Set<string>();
    for (const p of proposals) {
      if (p.status !== "pending" && p.status !== "partially_applied") continue;
      for (const item of p.items) {
        if (item.lineItemId && item.status === "pending") {
          ids.add(item.lineItemId);
        }
      }
    }
    return ids;
  }, [proposals]);

  // Map line item ID → most recent proposal that touched it
  const lineItemToProposal = useMemo(() => {
    const map = new Map<string, string>();
    // Iterate oldest to newest so latest wins
    const sorted = [...proposals].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    for (const p of sorted) {
      for (const item of p.items) {
        if (item.lineItemId) {
          map.set(item.lineItemId, p.id);
        }
      }
    }
    return map;
  }, [proposals]);

  const sections = useMemo(() => {
    // Determine section key, labels, and order based on view mode
    const getSectionKey = (item: LineItem): string => {
      if (viewMode === "cd") return HUD_TO_CD[item.section];
      if (viewMode === "net_sheet") return HUD_TO_NET_SHEET[item.section];
      return item.section;
    };
    const sectionLabels: Record<string, string> =
      viewMode === "cd"
        ? CD_SECTION_LABELS
        : viewMode === "net_sheet"
          ? NET_SHEET_SECTION_LABELS
          : STATEMENT_SECTION_LABELS;
    const sectionOrder: string[] =
      viewMode === "cd"
        ? CD_SECTION_ORDER
        : viewMode === "net_sheet"
          ? NET_SHEET_SECTION_ORDER
          : STATEMENT_SECTION_ORDER;

    const grouped = new Map<string, LineItem[]>();
    for (const item of lineItems) {
      const key = getSectionKey(item);
      const list = grouped.get(key) ?? [];
      list.push(item);
      grouped.set(key, list);
    }

    const result: SectionGroup[] = [];
    for (const section of sectionOrder) {
      const items = grouped.get(section);
      if (!items || items.length === 0) continue;
      result.push({
        section,
        label: sectionLabels[section] ?? section,
        items,
        buyerSubtotalCents: items.reduce(
          (sum, i) => sum + computePartyNet(i, "buyer_side"),
          0,
        ),
        sellerSubtotalCents: items.reduce(
          (sum, i) => sum + computePartyNet(i, "seller_side"),
          0,
        ),
      });
    }
    return result;
  }, [lineItems, viewMode]);

  // Grand totals
  const buyerTotal = sections.reduce(
    (sum, s) => sum + s.buyerSubtotalCents,
    0,
  );
  const sellerTotal = sections.reduce(
    (sum, s) => sum + s.sellerSubtotalCents,
    0,
  );

  function handleClickLineItem(lineItemId: string) {
    const proposalId = lineItemToProposal.get(lineItemId);
    if (proposalId) {
      setHighlightedProposal(proposalId);
      // Scroll proposal into view
      const el = document.getElementById(`proposal-${proposalId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  return (
    <div className={cn("", className)}>
      {/* Header row */}
      <div className="sticky top-0 z-10 flex items-center border-b border-onyx-20 bg-white px-4 py-2.5">
        <div className="flex flex-1 items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-onyx-60">
            {viewMode === "cd"
              ? "Closing Disclosure"
              : viewMode === "net_sheet"
                ? "Net Sheet"
                : "Settlement Statement"}
          </span>
        </div>
        <span className="w-24 text-right text-xs font-semibold uppercase tracking-wider text-onyx-60">
          {viewMode === "cd" ? "Borrower" : viewMode === "net_sheet" ? "Buyer Net" : "Buyer"}
        </span>
        <span className="w-24 text-right text-xs font-semibold uppercase tracking-wider text-onyx-60">
          {viewMode === "cd" ? "Seller" : viewMode === "net_sheet" ? "Seller Net" : "Seller"}
        </span>
      </div>

      {/* Sections */}
      <div>
        {sections.map((group) => (
          <StatementSectionGroup
            key={group.section}
            group={group}
            defaultExpanded
            highlightedLineItemId={highlightedLineItemId}
            proposalLineItemIds={proposalLineItemIds}
            onClickLineItem={handleClickLineItem}
            callbacks={callbacks}
          />
        ))}
      </div>

      {/* Grand total footer */}
      <div className="sticky bottom-0 flex items-center border-t-2 border-onyx-30 bg-onyx-5 px-4 py-3">
        <span className="flex-1 text-sm font-semibold text-onyx-90">
          Net Due
        </span>
        <span
          className={cn(
            "w-24 text-right text-sm font-semibold tabular-nums",
            buyerTotal > 0 ? "text-danger-80" : "text-success-80",
          )}
        >
          {buyerTotal > 0
            ? formatCurrency(buyerTotal)
            : `(${formatCurrency(Math.abs(buyerTotal))})`}
        </span>
        <span
          className={cn(
            "w-24 text-right text-sm font-semibold tabular-nums",
            sellerTotal > 0 ? "text-danger-80" : "text-success-80",
          )}
        >
          {sellerTotal > 0
            ? formatCurrency(sellerTotal)
            : `(${formatCurrency(Math.abs(sellerTotal))})`}
        </span>
      </div>
    </div>
  );
}
