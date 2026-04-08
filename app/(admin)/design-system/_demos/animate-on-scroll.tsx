"use client";

import { useRef, useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AnimateOnScroll({
  children,
  className,
  animation = "animate-fade-up",
}: {
  children: ReactNode;
  className?: string;
  animation?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.style.opacity = "0";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "";
          el.classList.add(animation);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      el.classList.remove(animation);
    };
  }, [animation]);

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
