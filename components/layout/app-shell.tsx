"use client";

import { useMemo } from "react";
import { useAtom, useAtomValue } from "jotai";
import { usePathname } from "next/navigation";
import { AppNavbar, type WorkspaceTab } from "@/components/layout/app-navbar";
import { CommandPalette } from "@/components/composite/command-palette";
import { userNameAtom } from "@/lib/auth/atoms";
import {
  commandPaletteOpenAtom,
  commandPaletteItemsAtom,
  commandPaletteFallbackAtom,
} from "@/app/(admin)/portfolio/_lib/command-palette";
import { useFileCommandItems } from "@/app/(admin)/portfolio/_lib/use-file-command-items";

/* ---------- constants ---------- */

const WORKSPACES: WorkspaceTab[] = [
  { id: "coordinator", label: "Coordinator", href: "/coordinator" },
  { id: "portfolio", label: "Portfolio", href: "/portfolio" },
  { id: "file-board", label: "File Board", href: "/file-board" },
];

const FIXED_IDS = new Set(WORKSPACES.map((w) => w.id));

/**
 * Derive a dynamic workspace tab from the current pathname.
 * Matches any top-level route (e.g. `/skills`, `/legacy-import`)
 * that isn't already a fixed workspace tab. Converts the slug to a title-cased
 * label (e.g. "legacy-import" → "Legacy Import").
 */
function deriveDynamicTab(pathname: string): WorkspaceTab | null {
  const match = pathname.match(/^\/([^/]+)/);
  const slug = match?.[1];
  if (!slug || FIXED_IDS.has(slug)) return null;
  const label = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return { id: slug, label, href: `/${slug}` };
}

/* ---------- component ---------- */

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userName] = useAtom(userNameAtom);
  const [paletteOpen, setPaletteOpen] = useAtom(commandPaletteOpenAtom);

  // Add a dynamic workspace tab for non-fixed routes (e.g. /skills, /legacy-import)
  const workspaces = useMemo(() => {
    const tab = deriveDynamicTab(pathname);
    return tab ? [...WORKSPACES, tab] : WORKSPACES;
  }, [pathname]);

  // Register global file items into the command palette registry
  useFileCommandItems();
  const commandItems = useAtomValue(commandPaletteItemsAtom);
  const fallback = useAtomValue(commandPaletteFallbackAtom);

  return (
    <div className="flex h-screen flex-col bg-onyx-5">
      <AppNavbar
        workspaces={workspaces}
        userName={userName ?? undefined}
        notificationCount={3}
        tabVariant="underline"
      />

      <div className="flex-1 overflow-hidden">
        {children}
      </div>

      <CommandPalette
        items={commandItems}
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        placeholder="Search files…"
        fallback={fallback}
      />
    </div>
  );
}
