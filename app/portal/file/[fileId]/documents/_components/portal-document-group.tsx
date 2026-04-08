"use client";

import { PortalDocumentRow } from "./portal-document-row";
import type { PortalDocument } from "@/lib/portal/fake-data";

interface PortalDocumentGroupProps {
  label: string;
  documents: PortalDocument[];
  onView: (doc: PortalDocument) => void;
}

export function PortalDocumentGroup({
  label,
  documents,
  onView,
}: PortalDocumentGroupProps) {
  return (
    <div>
      <h2 className="mb-1 border-b border-onyx-20 pb-2 text-xs font-semibold uppercase tracking-wider text-onyx-60">
        {label}
      </h2>

      {documents.length === 0 ? (
        <p className="py-3 text-center text-xs text-onyx-50">
          No documents yet
        </p>
      ) : (
        <div>
          {documents.map((doc) => (
            <PortalDocumentRow key={doc.id} document={doc} onView={onView} />
          ))}
        </div>
      )}
    </div>
  );
}
