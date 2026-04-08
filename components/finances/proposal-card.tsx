"use client";

import { useState } from "react";
import {
  FileText,
  CalendarDays,
  RefreshCw,
  FilePlus,
  MessageSquare,
  AlertTriangle,
  Search,
  GitCompare,
  Check,
  X,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useSetAtom, useAtomValue } from "jotai";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/app/(admin)/portfolio/_components/format-utils";
import {
  highlightedLineItemIdAtom,
  highlightedProposalIdAtom,
} from "@/app/(admin)/portfolio/_lib/finances";
import { ProposalItemCard } from "./proposal-item-card";
import type { Proposal, ProposalTrigger } from "@/types/finance";

/* ---------- trigger icons ---------- */

const TRIGGER_ICONS: Record<ProposalTrigger, typeof FileText> = {
  document_uploaded: FileText,
  date_changed: CalendarDays,
  resource_updated: RefreshCw,
  resource_created: FilePlus,
  user_request: MessageSquare,
  system_check: Search,
  balance_error: AlertTriangle,
  drift_detected: GitCompare,
};

const TRIGGER_COLORS: Record<ProposalTrigger, string> = {
  document_uploaded: "bg-sapphire-10 text-sapphire-60",
  date_changed: "bg-amber-50 text-amber-600",
  resource_updated: "bg-sapphire-10 text-sapphire-60",
  resource_created: "bg-success-20 text-success-80",
  user_request: "bg-violet-50 text-violet-600",
  system_check: "bg-amber-50 text-amber-600",
  balance_error: "bg-danger-20 text-danger-80",
  drift_detected: "bg-amber-50 text-amber-600",
};

/* ---------- helpers ---------- */

