"use client";

import { useState, useRef, useLayoutEffect } from "react";
import { cn } from "@/lib/utils";

export function SegmentedControl({
  options,
  defaultValue,
  name,
  className,
}: {
  options: { value: string; label: string }[];
  defaultValue?: string;
  name: string;
  className?: string;
}) {
  const [selected, setSelected] = useState(defaultValue ?? options[0]?.value ?? "");
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const activeEl = container.querySelector<HTMLElement>(
      `[data-value="${selected}"]`
    );
    if (!activeEl) return;
    setIndicator({
      left: activeEl.offsetLeft,
      width: activeEl.offsetWidth,
    });
  }, [selected]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative inline-flex items-center gap-1 rounded-xl bg-onyx-10 p-1",
        className
      )}
    >
      {/* Sliding indicator */}
      <div
        className="absolute top-1 bottom-1 rounded-lg bg-white shadow-[var(--shadow-soft)] transition-all duration-300 ease-[var(--ease-spring)]"
        style={{ left: indicator.left, width: indicator.width }}
      />
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <label
            key={option.value}
            data-value={option.value}
            className="relative z-10 cursor-pointer"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isSelected}
              onChange={() => setSelected(option.value)}
              className="sr-only"
            />
            <span
              className={cn(
                "block rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200",
                isSelected
                  ? "text-onyx-100"
                  : "text-onyx-60 hover:text-onyx-80"
              )}
            >
              {option.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}
