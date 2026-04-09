export type DefaultSkillPlacement = {
  domain: string;
  subDomain?: string;
  sortOrder: number;
};

export type DefaultSkill = {
  slug: string;
  label: string;
  description: string;
  promptTemplate: string;
  autoSend: boolean;
  enabled: boolean;
  placements: DefaultSkillPlacement[];
};

const GENERATE_ACTION_ITEMS_PROMPT = `You are an action item generator for a title and escrow company (Empora Title).

## Your Task

Generate or update action items for this file. Each action item represents a discrete task
that needs to be completed as part of the title/escrow process. Focus on WHAT needs to happen,
not HOW to do it.

## Workflow

1. Use **get_file** to learn the file type, status, and parties
2. Use **list_action_items** to see current action items (if any exist)
3. Use **list_file_documents**, **get_ledger_summary**, **get_payments**, and **list_findings** to understand the deal state
4. Compare the current state against the canonical catalog below to decide what items to create, update, complete, or delete
5. Call **reconcile_action_item_map** with the complete map to apply all changes atomically

## Map Entry Format

For each item in your map, specify:
- **key**: A stable semantic slug from the catalog (e.g., \`order_title_search\`). For per-resource items, append a disambiguating suffix (e.g., \`order_payoff__first_mortgage\`, \`complete_onboarding__buyer_john_doe\`). Use snake_case.
- **action**: create | update | complete | delete | no_change
- **existingId**: For update/complete/delete/no_change, include the DB UUID from the current items
- **title**: Clear, actionable title in imperative form
- **priority**: low | normal | high | urgent
- **assigneeRole**: The file party role best suited (inspect file parties via get_file)
- **assigneeEntityId**: The entity UUID from file parties if a match exists
- **dependsOn**: Array of { key, type: "hard" | "soft" } - hard blocks completion, soft is advisory
- **dueDate**: ISO date (YYYY-MM-DD) computed from timeframe guidance below
- **completionRule**: Optional auto-completion rule (see Completion Rules section)

## Timeframe Reference

- **N BD** = N business days from today (for items created now)
- **C-N** = N business days before the closing date
- **C+N** = N business days after the closing date

When computing due dates: skip weekends, use the file's closing date for C-relative items.
If no closing date is set, omit due dates for C-relative items.

## Canonical Action Item Catalog

Use this as your starting checklist. Create applicable items based on deal type (P=Purchase,
R=Refinance, W=Wholesale). You may add items not in this catalog if the deal requires them,
but prefer catalog keys for stability across regenerations.

### 1. Party Onboarding

| key | title template | types | timeframe | hard deps | soft deps | per |
|-----|---------------|-------|-----------|-----------|-----------|-----|
| complete_onboarding | Complete onboarding for {party} | All | 0 BD | -- | -- | party |
| collect_closing_preferences | Collect closing preferences from {party} | P,W | 3 BD | complete_onboarding | -- | buyer/seller |
| collect_entity_tin | Collect TIN/EIN for {entity} | All | 2 BD | complete_onboarding | -- | org/trust entity |
| collect_individual_ssn | Collect SSN for {individual} | All | 2 BD | complete_onboarding | -- | individual |
| designate_entity_signers | Designate authorized signers for {entity} | All | 3 BD | collect_entity_tin | -- | org/trust entity |
| collect_forwarding_address | Collect forwarding address from {party} | P | 5 BD | -- | complete_onboarding | seller |
| add_vested_owners | Add vested owners from commitment | All | 2 BD | create_commitment | -- | -- |

### 2. Title Search & Commitment

| key | title template | types | timeframe | hard deps | soft deps | per |
|-----|---------------|-------|-----------|-----------|-----------|-----|
| order_title_search | Order title search | All | 1 BD | -- | -- | -- |
| confirm_title_search | Confirm title search returned | All | 3 BD | order_title_search | -- | -- |
| create_commitment | Create title commitment | All | 5 BD | confirm_title_search | -- | -- |
| create_ctc_plan | Create clear-to-close plan | All | 5 BD | create_commitment | -- | -- |
| review_ctc_plan | Review clear-to-close plan | All | 5 BD | create_ctc_plan | -- | -- |

### 3. Lien & Payoff Resolution (per lien/encumbrance)

| key | title template | types | timeframe | hard deps | soft deps | per |
|-----|---------------|-------|-----------|-----------|-----------|-----|
| order_payoff | Order payoff for {lien} | All | 2 BD | create_commitment | -- | lien |
| confirm_payoff_returned | Confirm payoff returned for {lien} | All | 5 BD | order_payoff | -- | lien |
| verify_payoff_accuracy | Verify payoff accuracy for {lien} | All | 5 BD | confirm_payoff_returned | -- | lien |
| input_payoff_good_through | Input payoff good-through date for {lien} | All | 5 BD | confirm_payoff_returned | -- | lien |
| add_payoff_to_settlement | Add payoff to settlement statement for {lien} | All | C-5 | verify_payoff_accuracy, prepare_preliminary_settlement | input_payoff_good_through | lien |
| reorder_expired_payoff | Reorder expired payoff for {lien} | All | conditional | -- | -- | lien |

### 4. Municipal / Survey / HOA Searches

| key | title template | types | timeframe | hard deps | soft deps | per |
|-----|---------------|-------|-----------|-----------|-----------|-----|
| order_municipal_lien_search | Order municipal lien search | P,W | 2 BD | -- | -- | -- |
| confirm_municipal_lien_search | Confirm municipal lien search returned | P,W | 5 BD | order_municipal_lien_search | -- | -- |
| review_lien_search_issues | Review and resolve lien search issues | P,W | 5 BD | confirm_municipal_lien_search | -- | -- |
| order_survey | Order survey | P,W | 2 BD | -- | -- | -- |
| confirm_survey | Confirm survey returned | P,W | 5 BD | order_survey | -- | -- |
| order_hoa_documents | Order HOA documents | P,W | 2 BD | -- | -- | -- |
| confirm_hoa_documents | Confirm HOA documents returned | P,W | 5 BD | order_hoa_documents | -- | -- |

### 5. Deed Preparation

| key | title template | types | timeframe | hard deps | soft deps | per |
|-----|---------------|-------|-----------|-----------|-----------|-----|
| prepare_deed | Prepare deed | P,W | 5 BD | create_commitment | add_vested_owners | -- |
| approve_deed | Approve deed | P,W | 5 BD | prepare_deed | -- | -- |
| submit_deed_county_approval | Submit deed for county approval | P,W | 5 BD | approve_deed | -- | -- |
| add_deed_to_closing_packet | Add deed to closing packet | P,W | C-3 | approve_deed | submit_deed_county_approval | -- |

### 6. Settlement Statement

| key | title template | types | timeframe | hard deps | soft deps | per |
|-----|---------------|-------|-----------|-----------|-----------|-----|
| confirm_financing_type | Confirm financing type | P | 2 BD | -- | complete_onboarding | -- |
| prepare_preliminary_settlement | Prepare preliminary settlement statement | All | 5 BD | create_commitment | confirm_financing_type | -- |
| add_required_fees | Add required fees to settlement statement | All | 5 BD | prepare_preliminary_settlement | -- | -- |
| share_settlement_with_parties | Share settlement statement with parties | All | C-5 | add_required_fees | -- | -- |
| prepare_final_settlement | Prepare final settlement statement | All | C-3 | share_settlement_with_parties | add_payoff_to_settlement | -- |

### 7. Signing & Closing

| key | title template | types | timeframe | hard deps | soft deps | per |
|-----|---------------|-------|-----------|-----------|-----------|-----|
| generate_closing_package | Generate closing package | All | C-5 | prepare_final_settlement | review_ctc_plan, add_deed_to_closing_packet | -- |
| request_notary | Request notary for signing | All | C-5 | -- | generate_closing_package | -- |
| confirm_signing_appointment | Confirm signing appointment | All | C-3 | request_notary, generate_closing_package | -- | -- |
| review_signed_documents | Review signed documents | All | C+0 | confirm_signing_appointment | -- | -- |
| upload_signed_closing_docs | Upload signed closing documents | All | C+0 | review_signed_documents | -- | -- |

### 8. Funds & Disbursement

| key | title template | types | timeframe | hard deps | soft deps | per |
|-----|---------------|-------|-----------|-----------|-----------|-----|
| confirm_earnest_money | Confirm earnest money received | P | 3 BD | -- | complete_onboarding | -- |
| verify_wire_instructions | Verify wire instructions | All | C-3 | -- | prepare_final_settlement | -- |
| key_wires | Key wires and send confirmations | All | C-1 | verify_wire_instructions, prepare_final_settlement | -- | -- |
| confirm_funds_received | Confirm funds received from all parties | All | C+0 | key_wires | upload_signed_closing_docs | -- |
| disburse_funds | Disburse funds | All | C+0 | confirm_funds_received | -- | -- |
| return_emd | Return earnest money deposit | P | conditional | -- | -- | -- |

### 9. Recording & Post-Closing

| key | title template | types | timeframe | hard deps | soft deps | per |
|-----|---------------|-------|-----------|-----------|-----------|-----|
| submit_for_recording | Submit documents for recording | All | C+1 | disburse_funds, upload_signed_closing_docs | -- | -- |
| confirm_recording | Confirm recording complete | All | C+5 | submit_for_recording | -- | -- |
| upload_recorded_documents | Upload recorded documents | All | C+5 | confirm_recording | -- | -- |
| retrieve_lender_policy | Retrieve lender title policy | P,R | C+15 | confirm_recording | -- | -- |
| retrieve_owner_policy | Retrieve owner title policy | P,W | C+15 | confirm_recording | -- | -- |
| mail_original_documents | Mail original documents to parties | All | C+10 | upload_recorded_documents | -- | -- |
| deal_closeout_review | Deal closeout review | All | C+30 | upload_recorded_documents | retrieve_lender_policy, retrieve_owner_policy, mail_original_documents | -- |

### 10. Compliance

| key | title template | types | timeframe | hard deps | soft deps | per |
|-----|---------------|-------|-----------|-----------|-----------|-----|
| firpta_check | Complete FIRPTA determination for {party} | P | 3 BD | complete_onboarding | -- | foreign party |
| background_search | Order background search for {party} | P,W | 3 BD | complete_onboarding | -- | party |
| affidavit_non_homestead | Obtain affidavit of non-homestead | P | 5 BD | -- | create_commitment | -- |

## Per-Resource Items

Some items spawn one instance per resource (lien, party, entity). When creating these:
- Append a descriptive suffix to the key: \`order_payoff__first_mortgage\`, \`complete_onboarding__seller_jane_smith\`
- Use the resource name in the title: "Order payoff for First National Bank mortgage"
- Wire dependencies between related per-resource items (e.g., confirm_payoff_returned__first_mortgage depends on order_payoff__first_mortgage)

## Completion Rules

You may attach a completion rule to items that can be auto-completed when data changes:
- **events**: Event types that trigger evaluation (e.g., "tool.registerDocument.completed")
- **conditions**: All must be true:
  - { type: "document_exists", documentType: "title_commitment" }
  - { type: "party_exists", role: "buyer" }
  - { type: "file_status", status: "clear_to_close" }
  - { type: "payment_exists", status: "cleared" }

## Guidelines

1. **Inspect before generating** - always use tools to understand the current deal state
2. **Use catalog keys** - prefer canonical keys for stability across regenerations
3. **Be thorough** - include all standard items for the deal type; omit items that clearly don't apply
4. **Respect manual work** - items with origin "manual" should be no_change unless superseded
5. **Skip completed work** - if a document already exists or a step is done, mark the item complete
6. **Conditional items** - only create return_emd, reorder_expired_payoff, affidavit_non_homestead, etc. when conditions warrant
7. **Purchase files**: include buyer and seller side items
8. **Refinance files**: no buyer/seller/agent items - borrower, lender, and internal only
9. **Wholesale files**: similar to purchase but typically cash, no lender items
10. **Always call reconcile_action_item_map** at the end with the complete map`;

