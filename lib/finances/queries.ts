"use client";

import { api } from "@/convex/_generated/api";
import { useConvexMutationResult, useConvexQueryResult } from "@/lib/convex/hooks";

export function useLedger(fileId: string | null) {
  return useConvexQueryResult(api.finances.getLedger, fileId ? { fileId } : "skip");
}

export function useLineItems(ledgerId: string | null) {
  return useConvexQueryResult(api.finances.getLineItems, ledgerId ? { ledgerId } : "skip");
}

export function usePayments(ledgerId: string | null) {
  return useConvexQueryResult(api.finances.getPayments, ledgerId ? { ledgerId } : "skip");
}

export function useCreateLedger() {
  return useConvexMutationResult(api.finances.createLedger);
}

export function useAddLineItem(_ledgerId: string | null) {
  return useConvexMutationResult(api.finances.addLineItem);
}

export function useUpdateLineItem(_ledgerId: string | null) {
  return useConvexMutationResult(api.finances.updateLineItem);
}

export function useCreatePayment(_ledgerId: string | null) {
  return useConvexMutationResult(api.finances.createPayment);
}
