"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuLabel,
} from "@/components/ui/context-menu";

/* ---------- types ---------- */

export interface GroupDefinition<T> {
  key: string;
  label: string;
  items: T[];
}

export interface GroupByOption {
  value: string;
  label: string;
}

interface CollapsibleGroupProps<T> {
  groups: GroupDefinition<T>[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string;
  groupByOptions?: GroupByOption[];
  currentGroupBy?: string;
  onGroupByChange?: (value: string) => void;
  className?: string;
  emptyMessage?: string;
}

/* ---------- component ---------- */

export function CollapsibleGroup<T>({
  groups,
  renderItem,
  keyExtractor,
  groupByOptions,
  currentGroupBy,
  onGroupByChange,
  className,
  emptyMessage = "No items",
}: CollapsibleGroupProps<T>) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggleGroup(key: string) {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (groups.length === 0) {
    return (
      <div className={cn("flex items-center justify-center py-12 text-sm text-onyx-60", className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {groups.map((group) => {
        const isCollapsed = collapsed[group.key] ?? false;

        const header = (
          <button
            type="button"
            onClick={() => toggleGroup(group.key)}
            className="flex w-full items-center gap-1.5 border-b border-onyx-20 bg-onyx-5 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-onyx-60 transition-colors hover:text-onyx-80"
          >
            {isCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            )}
            <span className="truncate">{group.label}</span>
            <span className="ml-auto shrink-0 tabular-nums text-onyx-60">
              {group.items.length}
            </span>
          </button>
        );

        return (
          <div key={group.key}>
            {groupByOptions && groupByOptions.length > 0 ? (
              <ContextMenu>
                <ContextMenuTrigger asChild>{header}</ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuLabel>Group by</ContextMenuLabel>
                  <ContextMenuRadioGroup
                    value={currentGroupBy}
                    onValueChange={(v) => onGroupByChange?.(v)}
                  >
                    {groupByOptions.map((opt) => (
                      <ContextMenuRadioItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </ContextMenuRadioItem>
                    ))}
                  </ContextMenuRadioGroup>
                </ContextMenuContent>
              </ContextMenu>
            ) : (
              header
            )}

            {!isCollapsed && (
              <div className="flex flex-col divide-y divide-onyx-10">
                {group.items.map((item, index) => (
                  <div key={keyExtractor(item)}>{renderItem(item, index)}</div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
