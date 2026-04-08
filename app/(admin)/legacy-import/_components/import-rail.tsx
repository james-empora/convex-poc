"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { ChevronDown, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeleteLegacyImport } from "@/lib/legacy-import/queries";
import type { DealImportRecord } from "@/lib/legacy-import/types";
import { selectedDealIdAtom } from "../_lib/atoms";
import { DealSearchDialog } from "./deal-search-dialog";
import { ImportCard } from "./import-card";
import { SelectedImportPanel } from "./selected-import-panel";

export function ImportRail({
  imports,
  isLoading,
}: {
  imports: DealImportRecord[];
  isLoading: boolean;
}) {
  const selectedId = useAtomValue(selectedDealIdAtom);
  const setSelectedId = useSetAtom(selectedDealIdAtom);
  const deleteImport = useDeleteLegacyImport();

  const [searchOpen, setSearchOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const selectedImport = imports.find((item) => item.railsDealId === selectedId) ?? null;

  const checkScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    setCanScrollDown(element.scrollHeight - element.scrollTop - element.clientHeight > 8);
  }, []);

  useEffect(() => {
    checkScroll();
    const element = scrollRef.current;
    if (!element) return;
    element.addEventListener("scroll", checkScroll, { passive: true });
    return () => element.removeEventListener("scroll", checkScroll);
  }, [checkScroll, imports.length]);

  const filteredImports = useMemo(() => {
    if (!filter) return imports;
    const normalized = filter.toLowerCase();
    return imports.filter(
      (item) =>
        item.fileNumber.toLowerCase().includes(normalized) ||
        item.propertyAddress.toLowerCase().includes(normalized),
    );
  }, [filter, imports]);

  return (
    <>
      <div className="flex h-9 shrink-0 items-center border-b border-onyx-20 bg-onyx-10 px-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-onyx-70">
          Legacy Import
        </h2>
        <span className="ml-1 text-xs tabular-nums text-onyx-60">{imports.length}</span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-6 w-6 p-0 hover:bg-transparent"
          onClick={() => setSearchOpen(true)}
          title="Import New File"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <SelectedImportPanel deal={selectedImport} />

      <div className="shrink-0 border-b border-onyx-20 px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-onyx-50" />
          <Input
            placeholder="Filter by file # or address..."
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center px-4 py-12 text-sm text-onyx-60">
            Loading imports...
          </div>
        ) : filteredImports.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
            <p className="text-sm text-onyx-60">
              {imports.length === 0 ? "No files imported yet" : "No files match your filter"}
            </p>
            {imports.length === 0 && (
              <Button variant="outline" size="sm" onClick={() => setSearchOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Import Your First File
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-onyx-10">
            {filteredImports.map((deal) => (
              <ImportCard
                key={deal.railsDealId}
                deal={deal}
                isSelected={selectedId === deal.railsDealId}
                onClick={() => setSelectedId(deal.railsDealId)}
                onDelete={() => void deleteImport.mutateAsync({ railsDealId: deal.railsDealId })}
              />
            ))}
          </div>
        )}

        {canScrollDown && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-white pb-1 pt-6">
            <ChevronDown className="h-4 w-4 animate-bounce text-onyx-40" />
          </div>
        )}
      </div>

      <DealSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        existingDealIds={imports.map((item) => item.railsDealId)}
      />
    </>
  );
}
