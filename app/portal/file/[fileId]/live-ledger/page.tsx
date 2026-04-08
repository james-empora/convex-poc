"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { getFakeFile, getFakeLedger } from "@/lib/portal/fake-data";
import { LedgerSummary } from "./_components/ledger-summary";
import { LedgerCategorySection } from "./_components/ledger-category";
import { LedgerTotal } from "./_components/ledger-total";

export default function LiveLedgerPage({
  params,
}: {
  params: Promise<{ fileId: string }>;
}) {
  const { fileId } = use(params);

  const file = getFakeFile(fileId);
  if (!file) notFound();

  const ledger = getFakeLedger(fileId);

  if (!ledger) {
    return (
      <div className="rounded-lg border border-onyx-20 bg-white px-4 py-8 text-center">
        <p className="text-sm text-onyx-50">
          Settlement figures are not yet available for this file.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LedgerSummary data={ledger} />
      {ledger.categories.map((category) => (
        <LedgerCategorySection key={category.id} category={category} />
      ))}
      <LedgerTotal data={ledger} />
    </div>
  );
}
