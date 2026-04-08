"use client";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/app/(admin)/portfolio/_components/format-utils";
import type { ToolDetailKind } from "@/lib/tools/define-tool";


/* ---------- helpers ---------- */

function parseAny(raw: unknown): Record<string, unknown> | undefined {
  if (raw == null) return undefined;
  if (typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return undefined; }
  }
  return undefined;
}

function isDone(state: string) { return state === "output-available"; }
function isError(state: string) { return state === "output-error"; }

/* ---------- sub-renderers ---------- */

function LedgerSummaryDetail({ out }: { out: Record<string, unknown> }) {
  const balances = out.partyBalances as Array<{
    partyName: string; role: string; balanceCents: number;
    totalReceiptsCents: number; totalDisbursementsCents: number;
  }> | undefined;
  if (!balances) return null;
  return (
    <div className="mt-2 space-y-1">
      {balances.map((p) => (
        <div key={p.partyName} className="flex items-center justify-between text-xs">
          <span className="text-onyx-60">{p.partyName} ({p.role})</span>
          <span className={cn("font-medium tabular-nums", p.balanceCents > 0 ? "text-danger-80" : "text-success-80")}>
            {p.balanceCents > 0 ? formatCurrency(p.balanceCents) : `(${formatCurrency(Math.abs(p.balanceCents))})`}
          </span>
        </div>
      ))}
    </div>
  );
}

