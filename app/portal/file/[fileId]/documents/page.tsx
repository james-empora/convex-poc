"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { getFakeFile, getFakeDocuments } from "@/lib/portal/fake-data";
import { PortalDocumentList } from "./_components/portal-document-list";

export default function PortalDocumentsPage({
  params,
}: {
  params: Promise<{ fileId: string }>;
}) {
  const { fileId } = use(params);

  const file = getFakeFile(fileId);
  if (!file) notFound();

  const documents = getFakeDocuments(fileId);

  return (
    <div>
      <PortalDocumentList documents={documents} />
    </div>
  );
}
