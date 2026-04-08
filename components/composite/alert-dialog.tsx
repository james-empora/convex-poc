"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "max-w-[400px]",
  default: "max-w-[480px]",
  lg: "max-w-[560px]",
} as const;

const toneIconClasses = {
  neutral: "text-onyx-60",
  info: "text-sapphire-60",
  success: "text-success-80",
  warning: "text-warning-80",
  danger: "text-danger-80",
} as const;

export interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon?: React.ReactNode;
  heading: string;
  description?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  size?: "sm" | "default" | "lg";
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  className?: string;
}

export function AlertDialog({
  open,
  onOpenChange,
  icon,
  heading,
  description,
  children,
  actions,
  size = "default",
  tone = "neutral",
  className,
}: AlertDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Backdrop */}
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-white/40 backdrop-blur-[3px] data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        />

        {/* Content */}
        <DialogPrimitive.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2",
            sizeClasses[size],
            "rounded-2xl bg-white/95 p-8 text-left ring-1 ring-foreground/10 backdrop-blur-2xl shadow-[var(--shadow-lift)] glass-effect",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-open:slide-in-from-bottom-4",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            "duration-200",
            className
          )}
        >
          <div className="flex items-start gap-4">
            {/* Icon — bare, larger, tone-colored */}
            {icon && (
              <div
                className={cn(
                  "shrink-0 [&_svg]:h-8 [&_svg]:w-8",
                  toneIconClasses[tone]
                )}
              >
                {icon}
              </div>
            )}

            <div className="min-w-0 flex-1">
              {/* Heading */}
              <DialogPrimitive.Title className="font-heading text-2xl font-bold text-onyx-100">
                {heading}
              </DialogPrimitive.Title>

              {/* Description */}
              {description && (
                <DialogPrimitive.Description className="mt-3 text-base leading-relaxed text-onyx-60">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
          </div>

          {/* Optional body */}
          {children && <div className="mt-6">{children}</div>}

          {/* Actions */}
          {actions && (
            <div className="mt-8 flex items-center justify-end gap-3 [&_button]:h-11 [&_button]:px-5 [&_button]:text-base">
              {actions}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
