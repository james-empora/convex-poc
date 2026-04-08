"use client";

import { useState, useCallback, type ReactNode, type DragEvent } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Upload } from "lucide-react";
import { activeFileIdAtom, recentUploadsAtom } from "@/app/(admin)/portfolio/_lib/atoms";
import { api } from "@/convex/_generated/api";
import { useConvexMutationResult } from "@/lib/convex/hooks";
import { uploadDocumentClient } from "@/lib/documents/client-upload";
import type { DOCUMENT_FILETYPES } from "@/lib/validators/enums";
import type { FileDocument, DocumentType } from "@/types/title-file";

/* ---------- mappings ---------- */

type DocumentFiletype = (typeof DOCUMENT_FILETYPES)[number];

const EXT_TO_FILETYPE: Record<string, DocumentFiletype> = {
  pdf: "pdf",
  png: "png",
  jpg: "jpg",
  jpeg: "jpg",
  tiff: "tiff",
  tif: "tiff",
  docx: "docx",
  xlsx: "xlsx",
};

const EXT_TO_DISPLAY_TYPE: Record<string, DocumentType> = {
  pdf: "pdf",
  png: "image",
  jpg: "image",
  jpeg: "image",
  tiff: "image",
  tif: "image",
  docx: "docx",
  xlsx: "xlsx",
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* ---------- component ---------- */

export function DropZone({ children }: { children: ReactNode }) {
  const activeFileId = useAtomValue(activeFileIdAtom);
  const setRecentUploads = useSetAtom(recentUploadsAtom);
  const registerUploadedDocument = useConvexMutationResult(api.documents.registerClientUpload);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDragEnter = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (activeFileId) setIsDragOver(true);
    },
    [activeFileId],
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (!activeFileId) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      setUploading(true);

      try {
        for (const file of files) {
          const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
          const filetype = EXT_TO_FILETYPE[ext] ?? ("pdf" as const);
          const displayType = EXT_TO_DISPLAY_TYPE[ext] ?? "other";

          // 1. Upload directly from browser to Vercel Blob (no payload limit)
          const blob = await uploadDocumentClient(file);

          // 2. Register in DB and trigger extraction workflow
          const isUuid = UUID_RE.test(activeFileId);
          const result = await registerUploadedDocument.mutateAsync({
            name: file.name,
            documentType: "other",
            filetype,
            storagePath: blob.url,
            fileSizeBytes: file.size,
            origin: "upload",
            ...(isUuid
              ? { resourceType: "file" as const, resourceId: activeFileId }
              : {}),
          });

          // 3. Update local state so document appears immediately in the pane
          if (result) {
            const fileDoc: FileDocument = {
              id: result.legacyId ?? result._id,
              fileId: activeFileId,
              name: file.name,
              type: displayType,
              uploadedAt: new Date().toISOString(),
              uploadedBy: "You",
              size: file.size,
            };

            setRecentUploads((prev) => {
              const next = new Map(prev);
              const existing = next.get(activeFileId) ?? [];
              next.set(activeFileId, [...existing, fileDoc]);
              return next;
            });
          }
        }
      } finally {
        setUploading(false);
      }
    },
    [activeFileId, setRecentUploads],
  );

  return (
    <div
      data-testid="portfolio-drop-zone"
      className="relative h-full"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}

      {/* Drag overlay */}
      {isDragOver && activeFileId && (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-sapphire-60/10 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-sapphire-40 bg-white/90 px-8 py-6 shadow-lg">
            <Upload className="h-8 w-8 text-sapphire-60" />
            <p className="text-sm font-medium text-onyx-80">
              Drop files to upload
            </p>
            <p className="text-xs text-onyx-60">
              Files will be attached to the selected file
            </p>
          </div>
        </div>
      )}

      {/* Upload progress indicator */}
      {uploading && (
        <div className="pointer-events-none absolute bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-onyx-80 px-4 py-2 text-sm text-white shadow-lg">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Uploading&hellip;
        </div>
      )}
    </div>
  );
}
