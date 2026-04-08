"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Calculator,
  Shield,
  Scale,
  Banknote,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SnapshotDiff, getMockSnapshotDiff } from "./snapshot-diff";
import type { LedgerSnapshot } from "@/types/finance";

/* ---------- collapsible section wrapper ---------- */

function DetailSection({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: typeof Calculator;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-onyx-10 last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-xs transition-colors hover:bg-onyx-5"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-onyx-40" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-onyx-40" />
        )}
        <Icon className="h-3.5 w-3.5 shrink-0 text-onyx-50" />
        <span className="flex-1 text-left font-medium text-onyx-70">{title}</span>
        <Badge size="sm" variant="glass">
          {count}
        </Badge>
      </button>
      {expanded && (
        <div className="px-4 pb-3 pt-1 text-xs text-onyx-60">{children}</div>
      )}
    </div>
  );
}

/* ---------- main component ---------- */

export function SupportingDetails({
  snapshots,
  className,
}: {
  snapshots: LedgerSnapshot[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-onyx-20 bg-white",
        className,
      )}
    >
      <div className="border-b border-onyx-20 px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-onyx-60">
          Supporting Details
        </span>
      </div>

      <DetailSection icon={Calculator} title="Prorations" count={0}>
        <p className="text-onyx-40">
          Tax and other prorations will appear here when calculated.
        </p>
      </DetailSection>

      <DetailSection icon={Shield} title="Insurance" count={0}>
        <p className="text-onyx-40">
          Title insurance policies and endorsements will appear here.
        </p>
      </DetailSection>

      <DetailSection icon={Scale} title="Encumbrances" count={0}>
        <p className="text-onyx-40">
          Liens, judgments, and payoff details will appear here.
        </p>
      </DetailSection>

      <DetailSection icon={Banknote} title="Deposits" count={0}>
        <p className="text-onyx-40">
          EMD and option money details will appear here.
        </p>
      </DetailSection>

      <DetailSection icon={Camera} title="Snapshots" count={snapshots.length}>
        {snapshots.length === 0 ? (
          <p className="text-onyx-40">
            No snapshots yet. Create one from the summary bar.
          </p>
        ) : (
          <div className="space-y-3">
            {/* Snapshot timeline */}
            <div className="space-y-1.5">
              {snapshots.map((snap) => (
                <div
                  key={snap.id}
                  className="flex items-center justify-between rounded-md border border-onyx-10 bg-onyx-5 px-2.5 py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <Badge size="sm" variant="glass">
                      {snap.milestone.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-onyx-70">by {snap.createdByName}</span>
                  </div>
                  <span className="text-onyx-50">
                    {new Date(snap.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              ))}
            </div>

            {/* Diff from most recent snapshot to current */}
            {snapshots.length > 0 && (
              <div className="border-t border-onyx-10 pt-3">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-onyx-50">
                  Changes since last snapshot
                </p>
                <SnapshotDiff diff={getMockSnapshotDiff()} />
              </div>
            )}
          </div>
        )}
      </DetailSection>
    </div>
  );
}
