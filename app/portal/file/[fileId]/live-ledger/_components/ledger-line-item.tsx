"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/portal/fake-data";
import type { LedgerLineItem } from "@/lib/portal/fake-data";

interface LedgerLineItemRowProps {
  item: LedgerLineItem;
}

export function LedgerLineItemRow({ item }: LedgerLineItemRowProps) {
  const [expanded, setExpanded] = useState(false);
  const isCredit = item.amountCents < 0;

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-onyx-5"
      >
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-onyx-30 transition-transform",
            expanded && "rotate-180",
          )}
        />
        <span className="min-w-0 flex-1 text-sm text-onyx-80">
          {item.label}
        </span>
        {item.status === "estimated" && (
          <Badge
            variant="glass"
            size="sm"
            className="shrink-0 border border-onyx-20 text-[10px] text-onyx-50"
          >
            Est.
          </Badge>
        )}
        <span
          className={cn(
            "shrink-0 text-right font-mono text-sm font-medium tabular-nums",
            isCredit ? "text-success-80" : "text-onyx-100",
          )}
        >
          {isCredit ? "-" : ""}
          {formatCurrency(Math.abs(item.amountCents))}
        </span>
      </button>

      {expanded && (
        <div className="ml-7 mr-2 mb-1 rounded-md bg-onyx-5 px-3 py-2">
          <p className="text-sm leading-relaxed text-onyx-60">
            {item.description}
          </p>
        </div>
      )}
    </div>
  );
}
