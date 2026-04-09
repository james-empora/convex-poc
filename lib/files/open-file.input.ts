import { z } from "zod";
import { FORM_VARIANT_META_KEY } from "@/lib/forms/form-variant";
import {
  FileTypeSchema,
  FinancingTypeSchema,
  PropertyTypeSchema,
} from "@/lib/validators/enums";

export const OpenFileInput = z.object({
  fileType: FileTypeSchema.meta({ title: "File Type" }),
  addressLine1: z.string().meta({ title: "Address Line 1" }),
  addressLine2: z.string().optional().meta({ title: "Address Line 2" }),
  city: z.string().meta({ title: "City" }),
  state: z.string().meta({ title: "State" }).describe("Two-letter state code"),
  zip: z.string().meta({ title: "ZIP Code" }),
  county: z.string().optional().meta({ title: "County" }),
  parcelNumber: z.string().optional().meta({ title: "Parcel Number" }),
  legalDescription: z.string().optional().meta({ title: "Legal Description" }),
  propertyType: PropertyTypeSchema.optional().meta({ title: "Property Type" }),
  documentId: z.string().uuid().optional().meta({ title: "Document ID" }),
  purchasePriceCents: z.number().int().nonnegative().optional().meta({ title: "Purchase Price (cents)" }),
  earnestMoneyCents: z.number().int().nonnegative().optional().meta({ title: "Earnest Money (cents)" }),
  contractDate: z.string().optional().meta({ title: "Contract Date" }).describe("ISO date string"),
  closingDate: z.string().optional().meta({ title: "Closing Date" }).describe("ISO date string"),
  financingType: FinancingTypeSchema.optional().meta({ title: "Financing Type" }),
  loanAmountCents: z.number().int().nonnegative().optional().meta({ title: "Loan Amount (cents)" }),
  isCashOut: z.boolean().optional().meta({ title: "Cash-Out Refinance" }),
}).superRefine((value, ctx) => {
  if (value.fileType === "purchase" && value.purchasePriceCents === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "purchasePriceCents is required when fileType is purchase",
      path: ["purchasePriceCents"],
    });
  }

  if (value.fileType === "refinance" && value.loanAmountCents === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "loanAmountCents is required when fileType is refinance",
      path: ["loanAmountCents"],
    });
  }
}).meta({ [FORM_VARIANT_META_KEY]: "editable" });

export type OpenFileInput = z.infer<typeof OpenFileInput>;
