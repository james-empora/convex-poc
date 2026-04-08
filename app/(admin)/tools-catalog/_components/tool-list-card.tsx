"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ToolDefinition } from "@/lib/tools/define-tool";
import { ToolIcon } from "../_lib/icons";

interface ToolListCardProps {
  tool: ToolDefinition;
  isSelected: boolean;
  onClick: () => void;
}

function getToolLabel(tool: ToolDefinition): string {
  return (
    tool.ui?.label ??
    tool.gatewayName
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function ToolListCard({ tool, isSelected, onClick }: ToolListCardProps) {
  const hasUi = !!tool.ui;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "group w-full border-l-2 px-3 py-3 text-left transition-colors",
        isSelected
          ? "border-l-sapphire-60 bg-sapphire-10/50"
          : "border-l-transparent hover:bg-onyx-10/60",
      )}
    >
      {/* Row 1: Icon + label + no-ui badge */}
      <div className="flex items-center gap-1.5">
        <ToolIcon name={tool.ui?.icon} className="h-3 w-3 shrink-0 text-sapphire-60" />
        <span className="truncate text-sm font-medium text-onyx-100">
          {getToolLabel(tool)}
        </span>
        {!hasUi && (
          <Badge size="sm" variant="glass" className="ml-auto shrink-0 border text-[10px]">
            No UI
          </Badge>
        )}
      </div>

      {/* Row 2: Gateway name */}
      <p className="mt-0.5 truncate font-mono text-xs text-onyx-50">
        {tool.gatewayName}
      </p>
    </div>
  );
}
