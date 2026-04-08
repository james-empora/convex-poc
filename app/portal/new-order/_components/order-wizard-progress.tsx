"use client";

import { cn } from "@/lib/utils";

const STEPS = ["Property", "File Info", "Parties", "Review"];

interface OrderWizardProgressProps {
  currentStep: number;
}

export function OrderWizardProgress({ currentStep }: OrderWizardProgressProps) {
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((label, i) => (
        <div key={label} className="flex-1">
          <div
            className={cn(
              "h-1 rounded-full transition-colors",
              i <= currentStep ? "bg-sapphire-60" : "bg-onyx-20",
            )}
          />
          <p
            className={cn(
              "mt-1 text-center text-[10px] font-medium",
              i === currentStep
                ? "text-sapphire-70"
                : i < currentStep
                  ? "text-onyx-60"
                  : "text-onyx-40",
            )}
          >
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}
