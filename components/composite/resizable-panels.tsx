"use client";

import { useState, useEffect } from "react";
import {
  Group,
  Panel,
  Separator,
  useDefaultLayout,
  usePanelRef,
  type LayoutStorage,
  type GroupProps,
  type PanelProps,
  type SeparatorProps,
} from "react-resizable-panels";
import { cn } from "@/lib/utils";

/* ---------- SSR-safe storage ---------- */

const noopStorage: LayoutStorage = {
  getItem: () => null,
  setItem: () => {},
};

/**
 * Returns noopStorage during SSR and hydration, then switches to localStorage
 * after mount. This avoids hydration mismatches caused by stored layout values
 * differing from the server-rendered defaults.
 */
export function useSafeStorage(): LayoutStorage {
  const [storage, setStorage] = useState<LayoutStorage>(noopStorage);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try {
        // Test that localStorage is accessible (throws NS_ERROR_FAILURE in Firefox private mode)
        localStorage.getItem("__storage_test__");
        setStorage(localStorage);
      } catch (err) {
        console.warn("[resizable-panels] localStorage not available, falling back to noopStorage", err);
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);
  return storage;
}

/**
 * Returns true after the component has mounted on the client.
 * Use to defer rendering of localStorage-dependent panel layouts.
 */
export function useIsMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return mounted;
}

/* ---------- styled separators ---------- */

export function HorizontalSeparator({ className, ...props }: SeparatorProps) {
  return (
    <Separator
      className={cn(
        "group relative flex w-px items-center justify-center bg-onyx-20 transition-colors hover:bg-sapphire-30 data-[separator-active]:bg-sapphire-40",
        // Invisible wider hit area for easy grabbing
        "before:absolute before:inset-y-0 before:-left-1 before:-right-1 before:content-['']",
        className,
      )}
      {...props}
    />
  );
}

export function VerticalSeparator({ className, ...props }: SeparatorProps) {
  return (
    <Separator
      className={cn(
        "group relative flex h-px items-center justify-center bg-onyx-20 transition-colors hover:bg-sapphire-30 data-[separator-active]:bg-sapphire-40",
        "before:absolute before:inset-x-0 before:-top-1 before:-bottom-1 before:content-['']",
        className,
      )}
      {...props}
    />
  );
}

/* ---------- re-exports ---------- */

export { Group, Panel, useDefaultLayout, usePanelRef };
export type { LayoutStorage, GroupProps, PanelProps };
