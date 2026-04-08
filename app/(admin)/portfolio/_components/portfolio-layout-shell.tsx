"use client";

import { usePreloadedQuery, type Preloaded } from "convex/react";
import {
  PortfolioWorkspace,
  type ResourcePaneDefinition,
} from "./portfolio-workspace";
import { PortfolioRail } from "./portfolio-rail";
import { DocumentsPane } from "./documents-pane";
import { ActionItemsPane, ActionItemsHeaderAction } from "./action-items-pane";
import { DropZone } from "./drop-zone";
import { usePortfolioCommandItems } from "./use-portfolio-command-items";
import type { FileSummary } from "@/lib/files/list-files";
import type { api } from "@/convex/_generated/api";

/* ---------- constants ---------- */

const RESOURCE_PANES: ResourcePaneDefinition[] = [
  {
    id: "documents",
    title: "Documents",
    defaultSize: 50,
    minSize: 20,
    children: <DocumentsPane />,
  },
  {
    id: "action-items",
    title: "Action Items",
    defaultSize: 50,
    minSize: 20,
    children: <ActionItemsPane />,
    headerAction: <ActionItemsHeaderAction />,
  },
];

/* ---------- component ---------- */

export function PortfolioLayoutShell({
  children,
  preloadedFiles,
}: {
  children: React.ReactNode;
  preloadedFiles: Preloaded<typeof api.files.listFiles>;
}) {
  usePortfolioCommandItems();
  const { items: initialFiles } = usePreloadedQuery(preloadedFiles) as {
    items: FileSummary[];
  };

  return (
    <DropZone>
      <PortfolioWorkspace
        portfolioRail={<PortfolioRail initialFiles={initialFiles} />}
        contentWell={children}
        resourcePanes={RESOURCE_PANES}
      />
    </DropZone>
  );
}
