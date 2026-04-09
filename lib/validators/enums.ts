import { z } from "zod";

export const ENTITY_TYPES = ["individual", "organization", "brokerage", "lender"] as const;
export const MARITAL_STATUSES = ["single", "married", "divorced", "widowed", "unknown"] as const;
export const FORMATION_TYPES = [
  "llc",
  "corporation",
  "trust",
  "partnership",
  "sole_proprietorship",
  "estate",
  "government",
] as const;
export const LENDER_TYPES = [
  "bank",
  "credit_union",
  "mortgage_company",
  "private",
  "hard_money",
] as const;
export const FILE_PARTY_ROLES = [
  "buyer",
  "seller",
  "lender",
  "buyer_agent",
  "seller_agent",
  "title_agent",
  "escrow_officer",
  "notary",
  "titleholder",
  "signer",
  "settlement_agent",
] as const;
export const FILE_PARTY_SIDES = ["buyer_side", "seller_side", "internal"] as const;
export const FILE_TYPES = ["purchase", "refinance", "wholesale"] as const;
export const PROPERTY_TYPES = [
  "single_family",
  "condo",
  "multi_family",
  "commercial",
  "land",
  "manufactured",
] as const;
export const FINANCING_TYPES = ["conventional", "fha", "va", "usda", "cash", "other"] as const;
export const DOCUMENT_TYPES = [
  "purchase_contract",
  "deed",
  "mortgage",
  "title_commitment",
  "title_search",
  "survey",
  "payoff_letter",
  "closing_disclosure",
  "settlement_statement",
  "power_of_attorney",
  "operating_agreement",
  "tax_certificate",
  "estoppel_letter",
  "id_verification",
  "vesting_deed",
  "promissory_note",
  "closing_instruction",
  "wire_instruction",
  "insurance_binder",
  "transcript",
  "other",
] as const;
export const DOCUMENT_FILETYPES = ["pdf", "png", "jpg", "tiff", "docx", "xlsx"] as const;
export const DOCUMENT_ORIGINS = [
  "upload",
  "generated",
  "e_recording",
  "vendor",
  "email_attachment",
  "fax",
] as const;
export const ATTACHMENT_RESOURCE_TYPES = [
  "file",
  "property",
  "encumbrance",
  "vendor_order",
  "workflow",
  "work_item",
  "line_item",
  "appointment",
] as const;
export const CHAT_TITLE_SOURCES = ["manual", "generated"] as const;

export const EntityTypeSchema = z.enum(ENTITY_TYPES);
export const MaritalStatusSchema = z.enum(MARITAL_STATUSES);
export const FormationTypeSchema = z.enum(FORMATION_TYPES);
export const LenderTypeSchema = z.enum(LENDER_TYPES);
export const FilePartyRoleSchema = z.enum(FILE_PARTY_ROLES);
export const FilePartySideSchema = z.enum(FILE_PARTY_SIDES);
export const FileTypeSchema = z.enum(FILE_TYPES);
export const PropertyTypeSchema = z.enum(PROPERTY_TYPES);
export const FinancingTypeSchema = z.enum(FINANCING_TYPES);
export const DocumentTypeSchema = z.enum(DOCUMENT_TYPES);
export const DocumentFiletypeSchema = z.enum(DOCUMENT_FILETYPES);
export const DocumentOriginSchema = z.enum(DOCUMENT_ORIGINS);
export const AttachmentResourceTypeSchema = z.enum(ATTACHMENT_RESOURCE_TYPES);
export const ChatTitleSourceSchema = z.enum(CHAT_TITLE_SOURCES);
