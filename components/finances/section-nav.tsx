"use client";

import { useState, useEffect, useCallback } from "react";
import { FileSpreadsheet, Banknote, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "section-ledger", label: "Ledger", icon: FileSpreadsheet },
  { id: "section-payments", label: "Payments", icon: Banknote },
  { id: "section-supporting", label: "Supporting", icon: Info },
] as const;

export function SectionNav({
  scrollContainerRef,
}: {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);

  // Scroll spy via IntersectionObserver
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first section that is at least partially visible
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      {
        root: container,
        rootMargin: "-20% 0px -60% 0px", // Trigger when section is in top 40% of viewport
        threshold: 0,
      },
    );

    for (const section of SECTIONS) {
      const el = container.querySelector(`#${section.id}`);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [scrollContainerRef]);

  const handleClick = useCallback(
    (sectionId: string) => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const el = container.querySelector(`#${sectionId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setActiveId(sectionId);
      }
    },
    [scrollContainerRef],
  );

  return (
    <nav className="flex w-[120px] shrink-0 flex-col gap-1 py-4 pl-4 pr-2">
      {SECTIONS.map((section) => {
        const isActive = activeId === section.id;
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => handleClick(section.id)}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
              isActive
                ? "font-semibold text-sapphire-70"
                : "text-onyx-60 hover:text-onyx-80",
            )}
          >
            <div
              className={cn(
                "h-4 w-0.5 shrink-0 rounded-full transition-colors",
                isActive ? "bg-sapphire-60" : "bg-transparent",
              )}
            />
            {section.label}
          </button>
        );
      })}
    </nav>
  );
}
