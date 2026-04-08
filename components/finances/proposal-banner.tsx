"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProposalCard } from "./proposal-card";
import type { Proposal } from "@/types/finance";

export function ProposalBanner({
  proposals,
  onApply,
  onDismiss,
}: {
  proposals: Proposal[];
  onApply?: (proposalId: string) => void;
  onDismiss?: (proposalId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const pending = proposals.filter(
    (p) => p.status === "pending" || p.status === "partially_applied",
  );

  if (pending.length === 0) return null;

  return (
    <div className="rounded-xl border border-sapphire-20 bg-sapphire-5">
      {/* Collapsed banner */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2.5 px-4 py-3"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sapphire-60">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-medium text-onyx-80">
            AI found {pending.length} change{pending.length !== 1 ? "s" : ""} to review
          </p>
          <p className="text-xs text-onyx-50">
            {pending.map((p) => p.triggerDetail).join(" / ")}
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
          {expanded ? (
            <>
              <ChevronDown className="h-3 w-3" />
              Hide
            </>
          ) : (
            <>
              <ChevronRight className="h-3 w-3" />
              Review
            </>
          )}
        </Button>
      </button>

      {/* Expanded proposal cards */}
      {expanded && (
        <div className="border-t border-sapphire-20 px-4 py-3">
          <div className="grid gap-3 md:grid-cols-2">
            {pending.map((p) => (
              <ProposalCard
                key={p.id}
                proposal={p}
                onApply={onApply}
                onDismiss={onDismiss}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