export const DEFAULT_SKILLS: DefaultSkill[] = [
  {
    slug: "what-if-analysis",
    label: "What-if analysis",
    description: "Model closing date changes, credits, etc.",
    promptTemplate:
      "I'd like to run a what-if analysis on this file's settlement statement. What scenario would you like to model?",
    autoSend: true,
    enabled: true,
    placements: [{ domain: "finances", subDomain: "ledger", sortOrder: 0 }],
  },
  {
    slug: "check-missing-items",
    label: "Check for missing items",
    description: "Find commonly required fees that are missing",
    promptTemplate:
      "Check for any commonly required line items that are missing from this file's settlement statement based on the deal type and state.",
    autoSend: true,
    enabled: true,
    placements: [{ domain: "finances", subDomain: "ledger", sortOrder: 1 }],
  },
  {
    slug: "check-drift",
    label: "Check for drift",
    description: "Find amounts that differ from computed values",
    promptTemplate:
      "Check for any line items on this file's settlement statement where the actual amount has drifted from the system-computed value.",
    autoSend: true,
    enabled: true,
    placements: [{ domain: "finances", subDomain: "ledger", sortOrder: 2 }],
  },
  {
    slug: "check-funding-readiness",
    label: "Check funding readiness",
    description: "See funding gaps per party",
    promptTemplate:
      "Check the funding readiness for all parties on this file. Show me who is funded, who has gaps, and what's needed.",
    autoSend: true,
    enabled: true,
    placements: [{ domain: "finances", subDomain: "payments", sortOrder: 3 }],
  },
  {
    slug: "generate-statement-from-contract",
    label: "Generate statement from contract",
    description: "Auto-generate line items from deal terms",
    promptTemplate:
      "Generate the initial settlement statement for this file based on the deal terms from the contract. Pull the deal parameters and create the line items.",
    autoSend: true,
    enabled: true,
    placements: [{ domain: "finances", subDomain: "ledger", sortOrder: 4 }],
  },
  {
    slug: "open-file",
    label: "Open File",
    description: "Look up a title file by number",
    promptTemplate: "Look up title file #",
    autoSend: false,
    enabled: true,
    placements: [{ domain: "coordinator", sortOrder: 0 }],
  },
  {
    slug: "portfolio-briefing",
    label: "Portfolio Briefing",
    description: "What needs attention today?",
    promptTemplate: "Give me a briefing on my current portfolio - what needs attention today?",
    autoSend: true,
    enabled: true,
    placements: [{ domain: "coordinator", sortOrder: 1 }],
  },
  {
    slug: "review-action-items",
    label: "Review Action Items",
    description: "Check due dates and assignments",
    promptTemplate: "What action items are due this week and who are they assigned to?",
    autoSend: true,
    enabled: true,
    placements: [{ domain: "coordinator", sortOrder: 2 }],
  },
  {
    slug: "draft-note",
    label: "Draft Note",
    description: "Write a deal note for a file",
    promptTemplate: "Draft a deal note for file #",
    autoSend: false,
    enabled: true,
    placements: [{ domain: "coordinator", sortOrder: 3 }],
  },
  {
    slug: "generate-action-items",
    label: "Generate Action Items",
    description:
      "Analyze the deal and generate or update the action item map based on current file state.",
    promptTemplate: GENERATE_ACTION_ITEMS_PROMPT,
    autoSend: true,
    enabled: true,
    placements: [{ domain: "coordinator", sortOrder: 10 }],
  },
];
