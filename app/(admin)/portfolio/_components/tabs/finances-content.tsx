"use client";

import { useMemo, useState, useRef } from "react";
import { Loader2, Plus, Upload, FileText, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LedgerSummaryBar } from "@/components/finances/ledger-summary-bar";
import { ProposalBanner } from "@/components/finances/proposal-banner";
import { SkillsDropdown } from "@/components/composite/skills-dropdown";
import { SettlementStatement } from "@/components/finances/settlement-statement";
import { PaymentsPanel } from "@/components/finances/payments-panel";
import { SupportingDetails } from "@/components/finances/supporting-details";
import { StatementViewToggle } from "@/components/finances/statement-view-toggle";
import { SectionNav } from "@/components/finances/section-nav";
import { useLedger, useLineItems, usePayments, useCreateLedger, useAddLineItem, useUpdateLineItem } from "@/lib/finances/queries";
import { useFile } from "@/lib/files/queries";
import { useOpenChatWithPrompt } from "@/app/(admin)/portfolio/_components/use-open-chat-with-prompt";
import { runSkillAction } from "@/lib/skills/run-skill.server";
import { useRouter } from "next/navigation";
import type { ChatResource } from "@/lib/chat/types";
import type { LineItemMutationCallbacks } from "@/components/finances/line-item-row";
import type {
  Proposal,
  LedgerSnapshot,
  LineItemCharge,
  StatementSection,
} from "@/types/finance";

/* ---------- types ---------- */

interface FilePartyOption {
  id: string;
  name: string;
  role: string;
  side: LineItemCharge["partySide"];
}

/* ---------- empty state ---------- */

function EmptyFinancesState({ fileId }: { fileId: string }) {
  const openChatWithPrompt = useOpenChatWithPrompt();
  const createLedger = useCreateLedger();
  const financesResource: ChatResource = { type: "file", id: fileId };

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-onyx-10">
        <Table2 className="h-8 w-8 text-onyx-30" />
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-onyx-70">
          No settlement statement yet
        </p>
        <p className="mt-1 max-w-sm text-sm text-onyx-40">
          Get started by uploading a contract, creating a blank ledger, or
          letting AI generate the statement from deal terms.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() =>
            openChatWithPrompt(
              "I want to upload a contract and generate the settlement statement from it. Please help me get started.",
              financesResource,
            )
          }
        >
          <Upload className="h-4 w-4" />
          Upload a Contract
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          disabled={createLedger.isPending}
          onClick={() => createLedger.mutate({ fileId })}
        >
          {createLedger.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Start Blank Ledger
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() =>
            openChatWithPrompt(
              "Generate the initial settlement statement for this file based on the deal terms from the contract.",
              financesResource,
            )
          }
        >
          <FileText className="h-4 w-4" />
          Generate from Deal Terms
        </Button>
      </div>
      {createLedger.isError && (
        <p className="text-xs text-danger-80">{createLedger.error?.message}</p>
      )}
    </div>
  );
}

/* ---------- main component ---------- */

