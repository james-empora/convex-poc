"use client";

import { TitleFindingCard } from "./title-finding-card";
import type { TitleFinding, TitleFindingStatus } from "@/lib/portal/fake-data";

const GROUP_ORDER: TitleFindingStatus[] = [
  "action_required",
  "in_progress",
  "cleared",
  "standard_exception",
];

const GROUP_LABELS: Record<TitleFindingStatus, string> = {
  action_required: "Action Required",
  in_progress: "In Progress",
  cleared: "Cleared",
  standard_exception: "Standard Exceptions",
};

interface TitleFindingsListProps {
  findings: TitleFinding[];
}

export function TitleFindingsList({ findings }: TitleFindingsListProps) {
  const grouped = GROUP_ORDER.map((status) => ({
    status,
    label: GROUP_LABELS[status],
    items: findings.filter((f) => f.status === status),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.status}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-onyx-40">
            {group.label}
          </h2>
          <div className="space-y-2">
            {group.items.map((finding) => (
              <TitleFindingCard key={finding.id} finding={finding} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
