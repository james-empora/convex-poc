"use client";

import { useState } from "react";
import { AlertTriangle, Link2, ExternalLink, Pencil, RefreshCw, Check, Loader2, Sparkles, Calculator, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/app/(admin)/portfolio/_components/format-utils";
import { LineItemOverrideInput } from "./line-item-override-input";
import type { LineItem, StatementSection } from "@/types/finance";

/* ---------- types ---------- */

export type LineItemMutationCallbacks = {
  onOverride?: (lineItemId: string, amountCents: number, reason: string) => Promise<void>;
  onResync?: (lineItemId: string) => Promise<void>;
  onAskAI?: (lineItemLabel: string, amountCents: number) => void;
  onEdit?: (lineItemId: string, label: string, section: string) => Promise<void>;
};

/* ---------- context card (expanded detail) ---------- */

function LineItemContextCard({
  item,
  callbacks,
}: {
  item: LineItem;
  callbacks?: LineItemMutationCallbacks;
}) {
  const [showOverride, setShowOverride] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editLabel, setEditLabel] = useState(item.labelOverride ?? item.label);
  const [editSection, setEditSection] = useState(item.section);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const hasDrift = item.manuallyAdjusted && item.computedAmountCents !== item.actualAmountCents;
  const driftCents = item.actualAmountCents - item.computedAmountCents;

  async function handleOverrideSave(amountCents: number, reason: string) {
    if (!callbacks?.onOverride) return;
    setSaving(true);
    try {
      await callbacks.onOverride(item.id, amountCents, reason);
      setShowOverride(false);
      setSuccess("Override saved");
      setTimeout(() => setSuccess(null), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSave() {
    if (!callbacks?.onEdit) return;
    setSaving(true);
    try {
      await callbacks.onEdit(item.id, editLabel.trim() || item.label, editSection);
      setShowEdit(false);
      setSuccess("Saved");
      setTimeout(() => setSuccess(null), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleResync() {
    if (!callbacks?.onResync) return;
    setSaving(true);
    try {
      await callbacks.onResync(item.id);
      setSuccess("Re-synced");
      setTimeout(() => setSuccess(null), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-t border-onyx-10 bg-onyx-5/50 px-4 py-3 text-xs">
      {/* Success toast */}
      {success && (
        <div className="mb-2 flex items-center gap-1.5 rounded-md bg-success-20 px-2.5 py-1.5 text-success-80">
          <Check className="h-3 w-3" />
          {success}
        </div>
      )}

      {/* Inline edit form */}
      {showEdit && (
        <div className="mb-3 rounded-md border border-sapphire-20 bg-sapphire-5/30 p-3">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-sapphire-60">Edit Line Item</span>
            <button type="button" onClick={() => setShowEdit(false)} className="flex h-5 w-5 items-center justify-center rounded text-onyx-40 hover:text-onyx-70">
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-2">
            <div>
              <label className="text-[11px] font-medium text-onyx-50">Label</label>
              <input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                className="mt-0.5 w-full rounded border border-onyx-20 bg-white px-2 py-1.5 text-sm text-onyx-80 focus:border-sapphire-40 focus:outline-none"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-onyx-50">Section</label>
              <select
                value={editSection}
                onChange={(e) => setEditSection(e.target.value as StatementSection)}
                className="mt-0.5 w-full rounded border border-onyx-20 bg-white px-2 py-1.5 text-sm text-onyx-80 focus:border-sapphire-40 focus:outline-none"
              >
                <option value="cd_origination_charges">A. Origination Charges</option>
                <option value="cd_services_no_shop">B. Services You Cannot Shop For</option>
                <option value="cd_services_shop">C. Services You Can Shop For</option>
                <option value="cd_taxes_and_government">D. Taxes &amp; Government Fees</option>
                <option value="cd_prepaids">E. Prepaids</option>
                <option value="cd_escrow">F. Initial Escrow at Closing</option>
                <option value="cd_other_costs">G. Other Costs</option>
                <option value="title_charges">Title Charges (HUD)</option>
                <option value="adjustments_and_prorations">Adjustments &amp; Prorations (HUD)</option>
                <option value="additional_charges">Additional Charges (HUD)</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-onyx-60" onClick={() => setShowEdit(false)}>
              Cancel
            </Button>
            <Button size="sm" className="h-6 px-2.5 text-xs" onClick={handleEditSave} disabled={saving}>
              {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Split sub-rows */}
      {item.charges.length > 1 && (
        <div className="mb-3 rounded-md border border-onyx-10 bg-white px-2.5 py-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-onyx-40">
            Split breakdown
          </span>
          <div className="mt-1 space-y-0.5">
            {item.charges.filter((c) => c.partySide !== "internal").map((charge, i, arr) => {
              const net = charge.debitCents - charge.creditCents;
              const isLast = i === arr.length - 1;
              return (
                <div key={charge.id} className="flex items-center gap-2 text-onyx-70">
                  <span className="w-3 text-onyx-30">{isLast ? "└" : "├"}</span>
                  <span className="min-w-0 flex-1 truncate">{charge.partyName}</span>
                  <span className="tabular-nums">
                    {net > 0 ? formatCurrency(net) : net < 0 ? `(${formatCurrency(Math.abs(net))})` : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Proration detail */}
      {item.prorationDetail && (
        <div className="mb-3 rounded-md border border-onyx-10 bg-white px-2.5 py-2">
          <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-onyx-40">
            <Calculator className="h-3 w-3" />
            Proration calculation
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5">
            <span className="text-onyx-50">Strategy</span>
            <span className="text-onyx-80">{item.prorationDetail.strategy}-day year</span>
            <span className="text-onyx-50">Period</span>
            <span className="text-onyx-80">{item.prorationDetail.periodStart} – {item.prorationDetail.periodEnd}</span>
            <span className="text-onyx-50">Annual amount</span>
            <span className="tabular-nums text-onyx-80">{formatCurrency(item.prorationDetail.annualAmountCents)}</span>
            <span className="text-onyx-50">Per diem</span>
            <span className="tabular-nums text-onyx-80">{formatCurrency(item.prorationDetail.perDiemCents)}/day</span>
            <span className="text-onyx-50">Days</span>
            <span className="tabular-nums text-onyx-80">{item.prorationDetail.days} days</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Left: calculation + resource */}
        <div className="space-y-2">
          {item.resourceType && (
            <div>
              <span className="font-medium text-onyx-60">Linked resource</span>
              <p className="mt-0.5 flex items-center gap-1 text-onyx-80">
                <Link2 className="h-3 w-3 text-onyx-40" />
                {item.resourceLabel}
                <ExternalLink className="h-2.5 w-2.5 text-onyx-40" />
              </p>
            </div>
          )}

          {hasDrift && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2">
              <div className="flex items-center gap-1 font-medium text-amber-700">
                <AlertTriangle className="h-3 w-3" />
                Amount drift
              </div>
              <p className="mt-0.5 text-amber-600">
                System computed {formatCurrency(item.computedAmountCents)},
                manually set to {formatCurrency(item.actualAmountCents)}.
                Difference: {driftCents > 0 ? "+" : ""}{formatCurrency(driftCents)}.
              </p>
            </div>
          )}

          {/* Override input */}
          {showOverride && (
            <LineItemOverrideInput
              currentCents={item.actualAmountCents}
              onSave={handleOverrideSave}
              onCancel={() => setShowOverride(false)}
            />
          )}
        </div>

        {/* Right: charge breakdown */}
        <div>
          <span className="font-medium text-onyx-60">Charge breakdown</span>
          <div className="mt-1 space-y-0.5">
            {item.charges.map((charge) => {
              const net = charge.debitCents - charge.creditCents;
              return (
                <div key={charge.id} className="flex items-center justify-between text-onyx-80">
                  <span className="truncate">{charge.partyName}</span>
                  <span className={cn("tabular-nums", net > 0 ? "text-danger-80" : "text-success-80")}>
                    {net > 0 ? "" : "("}
                    {formatCurrency(Math.abs(net))}
                    {net > 0 ? "" : ")"}
                  </span>
                </div>
              );
            })}
          </div>

          {item.adjustedByName && (
            <div className="mt-2 border-t border-onyx-10 pt-2">
              <span className="font-medium text-onyx-60">Last override</span>
              <p className="text-onyx-80">
                {item.adjustedByName}
                {item.adjustmentReason && ` — "${item.adjustmentReason}"`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2 border-t border-onyx-10 pt-3">
        {saving && <Loader2 className="h-3 w-3 animate-spin text-sapphire-50" />}
        {!showOverride && !showEdit && !saving && callbacks?.onEdit && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 gap-1 px-2 text-xs"
            onClick={() => setShowEdit(true)}
          >
            <Pencil className="h-3 w-3" />
            Edit
          </Button>
        )}
        {!showOverride && !showEdit && !saving && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 gap-1 px-2 text-xs"
            onClick={() => setShowOverride(true)}
          >
            Override Amount
          </Button>
        )}
        {hasDrift && !saving && !showEdit && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 gap-1 px-2 text-xs"
            onClick={handleResync}
          >
            <RefreshCw className="h-3 w-3" />
            Re-sync to {formatCurrency(item.computedAmountCents)}
          </Button>
        )}
        {callbacks?.onAskAI && !saving && !showEdit && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 gap-1 px-2 text-xs text-sapphire-60 border-sapphire-20 hover:bg-sapphire-5"
            onClick={() => callbacks.onAskAI!(item.label, item.actualAmountCents)}
          >
            <Sparkles className="h-3 w-3" />
            Ask AI
          </Button>
        )}
      </div>
    </div>
  );
}

/* ---------- component ---------- */

export function LineItemRow({
  item,
  buyerNetCents,
  sellerNetCents,
  hasProposal,
  isHighlighted,
  onClickLineItem,
  callbacks,
}: {
  item: LineItem;
  buyerNetCents: number;
  sellerNetCents: number;
  hasProposal?: boolean;
  isHighlighted?: boolean;
  onClickLineItem?: (lineItemId: string) => void;
  callbacks?: LineItemMutationCallbacks;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasDrift = item.manuallyAdjusted && item.computedAmountCents !== item.actualAmountCents;

  return (
    <div id={`li-${item.id}`}>
      <button
        type="button"
        onClick={() => {
          setExpanded(!expanded);
          onClickLineItem?.(item.id);
        }}
        className={cn(
          "group flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-all hover:bg-onyx-5",
          hasProposal && "border-l-2 border-l-sapphire-60",
          !item.verified && "bg-amber-50/40",
          isHighlighted && "bg-sapphire-5 ring-1 ring-inset ring-sapphire-30",
        )}
      >
        {/* Label */}
        <span className={cn(
          "min-w-0 flex-1 truncate text-onyx-80 group-hover:text-onyx-100",
          item.labelOverride && "italic",
        )}>
          {item.labelOverride ?? item.label}
        </span>

        {/* Edit hint on hover */}
        <Pencil className="h-3 w-3 shrink-0 text-onyx-30 opacity-0 transition-opacity group-hover:opacity-100" />

        {/* Badges */}
        {item.paidOutsideOfClosing && (
          <Badge size="sm" variant="glass" className="shrink-0 border-onyx-30 text-onyx-60">
            POC
          </Badge>
        )}
        {hasDrift && (
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
        )}

        {/* Buyer column */}
        <span className="w-24 shrink-0 text-right tabular-nums text-onyx-80">
          {buyerNetCents !== 0 ? (
            buyerNetCents > 0
              ? formatCurrency(buyerNetCents)
              : `(${formatCurrency(Math.abs(buyerNetCents))})`
          ) : (
            <span className="text-onyx-30">&mdash;</span>
          )}
        </span>

        {/* Seller column */}
        <span className="w-24 shrink-0 text-right tabular-nums text-onyx-80">
          {sellerNetCents !== 0 ? (
            sellerNetCents > 0
              ? formatCurrency(sellerNetCents)
              : `(${formatCurrency(Math.abs(sellerNetCents))})`
          ) : (
            <span className="text-onyx-30">&mdash;</span>
          )}
        </span>
      </button>

      {expanded && <LineItemContextCard item={item} callbacks={callbacks} />}
    </div>
  );
}
