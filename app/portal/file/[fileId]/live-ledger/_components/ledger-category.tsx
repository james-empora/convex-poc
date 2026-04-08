"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/portal/fake-data";
import { LedgerLineItemRow } from "./ledger-line-item";
import type { LedgerCategory as LedgerCategoryType } from "@/lib/portal/fake-data";

interface LedgerCategorySectionProps {
  category: LedgerCategoryType;
}

export function LedgerCategorySection({
  category,
}: LedgerCategorySectionProps) {
  const subtotalCents = category.items.reduce(
    (sum, item) => sum + item.amountCents,
    0,
  );
  const isCredit = subtotalCents < 0;

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-onyx-40">
        {category.label}
      </h2>
      <Card size="sm">
        <CardContent className="px-2 py-1">
          <div className="divide-y divide-onyx-10">
            {category.items.map((item) => (
              <LedgerLineItemRow key={item.id} item={item} />
            ))}
          </div>
          {/* Subtotal */}
          <div className="mt-1 flex items-center border-t border-onyx-20 px-2 py-2">
            <span className="flex-1 text-sm font-semibold text-onyx-60">
              Subtotal
            </span>
            <span
              className={cn(
                "font-mono text-sm font-semibold tabular-nums",
                isCredit ? "text-success-80" : "text-onyx-100",
              )}
            >
              {isCredit ? "-" : ""}
              {formatCurrency(Math.abs(subtotalCents))}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
