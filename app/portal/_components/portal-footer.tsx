"use client";

import Image from "next/image";

export function PortalFooter() {
  return (
    <footer className="shrink-0 border-t border-onyx-20 bg-white px-4 py-3.5">
      <div className="flex items-center justify-between">
        <Image
          src="/empora-logo.svg"
          alt="Empora Title"
          width={96}
          height={24}
          className="h-5 w-auto opacity-60"
        />
        <div className="flex items-center gap-3 text-xs text-onyx-50">
          <span>&copy; {new Date().getFullYear()} Empora Title</span>
          <span className="text-onyx-20">&middot;</span>
          <a href="/portal/account" className="hover:text-onyx-80">
            Help
          </a>
          <span className="text-onyx-20">&middot;</span>
          <a href="/portal/account" className="hover:text-onyx-80">
            Privacy
          </a>
        </div>
      </div>
    </footer>
  );
}
