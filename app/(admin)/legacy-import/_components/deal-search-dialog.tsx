"use client";

import { useCallback, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { fetchSnapshotAction } from "@/lib/legacy-import/fetch-snapshot.server";
import { useImportSnapshot } from "@/lib/legacy-import/queries";
import { railsAdminSearchAction } from "@/lib/legacy-import/search-deals.server";
import type { RailsAdminSearchResult } from "@/lib/legacy-import/types";
import { cn } from "@/lib/utils";

type ImportStepId = "snapshot" | "import_deal" | "import_finances" | "milestones";
type StepStatus = "pending" | "active" | "done" | "error";

type ImportStep = {
  id: ImportStepId;
  label: string;
  detail: string;
  status: StepStatus;
};

const INITIAL_STEPS: ImportStep[] = [
  {
    id: "snapshot",
    label: "Fetching deal snapshot",
    detail: "Pulling current deal, titleholder, document, ledger, payment, and workflow state from Rails.",
    status: "pending",
  },
  {
    id: "import_deal",
    label: "Importing file and parties",
    detail: "Creating the file, property, address, parties, and documents in Convex.",
    status: "pending",
  },
  {
    id: "import_finances",
    label: "Importing finances",
    detail: "Creating the primary ledger, line items, charges, and payments in Convex.",
    status: "pending",
  },
  {
    id: "milestones",
    label: "Saving import record",
    detail: "Persisting unmodeled data and derived milestone progress for review.",
    status: "pending",
  },
];

function StepIndicator({ status }: { status: StepStatus }) {
  switch (status) {
    case "active":
      return <Loader2 className="h-4 w-4 animate-spin text-[#3D6B98]" />;
    case "done":
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    case "error":
      return <XCircle className="h-4 w-4 text-[#E8524A]" />;
    default:
      return <span className="h-4 w-4 rounded-full border border-[#E5E2DF]" />;
  }
}

export function DealSearchDialog({
  open,
  onOpenChange,
  existingDealIds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingDealIds: string[];
}) {
  const importSnapshot = useImportSnapshot();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RailsAdminSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importSteps, setImportSteps] = useState<ImportStep[]>([]);
  const [error, setError] = useState<string | null>(null);

  const updateStep = (id: ImportStepId, status: StepStatus) => {
    setImportSteps((prev) => prev.map((step) => (step.id === id ? { ...step, status } : step)));
  };

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    const result = await railsAdminSearchAction(query.trim());
    if ("error" in result) {
      setError(result.error);
      setResults([]);
    } else {
      setResults(result.data);
    }
    setSearching(false);
  }, [query]);

  const handleImport = useCallback(
    async (deal: RailsAdminSearchResult) => {
      setImportingId(deal.railsDealId);
      setError(null);
      setImportSteps(INITIAL_STEPS.map((step) => ({ ...step })));

      try {
        updateStep("snapshot", "active");
        const snapshotResult = await fetchSnapshotAction(deal.railsDealId);
        if ("error" in snapshotResult) {
          updateStep("snapshot", "error");
          setError(snapshotResult.error);
          return;
        }
        updateStep("snapshot", "done");

        updateStep("import_deal", "active");
        updateStep("import_finances", "active");
        updateStep("milestones", "active");
        await importSnapshot.mutateAsync({
          deal,
          snapshot: snapshotResult.data,
        });
        updateStep("import_deal", "done");
        updateStep("import_finances", "done");
        updateStep("milestones", "done");

        await new Promise((resolve) => setTimeout(resolve, 600));
        onOpenChange(false);
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Import failed";
        updateStep("import_deal", "error");
        updateStep("import_finances", "error");
        updateStep("milestones", "error");
        setError(message);
      } finally {
        setImportingId(null);
      }
    },
    [importSnapshot, onOpenChange],
  );

  const isAlreadyImported = (dealId: string) => existingDealIds.includes(dealId);
  const isImporting = !!importingId;

  return (
    <Dialog open={open} onOpenChange={isImporting ? undefined : onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Deal from Rails</DialogTitle>
        </DialogHeader>

        {isImporting && importSteps.length > 0 ? (
          <div className="space-y-3 py-2">
            <p className="text-sm font-medium text-[#1A1916]">Importing deal...</p>
            <div className="space-y-2">
              {importSteps.map((step) => (
                <div key={step.id} className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    <StepIndicator status={step.status} />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-sm",
                        step.status === "active" && "font-medium text-[#1A1916]",
                        step.status === "done" && "text-[#8C8986]",
                        step.status === "pending" && "text-[#B5B2AF]",
                        step.status === "error" && "font-medium text-[#E8524A]",
                      )}
                    >
                      {step.label}
                    </p>
                    {step.status === "active" && (
                      <p className="mt-0.5 text-xs text-[#8C8986]">{step.detail}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {error && <p className="text-sm text-[#E8524A]">{error}</p>}
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <Input
                placeholder="Search by file number, address, or party name..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleSearch();
                  }
                }}
              />
              <Button onClick={() => void handleSearch()} disabled={searching}>
                {searching && <Loader2 className="h-4 w-4 animate-spin" />}
                {searching ? "Searching..." : "Search"}
              </Button>
            </div>

            {error && <p className="text-sm text-[#E8524A]">{error}</p>}

            <div className="max-h-80 space-y-2 overflow-y-auto">
              {results.map((deal) => (
                <div
                  key={deal.railsDealId}
                  className="flex items-center justify-between rounded-md border border-[#E5E2DF] p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#1A1916]">{deal.fileNumber}</span>
                      <Badge variant="outline" className="text-xs">
                        {deal.dealStatus}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[#8C8986]">
                      {deal.propertyAddress}, {deal.city}, {deal.state}
                    </p>
                    {deal.partiesSummary && (
                      <p className="mt-0.5 truncate text-xs text-[#8C8986]">{deal.partiesSummary}</p>
                    )}
                  </div>
                  <div className="ml-3 flex-shrink-0">
                    {isAlreadyImported(deal.railsDealId) ? (
                      <Badge variant="secondary" className="text-xs">
                        Imported
                      </Badge>
                    ) : (
                      <Button size="sm" onClick={() => void handleImport(deal)}>
                        Import
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {results.length === 0 && !searching && query && (
                <p className="py-8 text-center text-sm text-[#8C8986]">No deals found</p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
