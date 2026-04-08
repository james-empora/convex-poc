"use client";

import {
  Group,
  Panel,
  HorizontalSeparator,
  useDefaultLayout,
  useSafeStorage,
  useIsMounted,
} from "@/components/composite/resizable-panels";
import { ToolsRail } from "./tools-rail";
import { ToolsContentWell } from "./tools-content-well";

const PANEL_IDS = ["tools-rail", "tools-content"] as const;

export function ToolsWorkspace() {
  const mounted = useIsMounted();
  const storage = useSafeStorage();

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: "tools-catalog-workspace",
    panelIds: [...PANEL_IDS],
    storage,
  });

  if (!mounted) {
    return <div className="h-full bg-onyx-5" />;
  }

  return (
    <Group
      orientation="horizontal"
      defaultLayout={
        defaultLayout ?? { "tools-rail": 24, "tools-content": 76 }
      }
      onLayoutChanged={onLayoutChanged}
      className="h-full"
    >
      <Panel id="tools-rail" minSize="16%" maxSize="35%">
        <div className="flex h-full flex-col overflow-hidden border-r border-onyx-20 bg-white">
          <ToolsRail />
        </div>
      </Panel>

      <HorizontalSeparator />

      <Panel id="tools-content" minSize="50%">
        <div className="flex h-full flex-col overflow-hidden bg-onyx-5">
          <ToolsContentWell />
        </div>
      </Panel>
    </Group>
  );
}
