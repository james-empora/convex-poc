"use client";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Landmark,
  FileCheck,
  CreditCard,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/app/(admin)/portfolio/_components/format-utils";
import type { Payment, PaymentMethod, PaymentStatus } from "@/types/finance";
import { PAYMENT_STATUS_LABELS } from "@/types/finance";

/* ---------- helpers ---------- */

const METHOD_ICONS: Record<PaymentMethod, typeof Landmark> = {
  wire: Landmark,
  check: FileCheck,
  ach: CreditCard,
  internal_transfer: ArrowLeftRight,
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  wire: "Wire",
  check: "Check",
  ach: "ACH",
  internal_transfer: "Transfer",
};

const STATUS_STYLES: Record<PaymentStatus, string> = {
  pending: "bg-onyx-10 text-onyx-60",
  posted: "bg-sapphire-10 text-sapphire-70 border-sapphire-20",
  cleared: "bg-success-20 text-success-80 border-success-60/30",
  reconciled: "bg-success-20 text-success-80 border-success-60/30",
  voided: "bg-danger-20 text-danger-80 border-danger-60/30 line-through",
};

/* ---------- component ---------- */

export function PaymentCard({ payment }: { payment: Payment }) {
  const MethodIcon = METHOD_ICONS[payment.method];
  const isReceipt = payment.paymentType === "receipt";

  return (
    <div className={cn(
      "flex items-center gap-3 rounded-lg border border-onyx-20 bg-white px-3 py-2.5",
      payment.status === "voided" && "opacity-60",
    )}>
      {/* Direction icon */}
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
        isReceipt ? "bg-success-20 text-success-80" : "bg-sapphire-10 text-sapphire-60",
      )}>
        {isReceipt ? (
          <ArrowDownToLine className="h-4 w-4" />
        ) : (
          <ArrowUpFromLine className="h-4 w-4" />
        )}
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium text-onyx-90">
            {payment.memo ?? `${isReceipt ? "Receipt" : "Disbursement"} — ${payment.partyName}`}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-onyx-50">
          <span className="flex items-center gap-1">
            <MethodIcon className="h-3 w-3" />
            {METHOD_LABELS[payment.method]}
          </span>
          {payment.bankName && (
            <>
              <span>&middot;</span>
              <span>{payment.bankName} {payment.maskedAccount}</span>
            </>
          )}
          {payment.instrumentNumber && (
            <>
              <span>&middot;</span>
              <span>#{payment.instrumentNumber}</span>
            </>
          )}
        </div>
      </div>

      {/* Amount + status */}
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold tabular-nums text-onyx-90">
          {formatCurrency(payment.amountCents)}
        </p>
        <Badge
          size="sm"
          variant="glass"
          className={cn("mt-0.5 border", STATUS_STYLES[payment.status])}
        >
          {PAYMENT_STATUS_LABELS[payment.status]}
        </Badge>
      </div>
    </div>
  );
}
