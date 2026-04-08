"use client";

import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ActionMenu, type ActionMenuItem } from "./action-menu";

/* ---------- types ---------- */

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T extends Record<string, unknown>> {
  title?: string;
  description?: string;
  columns: Column<T>[];
  data: T[];
  filterPlaceholder?: string;
  filterKey?: string;
  rowKey?: string;
  toolbar?: React.ReactNode;
  actions?: (row: T) => ActionMenuItem[];
  contextMenu?: (row: T) => ActionMenuItem[];
  onRowClick?: (row: T) => void;
  pageSize?: number;  // Enable pagination with N rows per page. Omit for no pagination.
  className?: string;
  emptyMessage?: string;
}

/* ---------- helpers (outside component to avoid re-creation) ---------- */

function SortIcon({
  sortKey,
  sortDir,
  columnKey,
}: {
  sortKey: string | null;
  sortDir: "asc" | "desc";
  columnKey: string;
}) {
  if (sortKey !== columnKey) {
    return <ChevronsUpDown className="ml-1 inline h-3.5 w-3.5 text-onyx-40" />;
  }
  return sortDir === "asc" ? (
    <ChevronUp className="ml-1 inline h-3.5 w-3.5 text-sapphire-60" />
  ) : (
    <ChevronDown className="ml-1 inline h-3.5 w-3.5 text-sapphire-60" />
  );
}

