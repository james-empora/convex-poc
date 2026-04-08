"use client";

import { useState } from "react";
import { Calendar, FileText, Archive, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import type { FileSummary } from "@/lib/files/list-files";
import type { FileStatus, FileType } from "@/types/title-file";
import { FILE_TYPE_LABELS } from "@/types/title-file";
import { STATUS_CONFIG, TYPE_CONFIG } from "./file-constants";

/* ---------- component ---------- */

interface FileCardProps {
  file: FileSummary;
  isSelected: boolean;
  onClick: () => void;
}

export function FileCard({ file, isSelected, onClick }: FileCardProps) {
  const status = STATUS_CONFIG[file.status as FileStatus] ?? { label: file.status, className: "" };
  const type = TYPE_CONFIG[file.fileType as FileType] ?? { className: "" };

  const closingDate = file.closingDate ? new Date(file.closingDate) : null;
  const [now] = useState(() => Date.now());
  const isUrgent =
    closingDate != null &&
    file.status !== "closed" &&
    file.status !== "cancelled" &&
    closingDate.getTime() - now < 3 * 24 * 60 * 60 * 1000;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          onClick={onClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick();
            }
          }}
          className={cn(
            "group relative w-full border-l-2 px-3 py-4 text-left transition-colors",
            isSelected
              ? "border-l-sapphire-60 bg-sapphire-10/50"
              : "border-l-transparent hover:bg-onyx-10/60",
          )}
        >
          {/* Row 1: Address + badges (right-aligned) */}
          <div className="flex items-center gap-1.5">
            <p className="min-w-0 truncate text-sm font-medium text-onyx-100">
              {file.propertyAddress}
            </p>
            <div className="ml-auto flex shrink-0 items-center gap-1">
              <Badge size="sm" variant="glass" className={cn("border text-[10px]", type.className)}>
                {FILE_TYPE_LABELS[file.fileType as FileType] ?? file.fileType}
              </Badge>
              <Badge size="sm" variant="glass" className={cn("border text-[10px]", status.className)}>
                {status.label}
              </Badge>
            </div>
          </div>

          {/* Row 2: City/State */}
          {(file.city || file.state) && (
            <p className="truncate text-xs text-onyx-70">
              {[file.city, file.state].filter(Boolean).join(", ")}
            </p>
          )}

          {/* Row 3: Closing date (left) + file number (right) */}
          <div className="mt-1 flex items-center text-xs text-onyx-60">
            <span className="flex items-center gap-0.5">
              {isUrgent && (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-garnet-60" title="Closing soon" />
              )}
              <Calendar className="h-3 w-3" />
              {closingDate
                ? closingDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : "TBD"}
            </span>
            <span className="ml-auto flex items-center gap-0.5">
              <FileText className="h-3 w-3" />
              {file.fileNumber ?? "No file #"}
            </span>
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem>
          <Archive className="mr-2 h-3.5 w-3.5" />
          Archive
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          Remove
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
