"use client";

import { useEffect, useMemo, useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useRouter } from "next/navigation";
import { createElement } from "react";
import {
  FileText,
  Image,
  FileSpreadsheet,
  File,
  User,
  Building2,
  Landmark,
  Briefcase,
  MessageSquare,
} from "lucide-react";
import {
  commandPaletteGroupsAtom,
  commandPaletteFallbackAtom,
} from "@/app/(admin)/portfolio/_lib/command-palette";
import { activeFileIdAtom, dynamicFileTabsAtom } from "@/app/(admin)/portfolio/_lib/atoms";
import { useOpenChatWithPrompt } from "./use-open-chat-with-prompt";
import { useFileDocuments } from "@/lib/documents/queries";
import { useFile } from "@/lib/files/queries";
import type { CommandItem } from "@/components/composite/command-palette";

const DOCS_GROUP_KEY = "portfolio:documents";
const ENTITIES_GROUP_KEY = "portfolio:entities";

const DOC_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  image: Image,
  png: Image,
  jpg: Image,
  tiff: Image,
  xlsx: FileSpreadsheet,
};

const ENTITY_ICONS: Record<string, typeof User> = {
  individual: User,
  organization: Building2,
  lender: Landmark,
  brokerage: Briefcase,
};

/**
 * Registers documents for the currently selected file as a command palette group.
 * Call from the portfolio layout — items are removed when the layout unmounts.
 */
export function usePortfolioCommandItems() {
  const router = useRouter();
  const activeFileId = useAtomValue(activeFileIdAtom);
  const setDynamicTabs = useSetAtom(dynamicFileTabsAtom);
  const setGroups = useSetAtom(commandPaletteGroupsAtom);
  const setFallback = useSetAtom(commandPaletteFallbackAtom);
  const openChatWithPrompt = useOpenChatWithPrompt();
  const { data: documents } = useFileDocuments(activeFileId);
  const { data: fileDetail } = useFile(activeFileId);

  /* ---- document items ---- */

  const docItems: CommandItem[] = useMemo(() => {
    if (!activeFileId || !documents) return [];

    return documents.map((doc) => {
      const Icon = DOC_ICONS[doc.filetype ?? ""] ?? File;
      return {
        id: `doc-${doc.id}`,
        label: doc.name,
        description: doc.documentType?.replace(/_/g, " ") ?? doc.filetype ?? "",
        icon: createElement(Icon, { className: "h-4 w-4" }),
        keywords: [doc.documentType, doc.filetype].filter(Boolean) as string[],
        onSelect: () => {
          const tabId = `doc-${doc.id}`;
          const label = doc.name.replace(/\.[^.]+$/, "");
          setDynamicTabs((prev) => {
            if (prev.some((t) => t.id === tabId)) return prev;
            return [...prev, { id: tabId, label, closable: true }];
          });
          router.push(`/portfolio/${activeFileId}/doc/${doc.id}`);
        },
      };
    });
  }, [activeFileId, documents, setDynamicTabs, router]);

  /* ---- entity items ---- */

  const parties = fileDetail?.parties;
  const entityItems: CommandItem[] = useMemo(() => {
    if (!activeFileId || !parties) return [];

    return parties.flatMap((group) =>
      group.entities.map((entity) => {
        const Icon = ENTITY_ICONS[entity.entityType] ?? User;
        return {
          id: `entity-${entity.entityId}`,
          label: entity.name,
          description: group.role.replace(/_/g, " "),
          icon: createElement(Icon, { className: "h-4 w-4" }),
          keywords: [
            group.role,
            entity.entityType,
            entity.email,
            entity.phone,
          ].filter(Boolean) as string[],
          onSelect: () => {
            // No-op for now
          },
        };
      }),
    );
  }, [activeFileId, parties]);

  /* ---- register groups ---- */

  useRegisterGroup(DOCS_GROUP_KEY, "Documents", 10, docItems, setGroups);
  useRegisterGroup(ENTITIES_GROUP_KEY, "Parties", 20, entityItems, setGroups);

  /* ---- register fallback ---- */

  const handleFallback = useCallback(
    (query: string) => openChatWithPrompt(query),
    [openChatWithPrompt],
  );

  useEffect(() => {
    if (activeFileId) {
      setFallback({
        prefix: "Chat about",
        icon: createElement(MessageSquare, { className: "h-4 w-4" }),
        onSelect: handleFallback,
      });
    } else {
      setFallback(null);
    }
    return () => setFallback(null);
  }, [activeFileId, handleFallback, setFallback]);
}

/** Shared helper to register/unregister a command palette group */
function useRegisterGroup(
  key: string,
  label: string,
  priority: number,
  items: CommandItem[],
  setGroups: ReturnType<typeof useSetAtom<typeof commandPaletteGroupsAtom>>,
) {
  useEffect(() => {
    if (items.length > 0) {
      setGroups((prev) => {
        const next = new Map(prev);
        next.set(key, { label, priority, items });
        return next;
      });
    } else {
      setGroups((prev) => {
        if (!prev.has(key)) return prev;
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
    }
    return () => {
      setGroups((prev) => {
        if (!prev.has(key)) return prev;
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
    };
  }, [key, label, priority, items, setGroups]);
}
