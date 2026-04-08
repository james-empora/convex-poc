import type { DataGap, DealSnapshot } from "./types";

function countDataPoints(data: unknown): number {
  if (!data) return 0;
  if (Array.isArray(data)) return data.length;
  if (typeof data === "object") return Object.keys(data as Record<string, unknown>).length;
  return 1;
}

export function identifyDataGaps(snapshot: DealSnapshot): DataGap[] {
  const gaps: DataGap[] = [];

  if (snapshot.workflow && countDataPoints(snapshot.workflow) > 0) {
    gaps.push({
      domain: "Workflows",
      description: "Workflow trees and status transitions are not modeled locally yet.",
      dataPointCount: countDataPoints(snapshot.workflow),
      rawData: snapshot.workflow,
    });
  }

  if (snapshot.ctcPlan && countDataPoints(snapshot.ctcPlan) > 0) {
    gaps.push({
      domain: "CTC Plan",
      description: "Clear-to-close planning details and section statuses are not modeled locally yet.",
      dataPointCount: countDataPoints(snapshot.ctcPlan),
      rawData: snapshot.ctcPlan,
    });
  }

  if (snapshot.signing && countDataPoints(snapshot.signing) > 0) {
    gaps.push({
      domain: "Signing",
      description: "Signing appointments, signer states, and notary logistics are not modeled locally yet.",
      dataPointCount: countDataPoints(snapshot.signing),
      rawData: snapshot.signing,
    });
  }

  if (snapshot.recording && countDataPoints(snapshot.recording) > 0) {
    gaps.push({
      domain: "Recording",
      description: "Recording submission state and county package details are not modeled locally yet.",
      dataPointCount: countDataPoints(snapshot.recording),
      rawData: snapshot.recording,
    });
  }

  if (snapshot.actionItems && countDataPoints(snapshot.actionItems) > 0) {
    gaps.push({
      domain: "Action Items",
      description: "Legacy operational tasks are not fully mapped to local models yet.",
      dataPointCount: countDataPoints(snapshot.actionItems),
      rawData: snapshot.actionItems,
    });
  }

  if (snapshot.notes && countDataPoints(snapshot.notes) > 0) {
    gaps.push({
      domain: "Notes",
      description: "Internal deal notes are not modeled locally yet.",
      dataPointCount: countDataPoints(snapshot.notes),
      rawData: snapshot.notes,
    });
  }

  if (snapshot.messages && countDataPoints(snapshot.messages) > 0) {
    gaps.push({
      domain: "Messages",
      description: "External party messaging history is not modeled locally yet.",
      dataPointCount: countDataPoints(snapshot.messages),
      rawData: snapshot.messages,
    });
  }

  return gaps;
}