function ProposalDetail({ out }: { out: Record<string, unknown> }) {
  const items = out.items as Array<{
    lineItemLabel: string; oldAmountCents: number | null; newAmountCents: number; action: string;
  }> | undefined;
  const netImpact = out.netImpact as { parties: Array<{ partyName: string; deltaCents: number }> } | undefined;
  const detail = out.triggerDetail as string | undefined;
  if (!items) return null;

  return (
    <div className="mt-2 space-y-2">
      {detail && <p className="text-xs text-onyx-60">{detail}</p>}
      <div className="rounded-md border border-onyx-10 bg-onyx-5/50 px-2.5 py-1.5">
        {items.slice(0, 5).map((item) => {
          return (
            <div key={item.lineItemLabel} className="flex items-center justify-between py-0.5 text-xs">
              <span className="text-onyx-70">{item.lineItemLabel}</span>
              <div className="flex items-center gap-2 tabular-nums">
                {item.oldAmountCents != null && (
                  <>
                    <span className="text-onyx-40 line-through">{formatCurrency(item.oldAmountCents)}</span>
                    <span className="text-onyx-30">&rarr;</span>
                  </>
                )}
                <span className="font-medium text-onyx-80">{formatCurrency(item.newAmountCents)}</span>
              </div>
            </div>
          );
        })}
        {items.length > 5 && <p className="mt-1 text-[11px] text-onyx-40">+{items.length - 5} more</p>}
      </div>
      {netImpact && netImpact.parties.length > 0 && (
        <p className="text-xs text-onyx-50">
          Net:{" "}
          {netImpact.parties.map((p, i) => (
            <span key={p.partyName}>
              {i > 0 && ", "}
              <span className="font-medium text-onyx-70">{p.partyName.split(" ")[0]}</span>{" "}
              <span className={cn("font-medium", p.deltaCents > 0 ? "text-danger-80" : "text-success-80")}>
                {p.deltaCents > 0 ? "+" : ""}{formatCurrency(p.deltaCents)}
              </span>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

function WhatIfDetail({ out }: { out: Record<string, unknown> }) {
  const question = out.question as string | undefined;
  const changes = out.changes as Array<{ label: string; currentCents: number; projectedCents: number }> | undefined;
  const netImpact = out.netImpact as Array<{ partyName: string; deltaCents: number }> | undefined;
  if (!changes) return null;

  return (
    <div className="mt-2 space-y-2">
      {question && <p className="text-xs font-medium text-violet-600">{question}</p>}
      <div className="rounded-md border border-violet-200 bg-violet-50/30 px-2.5 py-1.5">
        {changes.map((c) => {
          const delta = c.projectedCents - c.currentCents;
          return (
            <div key={c.label} className="flex items-center justify-between py-0.5 text-xs">
              <span className="text-onyx-70">{c.label}</span>
              <div className="flex items-center gap-2 tabular-nums">
                <span className="text-onyx-40">{formatCurrency(c.currentCents)}</span>
                <span className="text-onyx-30">&rarr;</span>
                <span className="font-medium text-onyx-80">{formatCurrency(c.projectedCents)}</span>
                <span className={cn("text-[11px]", delta > 0 ? "text-danger-80" : "text-success-80")}>
                  {delta > 0 ? "+" : ""}{formatCurrency(delta)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {netImpact && netImpact.length > 0 && (
        <p className="text-xs text-onyx-50">
          Net:{" "}
          {netImpact.map((p, i) => (
            <span key={p.partyName}>
              {i > 0 && ", "}
              <span className="font-medium text-onyx-70">{p.partyName.split(" ")[0]}</span>{" "}
              <span className={cn("font-medium", p.deltaCents > 0 ? "text-danger-80" : "text-success-80")}>
                {p.deltaCents > 0 ? "+" : ""}{formatCurrency(p.deltaCents)}
              </span>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

function LineItemsDetail({ out }: { out: Record<string, unknown> }) {
  const items = out.items as Array<{ label: string; actualAmountCents: number; section: string }> | undefined;
  const count = out.count as number | undefined;
  if (!items) return null;
  return (
    <p className="mt-1 text-xs text-onyx-60">
      {count ?? items.length} line item{(count ?? items.length) !== 1 ? "s" : ""} across{" "}
      {new Set(items.map((i) => i.section)).size} sections
    </p>
  );
}

function PaymentsDetail({ out }: { out: Record<string, unknown> }) {
  const payments = out.payments as Array<{ paymentType: string; amountCents: number; status: string }> | undefined;
  if (!payments) return null;
  const receipts = payments.filter((p) => p.paymentType === "receipt");
  const disbursements = payments.filter((p) => p.paymentType === "disbursement");
  return (
    <p className="mt-1 text-xs text-onyx-60">
      {receipts.length} receipt{receipts.length !== 1 ? "s" : ""}, {disbursements.length} disbursement{disbursements.length !== 1 ? "s" : ""}
    </p>
  );
}

/* ---------- main renderer ---------- */

export function renderFinancialDetail(
  detailKind: ToolDetailKind,
  state: string,
  _input: unknown,
  output: unknown,
): React.ReactNode | null {
  const out = parseAny(output);

  // Loading states
  if (!isDone(state) && !isError(state)) {
    if (detailKind === "proposal") return <p className="text-xs text-onyx-50">Preparing proposal...</p>;
    if (detailKind === "what-if") return <p className="text-xs text-onyx-50">Modeling scenario...</p>;
    return null; // Use default loading from ToolCallCard
  }

  if (isError(state)) {
    return <p className="text-xs text-onyx-60">Something went wrong</p>;
  }

  if (!out) return null;

  switch (detailKind) {
    case "ledger-summary":
      return <LedgerSummaryDetail out={out} />;

    case "line-items":
      return <LineItemsDetail out={out} />;

    case "add-line-item": {
      const label = out.label as string | undefined;
      const amount = out.amountCents as number | undefined;
      return (
        <p className="mt-1 text-xs text-onyx-60">
          Added <span className="font-medium">{label ?? "line item"}</span>
          {amount != null && <> &mdash; {formatCurrency(amount)}</>}
        </p>
      );
    }

    case "update-line-item": {
      const prev = out.previousAmountCents as number | undefined;
      const next = out.newAmountCents as number | undefined;
      const reason = out.reason as string | undefined;
      return (
        <p className="mt-1 text-xs text-onyx-60">
          {prev != null && next != null ? (
            <>Updated: {formatCurrency(prev)} &rarr; {formatCurrency(next)}</>
          ) : "Updated"}
          {reason && <> &mdash; {reason}</>}
        </p>
      );
    }

    case "proposal":
      return <ProposalDetail out={out} />;

    case "apply-proposal":
      return (
        <p className="mt-1 text-xs text-success-80">
          {out.message as string ?? "Proposal applied successfully."}
        </p>
      );

    case "dismiss-proposal":
      return (
        <p className="mt-1 text-xs text-onyx-50">
          {out.message as string ?? "Proposal dismissed."}
        </p>
      );

    case "what-if":
      return <WhatIfDetail out={out} />;

    case "payments":
      return <PaymentsDetail out={out} />;

    default:
      return null;
  }
}
