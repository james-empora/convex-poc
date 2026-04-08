"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAtom } from "jotai";
import { Filter, ChevronDown } from "lucide-react";
import { portfolioGroupByAtom } from "@/app/(admin)/portfolio/_lib/atoms";
import type { FileSummary } from "@/lib/files/list-files";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { CollapsibleGroup, type GroupDefinition, type GroupByOption } from "@/components/composite/collapsible-group";
import { SelectedDealPanel } from "./selected-deal-panel";
import { FileCard } from "./file-card";
import { FILE_STATUS_LABELS, FILE_TYPE_LABELS } from "@/types/title-file";
import { STATUS_CONFIG } from "./file-constants";

/* ---------- group-by options ---------- */

const GROUP_BY_OPTIONS: GroupByOption[] = [
  { value: "status", label: "Status" },
  { value: "closer", label: "Closer" },
  { value: "closing_date", label: "Closing Date" },
];

/* ---------- filter options ---------- */

type FilterCategory = "status" | "fileType" | "closer";

interface FilterState {
  status: Set<string>;
  fileType: Set<string>;
  closer: Set<string>;
}

const STATUS_OPTIONS = Object.entries(FILE_STATUS_LABELS) as [string, string][];
const TYPE_OPTIONS = Object.entries(FILE_TYPE_LABELS) as [string, string][];

function applyFilters(files: FileSummary[], filters: FilterState): FileSummary[] {
  return files.filter((file) => {
    if (filters.status.size > 0 && !filters.status.has(file.status)) return false;
    if (filters.fileType.size > 0 && !filters.fileType.has(file.fileType)) return false;
    if (filters.closer.size > 0 && !(file.closerName && filters.closer.has(file.closerName))) return false;
    return true;
  });
}

/* ---------- grouping logic ---------- */

const STATUS_ORDER: string[] = [
  "new",
  "pending",
  "in_progress",
  "clear_to_close",
  "on_hold",
  "closed",
  "funded",
  "recorded",
  "cancelled",
];

function groupByStatus(files: FileSummary[]): GroupDefinition<FileSummary>[] {
  const grouped = new Map<string, FileSummary[]>();
  for (const file of files) {
    const list = grouped.get(file.status) ?? [];
    list.push(file);
    grouped.set(file.status, list);
  }
  // Show known statuses in order, then any unknown statuses at the end
  const knownGroups = STATUS_ORDER
    .filter((s) => grouped.has(s))
    .map((status) => ({
      key: status,
      label: STATUS_CONFIG[status]?.label ?? FILE_STATUS_LABELS[status as keyof typeof FILE_STATUS_LABELS] ?? status,
      items: grouped.get(status)!,
    }));
  const unknownGroups = Array.from(grouped.entries())
    .filter(([s]) => !STATUS_ORDER.includes(s))
    .map(([status, items]) => ({ key: status, label: status, items }));
  return [...knownGroups, ...unknownGroups];
}

function groupByCloser(files: FileSummary[]): GroupDefinition<FileSummary>[] {
  const grouped = new Map<string, FileSummary[]>();
  for (const file of files) {
    const key = file.closerName ?? "Unassigned";
    const list = grouped.get(key) ?? [];
    list.push(file);
    grouped.set(key, list);
  }
  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, items]) => ({
      key: name,
      label: name,
      items,
    }));
}

function groupByClosingDate(files: FileSummary[]): GroupDefinition<FileSummary>[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
  const endOfNextWeek = new Date(endOfWeek);
  endOfNextWeek.setDate(endOfWeek.getDate() + 7);

  const buckets: { key: string; label: string; items: FileSummary[] }[] = [
    { key: "no_date", label: "No Date", items: [] },
    { key: "past", label: "Past Due", items: [] },
    { key: "today", label: "Today", items: [] },
    { key: "this_week", label: "This Week", items: [] },
    { key: "next_week", label: "Next Week", items: [] },
    { key: "later", label: "Later", items: [] },
  ];

  for (const file of files) {
    if (!file.closingDate) {
      buckets[0].items.push(file);
      continue;
    }
    const closing = new Date(file.closingDate);
    if (closing < today) buckets[1].items.push(file);
    else if (closing.toDateString() === today.toDateString()) buckets[2].items.push(file);
    else if (closing < endOfWeek) buckets[3].items.push(file);
    else if (closing < endOfNextWeek) buckets[4].items.push(file);
    else buckets[5].items.push(file);
  }

  return buckets.filter((b) => b.items.length > 0);
}

