"use client";

import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  Group,
  HorizontalSeparator,
  Panel,
  useDefaultLayout,
  useIsMounted,
  useSafeStorage,
} from "@/components/composite/resizable-panels";
import { useLegacyImports } from "@/lib/legacy-import/queries";
import { selectedDealIdAtom } from "../_lib/atoms";
import { ImportContentWell } from "./import-content-well";
import { ImportRail } from "./import-rail";

const PANEL_IDS = ["import-rail", "import-content"] as const;

export function ImportLayoutShell() {
  const mounted = useIsMounted();
  const storage = useSafeStorage();
  const selectedDealId = useAtomValue(selectedDealIdAtom);
  const setSelectedDealId = useSetAtom(selectedDealIdAtom);
  const { data: imports = [], isLoading } = useLegacyImports();

  useEffect(() => {
    if (imports.length === 0) {
      if (selectedDealId !== null) {
        setSelectedDealId(null);
      }
      return;
    }

    if (!selectedDealId || !imports.some((item) => item.railsDealId === selectedDealId)) {
      setSelectedDealId(imports[0].railsDealId);
    }
  }, [imports, selectedDealId, setSelectedDealId]);

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: "legacy-import-workspace",
    panelIds: [...PANEL_IDS],
    storage,
  });

  if (!mounted) {
    return <div className="h-full bg-onyx-5" />;
  }

  return (
    <Group
      orientation="horizontal"
      defaultLayout={defaultLayout ?? { "import-rail": 22, "import-content": 78 }}
      onLayoutChanged={onLayoutChanged}
      className="h-full"
    >
      <Panel id="import-rail" minSize="16%" maxSize="35%">
        <div className="flex h-full flex-col overflow-hidden border-r border-onyx-20 bg-white">
          <ImportRail imports={imports} isLoading={isLoading} />
        </div>
      </Panel>

      <HorizontalSeparator />

      <Panel id="import-content" minSize="50%">
        <div className="flex h-full flex-col overflow-hidden bg-onyx-5">
          <ImportContentWell imports={imports} isLoading={isLoading} />
        </div>
      </Panel>
    </Group>
  );
}
