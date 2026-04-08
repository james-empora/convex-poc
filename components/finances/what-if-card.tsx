"use client";

import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/app/(admin)/portfolio/_components/format-utils";

export interface WhatIfScenario {
  id: string;
  question: string;
  changes: {
    label: string;
    currentCents: number;
    projectedCents: number;
  }[];
  netImpact: {
    partyName: string;
    deltaCents: number;
  }[];
}

export function WhatIfCard({
  scenario,
  onCreateProposal,
  onDismiss,
}: {
  scenario: WhatIfScenario;
  onCreateProposal?: (scenarioId: string) => void;
  onDismiss?: (scenarioId: string) => void;
}) {
  return (
    <Card
      size="sm"
      className="border-violet-200 bg-violet-50/30 shadow-sm shadow-violet-100"
    >
      <CardContent className="space-y-3">
        {/* Header */}
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
            <FlaskConical className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-violet-500">
              What-If Analysis
            </p>
            <p className="mt-0.5 text-sm font-medium text-onyx-90">
              {scenario.question}
            </p>
          </div>
        </div>

        {/* Projected changes */}
        <div className="rounded-md border border-violet-200 bg-white/60 px-2.5 py-1.5">
          {scenario.changes.map((change) => {
            const delta = change.projectedCents - change.currentCents;
            return (
              <div
                key={change.label}
                className="flex items-center justify-between py-0.5 text-xs"
              >
                <span className="min-w-0 flex-1 truncate text-onyx-70">
                  {change.label}
                </span>
                <div className="flex items-center gap-2 tabular-nums">
                  <span className="text-onyx-40">
                    {formatCurrency(change.currentCents)}
                  </span>
                  <span className="text-onyx-30">&rarr;</span>
                  <span className="font-medium text-onyx-80">
                    {formatCurrency(change.projectedCents)}
                  </span>
                  <span
                    className={cn(
                      "text-[11px]",
                      delta > 0 ? "text-danger-80" : "text-success-80",
                    )}
                  >
                    {delta > 0 ? "+" : ""}
                    {formatCurrency(delta)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Net impact */}
        {scenario.netImpact.length > 0 && (
          <div className="text-xs">
            <span className="text-onyx-50">Net impact: </span>
            {scenario.netImpact.map((p, i) => (
              <span key={p.partyName}>
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
                  {p.deltaCents > 0 ? "+" : ""}
                  {formatCurrency(p.deltaCents)}
                </span>
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 border-t border-violet-200 pt-3">
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 border-violet-300 text-xs text-violet-700 hover:bg-violet-50"
            onClick={() => onCreateProposal?.(scenario.id)}
          >
            Create Proposal
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-onyx-50"
            onClick={() => onDismiss?.(scenario.id)}
          >
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
