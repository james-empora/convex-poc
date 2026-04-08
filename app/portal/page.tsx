"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSetAtom } from "jotai";
import { getFakeFiles } from "@/lib/portal/fake-data";
import { activePortalFileIdAtom } from "@/app/portal/_lib/atoms";
import { PortalFilePicker } from "./_components/portal-file-picker";

export default function PortalHome() {
  const router = useRouter();
  const setActiveFileId = useSetAtom(activePortalFileIdAtom);
  const files = getFakeFiles();

  useEffect(() => {
    // Auto-redirect to single file
    if (files.length === 1) {
      setActiveFileId(files[0].id);
      router.replace(`/portal/file/${files[0].id}`);
    }
  }, [files, router, setActiveFileId]);

  // Single file: show nothing while redirecting
  if (files.length === 1) return null;

  // Multiple files: show picker
  return <PortalFilePicker files={files} />;
}
