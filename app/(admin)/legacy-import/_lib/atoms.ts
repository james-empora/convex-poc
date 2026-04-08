"use client";

import { atom } from "jotai";
import type { MilestoneId } from "@/lib/legacy-import/types";

export const selectedDealIdAtom = atom<string | null>(null);
export const selectedMilestoneAtom = atom<MilestoneId | null>(null);

export type ImportTab = "finances" | "gaps";
export const importActiveTabAtom = atom<ImportTab>("finances");
