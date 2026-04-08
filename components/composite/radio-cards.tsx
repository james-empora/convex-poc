"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface RadioCardOption {
  value: string;
  label: string;
  description?: string;
}

export function RadioCards({
  options,
  defaultValue,
  name,
  className,
}: {
  options: RadioCardOption[];
  defaultValue?: string;
  name: string;
  className?: string;
}) {
  const [selected, setSelected] = useState(defaultValue ?? "");

  return (
    <div className={cn("grid gap-3", className)}>
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <label
            key={option.value}
            className={cn(
              "group relative flex cursor-pointer items-center gap-4 rounded-xl border px-5 py-4 transition-all duration-200",
              isSelected
                ? "border-sapphire-40 bg-sapphire-10 shadow-[var(--shadow-glow)]"
                : "border-onyx-20 bg-onyx-5 hover:border-onyx-30 hover:bg-onyx-10"
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isSelected}
              onChange={() => setSelected(option.value)}
              className="sr-only"
            />
            <div
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
                isSelected
                  ? "border-sapphire-60 bg-sapphire-60"
                  : "border-onyx-30 bg-transparent"
              )}
            >
              {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
            </div>
            <div className="min-w-0 flex-1">
              <span
                className={cn(
                  "block text-sm font-medium",
                  isSelected ? "text-sapphire-90" : "text-onyx-90"
                )}
              >
                {option.label}
              </span>
              {option.description && (
                <span className="block text-sm text-onyx-60">
                  {option.description}
                </span>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}
