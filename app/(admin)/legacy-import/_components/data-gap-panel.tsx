"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { identifyDataGaps } from "@/lib/legacy-import/deal-gaps";
import type { DataGap, DealImportRecord, DealSnapshot } from "@/lib/legacy-import/types";

function GapCard({ gap }: { gap: DataGap }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-md border border-[#E5E2DF] p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#1A1916]">{gap.domain}</span>
          <Badge variant="secondary" className="text-xs">
            {gap.dataPointCount} data points
          </Badge>
          <Badge variant="outline" className="text-xs text-[#DBA756]">
            Not modeled
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Collapse" : "View JSON"}
        </Button>
      </div>
      <p className="mt-1 text-xs text-[#8C8986]">{gap.description}</p>
      {expanded && (
        <pre className="mt-2 max-h-96 overflow-auto rounded bg-[#1A1916] p-3 font-mono text-xs text-[#E5E2DF] whitespace-pre-wrap break-words">
          {JSON.stringify(gap.rawData, null, 2)}
        </pre>
      )}
    </div>
  );
}

export function DataGapPanel({ deal }: { deal: DealImportRecord }) {
  const pseudoSnapshot: DealSnapshot = {
    dealInfo: {},
    titleholders: {},
    documents: {},
    ledgerStatus: null,
    lineItems: null,
    paymentStatus: null,
    fundingStatus: null,
    workflow: deal.unmodeledData.workflow as Record<string, unknown> | null,
    ctcPlan: deal.unmodeledData.ctcPlan as Record<string, unknown> | null,
    signing: deal.unmodeledData.signing as Record<string, unknown> | null,
    recording: deal.unmodeledData.recording as Record<string, unknown> | null,
    actionItems: deal.unmodeledData.actionItems as Record<string, unknown> | null,
    notes: deal.unmodeledData.notes as Record<string, unknown> | null,
    messages: deal.unmodeledData.messages as Record<string, unknown> | null,
    fetchedAt: deal.importedAt,
  };

  const gaps = identifyDataGaps(pseudoSnapshot);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Data Gaps ({gaps.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {gaps.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#8C8986]">
            No data gaps detected - all Rails data has local models
          </p>
        ) : (
          <div className="space-y-3">
            {gaps.map((gap) => (
              <GapCard key={gap.domain} gap={gap} />
            ))}
          </div>
        )}

        <div className="mt-4 rounded-md bg-[#F5F3F0] p-3">
          <p className="text-xs font-medium text-[#1A1916]">What's fully modeled locally:</p>
          <ul className="mt-1 space-y-0.5 text-xs text-[#8C8986]">
            <li>File, property, address, parties, documents</li>
            <li>Ledger, line items, charges (settlement statement)</li>
            <li>Payments (receipts and disbursements)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
