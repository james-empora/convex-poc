"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  Calendar,
  DollarSign,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { fetchSnapshotAction } from "@/lib/legacy-import/fetch-snapshot.server";
import { useRefreshLegacyImport } from "@/lib/legacy-import/queries";
import type { DealImportRecord } from "@/lib/legacy-import/types";

export function SelectedImportPanel({ deal }: { deal: DealImportRecord | null }) {
  const [refreshing, setRefreshing] = useState(false);
  const refreshImport = useRefreshLegacyImport();

  const handleRefresh = useCallback(async () => {
    if (!deal) return;
    setRefreshing(true);
    try {
      const result = await fetchSnapshotAction(deal.railsDealId);
      if ("data" in result) {
        await refreshImport.mutateAsync({
          railsDealId: deal.railsDealId,
          snapshot: result.data,
        });
      }
    } finally {
      setRefreshing(false);
    }
  }, [deal, refreshImport]);

  if (!deal) {
    return (
      <div className="flex min-h-[120px] shrink-0 items-center justify-center border-b border-onyx-20 bg-onyx-5 px-4 py-5">
        <div className="flex flex-col items-center gap-1 text-center">
          <MapPin className="h-5 w-5 text-onyx-30" />
          <p className="text-sm font-medium text-onyx-40">No file selected</p>
          <p className="text-xs text-onyx-30">Select a file from the list below</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[120px] shrink-0 border-b border-onyx-20 bg-gradient-to-br from-sapphire-10/30 to-sapphire-10 px-4 py-4">
      <p className="truncate font-display text-2xl font-normal leading-tight text-onyx-100">
        {deal.propertyAddress}
      </p>
      <p className="mt-0.5 truncate text-sm text-onyx-80">{deal.state}</p>

      <div className="mt-3 flex items-center gap-4 text-xs text-onyx-80">
        <span className="flex items-center gap-1">
          <FileText className="h-3.5 w-3.5" />
          <span className="font-mono">{deal.fileNumber || "No file #"}</span>
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(deal.importedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-onyx-80">
        {deal.financeStats && (
          <span className="flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 shrink-0" />
            <span>
              {deal.financeStats.lineItemCount} items · {deal.financeStats.paymentCount} payments
            </span>
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            disabled={refreshing || refreshImport.isPending}
            onClick={() => void handleRefresh()}
            className="flex cursor-pointer items-center gap-1 font-medium text-onyx-60 transition-colors disabled:opacity-50"
          >
            {refreshing || refreshImport.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            {refreshing || refreshImport.isPending ? "Refreshing" : "Refresh"}
          </button>
          <Link
            href={`/portfolio/${deal.fileId}`}
            className="flex items-center gap-0.5 font-medium text-sapphire-60 hover:underline"
          >
            Open File <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