function ContextRow<T extends Record<string, unknown>>({
  row,
  index,
  columns,
  hasActions,
  actions,
  contextItems,
  onRowClick,
}: {
  row: T;
  index: number;
  columns: Column<T>[];
  hasActions: boolean;
  actions?: (row: T) => ActionMenuItem[];
  contextItems: ActionMenuItem[];
  onRowClick?: (row: T) => void;
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <TableRow
          className={cn(
            "border-b border-onyx-20 transition-colors",
            index % 2 === 1 && "bg-onyx-5/40",
            onRowClick && "cursor-pointer",
            "hover:bg-sapphire-10/30"
          )}
          onClick={() => onRowClick?.(row)}
        >
          {columns.map((col) => (
            <TableCell key={col.key} className={cn("px-4 py-3", col.className)}>
              {col.render
                ? col.render(row[col.key], row)
                : String(row[col.key] ?? "")}
            </TableCell>
          ))}
          {hasActions && actions && (
            <TableCell className="w-10 px-2 py-3 text-right">
              <ActionMenu items={actions(row)} />
            </TableCell>
          )}
        </TableRow>
      </ContextMenuTrigger>
      <ContextMenuContent className="min-w-[160px]">
        {contextItems.map((item, i) => (
          <div key={`${item.label}-${i}`}>
            {item.separator && i > 0 && <ContextMenuSeparator />}
            <ContextMenuItem
              onClick={item.onClick}
              disabled={item.disabled}
              className={cn(
                "gap-2",
                item.variant === "danger" && "text-danger-80 focus:text-danger-80"
              )}
            >
              {item.icon}
              {item.label}
            </ContextMenuItem>
          </div>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}

/* ---------- component ---------- */

export function DataTable<T extends Record<string, unknown>>({
  title,
  description,
  columns,
  data,
  filterPlaceholder = "Filter...",
  filterKey,
  rowKey = "id",
  toolbar,
  actions,
  contextMenu,
  onRowClick,
  pageSize,
  className,
  emptyMessage = "No results.",
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filterValue, setFilterValue] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  function updateFilter(value: string) {
    setFilterValue(value);
    setCurrentPage(0);
  }

  function handleSort(key: string) {
    if (sortKey === key) {
      if (sortDir === "asc") {
        setSortDir("desc");
      } else {
        setSortKey(null);
        setSortDir("asc");
      }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const processedData = useMemo(() => {
    let result = [...data];

    if (filterKey && filterValue) {
      const lower = filterValue.toLowerCase();
      result = result.filter((row) =>
        String(row[filterKey] ?? "")
          .toLowerCase()
          .includes(lower)
      );
    }

    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        let cmp: number;
        if (typeof aVal === "number" && typeof bVal === "number") {
          cmp = aVal - bVal;
        } else {
          cmp = String(aVal).localeCompare(String(bVal));
        }
        return sortDir === "desc" ? -cmp : cmp;
      });
    }

    return result;
  }, [data, filterKey, filterValue, sortKey, sortDir]);

  const totalFiltered = processedData.length;
  const totalPages = pageSize ? Math.ceil(totalFiltered / pageSize) : 1;
  const safeCurrentPage = Math.min(currentPage, Math.max(0, totalPages - 1));
  const paginatedData = pageSize
    ? processedData.slice(safeCurrentPage * pageSize, (safeCurrentPage + 1) * pageSize)
    : processedData;

  const hasToolbar = title || filterKey || toolbar;
  const hasActions = !!actions;
  const getContextItems = contextMenu ?? actions;

  function renderCells(row: T) {
    return (
      <>
        {columns.map((col) => (
          <TableCell key={col.key} className={cn("px-4 py-3", col.className)}>
            {col.render
              ? col.render(row[col.key], row)
              : String(row[col.key] ?? "")}
          </TableCell>
        ))}
        {hasActions && (
          <TableCell className="w-10 px-2 py-3 text-right">
            <ActionMenu items={actions!(row)} />
          </TableCell>
        )}
      </>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 shadow-[var(--shadow-soft)]",
        className
      )}
    >
      {/* Toolbar */}
      {hasToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-onyx-20 px-5 py-4">
          <div className="min-w-0">
            {title && (
              <h3 className="font-heading text-lg font-semibold">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-onyx-60">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {filterKey && (
              <Input
                placeholder={filterPlaceholder}
                value={filterValue}
                onChange={(e) => updateFilter(e.target.value)}
                className="w-64"
              />
            )}
            {toolbar}
          </div>
        </div>
      )}

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow className="border-b border-onyx-20 bg-onyx-5 hover:bg-onyx-5">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={cn(
                  "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-onyx-60",
                  col.sortable && "cursor-pointer select-none hover:text-onyx-80",
                  col.className
                )}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                {col.header}
                {col.sortable && <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey={col.key} />}
              </TableHead>
            ))}
            {hasActions && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (hasActions ? 1 : 0)}
                className="py-12 text-center text-onyx-50"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : getContextItems ? (
            paginatedData.map((row, i) => (
              <ContextRow
                key={String(row[rowKey] ?? i)}
                row={row}
                index={i}
                columns={columns}
                hasActions={hasActions}
                actions={actions}
                contextItems={getContextItems(row)}
                onRowClick={onRowClick}
              />
            ))
          ) : (
            paginatedData.map((row, i) => (
              <TableRow
                key={String(row[rowKey] ?? i)}
                className={cn(
                  "border-b border-onyx-20 transition-colors",
                  i % 2 === 1 && "bg-onyx-5/40",
                  onRowClick && "cursor-pointer",
                  "hover:bg-sapphire-10/30"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {renderCells(row)}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-onyx-20 px-5 py-3">
        <p className="text-sm text-onyx-50">
          {pageSize
            ? totalFiltered === 0
              ? "0 results"
              : `${safeCurrentPage * pageSize + 1}–${Math.min((safeCurrentPage + 1) * pageSize, totalFiltered)} of ${totalFiltered}`
            : `${totalFiltered} ${totalFiltered === 1 ? "row" : "rows"}`}
          {filterValue && ` (filtered from ${data.length})`}
        </p>
        {pageSize && totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={safeCurrentPage === 0}
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i}
                variant={i === safeCurrentPage ? "default" : "ghost"}
                size="icon-sm"
                onClick={() => setCurrentPage(i)}
                className="text-xs"
              >
                {i + 1}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={safeCurrentPage >= totalPages - 1}
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
