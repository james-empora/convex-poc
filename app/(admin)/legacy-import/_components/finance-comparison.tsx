"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLedger, useLineItems, usePayments } from "@/lib/finances/queries";
import type { DealImportRecord } from "@/lib/legacy-import/types";

export function FinanceComparison({ deal }: { deal: DealImportRecord }) {
  const ledger = useLedger(deal.fileId);
  const lineItems = useLineItems(deal.ledgerId);
  const payments = usePayments(deal.ledgerId);

  if (!deal.ledgerId) {
    return null;
  }

  const ledgerData = ledger.data;
  const lineItemList = lineItems.data?.items ?? [];
  const paymentList = payments.data?.payments ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Imported Ledger Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <div className="text-xs text-[#8C8986]">Ledger Type</div>
              <div className="text-sm font-medium text-[#1A1916]">
                {ledgerData?.ledgerType ?? "deal"}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#8C8986]">Line Items</div>
              <div className="text-sm font-medium text-[#1A1916]">
                {deal.financeStats?.lineItemCount ?? lineItemList.length}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#8C8986]">Payments</div>
              <div className="text-sm font-medium text-[#1A1916]">
                {deal.financeStats?.paymentCount ?? paymentList.length}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#8C8986]">Charges</div>
              <div className="text-sm font-medium text-[#1A1916]">
                {deal.financeStats?.chargeCount ?? 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {ledgerData?.partyBalances && ledgerData.partyBalances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Party Balances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ledgerData.partyBalances.map((partyBalance) => {
                const balanceCents = partyBalance.balanceCents;
                const isFunded = partyBalance.isFunded ?? balanceCents <= 0;
                return (
                  <div
                    key={partyBalance.partyId}
                    className="flex items-center justify-between rounded-md border border-[#E5E2DF] p-2"
                  >
                    <div>
                      <span className="text-sm font-medium text-[#1A1916]">
                        {partyBalance.partyName}
                      </span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {partyBalance.partySide.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-sm font-mono ${balanceCents >= 0 ? "text-[#E8524A]" : "text-[#36A386]"}`}
                      >
                        ${Math.abs(balanceCents / 100).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                      <div className="text-xs text-[#8C8986]">
                        {isFunded ? "Funded" : "Not funded"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {lineItemList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Line Items ({lineItemList.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 space-y-1 overflow-y-auto">
              {lineItemList.map((lineItem) => (
                <div
                  key={lineItem.id}
                  className="flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-[#F5F3F0]"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[#1A1916]">{lineItem.label}</span>
                    {lineItem.verified && (
                      <Badge variant="secondary" className="text-xs">
                        verified
                      </Badge>
                    )}
                  </div>
                  <span className="font-mono text-[#1A1916]">
                    ${(lineItem.actualAmountCents / 100).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
