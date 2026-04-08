import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const legacyId = v.optional(v.string());
const timestampMs = v.float64();
const isoDate = v.string();
const cents = v.float64();
const jsonValue = v.any();
const jsonArray = v.array(v.any());
const stringArray = v.array(v.string());
const timeRange = v.object({
  start: v.float64(),
  end: v.optional(v.float64()),
});
const point = v.object({
  lat: v.float64(),
  lng: v.float64(),
});

const entityType = v.union(
  v.literal("individual"),
  v.literal("organization"),
  v.literal("brokerage"),
  v.literal("lender"),
);
const linkableEntityType = v.union(
  entityType,
  v.literal("property"),
);
const entityRef = v.object({
  type: entityType,
  id: v.string(),
});
const linkableEntityRef = v.object({
  type: linkableEntityType,
  id: v.string(),
});
const resourceRef = v.object({
  type: v.string(),
  id: v.string(),
});

const maritalStatus = v.union(
  v.literal("single"),
  v.literal("married"),
  v.literal("divorced"),
  v.literal("widowed"),
  v.literal("unknown"),
);
const formationType = v.union(
  v.literal("llc"),
  v.literal("corporation"),
  v.literal("trust"),
  v.literal("partnership"),
  v.literal("sole_proprietorship"),
  v.literal("estate"),
  v.literal("government"),
);
const lenderType = v.union(
  v.literal("bank"),
  v.literal("credit_union"),
  v.literal("mortgage_company"),
  v.literal("private"),
  v.literal("hard_money"),
);
const userType = v.union(v.literal("internal"), v.literal("external"));
const identifierType = v.union(
  v.literal("email"),
  v.literal("phone"),
  v.literal("ssn"),
  v.literal("ein"),
  v.literal("auth_provider_id"),
  v.literal("license_number"),
  v.literal("passport"),
);
const relationshipType = v.union(
  v.literal("spouse_of"),
  v.literal("member_of"),
  v.literal("subsidiary_of"),
  v.literal("agent_for"),
  v.literal("trustee_of"),
  v.literal("beneficiary_of"),
  v.literal("power_of_attorney_for"),
  v.literal("employed_by"),
  v.literal("officer_of"),
  v.literal("signer_for"),
  v.literal("guarantor_for"),
  v.literal("branch_of"),
);
const addressRole = v.union(
  v.literal("mailing"),
  v.literal("physical"),
  v.literal("billing"),
  v.literal("property"),
);
const propertyType = v.union(
  v.literal("single_family"),
  v.literal("condo"),
  v.literal("multi_family"),
  v.literal("commercial"),
  v.literal("land"),
  v.literal("manufactured"),
);
const propertyAttributeKey = v.union(
  v.literal("assessed_value_cents"),
  v.literal("occupancy_status"),
  v.literal("hoa_name"),
  v.literal("is_rental"),
  v.literal("has_management"),
  v.literal("tax_year"),
  v.literal("annual_tax_cents"),
);
const propertyAttributeSource = v.union(
  v.literal("attom"),
  v.literal("manual"),
  v.literal("county_records"),
  v.literal("mls"),
);
const fileType = v.union(
  v.literal("purchase"),
  v.literal("refinance"),
  v.literal("wholesale"),
);
const fileStatus = v.union(
  v.literal("pending"),
  v.literal("in_progress"),
  v.literal("clear_to_close"),
  v.literal("closed"),
  v.literal("funded"),
  v.literal("recorded"),
  v.literal("cancelled"),
);
const filePartyRole = v.union(
  v.literal("buyer"),
  v.literal("seller"),
  v.literal("lender"),
  v.literal("buyer_agent"),
  v.literal("seller_agent"),
  v.literal("title_agent"),
  v.literal("escrow_officer"),
  v.literal("notary"),
  v.literal("titleholder"),
  v.literal("signer"),
  v.literal("settlement_agent"),
);
const filePartySide = v.union(
  v.literal("buyer_side"),
  v.literal("seller_side"),
  v.literal("internal"),
);
const snapshotTrigger = v.union(
  v.literal("signing"),
  v.literal("recording"),
  v.literal("amendment"),
  v.literal("manual"),
);
const threadType = v.union(v.literal("user_chat"), v.literal("system"));
const chatTitleSource = v.union(
  v.literal("derived"),
  v.literal("generated"),
  v.literal("manual"),
);
const messageRole = v.union(
  v.literal("user"),
  v.literal("assistant"),
  v.literal("system"),
  v.literal("tool"),
);
const documentType = v.union(
  v.literal("purchase_contract"),
  v.literal("deed"),
  v.literal("mortgage"),
  v.literal("title_commitment"),
  v.literal("title_search"),
  v.literal("survey"),
  v.literal("payoff_letter"),
  v.literal("closing_disclosure"),
  v.literal("settlement_statement"),
  v.literal("power_of_attorney"),
  v.literal("operating_agreement"),
  v.literal("tax_certificate"),
  v.literal("estoppel_letter"),
  v.literal("id_verification"),
  v.literal("vesting_deed"),
  v.literal("promissory_note"),
  v.literal("closing_instruction"),
  v.literal("wire_instruction"),
  v.literal("insurance_binder"),
  v.literal("transcript"),
  v.literal("other"),
);
const documentFiletype = v.union(
  v.literal("pdf"),
  v.literal("png"),
  v.literal("jpg"),
  v.literal("tiff"),
  v.literal("docx"),
  v.literal("xlsx"),
);
const documentOrigin = v.union(
  v.literal("upload"),
  v.literal("generated"),
  v.literal("e_recording"),
  v.literal("vendor"),
  v.literal("email_attachment"),
  v.literal("fax"),
);
const attachmentResourceType = v.union(
  v.literal("file"),
  v.literal("property"),
  v.literal("encumbrance"),
  v.literal("vendor_order"),
  v.literal("workflow"),
  v.literal("work_item"),
  v.literal("line_item"),
  v.literal("appointment"),
);
const attachmentVisibility = v.union(
  v.literal("private"),
  v.literal("shared"),
  v.literal("public"),
);
const attachmentStatus = v.union(
  v.literal("requested"),
  v.literal("received"),
  v.literal("reviewed"),
  v.literal("approved"),
  v.literal("rejected"),
);
const ledgerType = v.union(v.literal("deal"), v.literal("register"));
const statementSection = v.union(
  v.literal("sale_price_and_credits"),
  v.literal("title_charges"),
  v.literal("government_recording_and_transfer"),
  v.literal("lender_charges"),
  v.literal("prepaid_items"),
  v.literal("escrow_reserves"),
  v.literal("adjustments_and_prorations"),
  v.literal("payoffs_and_liens"),
  v.literal("commissions"),
  v.literal("additional_charges"),
  v.literal("deposits_and_earnest_money"),
  v.literal("totals"),
);
const paymentType = v.union(
  v.literal("receipt"),
  v.literal("disbursement"),
);
const paymentMethod = v.union(
  v.literal("wire"),
  v.literal("check"),
  v.literal("ach"),
  v.literal("internal_transfer"),
);
const paymentStatus = v.union(
  v.literal("pending"),
  v.literal("posted"),
  v.literal("cleared"),
  v.literal("reconciled"),
  v.literal("voided"),
);
const proposalTrigger = v.union(
  v.literal("document_uploaded"),
  v.literal("date_changed"),
  v.literal("resource_updated"),
  v.literal("resource_created"),
  v.literal("user_request"),
  v.literal("system_check"),
  v.literal("balance_error"),
  v.literal("drift_detected"),
);
const proposalStatus = v.union(
  v.literal("pending"),
  v.literal("applied"),
  v.literal("partially_applied"),
  v.literal("dismissed"),
);
const proposalItemAction = v.union(
  v.literal("update"),
  v.literal("create"),
  v.literal("delete"),
);
const proposalItemStatus = v.union(
  v.literal("pending"),
  v.literal("applied"),
  v.literal("skipped"),
  v.literal("overridden"),
);
const snapshotMilestone = v.union(
  v.literal("clear_to_close"),
  v.literal("signing"),
  v.literal("funding"),
  v.literal("recording"),
);
const workflowRunType = v.union(
  v.literal("document_extraction"),
  v.literal("finding_analysis"),
  v.literal("compliance_check"),
  v.literal("skill_run"),
  v.literal("action_item_generation"),
);
const workflowRunStatus = v.union(
  v.literal("pending"),
  v.literal("running"),
  v.literal("completed"),
  v.literal("failed"),
);
const auditOperation = v.union(
  v.literal("INSERT"),
  v.literal("UPDATE"),
  v.literal("DELETE"),
);
const findingSourceType = v.literal("document");
const findingStatus = v.union(
  v.literal("draft"),
  v.literal("confirmed"),
  v.literal("dismissed"),
);
const actionItemPriority = v.union(
  v.literal("low"),
  v.literal("normal"),
  v.literal("high"),
  v.literal("urgent"),
);
const actionItemStatus = v.union(
  v.literal("pending"),
  v.literal("completed"),
  v.literal("deleted"),
);
const actionItemOrigin = v.union(v.literal("ai"), v.literal("manual"));
const actionItemDependencyType = v.union(
  v.literal("hard"),
  v.literal("soft"),
);

