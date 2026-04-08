"use client";

import { type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import {
  Group,
  Panel,
  HorizontalSeparator,
  VerticalSeparator,
  useDefaultLayout,
  usePanelRef,
  useSafeStorage,
  useIsMounted,
} from "@/components/composite/resizable-panels";
import { cn } from "@/lib/utils";

/* ---------- types ---------- */

export interface ResourcePaneDefinition {
  id: string;
  title: string;
  defaultSize?: number;
  minSize?: number;
  children: ReactNode;
  headerAction?: ReactNode;
}

interface PortfolioWorkspaceProps {
  portfolioRail: ReactNode;
  contentWell: ReactNode;
  resourcePanes: ResourcePaneDefinition[];
  className?: string;
}

/* ---------- collapsible resource pane ---------- */

function CollapsiblePane({ pane }: { pane: ResourcePaneDefinition }) {
  const panelRef = usePanelRef();

  function toggle() {
    const handle = panelRef.current;
    if (!handle) return;
    if (handle.isCollapsed()) {
      handle.expand();
    } else {
      handle.collapse();
    }
  }

  return (
    <Panel
      id={pane.id}
      defaultSize={pane.defaultSize}
      minSize={`${pane.minSize ?? 10}%`}
      collapsible
      panelRef={panelRef}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-9 items-center border-b border-onyx-20 bg-onyx-10">
          <button
            type="button"
            onClick={toggle}
            className="flex min-w-0 flex-1 items-center gap-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-onyx-70 transition-colors hover:text-onyx-90"
          >
            <ChevronDown className="h-3 w-3 shrink-0" />
            {pane.title}
          </button>
          {pane.headerAction && (
            <div
              className="flex shrink-0 items-center pr-1.5"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {pane.headerAction}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-auto">{pane.children}</div>
      </div>
    </Panel>
  );
}

/* ---------- right rail (stacked resource panes) ---------- */

function ResourceRail({ panes }: { panes: ResourcePaneDefinition[] }) {
  const storage = useSafeStorage();

  const panelIds = panes.map((p) => p.id);
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: "portfolio-resource-panes",
    panelIds,
    storage,
  });

  // Fallback: distribute equally
  const fallbackLayout: Record<string, number> = {};
  const sizeEach = 100 / panes.length;
  for (const pane of panes) {
    fallbackLayout[pane.id] = pane.defaultSize ?? sizeEach;
  }

  return (
    <Group
      orientation="vertical"
      defaultLayout={defaultLayout ?? fallbackLayout}
      onLayoutChanged={onLayoutChanged}
      className="h-full"
    >
      {panes.map((pane, index) => (
        <div key={pane.id} className="contents">
          {index > 0 && <VerticalSeparator />}
          <CollapsiblePane pane={pane} />
        </div>
      ))}
    </Group>
  );
}

/* ---------- main component ---------- */

const PANEL_IDS = ["portfolio", "content", "resources"] as const;

export function PortfolioWorkspace({
  portfolioRail,
  contentWell,
  resourcePanes,
  className,
}: PortfolioWorkspaceProps) {
  const mounted = useIsMounted();
  const storage = useSafeStorage();

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: "portfolio-workspace",
    panelIds: [...PANEL_IDS],
    storage,
  });

  // Defer rendering until after hydration to avoid mismatch from localStorage
  if (!mounted) {
    return <div className={cn("h-full bg-onyx-5", className)} />;
  }

  return (
    <Group
      orientation="horizontal"
      defaultLayout={
        defaultLayout ?? {
          portfolio: 20,
          content: 58,
          resources: 22,
        }
      }
      onLayoutChanged={onLayoutChanged}
      className={cn("h-full", className)}
    >
      {/* Portfolio rail */}
      <Panel id="portfolio" minSize="14%" maxSize="35%">
        <div className="flex h-full flex-col overflow-hidden border-r border-onyx-20 bg-white">
          {portfolioRail}
        </div>
      </Panel>

      <HorizontalSeparator />

      {/* Content well */}
      <Panel id="content" minSize="30%">
        <div className="flex h-full flex-col overflow-hidden bg-onyx-5">
          {contentWell}
        </div>
      </Panel>

      <HorizontalSeparator />

      {/* Resource panes rail */}
      <Panel id="resources" minSize="14%" maxSize="40%">
        <div className="flex h-full flex-col overflow-hidden border-l border-onyx-20 bg-white">
          <ResourceRail panes={resourcePanes} />
        </div>
      </Panel>
    </Group>
  );
}
