"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import { useAtomValue, useSetAtom } from "jotai";
import { PortalHeader } from "./portal-header";
import { PortalFooter } from "./portal-footer";
import { PortalMenu } from "./portal-menu";
import {
  activePortalFileIdAtom,
  chatBarPortalAtom,
} from "@/app/portal/_lib/atoms";
import { FILE_SUB_ITEMS } from "@/app/portal/_lib/constants";
import { getFakeFile } from "@/lib/portal/fake-data";

const LG_BREAKPOINT = 1024;

function subscribeToWidth(cb: () => void) {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
}
function getIsDesktop() {
  return window.innerWidth >= LG_BREAKPOINT;
}

function derivePageTitle(pathname: string, activeFileId: string | null): string | null {
  if (pathname === "/portal") return "My Files";
  if (pathname.startsWith("/portal/account")) return "Account";
  if (pathname.startsWith("/portal/new-order")) return "New Order";

  if (activeFileId && pathname.startsWith(`/portal/file/${activeFileId}`)) {
    const segment = pathname.replace(`/portal/file/${activeFileId}`, "") || "";
    const match = FILE_SUB_ITEMS.find((item) => item.path === segment);
    return match?.label ?? null;
  }

  return null;
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isDesktop = useSyncExternalStore(subscribeToWidth, getIsDesktop, () => false);
  const pathname = usePathname();
  const atomFileId = useAtomValue(activePortalFileIdAtom);

  // Derive file ID from URL so it survives page reloads (atom resets to null)
  const fileIdFromPath = pathname.match(/^\/portal\/file\/([^/]+)/)?.[1] ?? null;
  const activeFileId = fileIdFromPath ?? atomFileId;

  const activeFile = useMemo(
    () => (activeFileId ? getFakeFile(activeFileId) : null),
    [activeFileId],
  );
  const pageTitle = derivePageTitle(pathname, activeFileId);

  // Auto-close mobile menu when resizing to desktop
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= LG_BREAKPOINT) setMenuOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Expose the chat bar portal target via Jotai atom
  const chatBarRef = useRef<HTMLDivElement>(null);
  const setChatBarPortal = useSetAtom(chatBarPortalAtom);
  const chatBarRefCallback = useCallback(
    (node: HTMLDivElement | null) => {
      (chatBarRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      setChatBarPortal(node);
    },
    [setChatBarPortal],
  );

  return (
    <div className="flex h-dvh flex-col bg-onyx-5">
      <PortalHeader
        onMenuToggle={() => setMenuOpen(true)}
        showHamburger={!isDesktop}
        address={activeFileId && pathname.startsWith(`/portal/file/${activeFileId}`) ? activeFile?.address.street ?? null : null}
        pageTitle={pageTitle}
      />
      <div className="flex flex-1 overflow-hidden">
        <PortalMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          isDesktop={isDesktop}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto flex w-full min-h-full max-w-2xl flex-col px-4 py-6 sm:px-6">
              {children}
            </div>
          </main>
          {/* Portal target: chat input renders here via createPortal */}
          <div ref={chatBarRefCallback} />
        </div>
      </div>
      {!isDesktop && <PortalFooter />}
    </div>
  );
}
