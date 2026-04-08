"use client";

import { PortalFileHeader } from "./portal-file-header";
import { PortalTimeline } from "./portal-timeline";
import { PortalActionItems } from "./portal-action-items";
import { PortalTitleTeam } from "./portal-escrow-contact";
import type { PortalFile } from "@/lib/portal/fake-data";

interface PortalFileOverviewProps {
  file: PortalFile;
}

export function PortalFileOverview({ file }: PortalFileOverviewProps) {
  return (
    <div className="space-y-6">
      <PortalFileHeader file={file} />
      <div className="hidden md:block">
        <PortalTimeline file={file} />
      </div>
      <PortalActionItems />
      <PortalTitleTeam officer={file.escrowOfficer} />
    </div>
  );
}
