"use client";

import { useState } from "react";
import { Check, SkipForward, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/app/(admin)/portfolio/_components/format-utils";
import type { ProposalItem } from "@/types/finance";

export function ProposalItemCard({
  item,
  onApply,
  onSkip,
}: {
  item: ProposalItem;
  onApply: (itemId: string, overrideAmountCents?: number) => void;
  onSkip: (itemId: string) => void;
}) {
  const [showOverride, setShowOverride] = useState(false);
  const [overrideAmount, setOverrideAmount] = useState("");
  const isUpdate = item.action === "update";
  const isCreate = item.action === "create";

  return (
    <div className="rounded-lg border border-onyx-20 bg-white px-3 py-2.5">
      {/* Header */}
      <p className="text-sm font-medium text-onyx-90">{item.lineItemLabel}</p>

      {/* Values */}
      <div className="mt-1.5 space-y-0.5 text-xs">
        {isUpdate && item.oldAmountCents !== null && (
          <div className="flex items-center gap-2">
            <span className="w-16 text-onyx-50">Current:</span>
            <span className="tabular-nums text-onyx-70">
              {formatCurrency(item.oldAmountCents)}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="w-16 text-onyx-50">
            {isCreate ? "Amount:" : "Proposed:"}
          </span>
          <span className="font-medium tabular-nums text-onyx-90">
            {formatCurrency(item.newAmountCents)}
          </span>
        </div>
      </div>

      {/* Override input */}
      {showOverride && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-xs text-onyx-50">$</span>
          <Input
            type="text"
            inputMode="decimal"
            value={overrideAmount}
            onChange={(e) => setOverrideAmount(e.target.value)}
            placeholder={(item.newAmountCents / 100).toFixed(2)}
            className="h-6 w-24 font-mono text-xs"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const cents = Math.round(parseFloat(overrideAmount) * 100);
                if (!isNaN(cents)) onApply(item.id, cents);
              }
              if (e.key === "Escape") setShowOverride(false);
            }}
          />
          <Button
            size="sm"
            variant="default"
            className="h-6 px-2 text-xs"
            onClick={() => {
              const cents = Math.round(parseFloat(overrideAmount) * 100);
              if (!isNaN(cents)) onApply(item.id, cents);
            }}
          >
            Set
          </Button>
        </div>
      )}

      {/* Actions */}
      <div className="mt-2 flex items-center gap-1.5">
        <Button
          size="sm"
          variant="default"
          className="h-6 gap-1 px-2 text-xs"
          onClick={() => onApply(item.id)}
        >
          <Check className="h-3 w-3" />
          Apply
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 gap-1 px-2 text-xs text-onyx-50"
          onClick={() => onSkip(item.id)}
        >
          <SkipForward className="h-3 w-3" />
          Skip
        </Button>
        {!showOverride && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 gap-1 px-2 text-xs text-onyx-50"
            onClick={() => setShowOverride(true)}
          >
            <Pencil className="h-3 w-3" />
            Override
          </Button>
        )}
      </div>
    </div>
  );
}
