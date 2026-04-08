"use client";

import { useState } from "react";
import {
  Check,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/app/(admin)/portfolio/_components/format-utils";
import type { Proposal } from "@/types/finance";

function ResolvedEntry({ proposal }: { proposal: Proposal }) {
  const [expanded, setExpanded] = useState(false);
  const isApplied =
    proposal.status === "applied" || proposal.status === "partially_applied";
  const date = new Date(
    proposal.appliedAt ?? proposal.dismissedAt ?? proposal.createdAt,
  );

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-onyx-5"
      >
        {/* Status icon */}
        <div
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
            isApplied
              ? "bg-success-20 text-success-80"
              : "bg-onyx-10 text-onyx-40",
          )}
        >
          {isApplied ? (
            <Check className="h-3 w-3" />
          ) : (
            <X className="h-3 w-3" />
          )}
        </div>

        {/* Description */}
        <span className="min-w-0 flex-1 truncate text-onyx-60 group-hover:text-onyx-80">
          {proposal.triggerDetail}
          {proposal.items.length > 1 && (
            <span className="text-onyx-40">
              {" "}
              ({proposal.items.length} items)
            </span>
          )}
        </span>

        {/* Date */}
        <span className="shrink-0 text-onyx-40">
          {date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>

        {/* Expand chevron */}
        {expanded ? (
          <ChevronDown className="h-3 w-3 shrink-0 text-onyx-30" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0 text-onyx-30" />
        )}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="ml-9 mb-1 rounded-md border border-onyx-10 bg-onyx-5/50 px-2.5 py-2 text-xs">
          {proposal.items.slice(0, 8).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-0.5"
            >
              <span className="min-w-0 flex-1 truncate text-onyx-60">
                {item.lineItemLabel}
              </span>
              <div className="flex items-center gap-2 tabular-nums">
                {item.oldAmountCents !== null && (
                  <>
                    <span className="text-onyx-40 line-through">
                      {formatCurrency(item.oldAmountCents)}
                    </span>
                    <span className="text-onyx-30">&rarr;</span>
                  </>
                )}
                <span className="text-onyx-70">
                  {formatCurrency(item.newAmountCents)}
                </span>
              </div>
            </div>
          ))}
          {proposal.items.length > 8 && (
            <p className="mt-1 text-onyx-40">
              +{proposal.items.length - 8} more
            </p>
          )}
          <div className="mt-1.5 border-t border-onyx-10 pt-1.5 text-onyx-40">
            {isApplied
              ? `Applied by ${proposal.appliedByName}`
              : `Dismissed by ${proposal.dismissedByName}`}
          </div>
        </div>
      )}
    </div>
  );
}

export function ResolvedTimeline({
  proposals,
}: {
  proposals: Proposal[];
}) {
  const [expanded, setExpanded] = useState(false);

  if (proposals.length === 0) return null;

  return (
    <div className="border-t border-onyx-10 pt-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-1.5 px-1 text-xs font-medium text-onyx-50 transition-colors hover:text-onyx-70"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
        Resolved ({proposals.length})
      </button>

      {expanded && (
        <div className="mt-1 space-y-0.5">
          {proposals.map((p) => (
            <ResolvedEntry key={p.id} proposal={p} />
          ))}
        </div>
      )}
    </div>
  );
}
