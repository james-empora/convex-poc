"use client";

import { useParams } from "next/navigation";
import { useAtomValue, useSetAtom } from "jotai";
import { FileText, Image, FileSpreadsheet, File, Loader2 } from "lucide-react";
import { dynamicFileTabsAtom, recentUploadsAtom } from "@/app/(admin)/portfolio/_lib/atoms";
import { useFileDocuments } from "@/lib/documents/queries";
import type { FileDocumentSummary } from "@/lib/documents/list-file-documents";

/* ---------- icon map ---------- */

const DOC_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  image: Image,
  png: Image,
  jpg: Image,
  tiff: Image,
  xlsx: FileSpreadsheet,
};

/* ---------- helpers ---------- */

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/* ---------- component ---------- */

export function DocumentsPane() {
  const { fileId: activeFileId } = useParams<{ fileId?: string }>();
  const setDynamicTabs = useSetAtom(dynamicFileTabsAtom);
  const recentUploads = useAtomValue(recentUploadsAtom);

  const { data: dbDocuments, isLoading, isError } = useFileDocuments(activeFileId ?? null);

  // Merge DB documents with recently uploaded documents (optimistic display)
  const uploadedDocuments = activeFileId ? recentUploads.get(activeFileId) ?? [] : [];

  // Convert DB documents to a common shape, merge with uploads, deduplicate
  const documents = (() => {
    const dbDocs: { id: string; name: string; filetype: string; uploadedAt: string; size: number }[] =
      (dbDocuments ?? []).map((doc: FileDocumentSummary) => ({
        id: doc.id,
        name: doc.name,
        filetype: doc.filetype ?? "other",
        uploadedAt: doc.createdAt,
        size: doc.fileSizeBytes ?? 0,
      }));

    const uploadDocs = uploadedDocuments.map((doc) => ({
      id: doc.id,
      name: doc.name,
      filetype: doc.type,
      uploadedAt: doc.uploadedAt,
      size: doc.size,
    }));

    const all = [...dbDocs, ...uploadDocs];
    // Deduplicate by id
    const seen = new Set<string>();
    const deduped = all.filter((doc) => {
      if (seen.has(doc.id)) return false;
      seen.add(doc.id);
      return true;
    });
    // Sort by most recent first
    deduped.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    return deduped;
  })();

  function openDocument(docId: string, docName: string) {
    const tabId = `doc-${docId}`;
    const label = docName.replace(/\.[^.]+$/, "");
    setDynamicTabs((prev) => {
      if (prev.some((t) => t.id === tabId)) return prev;
      return [...prev, { id: tabId, label, closable: true }];
    });
    if (activeFileId) {
      window.history.replaceState(null, "", `/portfolio/${activeFileId}/doc/${docId}`);
    }
  }

  if (!activeFileId) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-sm text-onyx-60">
        Select a file to view documents
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin text-onyx-40" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-sm text-danger-60">
        Failed to load documents
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 p-4 text-center">
        <p className="text-sm text-onyx-60">No documents</p>
        <p className="text-xs text-onyx-50">
          Drag &amp; drop files onto the page to upload
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-onyx-10">
      {documents.map((doc) => {
        const Icon = DOC_ICONS[doc.filetype] ?? File;
        return (
          <button
            key={doc.id}
            type="button"
            onClick={() => openDocument(doc.id, doc.name)}
            className="flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-onyx-10/60"
          >
            <Icon className="h-5 w-5 shrink-0 text-onyx-50" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-onyx-80">
                {doc.name}
              </p>
              <p className="text-xs text-onyx-60">
                {formatDate(doc.uploadedAt)} &middot; {formatBytes(doc.size)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
