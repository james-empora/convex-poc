"use client";

import { use, useEffect } from "react";
import { notFound } from "next/navigation";
import { useSetAtom } from "jotai";
import { activePortalFileIdAtom } from "@/app/portal/_lib/atoms";
import { getFakeFile } from "@/lib/portal/fake-data";
import { PortalFileOverview } from "./_components/portal-file-overview";

export default function PortalFilePage({
  params,
}: {
  params: Promise<{ fileId: string }>;
}) {
  const { fileId } = use(params);
  const setActiveFileId = useSetAtom(activePortalFileIdAtom);

  useEffect(() => {
    setActiveFileId(fileId);
  }, [fileId, setActiveFileId]);

  const file = getFakeFile(fileId);
  if (!file) notFound();

  return <PortalFileOverview file={file} />;
}
