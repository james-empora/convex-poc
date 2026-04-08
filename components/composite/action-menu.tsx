"use client";

import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
  separator?: boolean; // renders a separator before this item
}

export interface ActionMenuProps {
  items: ActionMenuItem[];
  align?: "start" | "end";
  className?: string;
}

export function ActionMenu({
  items,
  align = "end",
  className,
}: ActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn(
            "text-onyx-40 hover:text-onyx-70 data-open:bg-muted",
            className
          )}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open actions menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-[160px]">
        {items.map((item, i) => (
          <div key={i}>
            {item.separator && i > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={item.onClick}
              disabled={item.disabled}
              className={cn(
                "gap-2",
                item.variant === "danger" && "text-danger-80 focus:text-danger-80"
              )}
            >
              {item.icon}
              {item.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
