"use client";

import { TabPanel } from "@/components/composite/tab-panel";

export function TabPanelDemo() {
  return (
    <TabPanel
      defaultTabs={[
        { id: "1", label: "Overview" },
        { id: "2", label: "Title Search" },
        { id: "3", label: "Settlement" },
        { id: "4", label: "Read Only", closable: false },
        { id: "5", label: "Archived", disabled: true },
      ]}
      showAddButton
      onAddTab={() => ({
        id: crypto.randomUUID(),
        label: "New Tab",
      })}
    />
  );
}
