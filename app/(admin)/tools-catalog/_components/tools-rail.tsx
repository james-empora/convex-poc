"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Search, ChevronDown, ChevronRight, Wrench } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  filteredGroupedToolsAtom,
  visibleToolCountAtom,
  selectedToolNameAtom,
  selectedToolAtom,
  selectedToolGroupAtom,
  searchQueryAtom,
} from "../_lib/atoms";
import { ToolIcon } from "../_lib/icons";
import { getGroup } from "../_lib/groups";
import { ToolListCard } from "./tool-list-card";

/* ---------- selected tool panel ---------- */

function SelectedToolPanel() {
  const tool = useAtomValue(selectedToolAtom);
  const groupId = useAtomValue(selectedToolGroupAtom);

  if (!tool) {
    return (
      <div className="flex shrink-0 items-center justify-center border-b border-onyx-20 bg-onyx-5 px-4 py-5 min-h-[120px]">
        <div className="flex flex-col items-center gap-1 text-center">
          <Wrench className="h-5 w-5 text-onyx-30" />
          <p className="text-sm font-medium text-onyx-40">No tool selected</p>
          <p className="text-xs text-onyx-30">
            Select a tool from the list below
          </p>
        </div>
      </div>
    );
  }

  const label =
    tool.ui?.label ??
    tool.gatewayName
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  const group = groupId ? getGroup(groupId) : null;

  return (
    <div className="shrink-0 border-b border-onyx-20 bg-gradient-to-br from-sapphire-10/30 to-sapphire-10 px-4 py-4 min-h-[120px]">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/60">
          <ToolIcon name={tool.ui?.icon} className="h-4 w-4 text-sapphire-60" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-2xl font-normal leading-tight text-onyx-100">
            {label}
          </p>
          <p className="mt-0.5 truncate font-mono text-sm text-onyx-80">
            {tool.gatewayName}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-onyx-80">
        {group && (
          <span className="rounded bg-white/60 px-1.5 py-0.5 font-medium">
            {group.label}
          </span>
        )}
        {tool.ui?.detailKind && (
          <span className="font-mono text-onyx-60">
            {tool.ui.detailKind}
          </span>
        )}
        {!tool.ui && (
          <span className="text-onyx-50 italic">No UI rendering</span>
        )}
      </div>
    </div>
  );
}

/* ---------- group header ---------- */

function GroupHeader({
  label,
  count,
  isCollapsed,
  onToggle,
}: {
  label: string;
  count: number;
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-1.5 border-b border-onyx-10 bg-onyx-5 px-3 py-1.5 text-left text-xs font-semibold uppercase tracking-wider text-onyx-70 transition-colors hover:text-onyx-90"
    >
      {isCollapsed ? (
        <ChevronRight className="h-3 w-3 shrink-0" />
      ) : (
        <ChevronDown className="h-3 w-3 shrink-0" />
      )}
      {label}
      <span className="ml-auto tabular-nums text-onyx-50">{count}</span>
    </button>
  );
}

/* ---------- rail ---------- */

export function ToolsRail() {
  const groups = useAtomValue(filteredGroupedToolsAtom);
  const totalCount = useAtomValue(visibleToolCountAtom);
  const selectedName = useAtomValue(selectedToolNameAtom);
  const setSelected = useSetAtom(selectedToolNameAtom);
  const [query, setQuery] = useAtom(searchQueryAtom);

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );

  function toggleGroup(id: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Scroll indicator
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 8);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    return () => el.removeEventListener("scroll", checkScroll);
  }, [checkScroll, totalCount]);

  return (
    <>
      {/* Header */}
      <div className="flex h-9 shrink-0 items-center border-b border-onyx-20 bg-onyx-10 px-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-onyx-70">
          Tools
        </h2>
        <span className="ml-1 text-xs tabular-nums text-onyx-60">
          {totalCount}
        </span>
      </div>

      {/* Selected tool summary */}
      <SelectedToolPanel />

      {/* Search input */}
      <div className="shrink-0 border-b border-onyx-20 px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-onyx-50" />
          <Input
            placeholder="Filter tools..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      {/* Grouped tool list */}
      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
            <p className="text-sm text-onyx-60">No tools match your filter</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.id}>
              <GroupHeader
                label={group.label}
                count={group.tools.length}
                isCollapsed={collapsedGroups.has(group.id)}
                onToggle={() => toggleGroup(group.id)}
              />
              {!collapsedGroups.has(group.id) && (
                <div className="divide-y divide-onyx-10">
                  {group.tools.map((tool) => (
                    <ToolListCard
                      key={tool.gatewayName}
                      tool={tool}
                      isSelected={selectedName === tool.gatewayName}
                      onClick={() => setSelected(tool.gatewayName)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        {/* Scroll indicator */}
        {canScrollDown && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-white pb-1 pt-6">
            <ChevronDown className="h-4 w-4 animate-bounce text-onyx-40" />
          </div>
        )}
      </div>
    </>
  );
}
