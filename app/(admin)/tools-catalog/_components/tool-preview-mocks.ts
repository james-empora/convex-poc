import type { ToolDetailKind } from "@/lib/tools/define-tool";

type PreviewMock = { input: unknown; output: unknown };

/**
 * Returns realistic mock input/output data for rendering ToolCallCard previews.
 * Exhaustive switch ensures compile-time safety when new detail kinds are added.
 */
export function getPreviewMocks(detailKind: ToolDetailKind): PreviewMock {
  switch (detailKind) {
    case "register":
      return {
        input: { name: "lease_agreement.pdf" },
        output: { extractionTriggered: true },
      };

    case "extract":
      return {
        input: {},
        output: { success: true, totalPages: 12 },
      };

    case "open-file":
      return {
        input: { addressLine1: "123 Main St", city: "Austin", state: "TX" },
        output: { address: "123 Main St, Austin, TX" },
      };

    case "search":
      return {
        input: { query: "John Smith" },
        output: [
          { id: 1, name: "John Smith" },
          { id: 2, name: "John Doe" },
        ],
      };

    case "create-entity":
      return {
        input: { entityType: "individual", firstName: "Jane", lastName: "Doe" },
        output: { name: "Jane Doe" },
      };

    case "add-party":
      return {
        input: { role: "borrower" },
        output: { entityName: "Jane Doe" },
      };

    case "remove-party":
      return {
        input: {},
        output: {},
      };

    case "ledger-summary":
      return {
        input: {},
        output: {
          partyBalances: [
            {
              partyName: "Buyer",
              role: "borrower",
              balanceCents: -50000,
              totalReceiptsCents: 100000,
              totalDisbursementsCents: 150000,
            },
            {
              partyName: "Seller",
              role: "seller",
              balanceCents: 50000,
              totalReceiptsCents: 150000,
              totalDisbursementsCents: 100000,
            },
          ],
        },
      };

    case "line-items":
      return {
        input: {},
        output: {
          items: [
            { label: "Appraisal Fee", actualAmountCents: 50000, section: "Charges" },
            { label: "Title Insurance", actualAmountCents: 125000, section: "Charges" },
            { label: "Recording Fee", actualAmountCents: 7500, section: "Charges" },
          ],
          count: 3,
        },
      };

    case "add-line-item":
      return {
        input: {},
        output: { label: "Recording Fee", amountCents: 7500 },
      };

    case "update-line-item":
      return {
        input: {},
        output: {
          previousAmountCents: 50000,
          newAmountCents: 55000,
          reason: "Updated per lender requirements",
        },
      };

    case "proposal":
      return {
        input: {},
        output: {
          triggerDetail: "Closing moved to April 20",
          items: [
            {
              lineItemLabel: "Appraisal Fee",
              oldAmountCents: 50000,
              newAmountCents: 55000,
              action: "updated",
            },
            {
              lineItemLabel: "Discount",
              oldAmountCents: null,
              newAmountCents: 10000,
              action: "added",
            },
          ],
          netImpact: {
            parties: [{ partyName: "Seller", deltaCents: -45000 }],
          },
        },
      };

    case "apply-proposal":
      return {
        input: {},
        output: { message: "Proposal applied — 2 line items updated" },
      };

    case "dismiss-proposal":
      return {
        input: {},
        output: { message: "Proposal dismissed" },
      };

    case "what-if":
      return {
        input: {},
        output: {
          question: "What if closing moves to April 20?",
          changes: [
            { label: "Appraisal Fee", currentCents: 50000, projectedCents: 55000 },
            { label: "Total Costs", currentCents: 500000, projectedCents: 505000 },
          ],
          netImpact: [
            { partyName: "Buyer", deltaCents: 5000 },
            { partyName: "Seller", deltaCents: -5000 },
          ],
        },
      };

    case "payments":
      return {
        input: {},
        output: {
          payments: [
            { paymentType: "Wire", amountCents: 250000, status: "completed" },
            { paymentType: "Check", amountCents: 75000, status: "pending" },
          ],
        },
      };
  }
}
