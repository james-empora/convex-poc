"use client";

import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PortalDocument } from "@/lib/portal/fake-data";

interface PortalDocumentViewerProps {
  document: PortalDocument;
  onClose: () => void;
}

export function PortalDocumentViewer({ document, onClose }: PortalDocumentViewerProps) {
  const isImage = ["png", "jpg"].includes(document.filetype);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Toolbar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-onyx-20 px-4">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-onyx-100">
            {document.name}
          </h2>
          <p className="text-xs text-onyx-50 uppercase">
            {document.filetype}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Download
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-onyx-50 hover:bg-onyx-10 hover:text-onyx-80"
            aria-label="Close viewer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Preview content */}
      <div className="flex-1 overflow-auto bg-onyx-10 p-4">
        {document.filetype === "pdf" ? (
          <div className="mx-auto flex h-full max-w-3xl items-center justify-center rounded-lg bg-white p-8 shadow-md">
            <div className="text-center">
              <p className="text-sm text-onyx-60">
                PDF preview would render here
              </p>
              <p className="mt-1 text-xs text-onyx-40">
                (Connect to real document API to enable)
              </p>
            </div>
          </div>
        ) : isImage ? (
          <div className="mx-auto flex h-full max-w-3xl items-center justify-center rounded-lg bg-white p-8 shadow-md">
            <div className="text-center">
              <p className="text-sm text-onyx-60">
                Image preview would render here
              </p>
              <p className="mt-1 text-xs text-onyx-40">
                (Connect to real document API to enable)
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-full max-w-3xl items-center justify-center rounded-lg bg-white p-8 shadow-md">
            <p className="text-sm text-onyx-60">
              Preview not available for .{document.filetype} files
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
