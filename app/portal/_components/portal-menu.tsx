"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAtomValue } from "jotai";
import Image from "next/image";
import {
  Home,
  Calendar,
  ChevronRight,
  Plus,
  FolderOpen,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { activePortalFileIdAtom } from "@/app/portal/_lib/atoms";
import {
  getFakeFiles,
  formatStatus,
  formatCurrency,
  formatDate,
  type PortalFile,
} from "@/lib/portal/fake-data";
import { FILE_SUB_ITEMS } from "@/app/portal/_lib/constants";

interface PortalMenuProps {
  open: boolean;
  onClose: () => void;
  isDesktop: boolean;
}

const OPEN_STATUSES = new Set([
  "pending",
  "in_progress",
  "clear_to_close",
  "funded",
]);

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-sapphire-10/80 text-sapphire-70 border-sapphire-30/50",
  in_progress: "bg-amethyst-10/80 text-amethyst-70 border-amethyst-30/50",
  clear_to_close: "bg-success-20/80 text-success-80 border-success-80/20",
  closed: "bg-onyx-10/80 text-onyx-60 border-onyx-30/50",
  funded: "bg-success-20/80 text-success-80 border-success-80/20",
  recorded: "bg-onyx-10/80 text-onyx-60 border-onyx-30/50",
  cancelled: "bg-danger-20/80 text-danger-80 border-danger-80/20",
};

export function PortalMenu({ open, onClose, isDesktop }: PortalMenuProps) {
  const pathname = usePathname();
  const activeFileId = useAtomValue(activePortalFileIdAtom);

  const allFiles = getFakeFiles();
  const openFiles = allFiles.filter((f) => OPEN_STATUSES.has(f.status));

  const navContent = (
    <NavContent
      pathname={pathname}
      activeFileId={activeFileId}
      openFiles={openFiles}
      onClose={onClose}
    />
  );

  // Desktop: always-visible static sidebar
  if (isDesktop) {
    return (
      <nav
        className="flex w-[20rem] shrink-0 flex-col border-r border-onyx-20 bg-white"
        aria-label="Main navigation"
      >
        {navContent}
      </nav>
    );
  }

  // Mobile: full-screen overlay with fast fade
  return (
    <nav
      className={cn(
        "fixed inset-0 z-50 flex flex-col bg-white transition-opacity duration-150",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-label="Main navigation"
    >
      {/* Mobile header: logo + close */}
      <div className="flex items-center justify-between px-4 py-3">
        <Image
          src="/empora-logo.svg"
          alt="Empora Title"
          width={100}
          height={24}
          className="h-5 w-auto"
        />
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-onyx-50 hover:bg-onyx-10 hover:text-onyx-80"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {navContent}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Nav content — shared between desktop & mobile                      */
/* ------------------------------------------------------------------ */

function NavContent({
  pathname,
  activeFileId,
  openFiles,
  onClose,
}: {
  pathname: string;
  activeFileId: string | null;
  openFiles: PortalFile[];
  onClose?: () => void;
}) {
  const activeFile = activeFileId
    ? openFiles.find((f) => f.id === activeFileId) ?? null
    : null;
  const otherFiles = activeFile
    ? openFiles.filter((f) => f.id !== activeFileId)
    : openFiles;
  const showOtherFiles = otherFiles.length > 0 && (openFiles.length > 1 || !activeFile);

  return (
    <>
      {/* File navigation */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {/* Active file — expanded details card with sub-nav */}
        {activeFile && (
          <div className="mb-2">
            <ExpandedFile
              file={activeFile}
              pathname={pathname}
              onClose={onClose}
            />
          </div>
        )}

        {/* Other open files — collapsed */}
        {showOtherFiles && (
          <div className={cn(activeFile && "mt-1")}>
            {otherFiles.map((file) => (
              <Link
                key={file.id}
                href={`/portal/file/${file.id}`}
                onClick={onClose}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-onyx-70 transition-colors hover:bg-onyx-10 hover:text-onyx-90"
              >
                <Home className="h-4 w-4 shrink-0 text-onyx-40" />
                <span className="flex-1 truncate">{file.address.street}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-onyx-30" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Action links + bottom items */}
      <div className="px-2 pb-3">
        <Separator className="mb-3" />
        <Link
          href="/portal/new-order"
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            pathname.startsWith("/portal/new-order")
              ? "bg-sapphire-10 text-sapphire-70"
              : "text-onyx-70 hover:bg-onyx-10 hover:text-onyx-90",
          )}
        >
          <Plus className="h-5 w-5 shrink-0" />
          Open New File
        </Link>
        <Link
          href="/portal"
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            pathname === "/portal"
              ? "bg-sapphire-10 text-sapphire-70"
              : "text-onyx-70 hover:bg-onyx-10 hover:text-onyx-90",
          )}
        >
          <FolderOpen className="h-5 w-5 shrink-0" />
          My Files
        </Link>

        <Separator className="my-3" />

        <Link
          href="/portal/account"
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            pathname.startsWith("/portal/account")
              ? "bg-sapphire-10 text-sapphire-70"
              : "text-onyx-70 hover:bg-onyx-10 hover:text-onyx-90",
          )}
        >
          <Settings className="h-5 w-5 shrink-0" />
          Account
        </Link>
        <a
          href="/auth/logout"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-onyx-70 transition-colors hover:bg-onyx-10 hover:text-danger-80"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Sign Out
        </a>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Expanded file — details card + sub-navigation                      */
/* ------------------------------------------------------------------ */

function ExpandedFile({
  file,
  pathname,
  onClose,
}: {
  file: PortalFile;
  pathname: string;
  onClose?: () => void;
}) {
  const fileBase = `/portal/file/${file.id}`;
  const priceCents =
    file.fileType === "purchase" ? file.purchasePriceCents : file.loanAmountCents;

  return (
    <div>
      {/* Details card */}
      <Link
        href={fileBase}
        onClick={onClose}
        className="block px-3 pt-1 pb-2"
      >
        {/* Address + status */}
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-heading text-lg font-semibold leading-tight text-onyx-100">
            {file.address.street}
          </p>
          <Badge
            variant="glass"
            size="sm"
            className={cn("shrink-0 border text-[10px]", STATUS_BADGE[file.status])}
          >
            {formatStatus(file.status)}
          </Badge>
        </div>
        <p className="mt-0.5 truncate text-sm text-onyx-80">
          {file.address.city}, {file.address.state} {file.address.zip}
        </p>

        {/* Meta row */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-onyx-80">
          {file.closingDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(file.closingDate)}
            </span>
          )}
          {priceCents && (
            <>
              <span className="text-onyx-30">&middot;</span>
              <span className="font-medium">
                {formatCurrency(priceCents)}
              </span>
            </>
          )}
        </div>
      </Link>

      {/* Sub-navigation */}
      <div className="mt-2">
        {FILE_SUB_ITEMS.map((item) => {
          const href = `${fileBase}${item.path}`;
          const isActive = item.path
            ? pathname.startsWith(href)
            : pathname === fileBase;
          return (
            <Link
              key={item.label}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sapphire-10 font-medium text-sapphire-70"
                  : "text-onyx-70 hover:bg-onyx-10 hover:text-onyx-90",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>

      <Separator className="mt-2" />
    </div>
  );
}
