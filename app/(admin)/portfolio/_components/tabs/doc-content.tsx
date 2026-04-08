"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useSetAtom } from "jotai";
import { ExternalLink, Download, FileText, Loader2 } from "lucide-react";
import { useDocument } from "@/lib/documents/queries";
import type { DocumentDetail } from "@/lib/documents/get-document";
import { dynamicFileTabsAtom } from "@/app/(admin)/portfolio/_lib/atoms";
import { Button } from "@/components/ui/button";

function formatBytes(bytes: number | null) {
  if (bytes === null) return "Size unavailable";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function tabLabel(name: string) {
  return name.replace(/\.[^.]+$/, "");
}

export function DocContent({
  docId,
  initialDocument,
}: {
  fileId: string;
  docId: string;
  initialDocument?: DocumentDetail | null;
}) {
  const skipQuery = !!initialDocument;
  const { data: fetchedDoc, isLoading, isError } = useDocument(skipQuery ? null : docId);
  const doc = initialDocument ?? fetchedDoc;
  const setDynamicTabs = useSetAtom(dynamicFileTabsAtom);

  useEffect(() => {
    if (!doc) return;

    setDynamicTabs((prev) =>
      prev.map((tab) =>
        tab.id === `doc-${docId}` ? { ...tab, label: tabLabel(doc.name) } : tab,
      ),
    );
  }, [doc, docId, setDynamicTabs]);

  if (isLoading && !skipQuery) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-onyx-40" />
      </div>
    );
  }

  if (isError || !doc) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-sm text-onyx-60">
        Unable to load this document.
      </div>
    );
  }

  const previewUrl = `/api/documents/${doc.id}/content`;
  const downloadUrl = `${previewUrl}?download=1`;
  const supportsInlinePreview = doc.filetype === "pdf";
  const supportsImagePreview =
    doc.filetype === "png" || doc.filetype === "jpg" || doc.filetype === "tiff";

  return (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,#ffffff_0%,#f7f4f1_100%)]">
      <div className="border-b border-onyx-20 bg-white/90 px-5 py-4 backdrop-blur-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="truncate font-medium text-onyx-100">{doc.name}</p>
            <p className="text-xs text-onyx-60">
              {doc.filetype?.toUpperCase() ?? "FILE"} · {formatBytes(doc.fileSizeBytes)} · Added {formatDate(doc.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={previewUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                Open
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={downloadUrl}>
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {supportsInlinePreview ? (
          <div className="h-full overflow-hidden bg-white">
            <iframe
              src={previewUrl}
              title={doc.name}
              className="h-full w-full border-0"
            />
          </div>
        ) : supportsImagePreview ? (
          <div className="flex h-full items-center justify-center overflow-auto bg-white">
            <div className="relative h-full w-full">
              <Image
                src={previewUrl}
                alt={doc.name}
                fill
                unoptimized
                className="object-contain"
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-white px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sapphire-10 text-sapphire-70">
              <FileText className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-onyx-90">Preview not available in-app</p>
              <p className="max-w-sm text-xs text-onyx-60">
                This {doc.filetype?.toUpperCase() ?? "document"} file can be opened in a new tab or downloaded.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
