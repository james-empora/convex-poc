"use client";

import { Clock } from "lucide-react";

interface PortalEscalationBannerProps {
  officerName: string;
}

export function PortalEscalationBanner({ officerName }: PortalEscalationBannerProps) {
  return (
    <div className="mx-auto flex max-w-[80%] items-center gap-2 rounded-lg border border-warning-20 bg-warning-20/50 px-3 py-2">
      <Clock className="h-4 w-4 shrink-0 text-warning-80" />
      <p className="text-xs text-warning-80">
        Waiting for <span className="font-semibold">{officerName}</span> to
        respond
      </p>
    </div>
  );
}
