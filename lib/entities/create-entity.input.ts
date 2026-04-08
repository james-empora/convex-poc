import { z } from "zod";
import { FORM_VARIANT_META_KEY } from "@/lib/forms/form-variant";
import {
  FormationTypeSchema,
  LenderTypeSchema,
  MaritalStatusSchema,
} from "@/lib/validators/enums";

// ---------------------------------------------------------------------------
// Per-entity-type input schemas — required fields enforced at the schema level
// ---------------------------------------------------------------------------

const ContactFields = {
  email: z.string().optional().meta({ title: "Email" }),
  phone: z.string().optional().meta({ title: "Phone" }),
};

const CreateIndividualInput = z.object({
  entityType: z.literal("individual").meta({ title: "Entity Type" }),
  firstName: z.string().meta({ title: "First Name" }).describe("Legal first name"),
  middleName: z.string().optional().meta({ title: "Middle Name" }),
  lastName: z.string().meta({ title: "Last Name" }).describe("Legal last name"),
  suffix: z.string().optional().meta({ title: "Suffix" }).describe("Jr, Sr, III, etc."),
  dateOfBirth: z.string().optional().meta({ title: "Date of Birth" }),
  maritalStatus: MaritalStatusSchema.optional().meta({ title: "Marital Status" }),
  ...ContactFields,
});

const CreateOrganizationInput = z.object({
  entityType: z.literal("organization").meta({ title: "Entity Type" }),
  legalName: z.string().meta({ title: "Legal Name" }),
  formationType: FormationTypeSchema.optional().meta({ title: "Formation Type" }),
  stateOfFormation: z.string().length(2).optional().meta({ title: "State of Formation" }).describe("Two-letter state code"),
  ...ContactFields,
});

const CreateBrokerageInput = z.object({
  entityType: z.literal("brokerage").meta({ title: "Entity Type" }),
  legalName: z.string().meta({ title: "Legal Name" }),
  licenseNumber: z.string().optional().meta({ title: "License Number" }),
  licenseState: z.string().length(2).optional().meta({ title: "License State" }).describe("Two-letter state code"),
  mlsId: z.string().optional().meta({ title: "MLS ID" }).describe("Multiple Listing Service identifier"),
  stateOfFormation: z.string().length(2).optional().meta({ title: "State of Formation" }).describe("Two-letter state code"),
  ...ContactFields,
});

const CreateLenderInput = z.object({
  entityType: z.literal("lender").meta({ title: "Entity Type" }),
  legalName: z.string().meta({ title: "Legal Name" }),
  nmlsId: z.string().optional().meta({ title: "NMLS ID" }).describe("Nationwide Multistate Licensing System identifier"),
  lenderType: LenderTypeSchema.optional().meta({ title: "Lender Type" }),
  stateOfFormation: z.string().length(2).optional().meta({ title: "State of Formation" }).describe("Two-letter state code"),
  ...ContactFields,
});

// ---------------------------------------------------------------------------
// Discriminated union — the actual exported schema
// ---------------------------------------------------------------------------

export const CreateEntityInput = z
  .discriminatedUnion("entityType", [
    CreateIndividualInput,
    CreateOrganizationInput,
    CreateBrokerageInput,
    CreateLenderInput,
  ])
  .describe("Create any entity type. Required fields vary by entityType.")
  .meta({ [FORM_VARIANT_META_KEY]: "editable" });
export type CreateEntityInput = z.infer<typeof CreateEntityInput>;
