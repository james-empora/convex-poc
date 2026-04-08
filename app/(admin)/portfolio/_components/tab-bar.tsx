"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { usePathname } from "next/navigation";
import { useAtom } from "jotai";
import { Bot, Clock3, MessageSquareMore, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  dynamicFileTabsAtom,
  chatTabCounterAtom,
  CONTENT_TABS,
} from "@/app/(admin)/portfolio/_lib/atoms";
import type { TabDefinition } from "@/components/composite/tab-panel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/convex/_generated/api";
import { createChatId, type FileChatSummary } from "@/lib/chat/threads";
import { useConvexMutationResult } from "@/lib/convex/hooks";
import { useRouter } from "next/navigation";
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

/* ---------- helpers ---------- */

/** Derive a tab href from its id */
function tabHref(fileId: string, tabId: string): string {
  if (tabId === "overview" || tabId === "finances") {
    return `/portfolio/${fileId}/${tabId}`;
  }
  if (tabId.startsWith("chat-")) {
    const chatId = tabId.replace("chat-", "");
    return `/portfolio/${fileId}/chat/${chatId}`;
  }
  if (tabId.startsWith("doc-")) {
    const docId = tabId.replace("doc-", "");
    return `/portfolio/${fileId}/doc/${docId}`;
  }
  return `/portfolio/${fileId}/overview`;
}

/** Derive the active tab id from the current pathname */
function activeTabFromPathname(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  // /portfolio/[fileId]/overview → ["portfolio", fileId, "overview"]
  // /portfolio/[fileId]/finances → ["portfolio", fileId, "finances"]
  // /portfolio/[fileId]/chat/[chatId] → ["portfolio", fileId, "chat", chatId]
  // /portfolio/[fileId]/doc/[docId] → ["portfolio", fileId, "doc", docId]
  if (segments.length >= 3) {
    const tabSegment = segments[2];
    if (tabSegment === "overview" || tabSegment === "finances") {
      return tabSegment;
    }
    if (tabSegment === "chat" && segments[3]) {
      return `chat-${segments[3]}`;
    }
    if (tabSegment === "doc" && segments[3]) {
      return `doc-${segments[3]}`;
    }
  }
  return "overview";
}

/* ---------- sortable tab item ---------- */

