"use client";

import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  type KeyboardEvent,
} from "react";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ---------- types ---------- */

export interface TabDefinition {
  id: string;
  label: string;
  disabled?: boolean;
  closable?: boolean;
}

interface TabPanelProps {
  defaultTabs: TabDefinition[];
  defaultActiveTabId?: string;
  onTabClose?: (tabId: string) => void;
  onTabsReorder?: (tabs: TabDefinition[]) => void;
  onTabRename?: (tabId: string, newLabel: string) => void;
  onActiveTabChange?: (tabId: string) => void;
  showAddButton?: boolean;
  onAddTab?: () => TabDefinition;
  renderContent?: (activeTabId: string) => React.ReactNode;
  className?: string;
  /** "pill" (default) = rounded with sliding indicator; "flat" = rectangular; "underline" = bottom accent border */
  variant?: "pill" | "flat" | "underline";
}

/* ---------- sortable tab item ---------- */

function SortableTab({
  tab,
  isActive,
  isEditing,
  isDraggingAny,
  variant,
  onActivate,
  onClose,
  onStartRename,
  onConfirmRename,
  onCancelRename,
}: {
  tab: TabDefinition;
  isActive: boolean;
  isEditing: boolean;
  isDraggingAny: boolean;
  variant?: "pill" | "flat" | "underline";
  onActivate: () => void;
  onClose: () => void;
  onStartRename: () => void;
  onConfirmRename: (newLabel: string) => void;
  onCancelRename: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const inputRef = useRef<HTMLInputElement>(null);
  const [editValue, setEditValue] = useState(tab.label);

  // Sync edit value and focus input when entering edit mode.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isEditing && inputRef.current) {
      setEditValue(tab.label);
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing, tab.label]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = editValue.trim();
      onConfirmRename(trimmed || tab.label);
    } else if (e.key === "Escape") {
      onCancelRename();
    }
  }

  function handleBlur() {
    const trimmed = editValue.trim();
    onConfirmRename(trimmed || tab.label);
  }

  const closable = tab.closable !== false && !tab.disabled;

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-tab-id={tab.id}
      className={cn(
        "group/tab relative z-10 flex shrink-0 items-center gap-1 px-3 py-1.5 text-sm font-medium transition-colors duration-200 select-none",
        variant === "pill" && "rounded-lg",
        variant === "flat" && "border-r border-onyx-20",
        variant === "underline" && cn(
          "border-b-2 bg-white py-0",
          isActive ? "border-sapphire-50" : "border-transparent"
        ),
        tab.disabled && "pointer-events-none opacity-50",
        isDragging && "opacity-0",
        !isActive && !tab.disabled && "text-onyx-60 hover:text-onyx-80",
        isActive && "text-onyx-100"
      )}
      onClick={() => {
        if (!tab.disabled && !isDraggingAny) onActivate();
      }}
      onDoubleClick={() => {
        if (!tab.disabled && !isDraggingAny) onStartRename();
      }}
      {...attributes}
      {...listeners}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="w-[80px] min-w-0 border-b border-sapphire-40 bg-transparent text-sm font-medium text-onyx-100 outline-none"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="truncate">{tab.label}</span>
      )}
      {closable && !isEditing && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="ml-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-onyx-40 opacity-0 transition-all duration-150 hover:bg-onyx-20 hover:text-onyx-80 group-hover/tab:opacity-100"
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Close tab {tab.label}</span>
        </button>
      )}
    </div>
  );
}

/* ---------- static tab for drag overlay ---------- */

function TabOverlay({ tab, variant }: { tab: TabDefinition; variant?: "pill" | "flat" | "underline" }) {
  return (
    <div className={cn(
      "flex items-center gap-1 bg-white px-3 py-1.5 text-sm font-medium text-onyx-100 shadow-[var(--shadow-lift)] ring-1 ring-onyx-20",
      variant !== "flat" && "rounded-lg"
    )}>
      <span className="truncate">{tab.label}</span>
    </div>
  );
}

/* ---------- main component ---------- */

