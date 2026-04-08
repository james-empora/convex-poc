"use client";

import { useEffect, useMemo } from "react";
import { useSetAtom } from "jotai";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { createElement } from "react";
import { commandPaletteGroupsAtom } from "@/app/(admin)/portfolio/_lib/command-palette";
import { useFiles } from "@/lib/files/queries";
import type { CommandItem } from "@/components/composite/command-palette";

const GROUP_KEY = "files";

/**
 * Registers the global file list as a command palette group.
 * Call from AppShell so file items are always available.
 */
export function useFileCommandItems() {
  const router = useRouter();
  const { data } = useFiles();
  const setGroups = useSetAtom(commandPaletteGroupsAtom);

  const items: CommandItem[] = useMemo(
    () =>
      (data?.items ?? []).map((file) => ({
        id: file.id,
        label: file.propertyAddress,
        description:
          [file.city, file.state].filter(Boolean).join(", ") +
          (file.fileNumber ? ` \u00B7 ${file.fileNumber}` : ""),
        icon: createElement(MapPin, { className: "h-4 w-4" }),
        keywords: [
          file.fileNumber,
          file.city,
          ...file.buyerNames,
          ...file.sellerNames,
          file.closerName,
        ].filter(Boolean) as string[],
        onSelect: () => {
          router.push(`/portfolio/${file.id}/overview`);
        },
      })),
    [data?.items, router],
  );

  useEffect(() => {
    setGroups((prev) => {
      const next = new Map(prev);
      next.set(GROUP_KEY, { label: "Files", priority: 0, items });
      return next;
    });
    return () => {
      setGroups((prev) => {
        const next = new Map(prev);
        next.delete(GROUP_KEY);
        return next;
      });
    };
  }, [items, setGroups]);
}
