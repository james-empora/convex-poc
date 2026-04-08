"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/portal/fake-data";
import type { LedgerData } from "@/lib/portal/fake-data";

interface LedgerSummaryProps {
  data: LedgerData;
}

export function LedgerSummary({ data }: LedgerSummaryProps) {
  const totalCents = data.categories.reduce(
    (sum, cat) => sum + cat.items.reduce((s, item) => s + item.amountCents, 0),
    0,
  );

  const hasEstimates = data.categories.some((cat) =>
    cat.items.some((item) => item.status === "estimated"),
  );

  return (
    <Card>
      <CardContent>
        <p className="text-sm text-onyx-50">Estimated Cash to Close</p>
        <p className="mt-1 font-heading text-3xl font-bold text-onyx-100">
          {formatCurrency(totalCents)}
        </p>
        {hasEstimates && (
          <p className="mt-2 text-sm text-onyx-40">
            Some figures are estimates and may change before closing.
            As of {formatDate(data.asOfDate)}.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
