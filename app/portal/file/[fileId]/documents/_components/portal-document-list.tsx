"use client";

import { useState, useMemo } from "react";
import { PortalDocumentGroup } from "./portal-document-group";
import { PortalDocumentViewer } from "./portal-document-viewer";
import { PortalDocumentUpload } from "./portal-document-upload";
import type { PortalDocument, PortalDocumentGroup as DocGroup } from "@/lib/portal/fake-data";

const GROUP_CONFIG: { key: DocGroup; label: string }[] = [
  { key: "closing", label: "Closing" },
  { key: "title", label: "Title" },
  { key: "contract", label: "Contract & Amendments" },
];

interface PortalDocumentListProps {
  documents: PortalDocument[];
}

export function PortalDocumentList({ documents }: PortalDocumentListProps) {
  const [viewingDoc, setViewingDoc] = useState<PortalDocument | null>(null);
  const [localDocs, setLocalDocs] = useState<PortalDocument[]>(documents);

  const grouped = useMemo(() => {
    const map: Record<DocGroup, PortalDocument[]> = {
      closing: [],
      title: [],
      contract: [],
    };
    for (const doc of localDocs) {
      (map[doc.group] ?? map.contract).push(doc);
    }
    return map;
  }, [localDocs]);

  function handleUpload(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
    const newDoc: PortalDocument = {
      id: `doc-local-${Date.now()}`,
      name: file.name,
      documentType: "other",
      filetype: ext as PortalDocument["filetype"],
      fileSizeBytes: file.size,
      createdAt: new Date().toISOString().split("T")[0],
      uploadedByMe: true,
      group: "contract",
    };
    setLocalDocs((prev) => [newDoc, ...prev]);
  }

  return (
    <>
      <div className="space-y-6">
        {GROUP_CONFIG.map(({ key, label }) => (
          <PortalDocumentGroup
            key={key}
            label={label}
            documents={grouped[key]}
            onView={setViewingDoc}
          />
        ))}

        <PortalDocumentUpload onUpload={handleUpload} />
      </div>

      {viewingDoc && (
        <PortalDocumentViewer
          document={viewingDoc}
          onClose={() => setViewingDoc(null)}
        />
      )}
    </>
  );
}