export function FinancesContent({ fileId }: { fileId: string }) {
  const router = useRouter();
  const openChatWithPrompt = useOpenChatWithPrompt();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [addingLineItem, setAddingLineItem] = useState(false);

  const { data: ledger, isLoading: ledgerLoading } = useLedger(fileId);
  const { data: lineItemsData } = useLineItems(ledger?.id ?? null);
  const { data: paymentsData } = usePayments(ledger?.id ?? null);
  const { data: file } = useFile(fileId);

  const lineItems = lineItemsData?.items ?? [];
  const payments = paymentsData?.payments ?? [];
  const proposals: Proposal[] = [];
  const snapshots: LedgerSnapshot[] = [];

  const hasLedger = !!ledger;

  // Extract file parties for the add form
  const fileParties: FilePartyOption[] = useMemo(() => {
    const fileData = file as {
      parties?: {
        role: string;
        side: string | null;
        entities: { name: string; entityId: string; filePartyId?: string }[];
      }[];
    } | null;
    if (!fileData?.parties) return [];
    return fileData.parties.flatMap((group) =>
      group.entities
        .filter((entity) => !!entity.filePartyId)
        .map((entity) => ({
        id: entity.filePartyId!,
        name: entity.name,
        role: group.role,
        side: (group.side ?? "internal") as LineItemCharge["partySide"],
      })),
    );
  }, [file]);

  const updateLineItem = useUpdateLineItem(ledger?.id ?? null);

  const callbacks: LineItemMutationCallbacks = {
    onOverride: async (lineItemId, amountCents, reason) => {
      await updateLineItem.mutateAsync({
        lineItemId,
        actualAmountCents: amountCents,
        adjustmentReason: reason,
      });
    },
    onResync: async (lineItemId) => {
      const item = lineItems.find((li) => li.id === lineItemId);
      if (!item) return;
      await updateLineItem.mutateAsync({
        lineItemId,
        actualAmountCents: item.computedAmountCents,
        adjustmentReason: "Re-synced to computed value",
      });
    },
    onAskAI: (label, amountCents) => {
      const resource: ChatResource = ledger
        ? { type: "ledger", id: ledger.id }
        : { type: "file", id: fileId };
      openChatWithPrompt(
        `Tell me about the "${label}" line item on this file's settlement statement (currently $${(amountCents / 100).toFixed(2)}). Is this amount correct? How was it calculated?`,
        resource,
      );
    },
    onEdit: async (lineItemId, label, _section) => {
      await updateLineItem.mutateAsync({ lineItemId, label });
    },
  };

  if (ledgerLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-onyx-30" />
      </div>
    );
  }

  if (!hasLedger) {
    return (
      <div className="h-full overflow-y-auto bg-onyx-5 p-6">
        <EmptyFinancesState fileId={fileId} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-onyx-5">
      {/* Sticky balance overview */}
      <div className="shrink-0 border-b border-onyx-20 bg-onyx-5 px-6 py-3">
        <LedgerSummaryBar ledger={ledger} pendingProposalCount={proposals.filter((p) => p.status === "pending").length} />
      </div>

      {/* Nav + scrollable content */}
      <div className="flex min-h-0 flex-1">
        {/* Sticky section nav */}
        <SectionNav scrollContainerRef={scrollRef} />

        {/* Scrollable content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl space-y-4 px-6 py-4">
            {/* AI Proposals banner */}
            <ProposalBanner
              proposals={proposals}
              onApply={() => {}}
              onDismiss={() => {}}
            />

            {/* === LEDGER SECTION === */}
            <section id="section-ledger">
              {/* Statement toolbar */}
              <div className="mb-4 flex items-center justify-between">
                <StatementViewToggle />
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => setAddingLineItem(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Line Item
                  </Button>
                  <SkillsDropdown
                    domain="finances"
                    subDomain="ledger"
                    onSkillClick={(skill) => {
                      const resource: ChatResource = ledger
                        ? { type: "ledger", id: ledger.id }
                        : { type: "file", id: fileId };
                      openChatWithPrompt(skill.promptTemplate, resource, {
                        autoSend: skill.autoSend,
                        skill: skill.autoSend ? undefined : {
                          skillId: skill.id,
                          label: skill.label,
                          promptTemplate: skill.promptTemplate,
                        },
                        domain: "finances",
                      });
                    }}
                    onRunInBackground={async (skill, customPrompt) => {
                      await runSkillAction({
                        skillId: skill.id,
                        fileId,
                        resourceType: ledger ? "ledger" : "file",
                        resourceId: ledger ? ledger.id : fileId,
                        customPrompt,
                      });
                      router.refresh();
                    }}
                  />
                </div>
              </div>

              {/* Inline add line item form */}
              {addingLineItem && (
                <div className="mb-4">
                  <InlineAddLineItem
                    ledgerId={ledger.id}
                    parties={fileParties}
                    onClose={() => setAddingLineItem(false)}
                    onAdded={() => {
                      setAddingLineItem(false);
                    }}
                  />
                </div>
              )}

              {/* Settlement statement */}
              <div className="rounded-xl border border-onyx-20 bg-white">
                <SettlementStatement
                  lineItems={lineItems}
                  proposals={proposals}
                  callbacks={callbacks}
                />
              </div>
            </section>

            {/* === PAYMENTS SECTION === */}
            <section id="section-payments" className="scroll-mt-4 pt-2">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-onyx-50">
                Payments
              </h2>
              <PaymentsPanel
                payments={payments}
                ledgerId={ledger.id}
                parties={fileParties}
              />
            </section>

            {/* === SUPPORTING SECTION === */}
            <section id="section-supporting" className="scroll-mt-4 pt-2">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-onyx-50">
                Supporting Details
              </h2>
              <SupportingDetails snapshots={snapshots} />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- inline add form ---------- */

interface ChargeRow {
  partyId: string;
  amount: string;
}

interface ChargeAllocationInput {
  partyId: string;
  partyName: string;
  partySide: LineItemCharge["partySide"];
  debitCents: number;
  creditCents: number;
}

function InlineAddLineItem({
  ledgerId,
  parties,
  onClose,
  onAdded,
}: {
  ledgerId: string;
  parties: FilePartyOption[];
  onClose: () => void;
  onAdded: () => void;
}) {
  const [label, setLabel] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [section, setSection] = useState<StatementSection>("additional_charges");
  const [payeeId, setPayeeId] = useState("");
  const [isProration, setIsProration] = useState(false);
  const [prorationStrategy, setProrationStrategy] = useState<"365" | "360">("365");
  const [annualAmount, setAnnualAmount] = useState("");
  const [charges, setCharges] = useState<ChargeRow[]>([{ partyId: "", amount: "" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addLineItemMutation = useAddLineItem(ledgerId);

  const payee = parties.find((p) => p.id === payeeId);

  function addChargeRow() {
    setCharges([...charges, { partyId: "", amount: "" }]);
  }

  function removeChargeRow(index: number) {
    if (charges.length <= 1) return;
    setCharges(charges.filter((_, i) => i !== index));
  }

  function updateCharge(index: number, field: "partyId" | "amount", value: string) {
    setCharges(charges.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  }

  async function handleSave() {
    const totalCents = Math.round(parseFloat(totalAmount) * 100);
    if (!label.trim()) { setError("Enter a label."); return; }
    if (isNaN(totalCents) || totalCents <= 0) { setError("Enter a valid amount."); return; }
    if (!payeeId) { setError("Select a payee."); return; }

    // Validate charges
    const validCharges = charges.filter((c) => c.partyId);
    if (validCharges.length === 0) { setError("Add at least one payer."); return; }

    const usedPartyIds = new Set(validCharges.map((c) => c.partyId));
    if (usedPartyIds.has(payeeId)) { setError("A payer cannot also be the payee."); return; }

    setSaving(true);
    setError(null);
    try {
      // Build charge allocations: debit payers, credit payee
      const chargeAllocations: ChargeAllocationInput[] = validCharges.map((c) => {
        const party = parties.find((p) => p.id === c.partyId)!;
        const debitAmount = validCharges.length > 1 && c.amount
          ? Math.round(parseFloat(c.amount) * 100)
          : totalCents;
        return {
          partyId: c.partyId,
          partyName: party.name,
          partySide: party.side,
          debitCents: debitAmount,
          creditCents: 0,
        };
      });
      // Add the credit side (payee)
      if (payee) {
        chargeAllocations.push({
          partyId: payeeId,
          partyName: payee.name,
          partySide: payee.side,
          debitCents: 0,
          creditCents: totalCents,
        });
      }

      await addLineItemMutation.mutateAsync({
        ledgerId,
        label,
        section,
        amountCents: totalCents,
        charges: chargeAllocations,
      });
      onAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add line item");
    } finally {
      setSaving(false);
    }
  }

  const selectClass = "w-full rounded-md border border-onyx-20 bg-white px-2.5 py-1.5 text-sm";
  const inputClass = "w-full rounded-md border border-onyx-20 bg-white px-2.5 py-1.5 text-sm";

  return (
    <div className="rounded-xl border border-onyx-20 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-onyx-80">New Line Item</h3>
        <Button variant="ghost" size="sm" className="h-6 text-xs text-onyx-60" onClick={onClose}>
          Cancel
        </Button>
      </div>

      <div className="space-y-3">
        {/* Row 1: Label + Total Amount */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-medium text-onyx-50">Label</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Seller Credit — Repairs" className={inputClass} autoFocus />
          </div>
          <div>
            <label className="text-xs font-medium text-onyx-50">Total ($)</label>
            <input value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="2,000.00" inputMode="decimal" className={inputClass} />
          </div>
        </div>

        {/* Row 2: Section + Payee */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-onyx-50">Section</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value as StatementSection)}
              className={selectClass}
            >
              <option value="sale_price_and_credits">Sale Price &amp; Credits</option>
              <option value="title_charges">Title Charges</option>
              <option value="government_recording_and_transfer">Government Recording &amp; Transfer</option>
              <option value="lender_charges">Lender Charges</option>
              <option value="prepaid_items">Prepaid Items</option>
              <option value="escrow_reserves">Escrow Reserves</option>
              <option value="adjustments_and_prorations">Adjustments &amp; Prorations</option>
              <option value="payoffs_and_liens">Payoffs &amp; Liens</option>
              <option value="commissions">Commissions</option>
              <option value="additional_charges">Additional Charges</option>
              <option value="deposits_and_earnest_money">Deposits &amp; Earnest Money</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-onyx-50">Paid to (payee)</label>
            <select value={payeeId} onChange={(e) => setPayeeId(e.target.value)} className={selectClass}>
              <option value="">Select party...</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.role.replace(/_/g, " ")})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Charges (payers) — supports splits */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-onyx-50">Charged to (payer{charges.length > 1 ? "s" : ""})</label>
            <button type="button" onClick={addChargeRow} className="text-[11px] font-medium text-sapphire-60 hover:text-sapphire-70">
              + Split charge
            </button>
          </div>
          <div className="mt-1 space-y-1.5">
            {charges.map((charge, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={charge.partyId}
                  onChange={(e) => updateCharge(i, "partyId", e.target.value)}
                  className={cn(selectClass, charges.length > 1 ? "flex-1" : "w-full")}
                >
                  <option value="">Select party...</option>
                  {parties.filter((p) => p.id !== payeeId).map((p) => (
                    <option key={p.id} value={p.id} disabled={charges.some((c, j) => j !== i && c.partyId === p.id)}>
                      {p.name} ({p.role.replace(/_/g, " ")})
                    </option>
                  ))}
                </select>
                {charges.length > 1 && (
                  <>
                    <input
                      value={charge.amount}
                      onChange={(e) => updateCharge(i, "amount", e.target.value)}
                      placeholder="$"
                      inputMode="decimal"
                      className="w-24 rounded-md border border-onyx-20 bg-white px-2.5 py-1.5 text-sm"
                    />
                    <button type="button" onClick={() => removeChargeRow(i)} className="flex h-6 w-6 items-center justify-center rounded text-sm font-medium text-onyx-50 hover:bg-onyx-10 hover:text-onyx-80">
                      &times;
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Proration toggle */}
        <div className="flex items-center gap-2 border-t border-onyx-10 pt-3">
          <input
            type="checkbox"
            id="is-proration"
            checked={isProration}
            onChange={(e) => setIsProration(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-onyx-30"
          />
          <label htmlFor="is-proration" className="text-xs font-medium text-onyx-50">
            This is a proration
          </label>
        </div>

        {isProration && (
          <div className="grid grid-cols-2 gap-3 rounded-md border border-onyx-10 bg-onyx-5/50 p-3">
            <div>
              <label className="text-xs font-medium text-onyx-50">Strategy</label>
              <select value={prorationStrategy} onChange={(e) => setProrationStrategy(e.target.value as "365" | "360")} className={selectClass}>
                <option value="365">365-day year</option>
                <option value="360">360-day year</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-onyx-50">Annual amount ($)</label>
              <input value={annualAmount} onChange={(e) => setAnnualAmount(e.target.value)} placeholder="4,200.00" inputMode="decimal" className={inputClass} />
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-danger-80">{error}</p>}

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-onyx-10 pt-3">
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : null}
          Add Line Item
        </Button>
      </div>
    </div>
  );
}