export default defineSchema({
  individuals: defineTable({
    legacyId,
    firstName: v.string(),
    middleName: v.optional(v.string()),
    lastName: v.string(),
    suffix: v.optional(v.string()),
    dateOfBirth: v.optional(isoDate),
    maritalStatus: v.optional(maritalStatus),
    citizenship: v.optional(v.string()),
    title: v.optional(v.string()),
    metadata: v.optional(jsonValue),
    createdAt: timestampMs,
    updatedAt: timestampMs,
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_last_name_first_name", ["lastName", "firstName"]),

  organizations: defineTable({
    legacyId,
    legalName: v.string(),
    formationType: v.optional(formationType),
    stateOfFormation: v.optional(v.string()),
    formationDate: v.optional(isoDate),
    dissolutionDate: v.optional(isoDate),
    metadata: v.optional(jsonValue),
    createdAt: timestampMs,
    updatedAt: timestampMs,
  }).index("by_legacy_id", ["legacyId"]),

  brokerages: defineTable({
    legacyId,
    legalName: v.string(),
    licenseNumber: v.optional(v.string()),
    licenseState: v.optional(v.string()),
    mlsId: v.optional(v.string()),
    stateOfFormation: v.optional(v.string()),
    metadata: v.optional(jsonValue),
    createdAt: timestampMs,
    updatedAt: timestampMs,
  }).index("by_legacy_id", ["legacyId"]),

  lenders: defineTable({
    legacyId,
    legalName: v.string(),
    nmlsId: v.optional(v.string()),
    lenderType: v.optional(lenderType),
    stateOfFormation: v.optional(v.string()),
    metadata: v.optional(jsonValue),
    createdAt: timestampMs,
    updatedAt: timestampMs,
  }).index("by_legacy_id", ["legacyId"]),

  users: defineTable({
    legacyId,
    auth0Sub: v.string(),
    email: v.string(),
    displayName: v.optional(v.string()),
    userType,
    entity: v.optional(entityRef),
    permissions: stringArray,
    active: v.boolean(),
    lastLoginAt: v.optional(timestampMs),
    createdAt: timestampMs,
    updatedAt: timestampMs,
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_auth0_sub", ["auth0Sub"])
    .index("by_email", ["email"])
    .index("by_entity", ["entity.type", "entity.id"])
    .index("by_user_type", ["userType"]),

  mcp_oauth_clients: defineTable({
    legacyId,
    clientId: v.string(),
    clientSecretDigest: v.string(),
    clientName: v.optional(v.string()),
    redirectUris: stringArray,
    createdAt: timestampMs,
    updatedAt: timestampMs,
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_client_id", ["clientId"]),

  mcp_oauth_grants: defineTable({
    legacyId,
    oauthClientId: v.id("mcp_oauth_clients"),
    userId: v.string(),
    userEmail: v.string(),
    grantType: v.union(
      v.literal("authorization_code"),
      v.literal("access_token"),
      v.literal("refresh_token"),
    ),
    tokenDigest: v.string(),
    codeChallengeS256: v.optional(v.string()),
    redirectUri: v.optional(v.string()),
    expiresAt: timestampMs,
    revokedAt: v.optional(timestampMs),
    createdAt: timestampMs,
    updatedAt: timestampMs,
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_token_digest", ["tokenDigest"])
    .index("by_grant_type", ["grantType"])
    .index("by_oauth_client_id", ["oauthClientId"]),

  entity_identifiers: defineTable({
    legacyId,
    entity: entityRef,
    identifierType,
    value: v.string(),
    verifiedAt: v.optional(timestampMs),
    source: v.optional(v.string()),
    validDuring: v.optional(timeRange),
  })
    .index("by_entity", ["entity.type", "entity.id"])
    .index("by_type_value", ["identifierType", "value"]),

  entity_relationships: defineTable({
    legacyId,
    fromEntity: entityRef,
    toEntity: entityRef,
    relationshipType,
    metadata: v.optional(jsonValue),
    validDuring: v.optional(timeRange),
  })
    .index("by_from_entity", ["fromEntity.type", "fromEntity.id"])
    .index("by_to_entity", ["toEntity.type", "toEntity.id"])
    .index("by_relationship_type", ["relationshipType"]),

  addresses: defineTable({
    legacyId,
    addressLine1: v.string(),
    addressLine2: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zip: v.optional(v.string()),
    county: v.optional(v.string()),
    country: v.string(),
    geom: v.optional(point),
    createdAt: timestampMs,
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_state_city", ["state", "city"]),

  address_links: defineTable({
    legacyId,
    entity: linkableEntityRef,
    addressId: v.id("addresses"),
    role: v.optional(addressRole),
    validDuring: v.optional(timeRange),
    createdAt: timestampMs,
  })
    .index("by_entity", ["entity.type", "entity.id"])
    .index("by_address_id", ["addressId"]),

  properties: defineTable({
    legacyId,
    addressId: v.id("addresses"),
    parcelNumber: v.optional(v.string()),
    legalDescription: v.optional(v.string()),
    propertyType: v.optional(propertyType),
    zoning: v.optional(v.string()),
    createdAt: timestampMs,
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_address_id", ["addressId"])
    .index("by_parcel_number", ["parcelNumber"]),

  property_attributes: defineTable({
    legacyId,
    propertyId: v.id("properties"),
    attributeKey: propertyAttributeKey,
    attributeValue: jsonValue,
    effectiveRange: v.optional(timeRange),
    source: v.optional(propertyAttributeSource),
    createdAt: timestampMs,
  })
    .index("by_property_id", ["propertyId"])
    .index("by_property_key", ["propertyId", "attributeKey"]),

  files: defineTable({
    legacyId,
    fileNumber: v.optional(v.string()),
    propertyId: v.id("properties"),
    fileType,
    status: fileStatus,
    openedAt: v.optional(timestampMs),
    closedAt: v.optional(timestampMs),
    metadata: v.optional(jsonValue),
    createdAt: timestampMs,
    updatedAt: timestampMs,
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_property_id", ["propertyId"])
    .index("by_status", ["status"])
    .index("by_type_status", ["fileType", "status"])
    .index("by_file_number", ["fileNumber"]),

  file_parties: defineTable({
    legacyId,
    fileId: v.id("files"),
    entity: entityRef,
    role: filePartyRole,
    side: v.optional(filePartySide),
    orderIndex: v.float64(),
    active: v.boolean(),
    createdAt: timestampMs,
    updatedAt: timestampMs,
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_file_id", ["fileId"])
    .index("by_entity", ["entity.type", "entity.id"])
    .index("by_file_role", ["fileId", "role"])
    .index("by_file_entity_role", ["fileId", "entity.type", "entity.id", "role"]),

  file_snapshots: defineTable({
    legacyId,
    fileId: v.id("files"),
    snapshotTrigger,
    snapshot: jsonValue,
    schemaVersion: v.string(),
    createdAt: timestampMs,
  }).index("by_file_id", ["fileId"]),

  chat_threads: defineTable({
    id: v.string(),
    threadType,
    userId: v.optional(v.id("users")),
    title: v.string(),
    titleSource: chatTitleSource,
    lastMessageAt: timestampMs,
    createdAt: timestampMs,
    updatedAt: timestampMs,
  })
    .index("by_chat_id", ["id"])
    .index("by_user_id", ["userId"])
    .index("by_type_last_message_at", ["threadType", "lastMessageAt"]),

  chat_messages: defineTable({
    legacyId,
    threadId: v.id("chat_threads"),
    messageId: v.string(),
    role: messageRole,
    parts: jsonArray,
    model: v.optional(v.string()),
    tokenUsage: v.optional(jsonValue),
    ordinal: v.float64(),
    createdAt: timestampMs,
  })
    .index("by_thread_message_id", ["threadId", "messageId"])
    .index("by_thread_ordinal", ["threadId", "ordinal"]),

  thread_associations: defineTable({
    legacyId,
    threadId: v.id("chat_threads"),
    resource: resourceRef,
    createdAt: timestampMs,
  })
    .index("by_thread_resource", ["threadId", "resource.type", "resource.id"])
    .index("by_resource", ["resource.type", "resource.id"]),

  documents: defineTable({
    legacyId,
    name: v.string(),
    documentType,
    storagePath: v.string(),
    filetype: v.optional(documentFiletype),
    fileSizeBytes: v.optional(v.float64()),
    pageCount: v.optional(v.float64()),
    versionMajor: v.float64(),
    versionMinor: v.float64(),
    origin: v.optional(documentOrigin),
    uploadedBy: v.optional(resourceRef),
    extractedText: v.optional(jsonValue),
    metadata: v.optional(jsonValue),
    deletedAt: v.optional(timestampMs),
    createdAt: timestampMs,
    updatedAt: timestampMs,
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_document_type", ["documentType"])
    .index("by_uploaded_by", ["uploadedBy.type", "uploadedBy.id"])
    .index("by_deleted_at", ["deletedAt"]),

  document_attachments: defineTable({
    legacyId,
    documentId: v.id("documents"),
    resource: v.object({
      type: attachmentResourceType,
      id: v.string(),
    }),
    label: v.optional(v.string()),
    visibility: attachmentVisibility,
    status: v.optional(attachmentStatus),
    attributes: v.optional(jsonValue),
    createdAt: timestampMs,
  })
    .index("by_document_id", ["documentId"])
    .index("by_resource", ["resource.type", "resource.id"])
    .index("by_resource_status", ["resource.type", "resource.id", "status"])
    .index("by_document_resource", ["documentId", "resource.type", "resource.id"]),

  ledgers: defineTable({
    legacyId,
    fileId: v.id("files"),
    ledgerType,
    name: v.string(),
    isPrimary: v.boolean(),
    templateVersion: v.string(),
    metadata: v.optional(jsonValue),
    createdAt: timestampMs,
    updatedAt: timestampMs,
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_file_id", ["fileId"])
    .index("by_ledger_type", ["ledgerType"]),

  line_items: defineTable({
    legacyId,
    ledgerId: v.id("ledgers"),
    templateKey: v.string(),
    label: v.string(),
    labelOverride: v.optional(v.string()),
    section: statementSection,
    computedAmountCents: cents,
    actualAmountCents: cents,
    manuallyAdjusted: v.boolean(),
    adjustedByUserId: v.optional(v.id("users")),
    adjustedByName: v.optional(v.string()),
    adjustedAt: v.optional(timestampMs),
    adjustmentReason: v.optional(v.string()),
    paidOutsideOfClosing: v.boolean(),
    verified: v.boolean(),
    sortOrder: v.float64(),
    resource: v.optional(resourceRef),
    resourceLabel: v.optional(v.string()),
    metadata: v.optional(jsonValue),
    deletedAt: v.optional(timestampMs),
    createdAt: timestampMs,
    updatedAt: timestampMs,
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_ledger_id", ["ledgerId"])
    .index("by_ledger_section", ["ledgerId", "section"])
    .index("by_ledger_template_key", ["ledgerId", "templateKey"])
    .index("by_deleted_at", ["deletedAt"]),

  charges: defineTable({
    legacyId,
    lineItemId: v.id("line_items"),
    partyId: v.id("file_parties"),
    partySide: filePartySide,
    partyName: v.string(),
    debitCents: cents,
    creditCents: cents,
    createdAt: timestampMs,
    updatedAt: timestampMs,
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_line_item_id", ["lineItemId"])
    .index("by_party_id", ["partyId"]),

  payments: defineTable({
    legacyId,
    ledgerId: v.id("ledgers"),
    partyId: v.id("file_parties"),
    partyName: v.string(),
    paymentType,
    method: paymentMethod,
    amountCents: cents,
    status: paymentStatus,
    memo: v.optional(v.string()),
    instrumentNumber: v.optional(v.string()),
    bankName: v.optional(v.string()),
    maskedAccount: v.optional(v.string()),
    postedAt: v.optional(timestampMs),
    clearedAt: v.optional(timestampMs),
    reconciledAt: v.optional(timestampMs),
    voidedAt: v.optional(timestampMs),
    voidedByUserId: v.optional(v.id("users")),
    voidReason: v.optional(v.string()),
    metadata: v.optional(jsonValue),
    createdAt: timestampMs,
    updatedAt: timestampMs,
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_ledger_id", ["ledgerId"])
    .index("by_party_id", ["partyId"])
    .index("by_status", ["status"])
    .index("by_type_status", ["paymentType", "status"]),

  ledger_proposals: defineTable({
    legacyId,
    ledgerId: v.id("ledgers"),
    trigger: proposalTrigger,
    triggerDetail: v.string(),
    netImpact: jsonValue,
    status: proposalStatus,
    appliedByUserId: v.optional(v.id("users")),
    appliedByName: v.optional(v.string()),
    appliedAt: v.optional(timestampMs),
    dismissedByUserId: v.optional(v.id("users")),
    dismissedByName: v.optional(v.string()),
    dismissedAt: v.optional(timestampMs),
    chatMessageId: v.optional(v.string()),
    metadata: v.optional(jsonValue),
    createdAt: timestampMs,
    updatedAt: timestampMs,
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_ledger_id", ["ledgerId"])
    .index("by_status", ["status"])
    .index("by_ledger_status", ["ledgerId", "status"]),

  ledger_proposal_items: defineTable({
    legacyId,
    proposalId: v.id("ledger_proposals"),
    lineItemId: v.optional(v.id("line_items")),
    lineItemLabel: v.string(),
    action: proposalItemAction,
    field: v.string(),
    oldValue: v.optional(v.string()),
    newValue: v.string(),
    oldAmountCents: v.optional(cents),
    newAmountCents: cents,
    status: proposalItemStatus,
    overrideValue: v.optional(v.string()),
    createdAt: timestampMs,
    updatedAt: timestampMs,
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_proposal_id", ["proposalId"])
    .index("by_line_item_id", ["lineItemId"])
    .index("by_status", ["status"]),

  ledger_snapshots: defineTable({
    legacyId,
    ledgerId: v.id("ledgers"),
    milestone: snapshotMilestone,
    state: jsonValue,
    schemaVersion: v.string(),
    createdByUserId: v.id("users"),
    createdByName: v.string(),
    createdAt: timestampMs,
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_ledger_id", ["ledgerId"])
    .index("by_ledger_milestone", ["ledgerId", "milestone"]),

  workflow_runs: defineTable({
    legacyId,
    workflowType: workflowRunType,
    threadId: v.optional(v.id("chat_threads")),
    status: workflowRunStatus,
    input: v.optional(jsonValue),
    errorMessage: v.optional(v.string()),
    startedAt: v.optional(timestampMs),
    completedAt: v.optional(timestampMs),
    createdAt: timestampMs,
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_type_status", ["workflowType", "status"])
    .index("by_thread_id", ["threadId"])
    .index("by_status", ["status"]),

  audit_log: defineTable({
    legacyId,
    tableName: v.string(),
    rowId: v.string(),
    operation: auditOperation,
    oldData: v.optional(jsonValue),
    newData: v.optional(jsonValue),
    changedFields: v.optional(stringArray),
    userId: v.optional(v.string()),
    userEmail: v.optional(v.string()),
    occurredAt: timestampMs,
  })
    .index("by_row_id", ["rowId"])
    .index("by_table_row", ["tableName", "rowId"])
    .index("by_user_id", ["userId"])
    .index("by_occurred_at", ["occurredAt"]),

  findings: defineTable({
    legacyId,
    fileId: v.optional(v.id("files")),
    findingType: v.string(),
    summary: v.string(),
    data: v.optional(jsonValue),
    status: findingStatus,
    createdAt: timestampMs,
    updatedAt: timestampMs,
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_file_id", ["fileId"])
    .index("by_finding_type", ["findingType"])
    .index("by_file_status", ["fileId", "status"]),

  finding_sources: defineTable({
    legacyId,
    findingId: v.id("findings"),
    source: v.object({
      type: findingSourceType,
      id: v.string(),
    }),
    excerpt: v.optional(v.string()),
    pageNumber: v.optional(v.float64()),
    createdAt: timestampMs,
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_finding_id", ["findingId"])
    .index("by_source", ["source.type", "source.id"]),

  skills: defineTable({
    legacyId,
    slug: v.string(),
    label: v.string(),
    description: v.optional(v.string()),
    promptTemplate: v.string(),
    autoSend: v.boolean(),
    enabled: v.boolean(),
    createdAt: timestampMs,
    updatedAt: timestampMs,
    deletedAt: v.optional(timestampMs),
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_slug", ["slug"])
    .index("by_enabled", ["enabled"])
    .index("by_deleted_at", ["deletedAt"]),

  skill_placements: defineTable({
    legacyId,
    skillId: v.id("skills"),
    domain: v.string(),
    subDomain: v.optional(v.string()),
    sortOrder: v.float64(),
    createdAt: timestampMs,
  })
    .index("by_skill_id", ["skillId"])
    .index("by_domain_sub_domain", ["domain", "subDomain"])
    .index("by_skill_domain_sub_domain", ["skillId", "domain", "subDomain"]),

  action_items: defineTable({
    legacyId,
    fileId: v.id("files"),
    key: v.string(),
    title: v.string(),
    priority: actionItemPriority,
    assigneeEntity: v.optional(resourceRef),
    assigneeRole: v.optional(v.string()),
    status: actionItemStatus,
    statusReason: v.optional(v.string()),
    completedAt: v.optional(timestampMs),
    deletedAt: v.optional(timestampMs),
    dueDate: v.optional(isoDate),
    completionRule: v.optional(jsonValue),
    origin: actionItemOrigin,
    threadId: v.optional(v.id("chat_threads")),
    createdAt: timestampMs,
    updatedAt: timestampMs,
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_file_key", ["fileId", "key"])
    .index("by_file_id", ["fileId"])
    .index("by_file_status", ["fileId", "status"])
    .index("by_assignee_entity", ["assigneeEntity.id", "assigneeEntity.type"]),

  action_item_dependencies: defineTable({
    legacyId,
    fromItemId: v.id("action_items"),
    toItemId: v.id("action_items"),
    type: actionItemDependencyType,
    createdAt: timestampMs,
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_item_pair", ["fromItemId", "toItemId"])
    .index("by_from_item_id", ["fromItemId"])
    .index("by_to_item_id", ["toItemId"]),

  legacy_imports: defineTable({
    legacyId,
    railsDealId: v.string(),
    fileId: v.string(),
    ledgerId: v.optional(v.string()),
    fileNumber: v.string(),
    propertyAddress: v.string(),
    state: v.string(),
    dealStatus: v.string(),
    fileType: v.string(),
    unmodeledData: v.object({
      workflow: v.optional(jsonValue),
      ctcPlan: v.optional(jsonValue),
      signing: v.optional(jsonValue),
      recording: v.optional(jsonValue),
      actionItems: v.optional(jsonValue),
      notes: v.optional(jsonValue),
      messages: v.optional(jsonValue),
    }),
    financeStats: v.optional(
      v.object({
        lineItemCount: v.float64(),
        paymentCount: v.float64(),
        chargeCount: v.float64(),
        snapshotCount: v.float64(),
      }),
    ),
    actualProgress: v.array(
      v.object({
        milestoneId: v.string(),
        status: v.string(),
        actualDate: v.optional(v.string()),
        actualDurationDays: v.optional(v.float64()),
      }),
    ),
    importedAt: timestampMs,
    refreshedAt: v.optional(timestampMs),
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_rails_deal_id", ["railsDealId"])
    .index("by_file_id", ["fileId"])
    .index("by_imported_at", ["importedAt"]),

});
