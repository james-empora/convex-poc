"use client";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/app/(admin)/portfolio/_components/format-utils";
import { LedgerSwitcher } from "./ledger-switcher";
import type { LedgerSummary, LedgerListItem } from "@/types/finance";

/* ---------- compact party badge ---------- */

function PartyBadge({
  name,
  role: _role,
  balanceCents,
  receiptsCents,
  disbursementsCents,
}: {
  name: string;
  role: string;
  balanceCents: number;
  receiptsCents: number;
  disbursementsCents: number;
}) {
  const isDebtor = balanceCents > 0;
  const absBalance = Math.abs(balanceCents);
  const fundedAmount = isDebtor ? receiptsCents : disbursementsCents;
  const isFunded = fundedAmount >= absBalance;
  const gap = Math.max(0, absBalance - fundedAmount);

  return (
    <div className="flex items-center gap-2">
      {isDebtor ? (
        <ArrowDownToLine className="h-3 w-3 text-onyx-40" />
      ) : (
        <ArrowUpFromLine className="h-3 w-3 text-onyx-40" />
      )}
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-onyx-70">{name}</span>
          <span
            className={cn(
              "text-sm font-semibold tabular-nums",
              isFunded ? "text-success-80" : isDebtor ? "text-danger-80" : "text-onyx-80",
            )}
          >
            {isDebtor ? formatCurrency(absBalance) : `(${formatCurrency(absBalance)})`}
          </span>
        </div>
        {!isFunded && (
          <span className="text-[11px] text-onyx-60">
            {formatCurrency(gap)} remaining to fund
          </span>
        )}
        {isFunded && (
          <div className="flex items-center gap-0.5 text-[10px] text-success-80">
            <CheckCircle2 className="h-2.5 w-2.5" />
            Fully funded
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- component ---------- */

export function LedgerSummaryBar({
  ledger,
  ledgers = [],
  pendingProposalCount = 0,
}: {
  ledger: LedgerSummary;
  ledgers?: LedgerListItem[];
  pendingProposalCount?: number;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-onyx-20 bg-white px-4 py-2.5">
      {/* Party balances */}
      {ledger.partyBalances.map((party) => (
        <PartyBadge
          key={party.partyId}
          name={party.partyName}
          role={party.role}
          balanceCents={party.balanceCents}
          receiptsCents={party.totalReceiptsCents}
          disbursementsCents={party.totalDisbursementsCents}
        />
      ))}

      <div className="h-8 w-px bg-onyx-20" />

      {/* Ledger status */}
      <div className="flex items-center gap-2">
        <Badge size="sm" variant="glass">
          {ledger.lastSnapshotMilestone
            ? ledger.lastSnapshotMilestone.replace(/_/g, " ")
            : "Working"}
        </Badge>
        <LedgerSwitcher ledgers={ledgers} />
      </div>

      {/* Indicators */}
      <div className="flex items-center gap-3">
        {pendingProposalCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-sapphire-60">
            <Clock className="h-3 w-3" />
            {pendingProposalCount} pending
          </span>
        )}
        {ledger.driftCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-amber-600">
            <AlertTriangle className="h-3 w-3" />
            {ledger.driftCount} drift
          </span>
        )}
      </div>
    </div>
  );
}
