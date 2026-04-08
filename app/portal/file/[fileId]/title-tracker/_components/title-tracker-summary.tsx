"use client";

import { Search, FileCheck, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/portal/fake-data";
import type { TitleTrackerData } from "@/lib/portal/fake-data";

interface TitleTrackerSummaryProps {
  data: TitleTrackerData;
}

export function TitleTrackerSummary({ data }: TitleTrackerSummaryProps) {
  const { findings } = data;
  const total = findings.filter((f) => f.status !== "standard_exception").length;
  const cleared = findings.filter((f) => f.status === "cleared").length;
  const actionRequired = findings.filter(
    (f) => f.status === "action_required",
  ).length;
  const inProgress = findings.filter((f) => f.status === "in_progress").length;

  const allCleared = cleared === total;
  const pct = total > 0 ? Math.round((cleared / total) * 100) : 0;

  const statusLabel = allCleared
    ? "Title Clear"
    : actionRequired > 0
      ? "Action Needed"
      : "Clearing in Progress";

  const statusBadgeClass = allCleared
    ? "bg-success-20/80 text-success-80 border-success-80/20"
    : actionRequired > 0
      ? "bg-warning-20/80 text-warning-80 border-warning-80/20"
      : "bg-sapphire-10/80 text-sapphire-70 border-sapphire-30/50";

  return (
    <Card>
      <CardContent className="space-y-4">
        {/* Status + progress */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-onyx-100">
              Title Clearance
            </p>
            <p className="mt-0.5 text-sm text-onyx-60">
              {cleared} of {total} items cleared
            </p>
          </div>
          <Badge
            variant="glass"
            className={cn("shrink-0 border", statusBadgeClass)}
          >
            {statusLabel}
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="h-2 overflow-hidden rounded-full bg-onyx-10">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              allCleared ? "bg-success-80" : "bg-sapphire-60",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Summary counts */}
        {!allCleared && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-onyx-60">
            {actionRequired > 0 && (
              <span className="text-warning-80">
                {actionRequired} needs your action
              </span>
            )}
            {inProgress > 0 && (
              <span className="text-sapphire-60">
                {inProgress} in progress
              </span>
            )}
          </div>
        )}

        {/* Key dates */}
        <div className="flex flex-col gap-1.5 border-t border-onyx-10 pt-3 text-sm text-onyx-60">
          <span className="flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5" />
            Search ordered {formatDate(data.searchOrderedDate)}
          </span>
          {data.searchCompletedDate && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Completed {formatDate(data.searchCompletedDate)}
            </span>
          )}
          {data.commitmentIssuedDate && (
            <span className="flex items-center gap-1.5">
              <FileCheck className="h-3.5 w-3.5" />
              Commitment {formatDate(data.commitmentIssuedDate)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