function formatRelativeTime(iso: string): string {
  const now = new Date();
  const date = new Date(iso);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ---------- diff row ---------- */

function ProposalDiffRow({
  label,
  oldCents,
  newCents,
  onHoverLineItem,
}: {
  label: string;
  oldCents: number | null;
  newCents: number;
  onHoverLineItem?: (hovering: boolean) => void;
}) {
  const delta = newCents - (oldCents ?? 0);
  return (
    <div
      className="flex items-center justify-between py-0.5 text-xs"
      onMouseEnter={() => onHoverLineItem?.(true)}
      onMouseLeave={() => onHoverLineItem?.(false)}
    >
      <span className="min-w-0 flex-1 truncate text-onyx-70">{label}</span>
      <div className="flex items-center gap-2 tabular-nums">
        {oldCents !== null && (
          <>
            <span className="text-onyx-40 line-through">
              {formatCurrency(oldCents)}
            </span>
            <span className="text-onyx-30">&rarr;</span>
          </>
        )}
        <span className="font-medium text-onyx-80">
          {formatCurrency(newCents)}
        </span>
        {oldCents !== null && (
          <span
            className={cn(
              "text-[11px]",
              delta > 0 ? "text-danger-80" : "text-success-80",
            )}
          >
            {delta > 0 ? "+" : ""}
            {formatCurrency(delta)}
          </span>
        )}
      </div>
    </div>
  );
}

/* ---------- main component ---------- */

export function ProposalCard({
  proposal,
  onApply,
  onDismiss,
}: {
  proposal: Proposal;
  onApply?: (proposalId: string) => void;
  onDismiss?: (proposalId: string) => void;
}) {
  const [reviewMode, setReviewMode] = useState(false);
  const setHighlightedLineItem = useSetAtom(highlightedLineItemIdAtom);
  const highlightedProposalId = useAtomValue(highlightedProposalIdAtom);
  const isPending = proposal.status === "pending";
  const isHighlighted = highlightedProposalId === proposal.id;
  const isPartial = proposal.status === "partially_applied";
  const TriggerIcon = TRIGGER_ICONS[proposal.trigger];
  const pendingItems = proposal.items.filter((i) => i.status === "pending");

  return (
    <Card
      size="sm"
      id={`proposal-${proposal.id}`}
      className={cn(
        "transition-all",
        isPending && "border-sapphire-30 shadow-sm shadow-sapphire-10",
        isPartial && "border-amber-300 shadow-sm shadow-amber-50",
        isHighlighted && "ring-2 ring-sapphire-40 ring-offset-1",
      )}
    >
      <CardContent className="space-y-3">
        {/* Header: trigger + timestamp */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <div
              className={cn(
                "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                TRIGGER_COLORS[proposal.trigger],
              )}
            >
              <TriggerIcon className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-sm font-medium text-onyx-90">
                {proposal.triggerDetail}
              </p>
              <p className="mt-0.5 text-xs text-onyx-40">
                {formatRelativeTime(proposal.createdAt)}
                {proposal.chatMessageId && (
                  <button
                    type="button"
                    className="ml-2 inline-flex items-center gap-0.5 text-sapphire-60 hover:text-sapphire-70"
                  >
                    View in chat
                    <ExternalLink className="h-2.5 w-2.5" />
                  </button>
                )}
              </p>
            </div>
          </div>
          {isPending && (
            <Badge size="sm" className="shrink-0 border-sapphire-30 bg-sapphire-10 text-sapphire-60">
              <Sparkles className="mr-0.5 h-3 w-3" />
              AI
            </Badge>
          )}
        </div>

        {/* Diff table or review mode */}
        {reviewMode ? (
          <div className="space-y-2">
            {pendingItems.map((item) => (
              <ProposalItemCard
                key={item.id}
                item={item}
                onApply={() => {}}
                onSkip={() => {}}
              />
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-onyx-50"
              onClick={() => setReviewMode(false)}
            >
              Back to summary
            </Button>
          </div>
        ) : (
          <>
            {/* Scope */}
            <p className="text-xs text-onyx-50">
              {proposal.items.length} line item{proposal.items.length > 1 ? "s" : ""} affected:
            </p>

            {/* Diffs */}
            <div className="rounded-md border border-onyx-10 bg-onyx-5/50 px-2.5 py-1.5">
              {proposal.items.slice(0, 5).map((item) => (
                <ProposalDiffRow
                  key={item.id}
                  label={item.lineItemLabel}
                  oldCents={item.oldAmountCents}
                  newCents={item.newAmountCents}
                  onHoverLineItem={(hovering) =>
                    setHighlightedLineItem(hovering ? item.lineItemId : null)
                  }
                />
              ))}
              {proposal.items.length > 5 && (
                <p className="mt-1 text-[11px] text-onyx-40">
                  +{proposal.items.length - 5} more items
                </p>
              )}
            </div>

            {/* Net impact */}
            {proposal.netImpact.parties.length > 0 && (
              <div className="text-xs">
                <span className="text-onyx-50">Net: </span>
                {proposal.netImpact.parties.map((p, i) => (
                  <span key={p.partyId}>
                    {i > 0 && ", "}
                    <span className="font-medium text-onyx-70">
                      {p.partyName.split(" ")[0]}
                    </span>{" "}
                    <span
                      className={cn(
                        "font-medium",
                        p.deltaCents > 0 ? "text-danger-80" : "text-success-80",
                      )}
                    >
                      {p.deltaCents > 0 ? "owes" : "saves"}{" "}
                      {formatCurrency(Math.abs(p.deltaCents))}
                      {p.deltaCents < 0 ? " less" : " more"}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </>
        )}

        {/* Actions */}
        {(isPending || isPartial) && !reviewMode && (
          <div className="flex items-center gap-2 border-t border-onyx-10 pt-3">
            <Button
              size="sm"
              variant="default"
              className="h-7 gap-1 text-xs"
              onClick={() => onApply?.(proposal.id)}
            >
              <Check className="h-3 w-3" />
              Apply {isPartial ? "Remaining" : "All"}
            </Button>
            {pendingItems.length > 1 && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-xs"
                onClick={() => setReviewMode(true)}
              >
                Review Each
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 text-xs text-onyx-50"
              onClick={() => onDismiss?.(proposal.id)}
            >
              <X className="h-3 w-3" />
              Dismiss
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
