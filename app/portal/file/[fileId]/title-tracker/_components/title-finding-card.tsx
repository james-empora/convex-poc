"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Info,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/portal/fake-data";
import type { TitleFinding } from "@/lib/portal/fake-data";

const STATUS_CONFIG: Record<
  TitleFinding["status"],
  {
    icon: typeof CheckCircle2;
    badgeLabel: string;
    badgeClass: string;
    iconClass: string;
  }
> = {
  action_required: {
    icon: AlertTriangle,
    badgeLabel: "Action Required",
    badgeClass: "bg-warning-20/80 text-warning-80 border-warning-80/20",
    iconClass: "text-warning-80",
  },
  in_progress: {
    icon: Loader2,
    badgeLabel: "In Progress",
    badgeClass: "bg-sapphire-10/80 text-sapphire-70 border-sapphire-30/50",
    iconClass: "text-sapphire-60",
  },
  cleared: {
    icon: CheckCircle2,
    badgeLabel: "Cleared",
    badgeClass: "bg-success-20/80 text-success-80 border-success-80/20",
    iconClass: "text-success-80",
  },
  standard_exception: {
    icon: Info,
    badgeLabel: "Standard Exception",
    badgeClass: "bg-onyx-10/80 text-onyx-60 border-onyx-30/50",
    iconClass: "text-onyx-40",
  },
};

interface TitleFindingCardProps {
  finding: TitleFinding;
}

export function TitleFindingCard({ finding }: TitleFindingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = STATUS_CONFIG[finding.status];
  const Icon = config.icon;

  return (
    <Card size="sm">
      <CardContent>
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              finding.status === "action_required" && "bg-warning-20",
              finding.status === "in_progress" && "bg-sapphire-10",
              finding.status === "cleared" && "bg-success-20",
              finding.status === "standard_exception" && "bg-onyx-10",
            )}
          >
            <Icon className={cn("h-4 w-4", config.iconClass)} />
          </div>

          <div className="min-w-0 flex-1">
            {/* Header row */}
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold text-onyx-100">
                {finding.title}
              </p>
              <Badge
                variant="glass"
                size="sm"
                className={cn("border", config.badgeClass)}
              >
                {config.badgeLabel}
              </Badge>
            </div>

            {/* Responsible party + date */}
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-onyx-50">
              {finding.responsibleParty && (
                <span>{finding.responsibleParty}</span>
              )}
              {finding.clearedDate && (
                <>
                  <span className="text-onyx-20">&middot;</span>
                  <span>Cleared {formatDate(finding.clearedDate)}</span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="mt-2 text-sm leading-relaxed text-onyx-60">
              {finding.description}
            </p>

            {/* Action button */}
            {finding.actionLabel && (
              <Button
                variant="outline"
                size="default"
                className="mt-3"
                onClick={() => {}}
              >
                {finding.actionLabel}
              </Button>
            )}

            {/* Collapsible legal reference */}
            {finding.legalReference && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 text-sm font-medium text-onyx-50 transition-colors hover:text-onyx-80"
                >
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      expanded && "rotate-180",
                    )}
                  />
                  Legal details
                </button>
                {expanded && (
                  <div className="mt-2 rounded-md bg-onyx-5 px-3 py-2.5">
                    <p className="font-mono text-xs leading-relaxed text-onyx-60">
                      {finding.legalReference}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
