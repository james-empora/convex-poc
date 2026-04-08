"use client";

import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useSetAtom } from "jotai";
import { createChatId } from "@/lib/chat/threads";
import { dynamicFileTabsAtom, chatTabCounterAtom } from "@/app/(admin)/portfolio/_lib/atoms";

/* ---------- types ---------- */

interface ResourceLinkContextValue {
  currentFileId: string | null;
  navigateToResource: (resourceType: "file" | "doc", resourceId: string) => void;
  /** Navigate to a specific fixed tab (overview, finances) for a given file */
  navigateToTab: (targetFileId: string, tab: "overview" | "finances") => void;
  /** Create a new chat tab for a given file and navigate to it */
  createChatTab: (targetFileId: string) => void;
}

/* ---------- context ---------- */

const ResourceLinkContext = createContext<ResourceLinkContextValue | null>(null);

export function useResourceLinkContext() {
  const ctx = useContext(ResourceLinkContext);
  if (!ctx) {
    throw new Error("useResourceLinkContext must be used within a ResourceLinkProvider");
  }
  return ctx;
}

/* ---------- provider ---------- */

interface ResourceLinkProviderProps {
  fileId: string | null;
  children: ReactNode;
}

export function ResourceLinkProvider({ fileId, children }: ResourceLinkProviderProps) {
  const router = useRouter();
  const setDynamicTabs = useSetAtom(dynamicFileTabsAtom);
  const setChatCounter = useSetAtom(chatTabCounterAtom);

  const navigateToResource = useCallback(
    (resourceType: "file" | "doc", resourceId: string) => {
      if (resourceType === "file") {
        if (resourceId === fileId) {
          window.history.replaceState(null, "", `/portfolio/${fileId}/overview`);
        } else {
          router.push(`/portfolio/${resourceId}/overview`);
        }
        return;
      }

      // resourceType === "doc" — open in the current file context
      const tabId = `doc-${resourceId}`;
      const label = "Document";
      setDynamicTabs((prev) =>
        prev.some((t) => t.id === tabId)
          ? prev
          : [...prev, { id: tabId, label, closable: true }],
      );
      const targetFileId = fileId ?? resourceId;
      window.history.replaceState(null, "", `/portfolio/${targetFileId}/doc/${resourceId}`);
    },
    [fileId, router, setDynamicTabs],
  );

  const navigateToTab = useCallback(
    (targetFileId: string, tab: "overview" | "finances") => {
      if (targetFileId === fileId) {
        window.history.replaceState(null, "", `/portfolio/${fileId}/${tab}`);
      } else {
        router.push(`/portfolio/${targetFileId}/${tab}`);
      }
    },
    [fileId, router],
  );

  const createChatTab = useCallback(
    (targetFileId: string) => {
      if (targetFileId !== fileId) {
        router.push(`/portfolio/${targetFileId}/overview`);
        return;
      }

      const chatId = createChatId();
      const tabId = `chat-${chatId}`;
      setChatCounter((prev) => {
        const next = prev + 1;
        setDynamicTabs((tabs) => [
          ...tabs,
          { id: tabId, label: `Chat #${next}`, closable: true },
        ]);
        return next;
      });
      window.history.replaceState(null, "", `/portfolio/${fileId}/chat/${chatId}`);
    },
    [fileId, router, setChatCounter, setDynamicTabs],
  );

  return (
    <ResourceLinkContext.Provider
      value={{
        currentFileId: fileId,
        navigateToResource,
        navigateToTab,
        createChatTab,
      }}
    >
      {children}
    </ResourceLinkContext.Provider>
  );
}
