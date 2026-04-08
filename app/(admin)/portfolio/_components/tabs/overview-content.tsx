"use client";

import { Users, ArrowRightLeft } from "lucide-react";
import type { FileDetail } from "@/lib/files/get-file";
import { FileHeader } from "../file-header";

/* ---------- party display ---------- */

function PartiesGrid({ file }: { file: FileDetail }) {
  const parties = file.parties ?? [];
  const buyerNames = file.buyerNames ?? [];
  const sellerNames = file.sellerNames ?? [];
  // Group parties into buyer-side and seller-side for display
  const buyerSide = parties.filter((p) => p.side === "buyer_side" || p.role === "buyer");
  const sellerSide = parties.filter((p) => p.side === "seller_side" || p.role === "seller");
  const otherParties = parties.filter(
    (p) => p.side !== "buyer_side" && p.side !== "seller_side" && p.role !== "buyer" && p.role !== "seller",
  );

  const allParties = [...sellerSide, ...buyerSide, ...otherParties];

  if (allParties.length === 0) {
    return <SimpleParties file={{ ...file, buyerNames, sellerNames }} />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {allParties.map((party) => (
        <div
          key={`${party.role}-${party.entities[0]?.entityId ?? party.role}`}
          className="rounded-xl border border-onyx-20 bg-white p-4 shadow-[var(--shadow-soft)]"
        >
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-onyx-50">
            <Users className="h-3 w-3" />
            {party.role.replace(/_/g, " ")}
          </div>
          <ul className="space-y-2">
            {party.entities.map((entity) => (
              <li key={entity.entityId} className="text-sm">
                <p className="font-medium text-onyx-90">{entity.name}</p>
                {entity.email && (
                  <p className="text-xs text-onyx-60">{entity.email}</p>
                )}
                {entity.phone && (
                  <p className="text-xs text-onyx-60">{entity.phone}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ---------- fallback for files with no party data ---------- */

function SimpleParties({ file }: { file: FileDetail }) {
  const buyerNames = file.buyerNames ?? [];
  const sellerNames = file.sellerNames ?? [];
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {buyerNames.length > 0 && (
        <div className="rounded-xl border border-onyx-20 bg-white p-4 shadow-[var(--shadow-soft)]">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-onyx-50">
            <Users className="h-3 w-3" />
            {file.fileType === "refinance" ? "Borrower" : "Buyer"}
          </div>
          <ul className="space-y-1">
            {buyerNames.map((name) => (
              <li key={name} className="text-sm text-onyx-90">{name}</li>
            ))}
          </ul>
        </div>
      )}
      {sellerNames.length > 0 && (
        <div className="rounded-xl border border-onyx-20 bg-white p-4 shadow-[var(--shadow-soft)]">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-onyx-50">
            <ArrowRightLeft className="h-3 w-3" />
            Seller
          </div>
          <ul className="space-y-1">
            {sellerNames.map((name) => (
              <li key={name} className="text-sm text-onyx-90">{name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------- component ---------- */

export function OverviewContent({ fileId, file }: { fileId: string; file?: FileDetail | null }) {
  if (!file) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-onyx-40">
        File not found
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-onyx-5 p-6">
      <div className="space-y-6">
        <FileHeader file={file} />
        <PartiesGrid file={file} />
      </div>
    </div>
  );
}
