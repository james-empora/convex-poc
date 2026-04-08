import { describe, expect, it } from "vitest";
import { identifyDataGaps } from "./deal-gaps";
import { deriveMilestoneProgress } from "./deal-progress";
import {
  extractAddress,
  extractDocuments,
  extractLineItems,
  extractParties,
  extractPayments,
  mapFileStatus,
  mapFileType,
} from "./snapshot-mappers";
import type { DealSnapshot } from "./types";

function makeSnapshot(overrides: Partial<DealSnapshot> = {}): DealSnapshot {
  return {
    dealInfo: {},
    titleholders: {},
    documents: {},
    ledgerStatus: null,
    lineItems: null,
    paymentStatus: null,
    fundingStatus: null,
    workflow: null,
    ctcPlan: null,
    signing: null,
    recording: null,
    actionItems: null,
    notes: null,
    messages: null,
    fetchedAt: "2026-04-08T12:00:00Z",
    ...overrides,
  };
}

describe("legacy import mappers", () => {
  it("extracts nested address data", () => {
    expect(
      extractAddress({
        property: {
          parcel_number: "12-345",
          legal_description: "LOT 1",
          address: {
            street_address: "456 Oak Ave",
            city: "Savannah",
            state: "GA",
            zip_code: "31401",
          },
        },
      }),
    ).toEqual({
      addressLine1: "456 Oak Ave",
      addressLine2: undefined,
      city: "Savannah",
      state: "GA",
      zip: "31401",
      county: undefined,
      parcelNumber: "12-345",
      legalDescription: "LOT 1",
    });
  });

  it("maps file type and status from Rails values", () => {
    expect(mapFileType({ transaction_type: "refi" })).toBe("refinance");
    expect(mapFileStatus({ status: { status: "Completed" } })).toBe("recorded");
  });

  it("extracts titleholder parties from split buyer/seller arrays", () => {
    const parties = extractParties(
      makeSnapshot({
        titleholders: {
          individual_titleholders: [
            { deal_side: "future", first_name: "Jane", last_name: "Doe", email: "jane@test.com" },
          ],
          entity_titleholders: [
            { deal_side: "current", entity_name: "Acme LLC" },
          ],
        },
      }),
    );

    expect(parties).toHaveLength(2);
    expect(parties[0]).toMatchObject({
      railsPartyId: "future",
      entityName: "Jane Doe",
      sourceType: "individual",
      role: "buyer",
      side: "buyer_side",
      email: "jane@test.com",
    });
    expect(parties[1]).toMatchObject({
      railsPartyId: "current",
      entityName: "Acme LLC",
      sourceType: "entity",
      role: "seller",
      side: "seller_side",
    });
  });

  it("extracts documents, line items, and payments from mixed shapes", () => {
    const snapshot = makeSnapshot({
      documents: {
        documents: [{ document_id: "d1", display_name: "Contract", type: "contract" }],
      },
      lineItems: {
        line_items: [
          {
            label: "Title Fee",
            settlement_statement_section: "title",
            line_item_type: "title_fee",
            actual_amount_cents: 50000,
            charges: [
              {
                party_key: "future",
                party_name: "Buyer",
                debit_cents: 50000,
                credit_cents: 0,
              },
            ],
          },
        ],
      },
      paymentStatus: {
        payments: {
          receipts: {
            by_status: {
              pending: {
                items: [
                  {
                    party_key: "future",
                    party_name: "Buyer",
                    payment_method: "wire_transfer",
                    amount_cents: 50000,
                  },
                ],
              },
            },
          },
        },
      },
    });

    expect(extractDocuments(snapshot)[0]).toMatchObject({
      railsDocId: "d1",
      displayName: "Contract",
      documentType: "purchase_contract",
    });
    expect(extractLineItems(snapshot)[0]).toMatchObject({
      label: "Title Fee",
      section: "title_charges",
      actualAmountCents: 50000,
    });
    expect(extractPayments(snapshot)[0]).toMatchObject({
      railsPartyId: "future",
      partyName: "Buyer",
      method: "wire",
      amountCents: 50000,
    });
  });

  it("derives milestone progress and data gaps", () => {
    const snapshot = makeSnapshot({
      dealInfo: { status: "funded", opened_at: "2026-04-01T12:00:00Z" },
      documents: { documents: [{ document_type: "title_commitment", uploaded_at: "2026-04-02T12:00:00Z" }] },
      ctcPlan: { status: "approved", approved_at: "2026-04-03T12:00:00Z" },
      signing: { status: "completed", completed_at: "2026-04-04T12:00:00Z" },
      workflow: { active: true },
      notes: { count: 2 },
    });

    expect(deriveMilestoneProgress(snapshot).map((item) => item.status)).toEqual([
      "completed",
      "completed",
      "completed",
      "completed",
      "completed",
    ]);

    expect(identifyDataGaps(snapshot).map((gap) => gap.domain)).toEqual([
      "Workflows",
      "CTC Plan",
      "Signing",
      "Notes",
    ]);
  });
});
