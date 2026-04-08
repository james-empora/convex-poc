"use client";

import Image from "next/image";
import { Menu } from "lucide-react";
import { UserAvatar } from "@/components/composite/user-avatar";
import { useAtomValue } from "jotai";
import { userNameAtom } from "@/lib/auth/atoms";

interface PortalHeaderProps {
  onMenuToggle: () => void;
  showHamburger: boolean;
  address: string | null;
  pageTitle: string | null;
}

export function PortalHeader({
  onMenuToggle,
  showHamburger,
  address,
  pageTitle,
}: PortalHeaderProps) {
  const userName = useAtomValue(userNameAtom);

  return (
    <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center justify-between border-b border-onyx-20 bg-white px-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {showHamburger && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-onyx-60 transition-colors hover:bg-onyx-10 hover:text-onyx-80"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {showHamburger && (address || pageTitle) ? (
          <div className="flex min-w-0 items-center gap-1.5">
            {address && (
              <span className="truncate text-base font-semibold text-onyx-100">
                {address}
              </span>
            )}
            {address && pageTitle && (
              <span className="shrink-0 text-onyx-30">&middot;</span>
            )}
            {pageTitle && (
              <span className="shrink-0 text-base text-onyx-70">{pageTitle}</span>
            )}
          </div>
        ) : (
          <Image
            src="/empora-logo.svg"
            alt="Empora Title"
            width={100}
            height={24}
            className="h-5 w-auto"
          />
        )}
      </div>

      <UserAvatar name={userName ?? "User"} size="sm" />
    </header>
  );
}
