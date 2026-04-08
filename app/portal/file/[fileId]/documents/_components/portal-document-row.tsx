"use client";

import { FileText, Image as ImageIcon, FileSpreadsheet, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PortalDocument } from "@/lib/portal/fake-data";
import { formatFileSize, formatRelativeDate } from "@/lib/portal/fake-data";

const FILE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  png: ImageIcon,
  jpg: ImageIcon,
  docx: FileText,
  xlsx: FileSpreadsheet,
};

const ICON_COLORS: Record<string, string> = {
  pdf: "bg-sapphire-10 text-sapphire-60",
  png: "bg-amethyst-10 text-amethyst-60",
  jpg: "bg-amethyst-10 text-amethyst-60",
  docx: "bg-sapphire-10 text-sapphire-60",
  xlsx: "bg-sapphire-10 text-sapphire-60",
};

interface PortalDocumentRowProps {
  document: PortalDocument;
  onView: (doc: PortalDocument) => void;
}

export function PortalDocumentRow({ document, onView }: PortalDocumentRowProps) {
  const Icon = FILE_ICONS[document.filetype] ?? FileText;
  const iconColor = ICON_COLORS[document.filetype] ?? "bg-onyx-10 text-onyx-60";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView(document)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView(document);
        }
      }}
      className="flex cursor-pointer items-center gap-3 border-b border-onyx-10 px-2 py-2.5 transition-colors hover:bg-onyx-5"
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconColor}`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate text-sm font-medium text-onyx-100">
          {document.name}
        </span>
        {document.uploadedByMe && (
          <Badge
            variant="secondary"
            size="sm"
            className="shrink-0 bg-onyx-10 text-onyx-70"
          >
            You
          </Badge>
        )}
      </div>

      <span className="hidden shrink-0 text-xs text-onyx-70 sm:inline">
        {formatFileSize(document.fileSizeBytes)}
      </span>

      <span className="hidden shrink-0 text-xs text-onyx-70 md:inline">
        {formatRelativeDate(document.createdAt)}
      </span>

      <Button
        variant="ghost"
        size="icon-xs"
        className="shrink-0 text-onyx-60 hover:text-onyx-90"
        onClick={(e) => {
          e.stopPropagation();
          // TODO: trigger actual download
        }}
        aria-label={`Download ${document.name}`}
      >
        <Download className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
