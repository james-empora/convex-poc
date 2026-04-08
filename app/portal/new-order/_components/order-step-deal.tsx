"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DealData {
  transactionType: "purchase" | "refinance" | "";
  price: string;
  closingDate: string;
}

interface OrderStepDealProps {
  data: DealData;
  onChange: (data: DealData) => void;
  onNext: () => void;
  onBack: () => void;
}

const TYPE_OPTIONS = [
  { value: "purchase" as const, label: "Purchase", description: "Buying a property" },
  { value: "refinance" as const, label: "Refinance", description: "Refinancing an existing loan" },
];

export function OrderStepDeal({ data, onChange, onNext, onBack }: OrderStepDealProps) {
  function update(field: keyof DealData, value: string) {
    onChange({ ...data, [field]: value });
  }

  const priceLabel =
    data.transactionType === "refinance" ? "Loan Amount" : "Purchase Price";
  const valid = data.transactionType && data.price;

  return (
    <div className="space-y-4">
      {/* Transaction type */}
      <div className="space-y-2">
        <Label>Transaction Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update("transactionType", opt.value)}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors",
                data.transactionType === opt.value
                  ? "border-sapphire-40 bg-sapphire-10/50 ring-1 ring-sapphire-40/30"
                  : "border-onyx-20 bg-white hover:border-onyx-30",
              )}
            >
              <p className="text-sm font-medium text-onyx-100">{opt.label}</p>
              <p className="mt-0.5 text-xs text-onyx-50">{opt.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="space-y-2">
        <Label htmlFor="price">{priceLabel}</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-onyx-50">
            $
          </span>
          <Input
            id="price"
            value={data.price}
            onChange={(e) => update("price", e.target.value)}
            placeholder="425,000"
            className="pl-7"
            inputMode="numeric"
          />
        </div>
      </div>

      {/* Closing date */}
      <div className="space-y-2">
        <Label htmlFor="closing-date">Target Closing Date</Label>
        <Input
          id="closing-date"
          type="date"
          value={data.closingDate}
          onChange={(e) => update("closingDate", e.target.value)}
        />
        <p className="text-xs text-onyx-40">
          Optional — we&apos;ll work with you on timing
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={onNext} disabled={!valid} className="flex-1">
          Next: Parties
        </Button>
      </div>
    </div>
  );
}
