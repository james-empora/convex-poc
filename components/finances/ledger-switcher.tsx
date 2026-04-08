"use client";

import { useAtom } from "jotai";
import { ChevronDown, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { activeLedgerIdAtom } from "@/app/(admin)/portfolio/_lib/finances";
import type { LedgerListItem } from "@/types/finance";
import { useState, useRef, useEffect } from "react";

export function LedgerSwitcher({
  ledgers,
}: {
  ledgers: LedgerListItem[];
}) {
  const [activeLedgerId, setActiveLedgerId] = useAtom(activeLedgerIdAtom);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Default to primary ledger if none selected
  const currentId = activeLedgerId ?? ledgers.find((l) => l.isPrimary)?.id ?? ledgers[0]?.id;
  const current = ledgers.find((l) => l.id === currentId) ?? ledgers[0];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (ledgers.length <= 1) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md border border-onyx-20 bg-white px-2.5 py-1.5 text-xs font-medium text-onyx-70 transition-colors hover:border-onyx-30 hover:text-onyx-90"
      >
        <Database className="h-3 w-3 text-onyx-40" />
        {current?.name}
        <ChevronDown className={cn("h-3 w-3 text-onyx-40 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-20 mt-1 min-w-48 rounded-lg border border-onyx-20 bg-white py-1 shadow-lg">
          {ledgers.map((ledger) => (
            <button
              key={ledger.id}
              type="button"
              onClick={() => {
                setActiveLedgerId(ledger.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-onyx-5",
                ledger.id === currentId && "bg-sapphire-5 text-sapphire-70",
              )}
            >
              <span className="min-w-0 flex-1">
                {ledger.name}
                {ledger.isPrimary && (
                  <Badge size="sm" variant="glass" className="ml-1.5">
                    Primary
                  </Badge>
                )}
              </span>
              <span className="text-xs tabular-nums text-onyx-40">
                {ledger.totalLineItems} items
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