function SortableTab({
  tab,
  isActive,
  isEditing,
  isDraggingAny,
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
  const renamable = tab.id.startsWith("chat-");

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-tab-id={tab.id}
      className={cn(
        "group/tab relative z-10 flex shrink-0 items-center gap-1 px-3 py-0 text-sm font-medium transition-colors duration-200 select-none",
        "border-b-2 bg-white",
        isActive ? "border-sapphire-50" : "border-transparent",
        tab.disabled && "pointer-events-none opacity-50",
        isDragging && "opacity-0",
        !isActive && !tab.disabled && "text-onyx-60 hover:text-onyx-80",
        isActive && "text-onyx-100",
      )}
      onClick={() => {
        if (!tab.disabled && !isDraggingAny) onActivate();
      }}
      onDoubleClick={() => {
        if (!tab.disabled && !isDraggingAny && renamable) onStartRename();
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
          className="w-[120px] min-w-0 border-b border-sapphire-40 bg-transparent text-sm font-medium text-onyx-100 outline-none"
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

/* ---------- drag overlay ---------- */

function TabOverlay({ tab }: { tab: TabDefinition }) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-onyx-100 shadow-[var(--shadow-lift)] ring-1 ring-onyx-20">
      <span className="truncate">{tab.label}</span>
    </div>
  );
}

/* ---------- main component ---------- */

interface TabBarProps {
  fileId: string;
  chats?: FileChatSummary[];
}

export function TabBar({ fileId, chats: savedChats }: TabBarProps) {
  const updateChatTitle = useConvexMutationResult(api.chat.updateChatTitle);
  const pathname = usePathname();
  const router = useRouter();
  const [dynamicTabs, setDynamicTabs] = useAtom(dynamicFileTabsAtom);
  const [chatCounter, setChatCounter] = useAtom(chatTabCounterAtom);
  const counterRef = useRef(chatCounter);
  const [dragActiveId, setDragActiveId] = useState<string | null>(null);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);

  const activeTabId = activeTabFromPathname(pathname);
  const allTabs: TabDefinition[] = [...CONTENT_TABS, ...dynamicTabs].map((tab) => {
    if (!tab.id.startsWith("chat-")) return tab;

    const chatId = tab.id.replace("chat-", "");
    const savedChat = savedChats?.find((chat) => chat.id === chatId);
    if (!savedChat) return tab;

    return {
      ...tab,
      label: savedChat.title,
    };
  });

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  function navigateToTab(tabId: string) {
    window.history.replaceState(null, "", tabHref(fileId, tabId));
  }

  function closeTab(tabId: string) {
    const idx = allTabs.findIndex((t) => t.id === tabId);
    setDynamicTabs((prev) => prev.filter((t) => t.id !== tabId));

    // If closing the active tab, navigate to a neighbor
    if (tabId === activeTabId) {
      const remaining = allTabs.filter((t) => t.id !== tabId);
      const newActive =
        remaining[Math.min(idx, remaining.length - 1)]?.id ?? "overview";
      window.history.replaceState(null, "", tabHref(fileId, newActive));
    }
  }

  function addChatTab() {
    counterRef.current += 1;
    setChatCounter(counterRef.current);
    const chatId = createChatId();
    const newTab: TabDefinition = {
      id: `chat-${chatId}`,
      label: `Chat #${counterRef.current}`,
      closable: true,
    };
    setDynamicTabs((prev) => [...prev, newTab]);
    window.history.replaceState(null, "", tabHref(fileId, newTab.id));
  }

  function openSavedChat(chatId: string, fallbackLabel: string) {
    const tabId = `chat-${chatId}`;
    setDynamicTabs((prev) =>
      prev.some((tab) => tab.id === tabId)
        ? prev
        : [...prev, { id: tabId, label: fallbackLabel, closable: true }],
    );
    window.history.replaceState(null, "", tabHref(fileId, tabId));
  }

  async function renameTab(tabId: string, newLabel: string) {
    const trimmed = newLabel.trim();
    setEditingTabId(null);
    if (!trimmed) return;

    setDynamicTabs((prev) =>
      prev.map((tab) => (tab.id === tabId ? { ...tab, label: trimmed } : tab)),
    );

    if (!tabId.startsWith("chat-")) return;

    const chatId = tabId.replace("chat-", "");
    const result = await updateChatTitle.mutateAsync({
      chatId,
      title: trimmed,
      fileId,
      source: "manual",
    });

    if (result) router.refresh();
  }

  function handleDragStart(event: DragStartEvent) {
    setDragActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setDragActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setDynamicTabs((prev) => {
      const oldIndex = prev.findIndex((t) => t.id === active.id);
      const newIndex = prev.findIndex((t) => t.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  const dragTab = dragActiveId
    ? allTabs.find((t) => t.id === dragActiveId)
    : null;

  return (
    <div className="relative flex h-9 items-stretch border-b border-onyx-20 bg-onyx-10">
      <div className="min-w-0 flex-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        <div className="flex h-full min-w-max items-stretch gap-0">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={allTabs.map((t) => t.id)}
              strategy={horizontalListSortingStrategy}
            >
              {allTabs.map((tab) => (
                <SortableTab
                  key={tab.id}
                  tab={tab}
                  isActive={tab.id === activeTabId}
                  isEditing={tab.id === editingTabId}
                  isDraggingAny={!!dragActiveId}
                  onActivate={() => navigateToTab(tab.id)}
                  onClose={() => closeTab(tab.id)}
                  onStartRename={() => setEditingTabId(tab.id)}
                  onConfirmRename={(newLabel) => void renameTab(tab.id, newLabel)}
                  onCancelRename={() => setEditingTabId(null)}
                />
              ))}
            </SortableContext>
            <DragOverlay dropAnimation={null}>
              {dragTab ? <TabOverlay tab={dragTab} /> : null}
            </DragOverlay>
          </DndContext>

          <button
            type="button"
            onClick={addChatTab}
            className="ml-0.5 inline-flex h-7 w-7 shrink-0 self-center items-center justify-center rounded-lg text-onyx-40 transition-colors duration-200 hover:bg-onyx-20 hover:text-onyx-70"
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add tab</span>
          </button>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 border-l border-onyx-20 px-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-onyx-40 transition-colors duration-200 hover:bg-onyx-20 hover:text-onyx-70"
            >
              <MessageSquareMore className="h-4 w-4" />
              <span className="sr-only">Open saved chats</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
            {(() => {
              const userChats = savedChats?.filter((c) => c.threadType === "user_chat") ?? [];
              // Hide system threads with no messages (failed/incomplete workflows)
              const systemChats = savedChats?.filter((c) => c.threadType === "system" && c.messageCount > 0) ?? [];
              const hasAny = userChats.length > 0 || systemChats.length > 0;

              if (!hasAny) {
                return (
                  <>
                    <DropdownMenuLabel>Saved chats</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled>No saved chats yet</DropdownMenuItem>
                  </>
                );
              }

              return (
                <>
                  {userChats.length > 0 && (
                    <>
                      <DropdownMenuLabel>Your chats</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {userChats.map((chat) => (
                        <DropdownMenuItem
                          key={chat.id}
                          onClick={() => openSavedChat(chat.id, chat.title)}
                          className="flex items-start gap-3 py-2"
                        >
                          <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-onyx-40" />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-onyx-100">
                              {chat.title}
                            </div>
                            <div className="truncate text-xs text-onyx-50">
                              {chat.preview ?? "No message preview"}
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                  {systemChats.length > 0 && (
                    <>
                      <DropdownMenuLabel className="mt-1">System</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {systemChats.map((chat) => (
                        <DropdownMenuItem
                          key={chat.id}
                          onClick={() => openSavedChat(chat.id, chat.title)}
                          className="flex items-start gap-3 py-2"
                        >
                          <Bot className="mt-0.5 h-4 w-4 shrink-0 text-amethyst-50" />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-onyx-100">
                              {chat.title}
                            </div>
                            <div className="truncate text-xs text-onyx-50">
                              {chat.preview ?? "AI workflow log"}
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </>
              );
            })()}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
