"use client";

import { useState } from "react";
import { Camera, Check, Shield, Pen, Banknote, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { SnapshotMilestone } from "@/types/finance";

const MILESTONES: {
  value: SnapshotMilestone;
  label: string;
  description: string;
  icon: typeof Shield;
}[] = [
  {
    value: "clear_to_close",
    label: "Clear to Close",
    description: "Lock the statement for CTC review. All figures should be final.",
    icon: Shield,
  },
  {
    value: "signing",
    label: "Signing",
    description: "Capture the statement as presented at the signing table.",
    icon: Pen,
  },
  {
    value: "funding",
    label: "Funding",
    description: "Record the funded statement. Disbursements should match.",
    icon: Banknote,
  },
  {
    value: "recording",
    label: "Recording",
    description: "Final post-recording snapshot. This is the permanent record.",
    icon: BookOpen,
  },
];

export function SnapshotCreateDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (milestone: SnapshotMilestone) => void;
}) {
  const [selected, setSelected] = useState<SnapshotMilestone | null>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-xl border border-onyx-20 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-onyx-10 px-5 py-4">
          <Camera className="h-5 w-5 text-sapphire-60" />
          <div>
            <h3 className="text-sm font-semibold text-onyx-90">
              Create Ledger Snapshot
            </h3>
            <p className="text-xs text-onyx-50">
              Captures an immutable copy of the current ledger state.
            </p>
          </div>
        </div>

        {/* Milestone selector */}
        <div className="space-y-2 p-5">
          {MILESTONES.map((m) => {
            const Icon = m.icon;
            const isSelected = selected === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setSelected(m.value)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-all",
                  isSelected
                    ? "border-sapphire-40 bg-sapphire-5 ring-1 ring-sapphire-30"
                    : "border-onyx-20 hover:border-onyx-30 hover:bg-onyx-5",
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    isSelected
                      ? "bg-sapphire-60 text-white"
                      : "bg-onyx-10 text-onyx-50",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isSelected ? "text-sapphire-70" : "text-onyx-80",
                    )}
                  >
                    {m.label}
                  </p>
                  <p className="mt-0.5 text-xs text-onyx-50">
                    {m.description}
                  </p>
                </div>
                {isSelected && (
                  <Check className="ml-auto mt-1 h-4 w-4 shrink-0 text-sapphire-60" />
                )}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-onyx-10 px-5 py-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!selected}
            onClick={() => {
              if (selected) {
                onCreate(selected);
                onClose();
              }
            }}
          >
            <Camera className="mr-1.5 h-3.5 w-3.5" />
            Create Snapshot
          </Button>
        </div>
      </div>
    </div>
  );
}
