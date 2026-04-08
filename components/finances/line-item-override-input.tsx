"use client";

import { useState, useRef, useEffect } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const REASON_SUGGESTIONS = [
  "Lender instruction",
  "Rounding",
  "Negotiated",
  "Custom",
] as const;

export function LineItemOverrideInput({
  currentCents,
  onSave,
  onCancel,
}: {
  currentCents: number;
  onSave: (amountCents: number, reason: string) => void;
  onCancel: () => void;
}) {
  const [amount, setAmount] = useState((currentCents / 100).toFixed(2));
  const [reason, setReason] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  function handleSave() {
    const cents = Math.round(parseFloat(amount) * 100);
    if (isNaN(cents) || cents < 0) return;
    onSave(cents, reason);
  }

  return (
    <div className="space-y-2 rounded-md border border-sapphire-30 bg-sapphire-5 p-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-onyx-60">$</span>
        <Input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") onCancel();
          }}
          className="h-7 w-28 font-mono text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-1">
        {REASON_SUGGESTIONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setReason(r)}
            className={`rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
              reason === r
                ? "border-sapphire-40 bg-sapphire-10 text-sapphire-70"
                : "border-onyx-20 text-onyx-50 hover:border-onyx-30"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="default"
          className="h-6 gap-1 px-2 text-xs"
          onClick={handleSave}
        >
          <Check className="h-3 w-3" />
          Save
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 gap-1 px-2 text-xs"
          onClick={onCancel}
        >
          <X className="h-3 w-3" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
