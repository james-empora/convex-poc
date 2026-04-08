"use client";

import { useParams } from "next/navigation";
import { Calendar, FileText, MapPin, Users, Loader2 } from "lucide-react";
import { useFile } from "@/lib/files/queries";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

function checkUrgent(status: string, closingDate: string | null): boolean {
  "use no memo";
  if (!closingDate) return false;
  if (status === "closed" || status === "cancelled") return false;
  return new Date(closingDate).getTime() - Date.now() < THREE_DAYS_MS;
}

export function SelectedDealPanel() {
  const { fileId } = useParams<{ fileId?: string }>();
  const { data: file, isLoading } = useFile(fileId ?? null);

  if (!fileId) {
    return (
      <div className="shrink-0 border-b border-onyx-20 bg-onyx-5 px-4 py-5 min-h-[120px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-1 text-center">
          <MapPin className="h-5 w-5 text-onyx-30" />
          <p className="text-sm font-medium text-onyx-40">No deal selected</p>
          <p className="text-xs text-onyx-30">
            Select a file from the list below
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || !file) {
    return (
      <div className="flex shrink-0 items-center justify-center border-b border-onyx-20 bg-onyx-5 px-4 py-5 min-h-[120px]">
        <Loader2 className="h-4 w-4 animate-spin text-onyx-40" />
      </div>
    );
  }

  const isUrgent = checkUrgent(file.status, file.closingDate);
  const closingDate = file.closingDate ? new Date(file.closingDate) : null;

  return (
    <div className="shrink-0 border-b border-onyx-20 bg-gradient-to-br from-sapphire-10/30 to-sapphire-10 px-4 py-4 min-h-[120px]">
      {/* Address */}
      <p className="truncate font-display text-2xl font-normal leading-tight text-onyx-100">
        {file.propertyAddress}
      </p>
      {(file.city || file.state) && (
        <p className="mt-0.5 truncate text-sm text-onyx-80">
          {[file.city, file.state].filter(Boolean).join(", ")}
        </p>
      )}

      {/* Meta row */}
      <div className="mt-3 flex items-center gap-4 text-xs text-onyx-80">
        <span className="flex items-center gap-1">
          <FileText className="h-3.5 w-3.5" />
          <span className="font-mono">{file.fileNumber ?? "No file #"}</span>
        </span>
        {closingDate && (
          <span className="flex items-center gap-1">
            {isUrgent && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-garnet-60" />
            )}
            <Calendar className="h-3.5 w-3.5" />
            {closingDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        )}
      </div>

      {/* Parties */}
      <div className="mt-3 flex items-center gap-3 text-xs text-onyx-80">
        {(file.buyerNames.length > 0 || file.sellerNames.length > 0) && (
          <span className="flex min-w-0 items-center gap-1">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {file.sellerNames[0]}
              {file.buyerNames.length > 0 && (
                <span className="text-onyx-30"> &rarr; </span>
              )}
              {file.buyerNames[0]}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
