"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/portal/fake-data";
import type { LedgerData } from "@/lib/portal/fake-data";

interface LedgerTotalProps {
  data: LedgerData;
}

export function LedgerTotal({ data }: LedgerTotalProps) {
  const totalCents = data.categories.reduce(
    (sum, cat) => sum + cat.items.reduce((s, item) => s + item.amountCents, 0),
    0,
  );

  return (
    <Card className="border-sapphire-30 bg-sapphire-10/30">
      <CardContent className="flex items-center justify-between">
        <span className="text-base font-bold text-onyx-100">
          Cash to Close
        </span>
        <span className="font-mono text-lg font-bold tabular-nums text-onyx-100">
          {formatCurrency(totalCents)}
        </span>
      </CardContent>
    </Card>
  );
}
