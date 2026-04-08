"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { STATUS_CONFIG, TYPE_CONFIG } from "@/app/(admin)/portfolio/_components/file-constants";
import { FILE_TYPE_LABELS } from "@/types/title-file";
import type { FileStatus, FileType } from "@/types/title-file";
import type { FileDetail } from "@/lib/files/get-file";
import type { DocumentDetail } from "@/lib/documents/get-document";
import { Calendar, FileText, Loader2 } from "lucide-react";

/* ---------- helpers ---------- */

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  pdf: "PDF",
  docx: "DOCX",
  xlsx: "XLSX",
  image: "Image",
  png: "PNG",
  jpg: "JPG",
  tiff: "TIFF",
  other: "File",
};

/* ---------- file hover preview ---------- */

interface FileHoverPreviewProps {
  file: FileDetail | null;
  resourceId: string;
  isLoading?: boolean;
}

export function FileHoverPreview({ file, resourceId, isLoading }: FileHoverPreviewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="size-4 animate-spin text-onyx-40" />
      </div>
    );
  }

  if (!file) {
    return (
      <div className="flex flex-col items-center gap-1.5 py-3 text-center">
        <FileText className="size-5 text-onyx-20" />
        <span className="text-xs font-medium text-onyx-50">File not found</span>
        <span className="font-mono text-[10px] text-onyx-30">{resourceId}</span>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[file.status as FileStatus] ?? { label: file.status, className: "" };
  const typeCfg = TYPE_CONFIG[file.fileType as FileType] ?? { className: "" };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Row 1: Address */}
      <p className="truncate font-display text-base font-semibold text-onyx-100">
        {file.propertyAddress}
      </p>

      {/* Row 2: City/State + type/status badges */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-onyx-60">
          {file.city}, {file.state}
        </span>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <Badge size="sm" variant="glass" className={cn("border text-[10px]", typeCfg.className)}>
            {FILE_TYPE_LABELS[file.fileType as FileType] ?? file.fileType}
          </Badge>
          <Badge size="sm" variant="glass" className={cn("border text-[10px]", statusCfg.className)}>
            {statusCfg.label}
          </Badge>
        </div>
      </div>

      {/* Divider + metadata row */}
      <div className="mt-1 flex items-center gap-2 border-t border-onyx-10 pt-3 text-xs text-onyx-50">
        {file.closingDate && (
          <span className="flex items-center gap-1">
            <Calendar className="size-3 text-onyx-40" />
            {formatShortDate(file.closingDate)}
          </span>
        )}
        {file.fileNumber && (
          <span className="ml-auto flex items-center gap-1 font-mono text-[11px] text-onyx-40">
            <FileText className="size-3" />
            {file.fileNumber}
          </span>
        )}
      </div>
    </div>
  );
}

/* ---------- document hover preview ---------- */

interface DocHoverPreviewProps {
  doc: DocumentDetail | null;
  resourceId: string;
  isLoading?: boolean;
}

export function DocHoverPreview({ doc, resourceId, isLoading }: DocHoverPreviewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="size-4 animate-spin text-onyx-40" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex flex-col items-center gap-1.5 py-3 text-center">
        <FileText className="size-5 text-onyx-20" />
        <span className="text-xs font-medium text-onyx-50">Document not found</span>
        <span className="font-mono text-[10px] text-onyx-30">{resourceId}</span>
      </div>
    );
  }

  const filetype = doc.filetype ?? "other";

  return (
    <div className="flex flex-col gap-2.5">
      {/* Row 1: Doc icon + name */}
      <div className="flex items-start gap-2">
        <FileText className="mt-0.5 size-4 shrink-0 text-onyx-40" />
        <p className="min-w-0 truncate text-sm font-medium text-onyx-100">
          {doc.name}
        </p>
      </div>

      {/* Divider + metadata row */}
      <div className="mt-1 flex items-center gap-2 border-t border-onyx-10 pt-3 text-xs text-onyx-50">
        <Badge size="sm" variant="glass" className="border text-[10px]">
          {DOC_TYPE_LABELS[filetype] ?? filetype.toUpperCase()}
        </Badge>
        {doc.fileSizeBytes != null && (
          <span className="text-onyx-40">{formatBytes(doc.fileSizeBytes)}</span>
        )}
        {doc.createdAt && (
          <span className="ml-auto flex items-center gap-1 text-onyx-40">
            <Calendar className="size-3" />
            {formatDate(doc.createdAt)}
          </span>
        )}
      </div>
    </div>
  );
}
