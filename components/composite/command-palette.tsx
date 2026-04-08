"use client";

import { useState, useEffect, useRef, useCallback, type KeyboardEvent } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

/* ---------- types ---------- */

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  keywords?: string[];
  /** Group label — set by the registry atom, used for rendering section headings */
  group?: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  items: CommandItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeholder?: string;
  fallback?: {
    prefix: string;
    icon?: React.ReactNode;
    onSelect: (query: string) => void;
  } | null;
  className?: string;
}

/* ---------- component ---------- */

export function CommandPalette({
  items,
  open,
  onOpenChange,
  placeholder = "Search\u2026",
  fallback,
  className,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Register global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function handleKeyDown(e: globalThis.KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }

    function handleOpenRequest() {
      onOpenChange(true);
    }

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("empora:open-command-palette", handleOpenRequest);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("empora:open-command-palette", handleOpenRequest);
    };
  }, [open, onOpenChange]);

  // Reset and focus on open
  const prevOpenRef = useRef(open);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      requestAnimationFrame(() => {
        setQuery("");
        setSelectedIndex(0);
        inputRef.current?.focus();
      });
    }
    prevOpenRef.current = open;
  }, [open]);

  // Filter items
  const filtered = query.trim()
    ? items.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.label.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.keywords?.some((kw) => kw.toLowerCase().includes(q))
        );
      })
    : items;

  // Scroll selected into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const selected = list.children[selectedIndex] as HTMLElement | undefined;
    selected?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (item: CommandItem) => {
      item.onSelect();
      onOpenChange(false);
    },
    [onOpenChange],
  );

  const showFallback =
    filtered.length === 0 && query.trim() !== "" && fallback != null;

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex]);
      } else if (showFallback && fallback) {
        fallback.onSelect(query);
        onOpenChange(false);
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "top-[20%] -translate-y-0 gap-0 overflow-hidden bg-white p-0 shadow-2xl sm:max-w-xl",
          className,
        )}
      >
        <DialogTitle className="sr-only">Command Palette</DialogTitle>

        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-onyx-20 px-4">
          <Search className="h-5 w-5 shrink-0 text-onyx-40" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent py-4 text-base text-onyx-100 outline-none placeholder:text-onyx-40"
          />
          <kbd className="hidden rounded border border-onyx-20 bg-onyx-10 px-1.5 py-0.5 text-[10px] font-medium text-onyx-50 sm:inline-block">
            ESC
          </kbd>
        </div>

        {/* Results list */}
        <div
          ref={listRef}
          className="max-h-96 overflow-y-auto p-1"
          role="listbox"
        >
          {filtered.length === 0 ? (
            showFallback && fallback ? (
              <button
                type="button"
                role="option"
                aria-selected
                onClick={() => {
                  fallback.onSelect(query);
                  onOpenChange(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-md bg-sapphire-10 px-2.5 py-2 text-left text-sm text-onyx-100 transition-colors"
              >
                {fallback.icon && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center text-onyx-40">
                    {fallback.icon}
                  </span>
                )}
                <span>
                  <span className="text-onyx-50">{fallback.prefix} </span>
                  <span className="font-medium">&ldquo;{query}&rdquo;</span>
                </span>
              </button>
            ) : (
              <div className="py-6 text-center text-sm text-onyx-40">
                No results found.
              </div>
            )
          ) : (
            filtered.map((item, index) => {
              const prevGroup = index > 0 ? filtered[index - 1].group : null;
              const showGroupHeading =
                item.group && item.group !== prevGroup;

              return (
                <div key={item.id}>
                  {showGroupHeading && (
                    <div className="px-2.5 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-onyx-50 first:pt-1">
                      {item.group}
                    </div>
                  )}
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === selectedIndex}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                      index === selectedIndex
                        ? "bg-sapphire-10 text-onyx-100"
                        : "text-onyx-70 hover:text-onyx-100",
                    )}
                  >
                    {item.icon && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-onyx-40">
                        {item.icon}
                      </span>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium">
                        {item.label}
                      </span>
                      {item.description && (
                        <span className="truncate text-xs text-onyx-50">
                          {item.description}
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
