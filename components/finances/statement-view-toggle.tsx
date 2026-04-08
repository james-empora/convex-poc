"use client";

import { useAtom } from "jotai";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  statementViewModeAtom,
} from "@/app/(admin)/portfolio/_lib/finances";

export function StatementViewToggle() {
  const [viewMode, setViewMode] = useAtom(statementViewModeAtom);

  if (viewMode === "hud") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-onyx-60">HUD Preview</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-sapphire-60 hover:text-sapphire-70"
          onClick={() => setViewMode("cd")}
        >
          Back to Closing Disclosure
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-onyx-60">Closing Disclosure</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1 text-xs text-onyx-40 hover:text-onyx-60"
        onClick={() => setViewMode("hud")}
      >
        <Eye className="h-3 w-3" />
        Preview HUD
      </Button>
    </div>
  );
}
