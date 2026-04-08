"use client";

import { useAtom, useAtomValue } from "jotai";
import { AlertTriangle, DollarSign, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DealImportRecord } from "@/lib/legacy-import/types";
import { importActiveTabAtom, selectedDealIdAtom, type ImportTab } from "../_lib/atoms";
import { DataGapPanel } from "./data-gap-panel";
import { FinanceComparison } from "./finance-comparison";

const TABS: { id: ImportTab; label: string; icon: typeof DollarSign }[] = [
  { id: "finances", label: "Finances", icon: DollarSign },
  { id: "gaps", label: "Data Gaps", icon: AlertTriangle },
];

export function ImportContentWell({
  imports,
  isLoading,
}: {
  imports: DealImportRecord[];
  isLoading: boolean;
}) {
  const selectedDealId = useAtomValue(selectedDealIdAtom);
  const [activeTab, setActiveTab] = useAtom(importActiveTabAtom);
  const deal = imports.find((item) => item.railsDealId === selectedDealId) ?? null;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-onyx-60">
        Loading import details...
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <div className="rounded-lg border border-dashed border-onyx-30 p-8">
          <Plus className="mx-auto h-8 w-8 text-onyx-40" />
          <p className="mt-3 text-sm font-medium text-onyx-70">
            Import or select a file to get started
          </p>
          <p className="mt-1 text-xs text-onyx-50">
            Use the Import button in the left panel to search Rails
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center border-b border-onyx-20 bg-white px-2">
        {TABS.map((tab) => {
          const isDisabled = tab.id === "finances" && !deal.ledgerId;
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              disabled={isDisabled}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "border-sapphire-50 text-sapphire-70"
                  : "border-transparent text-onyx-60 hover:text-onyx-90",
                isDisabled && "cursor-not-allowed opacity-40",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {activeTab === "finances" && <FinanceComparison deal={deal} />}
        {activeTab === "gaps" && <DataGapPanel deal={deal} />}
      </div>
    </div>
  );
}
