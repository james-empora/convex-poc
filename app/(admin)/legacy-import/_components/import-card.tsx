"use client";

import Link from "next/link";
import { ExternalLink, FileText, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import type { DealImportRecord } from "@/lib/legacy-import/types";

export function ImportCard({
  deal,
  isSelected,
  onClick,
  onDelete,
}: {
  deal: DealImportRecord;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          onClick={onClick}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onClick();
            }
          }}
          className={cn(
            "group relative w-full border-l-2 px-3 py-3 text-left transition-colors",
            isSelected
              ? "border-l-sapphire-60 bg-sapphire-10/50"
              : "border-l-transparent hover:bg-onyx-10/60",
          )}
        >
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-sm font-medium text-onyx-100">
              <FileText className="h-3 w-3 text-onyx-60" />
              {deal.fileNumber || "No file #"}
            </span>
            <Badge size="sm" variant="glass" className="ml-auto border text-[10px]">
              {deal.dealStatus}
            </Badge>
          </div>

          <p className="mt-0.5 truncate text-xs text-onyx-70">{deal.propertyAddress}</p>

          <div className="mt-1 flex items-center text-xs text-onyx-60">
            <span>{deal.state}</span>
            <Badge size="sm" variant="glass" className="ml-auto border text-[10px]">
              {deal.fileType}
            </Badge>
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem asChild>
          <Link href={`/portfolio/${deal.fileId}`}>
            <ExternalLink className="mr-2 h-3.5 w-3.5" />
            Open in Portfolio
          </Link>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          Remove
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
