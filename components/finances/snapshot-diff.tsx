"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/app/(admin)/portfolio/_components/format-utils";

export interface SnapshotDiffItem {
  lineItemLabel: string;
  beforeCents: number | null;
  afterCents: number;
  action: "added" | "removed" | "changed" | "unchanged";
}

export interface SnapshotDiffData {
  fromLabel: string;
  toLabel: string;
  items: SnapshotDiffItem[];
  totalChanges: number;
}

/** Mock diff for demo — compares CTC snapshot to current state */
export function getMockSnapshotDiff(): SnapshotDiffData {
  return {
    fromLabel: "Clear to Close — Mar 28",
    toLabel: "Current",
    items: [
      { lineItemLabel: "Lender's Title Insurance Policy", beforeCents: 48900, afterCents: 50000, action: "changed" },
      { lineItemLabel: "Property Tax Proration", beforeCents: 329100, afterCents: 345600, action: "changed" },
      { lineItemLabel: "Prepaid Interest", beforeCents: 47265, afterCents: 47265, action: "unchanged" },
      { lineItemLabel: "Contract Sales Price", beforeCents: 35000000, afterCents: 35000000, action: "unchanged" },
    ],
    totalChanges: 2,
  };
}

export function SnapshotDiff({ diff }: { diff: SnapshotDiffData }) {
  const changedItems = diff.items.filter((i) => i.action !== "unchanged");
  const unchangedCount = diff.items.length - changedItems.length;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs text-onyx-50">
        <Badge size="sm" variant="glass">
          {diff.fromLabel}
        </Badge>
        <ArrowRight className="h-3 w-3" />
        <Badge size="sm" variant="glass">
          {diff.toLabel}
        </Badge>
        <span className="ml-auto">
          {diff.totalChanges} change{diff.totalChanges !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Changed items */}
      {changedItems.length > 0 ? (
        <div className="rounded-md border border-onyx-10 bg-white">
          {changedItems.map((item) => {
            const delta =
              item.beforeCents !== null
                ? item.afterCents - item.beforeCents
                : item.afterCents;
            return (
              <div
                key={item.lineItemLabel}
                className="flex items-center justify-between border-b border-onyx-10 px-3 py-1.5 text-xs last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-block h-1.5 w-1.5 rounded-full",
                      item.action === "added" && "bg-success-80",
                      item.action === "removed" && "bg-danger-80",
                      item.action === "changed" && "bg-amber-500",
                    )}
                  />
                  <span className="text-onyx-70">{item.lineItemLabel}</span>
                </div>
                <div className="flex items-center gap-2 tabular-nums">
                  {item.beforeCents !== null && (
                    <>
                      <span className="text-onyx-40 line-through">
                        {formatCurrency(item.beforeCents)}
                      </span>
                      <span className="text-onyx-30">&rarr;</span>
                    </>
                  )}
                  <span className="text-onyx-80">
                    {formatCurrency(item.afterCents)}
                  </span>
                  {item.beforeCents !== null && delta !== 0 && (
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
          })}
        </div>
      ) : (
        <p className="text-xs text-onyx-40">No changes between snapshots.</p>
      )}

      {unchangedCount > 0 && (
        <p className="text-[11px] text-onyx-40">
          {unchangedCount} unchanged item{unchangedCount !== 1 ? "s" : ""} not
          shown.
        </p>
      )}
    </div>
  );
}
