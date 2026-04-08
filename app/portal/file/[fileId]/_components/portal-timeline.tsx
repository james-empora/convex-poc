"use client";

import { cn } from "@/lib/utils";
import type { PortalFile } from "@/lib/portal/fake-data";

interface Milestone {
  label: string;
  date: string; // ISO date
  shortDate: string;
}

const MILESTONES: Milestone[] = [
  { label: "Contract", date: "2026-03-01", shortDate: "Mar 1" },
  { label: "EMD Received", date: "2026-03-03", shortDate: "Mar 3" },
  { label: "Title Ordered", date: "2026-03-05", shortDate: "Mar 5" },
  { label: "Commitment", date: "2026-03-15", shortDate: "Mar 15" },
  { label: "Survey", date: "2026-03-22", shortDate: "Mar 22" },
  { label: "Signing", date: "2026-04-12", shortDate: "Apr 12" },
  { label: "Closing", date: "2026-04-15", shortDate: "Apr 15" },
  { label: "Recorded", date: "2026-04-16", shortDate: "Apr 16" },
];

const TODAY = "2026-03-31";

function daysBetween(a: string, b: string) {
  return (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24);
}

/** Forward + backward pass to push apart any adjacent items closer than minGap %. */
function enforceMinGap(
  raw: number[],
  minGap: number,
  lo = 0,
  hi = 100,
): number[] {
  const n = raw.length;
  const r = [...raw];
  for (let i = 1; i < n; i++) r[i] = Math.max(r[i], r[i - 1] + minGap);
  r[n - 1] = Math.min(r[n - 1], hi);
  for (let i = n - 2; i >= 0; i--) r[i] = Math.min(r[i], r[i + 1] - minGap);
  r[0] = Math.max(r[0], lo);
  return r;
}

interface PortalTimelineProps {
  file: PortalFile;
}

export function PortalTimeline({ file: _file }: PortalTimelineProps) {
  const firstDate = MILESTONES[0].date;
  const lastDate = MILESTONES[MILESTONES.length - 1].date;
  const totalDays = daysBetween(firstDate, lastDate);

  // Date-proportional spacing, inset from edges so labels don't overflow
  const INSET = 8;
  const rawPcts = MILESTONES.map(
    (m) =>
      INSET + (daysBetween(firstDate, m.date) / totalDays) * (100 - INSET * 2),
  );
  const pcts = enforceMinGap(rawPcts, 7, INSET, 100 - INSET);

  const positions = MILESTONES.map((m, i) => ({
    ...m,
    pct: pcts[i],
    isPast: m.date <= TODAY,
    isAbove: i % 2 === 0,
  }));

  // Interpolate Today between the two adjusted milestone positions it falls between
  const n = MILESTONES.length;
  const nextIdx = MILESTONES.findIndex((m) => m.date > TODAY);
  let todayPct: number;
  if (nextIdx <= 0) {
    todayPct = nextIdx === 0 ? pcts[0] : pcts[n - 1];
  } else {
    const frac =
      daysBetween(MILESTONES[nextIdx - 1].date, TODAY) /
      daysBetween(MILESTONES[nextIdx - 1].date, MILESTONES[nextIdx].date);
    todayPct = pcts[nextIdx - 1] + frac * (pcts[nextIdx] - pcts[nextIdx - 1]);
  }

  return (
        <div className="relative" style={{ height: "5rem" }}>
          {/* Horizontal line — past (solid) */}
          <div
            className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-sapphire-60"
            style={{
              left: `${pcts[0]}%`,
              width: `${todayPct - pcts[0]}%`,
            }}
          />
          {/* Horizontal line — future (dashed) */}
          <div
            className="absolute top-1/2 -translate-y-1/2 border-t-2 border-dashed border-onyx-20"
            style={{
              left: `${todayPct}%`,
              width: `${pcts[n - 1] - todayPct}%`,
            }}
          />

          {/* Milestones */}
          {positions.map((m) => {
            const labelBlock = (
              <div className="flex flex-col items-center gap-0.5 whitespace-nowrap">
                <span
                  className={cn(
                    "text-[11px] font-medium leading-tight",
                    m.isPast ? "text-onyx-100" : "text-onyx-40",
                  )}
                >
                  {m.label}
                </span>
                <span
                  className={cn(
                    "text-[10px] leading-tight",
                    m.isPast ? "text-onyx-50" : "text-onyx-30",
                  )}
                >
                  {m.shortDate}
                </span>
              </div>
            );

            const dot = (
              <div
                className={cn(
                  "relative z-10 h-3 w-3 shrink-0 rounded-full border-2",
                  m.isPast
                    ? "border-sapphire-60 bg-sapphire-60"
                    : "border-onyx-30 bg-white",
                )}
              />
            );

            return (
              <div
                key={m.label}
                className="absolute flex flex-col items-center gap-1"
                style={{
                  left: `${m.pct}%`,
                  transform: "translateX(-50%)",
                  ...(m.isAbove
                    ? { bottom: "50%", marginBottom: "-6px" }
                    : { top: "50%", marginTop: "-6px" }),
                }}
              >
                {m.isAbove ? (
                  <>
                    {labelBlock}
                    {dot}
                  </>
                ) : (
                  <>
                    {dot}
                    {labelBlock}
                  </>
                )}
              </div>
            );
          })}

          {/* Today marker */}
          <div
            className="absolute flex flex-col items-center gap-1"
            style={{
              left: `${todayPct}%`,
              transform: "translateX(-50%)",
              top: "50%",
              marginTop: "-7px",
            }}
          >
            <div className="relative z-20 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white bg-sapphire-60 shadow-[0_0_0_3px_rgba(70,112,255,0.25)]" />
            <span className="text-[11px] font-semibold text-sapphire-60">
              Today
            </span>
          </div>
        </div>
  );
}
