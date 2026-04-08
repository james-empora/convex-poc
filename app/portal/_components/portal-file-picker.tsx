"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Calendar, ChevronRight, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { PortalFile } from "@/lib/portal/fake-data";
import { formatCurrency, formatDate, formatStatus } from "@/lib/portal/fake-data";

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-sapphire-10/80 text-sapphire-70 border-sapphire-30/50",
  in_progress: "bg-amethyst-10/80 text-amethyst-70 border-amethyst-30/50",
  clear_to_close: "bg-success-20/80 text-success-80 border-success-80/20",
  closed: "bg-onyx-10/80 text-onyx-60 border-onyx-30/50",
  funded: "bg-success-20/80 text-success-80 border-success-80/20",
  recorded: "bg-onyx-10/80 text-onyx-60 border-onyx-30/50",
  cancelled: "bg-danger-20/80 text-danger-80 border-danger-80/20",
};

interface PortalFilePickerProps {
  files: PortalFile[];
}

export function PortalFilePicker({ files }: PortalFilePickerProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const availableStatuses = useMemo(() => {
    const statuses = [...new Set(files.map((f) => f.status))];
    return statuses.sort();
  }, [files]);

  const filtered = useMemo(() => {
    let result = files;

    if (statusFilter !== "all") {
      result = result.filter((f) => f.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.address.street.toLowerCase().includes(q) ||
          f.address.city.toLowerCase().includes(q) ||
          f.fileNumber.toLowerCase().includes(q),
      );
    }

    return result;
  }, [files, search, statusFilter]);

  return (
    <div className="space-y-3">
      {/* Search + status filter row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-onyx-40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="h-10 w-full rounded-lg border border-input bg-white pl-9 pr-3 text-sm text-onyx-100 placeholder:text-onyx-40 focus:border-sapphire-40 focus:outline-none focus:ring-1 focus:ring-sapphire-40/30"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] shrink-0 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {availableStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {formatStatus(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* File list */}
      <div className="space-y-2">
        {filtered.map((file) => (
          <Link key={file.id} href={`/portal/file/${file.id}`} className="block">
            <Card className="py-3 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="px-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate font-heading text-base font-semibold text-onyx-100">
                        {file.address.street}
                      </h2>
                      <Badge
                        variant="glass"
                        size="sm"
                        className={cn("shrink-0", STATUS_BADGE[file.status])}
                      >
                        {formatStatus(file.status)}
                      </Badge>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-onyx-50">
                      <span>
                        {file.address.city}, {file.address.state}
                      </span>
                      <span className="text-onyx-20">&middot;</span>
                      <span>
                        {file.fileType === "purchase" ? "Purchase" : "Refinance"}
                      </span>
                      {(file.purchasePriceCents || file.loanAmountCents) && (
                        <>
                          <span className="text-onyx-20">&middot;</span>
                          <span className="font-medium text-onyx-60">
                            {formatCurrency(
                              (file.fileType === "purchase"
                                ? file.purchasePriceCents
                                : file.loanAmountCents) ?? 0,
                            )}
                          </span>
                        </>
                      )}
                      {file.closingDate && (
                        <>
                          <span className="text-onyx-20">&middot;</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(file.closingDate)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-onyx-30" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-lg border border-onyx-20 bg-white px-4 py-6 text-center">
            <p className="text-sm text-onyx-50">No files match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
