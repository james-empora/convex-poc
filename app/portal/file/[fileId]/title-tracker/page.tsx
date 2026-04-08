"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { getFakeFile, getFakeTitleTracker } from "@/lib/portal/fake-data";
import { TitleTrackerSummary } from "./_components/title-tracker-summary";
import { TitleFindingsList } from "./_components/title-findings-list";

export default function TitleTrackerPage({
  params,
}: {
  params: Promise<{ fileId: string }>;
}) {
  const { fileId } = use(params);

  const file = getFakeFile(fileId);
  if (!file) notFound();

  const trackerData = getFakeTitleTracker(fileId);

  if (!trackerData) {
    return (
      <div className="rounded-lg border border-onyx-20 bg-white px-4 py-8 text-center">
        <p className="text-sm text-onyx-50">
          Title search has not been ordered yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TitleTrackerSummary data={trackerData} />
      <TitleFindingsList findings={trackerData.findings} />
    </div>
  );
}
