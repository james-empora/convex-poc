"use client";

import { useState } from "react";
import { Plus, ArrowDownToLine, ArrowUpFromLine, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PaymentCard } from "./payment-card";
import { useCreatePayment } from "@/lib/finances/queries";
import type { Payment } from "@/types/finance";

/* ---------- add payment form ---------- */

function AddPaymentForm({
  ledgerId,
  paymentType,
  onClose,
  onAdded,
}: {
  ledgerId?: string;
  paymentType: "receipt" | "disbursement";
  onClose: () => void;
  onAdded: () => void;
}) {
  const [partyName, setPartyName] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"wire" | "check" | "ach" | "internal_transfer">("wire");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createPayment = useCreatePayment(ledgerId ?? null);

  async function handleSave() {
    const cents = Math.round(parseFloat(amount) * 100);
    if (!partyName.trim() || isNaN(cents) || cents <= 0) {
      setError("Enter a party name and valid amount.");
      return;
    }
    if (!ledgerId) {
      setError("No ledger found for this file.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createPayment.mutateAsync({
        ledgerId,
        partyId: ledgerId, // TODO: replace with actual party picker
        partyName,
        paymentType,
        method,
        amountCents: cents,
        memo: memo || undefined,
      });
      onAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create payment");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-sapphire-20 bg-sapphire-5 px-3 py-2.5">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1">
          <label className="text-xs font-medium text-onyx-60">Party</label>
          <input
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
            placeholder="John Smith"
            className="mt-1 w-full rounded-md border border-onyx-20 bg-white px-2.5 py-1.5 text-sm"
            autoFocus
          />
        </div>
        <div className="w-28">
          <label className="text-xs font-medium text-onyx-60">Amount ($)</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="5,000.00"
            inputMode="decimal"
            className="mt-1 w-full rounded-md border border-onyx-20 bg-white px-2.5 py-1.5 text-sm"
          />
        </div>
        <div className="w-28">
          <label className="text-xs font-medium text-onyx-60">Method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as typeof method)}
            className="mt-1 w-full rounded-md border border-onyx-20 bg-white px-2.5 py-1.5 text-sm"
          >
            <option value="wire">Wire</option>
            <option value="check">Check</option>
            <option value="ach">ACH</option>
            <option value="internal_transfer">Transfer</option>
          </select>
        </div>
        <div className="min-w-0 flex-1">
          <label className="text-xs font-medium text-onyx-60">Memo</label>
          <input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Optional"
            className="mt-1 w-full rounded-md border border-onyx-20 bg-white px-2.5 py-1.5 text-sm"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" onClick={handleSave} disabled={saving} className="h-8">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8">
            Cancel
          </Button>
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs text-danger-80">{error}</p>}
    </div>
  );
}

/* ---------- component ---------- */

export function PaymentsPanel({
  payments,
  ledgerId,
  onPaymentAdded,
  className,
}: {
  payments: Payment[];
  ledgerId?: string;
  onPaymentAdded?: () => void;
  className?: string;
}) {
  const [view, setView] = useState<"receipts" | "disbursements">("receipts");
  const [addingPayment, setAddingPayment] = useState(false);

  const receipts = payments.filter((p) => p.paymentType === "receipt" && p.status !== "voided");
  const disbursements = payments.filter((p) => p.paymentType === "disbursement" && p.status !== "voided");
  const items = view === "receipts" ? receipts : disbursements;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg bg-onyx-10 p-0.5">
          <button
            type="button"
            onClick={() => setView("receipts")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              view === "receipts"
                ? "bg-white text-onyx-90 shadow-sm"
                : "text-onyx-60 hover:text-onyx-80",
            )}
          >
            <ArrowDownToLine className="h-3 w-3" />
            Receipts ({receipts.length})
          </button>
          <button
            type="button"
            onClick={() => setView("disbursements")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              view === "disbursements"
                ? "bg-white text-onyx-90 shadow-sm"
                : "text-onyx-60 hover:text-onyx-80",
            )}
          >
            <ArrowUpFromLine className="h-3 w-3" />
            Disbursements ({disbursements.length})
          </button>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={() => setAddingPayment(true)}
        >
          <Plus className="h-3 w-3" />
          Add {view === "receipts" ? "Receipt" : "Disbursement"}
        </Button>
      </div>

      {/* Add payment form */}
      {addingPayment && (
        <AddPaymentForm
          ledgerId={ledgerId}
          paymentType={view === "receipts" ? "receipt" : "disbursement"}
          onClose={() => setAddingPayment(false)}
          onAdded={() => {
            setAddingPayment(false);
            onPaymentAdded?.();
          }}
        />
      )}

      {/* Payment list */}
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((payment) => (
            <PaymentCard key={payment.id} payment={payment} />
          ))}
        </div>
      ) : (
        <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-onyx-20 text-sm text-onyx-40">
          No {view} yet
        </div>
      )}
    </div>
  );
}