function groupFiles(files: FileSummary[], groupBy: string): GroupDefinition<FileSummary>[] {
  switch (groupBy) {
    case "closer":
      return groupByCloser(files);
    case "closing_date":
      return groupByClosingDate(files);
    default:
      return groupByStatus(files);
  }
}

/* ---------- component ---------- */

export function PortfolioRail({ initialFiles }: { initialFiles: FileSummary[] }) {
  const router = useRouter();
  const { fileId: activeFileId } = useParams<{ fileId?: string }>();
  const [groupBy, setGroupBy] = useAtom(portfolioGroupByAtom);
  const [filters, setFilters] = useState<FilterState>({
    status: new Set(),
    fileType: new Set(),
    closer: new Set(),
  });

  const files = initialFiles;

  const activeFilterCount =
    filters.status.size + filters.fileType.size + filters.closer.size;

  // Derive closer options from actual data
  const closerOptions = useMemo(
    () => [...new Set(files.map((f) => f.closerName).filter(Boolean) as string[])].sort(),
    [files],
  );

  function toggleFilter(category: FilterCategory, value: string) {
    setFilters((prev) => {
      const next = new Set(prev[category]);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return { ...prev, [category]: next };
    });
  }

  const filteredFiles = useMemo(
    () => applyFilters(files, filters),
    [files, filters],
  );
  const groups = useMemo(
    () => groupFiles(filteredFiles, groupBy),
    [filteredFiles, groupBy],
  );

  // Scroll indicator
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 8);
  }

  useEffect(() => {
    handleScroll();
  }, [groups]);

  function selectFile(file: FileSummary) {
    router.push(`/portfolio/${file.id}/overview`);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Rail header */}
      <div className="flex h-9 shrink-0 items-center border-b border-onyx-20 bg-onyx-10 px-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-onyx-70">
          Portfolio
        </h2>
        <span className="ml-1 text-xs tabular-nums text-onyx-60">
          {filteredFiles.length}
        </span>

        {/* Filter dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="relative ml-auto inline-flex h-6 w-6 items-center justify-center rounded text-onyx-40 transition-colors hover:bg-onyx-10 hover:text-onyx-70"
            >
              <Filter className="h-3.5 w-3.5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-sapphire-60 px-0.5 text-[9px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
              <span className="sr-only">Filter</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            {STATUS_OPTIONS.map(([value, label]) => (
              <DropdownMenuCheckboxItem
                key={value}
                checked={filters.status.has(value)}
                onCheckedChange={() => toggleFilter("status", value)}
              >
                {label}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Type</DropdownMenuLabel>
            {TYPE_OPTIONS.map(([value, label]) => (
              <DropdownMenuCheckboxItem
                key={value}
                checked={filters.fileType.has(value)}
                onCheckedChange={() => toggleFilter("fileType", value)}
              >
                {label}
              </DropdownMenuCheckboxItem>
            ))}
            {closerOptions.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Escrow Officer</DropdownMenuLabel>
                {closerOptions.map((name) => (
                  <DropdownMenuCheckboxItem
                    key={name}
                    checked={filters.closer.has(name)}
                    onCheckedChange={() => toggleFilter("closer", name)}
                  >
                    {name}
                  </DropdownMenuCheckboxItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Selected deal summary */}
      <SelectedDealPanel />

      {/* Empty state */}
      {files.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 px-4 text-center">
          <p className="text-sm text-onyx-40">No files yet</p>
          <p className="text-xs text-onyx-30">
            Create a file via chat or the coordinator
          </p>
        </div>
      )}

      {/* Grouped file list */}
      {files.length > 0 && (
        <div className="relative flex-1 overflow-hidden">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-full overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden"
          >
            <CollapsibleGroup<FileSummary>
              groups={groups}
              renderItem={(file) => (
                <FileCard
                  file={file}
                  isSelected={file.id === activeFileId}
                  onClick={() => selectFile(file)}
                />
              )}
              keyExtractor={(file) => file.id}
              groupByOptions={GROUP_BY_OPTIONS}
              currentGroupBy={groupBy}
              onGroupByChange={setGroupBy}
            />
          </div>

          {/* Bottom fade + scroll indicator */}
          {canScrollDown && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center">
              <div className="h-10 w-full bg-gradient-to-t from-white to-transparent" />
              <div className="pointer-events-auto -mt-5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-onyx-40 shadow-[var(--shadow-soft)]">
                <ChevronDown className="h-3 w-3" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
