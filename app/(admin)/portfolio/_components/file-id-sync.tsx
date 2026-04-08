"use client";

import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { activeFileIdAtom, dynamicFileTabsAtom } from "@/app/(admin)/portfolio/_lib/atoms";

/**
 * Thin client component that syncs Jotai atoms with the current URL.
 * Extracted from the page component so the page can be a server component.
 */
export function FileIdSync({
  fileId,
  tabType,
  tabId,
}: {
  fileId: string;
  tabType: string;
  tabId?: string;
}) {
  const setActiveFileId = useSetAtom(activeFileIdAtom);
  const setDynamicTabs = useSetAtom(dynamicFileTabsAtom);

  useEffect(() => {
    setActiveFileId(fileId);
  }, [fileId, setActiveFileId]);

  useEffect(() => {
    if (!tabId) return;

    if (tabType === "chat") {
      const id = `chat-${tabId}`;
      setDynamicTabs((prev) =>
        prev.some((t) => t.id === id)
          ? prev
          : [...prev, { id, label: "Chat", closable: true }],
      );
    }
    if (tabType === "doc") {
      const id = `doc-${tabId}`;
      setDynamicTabs((prev) =>
        prev.some((t) => t.id === id)
          ? prev
          : [...prev, { id, label: "Document", closable: true }],
      );
    }
  }, [tabType, tabId, setDynamicTabs]);

  return null;
}