export function TabPanel({
  defaultTabs,
  defaultActiveTabId,
  onTabClose,
  onTabsReorder,
  onTabRename,
  onActiveTabChange,
  showAddButton,
  onAddTab,
  renderContent,
  className,
  variant = "pill",
}: TabPanelProps) {
  const [tabs, setTabs] = useState<TabDefinition[]>(defaultTabs);
  const [activeTabId, setActiveTabId] = useState(
    defaultActiveTabId ?? defaultTabs[0]?.id ?? ""
  );
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [dragActiveId, setDragActiveId] = useState<string | null>(null);

  // Sliding indicator — useLayoutEffect + setState is the correct pattern
  // for DOM measurement (per React docs), suppress the lint rule here.
  const tabBarRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  // DOM measurement → setState in useLayoutEffect is the React-recommended pattern.
  /* eslint-disable react-hooks/set-state-in-effect */
  useLayoutEffect(() => {
    if (dragActiveId) return; // hide during drag
    const container = tabBarRef.current;
    if (!container) return;
    const activeEl = container.querySelector<HTMLElement>(
      `[data-tab-id="${activeTabId}"]`
    );
    if (!activeEl) {
      setIndicator({ left: 0, width: 0 });
      return;
    }
    setIndicator({
      left: activeEl.offsetLeft,
      width: activeEl.offsetWidth,
    });
  }, [activeTabId, tabs, dragActiveId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  function activateTab(id: string) {
    setActiveTabId(id);
    onActiveTabChange?.(id);
  }

  function closeTab(id: string) {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      const next = prev.filter((t) => t.id !== id);
      // If closing the active tab, pick a neighbor
      if (id === activeTabId && next.length > 0) {
        const newActive =
          next[Math.min(idx, next.length - 1)]?.id ?? next[0]?.id ?? "";
        setActiveTabId(newActive);
        onActiveTabChange?.(newActive);
      }
      onTabClose?.(id);
      return next;
    });
  }

  function renameTab(id: string, newLabel: string) {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, label: newLabel } : t))
    );
    setEditingTabId(null);
    onTabRename?.(id, newLabel);
  }

  function addTab() {
    if (!onAddTab) return;
    const newTab = onAddTab();
    setTabs((prev) => [...prev, newTab]);
    activateTab(newTab.id);
  }

  function handleDragStart(event: DragStartEvent) {
    setDragActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setDragActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setTabs((prev) => {
      const oldIndex = prev.findIndex((t) => t.id === active.id);
      const newIndex = prev.findIndex((t) => t.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      onTabsReorder?.(reordered);
      return reordered;
    });
  }

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const dragTab = dragActiveId
    ? tabs.find((t) => t.id === dragActiveId)
    : null;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden border border-onyx-20",
        variant === "pill" && "rounded-xl",
        className
      )}
    >
      {/* Tab bar */}
      <div
        ref={tabBarRef}
        className={cn(
          "relative flex items-center overflow-x-auto [&::-webkit-scrollbar]:hidden",
          variant === "underline"
            ? "h-9 items-stretch gap-0 border-b border-onyx-20 bg-onyx-10"
            : variant === "flat"
              ? "gap-0 bg-onyx-10"
              : "gap-0.5 bg-onyx-10 p-1"
        )}
      >
        {/* Sliding active indicator (hidden for underline — border is on the tab itself) */}
        {variant !== "underline" && !dragActiveId && indicator.width > 0 && (
          <div
            className={cn(
              "pointer-events-none absolute bg-white transition-all duration-300 ease-[var(--ease-spring)]",
              variant === "flat"
                ? "top-0 bottom-0"
                : "top-1 bottom-1 rounded-lg shadow-[var(--shadow-soft)]"
            )}
            style={{ left: indicator.left, width: indicator.width }}
          />
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tabs.map((t) => t.id)}
            strategy={horizontalListSortingStrategy}
          >
            {tabs.map((tab) => (
              <SortableTab
                key={tab.id}
                tab={tab}
                isActive={tab.id === activeTabId}
                isEditing={tab.id === editingTabId}
                isDraggingAny={!!dragActiveId}
                variant={variant}
                onActivate={() => activateTab(tab.id)}
                onClose={() => closeTab(tab.id)}
                onStartRename={() => setEditingTabId(tab.id)}
                onConfirmRename={(newLabel) => renameTab(tab.id, newLabel)}
                onCancelRename={() => setEditingTabId(null)}
              />
            ))}
          </SortableContext>
          <DragOverlay dropAnimation={null}>
            {dragTab ? <TabOverlay tab={dragTab} variant={variant} /> : null}
          </DragOverlay>
        </DndContext>

        {showAddButton && (
          <button
            type="button"
            onClick={addTab}
            className="z-10 ml-0.5 inline-flex h-7 w-7 shrink-0 self-center items-center justify-center rounded-lg text-onyx-40 transition-colors duration-200 hover:bg-onyx-20 hover:text-onyx-70"
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add tab</span>
          </button>
        )}
      </div>

      {/* Content area */}
      <div className="min-h-0 flex-1 overflow-hidden bg-white">
        {renderContent && activeTabId ? (
          renderContent(activeTabId)
        ) : activeTab ? (
          <div className="flex h-full items-center justify-center p-6 text-onyx-40">
            <span>Content for &ldquo;{activeTab.label}&rdquo;</span>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-onyx-40">
            <span>No tabs open</span>
          </div>
        )}
      </div>
    </div>
  );
}
