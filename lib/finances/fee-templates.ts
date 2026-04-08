/** Current template version — pinned to the ledger when created */
export const CURRENT_TEMPLATE_VERSION = "2026.1";

/**
 * Fee schedule templates for common line items by state.
 * These are used by the AI to auto-generate initial settlement statements.
 */

export interface FeeTemplate {
  templateKey: string;
  label: string;
  section: string;
  /** How to compute the amount: fixed, percentage, or per-unit */
  computeMethod: "fixed" | "percentage" | "per_thousand" | "per_diem" | "manual";
  /** For fixed: amount in cents. For percentage: basis points (1% = 100). */
  defaultValue?: number;
  /** Which field to use as the base for percentage/per_thousand calculations */
  basedOn?: "sales_price" | "loan_amount" | "annual_tax";
  /** Default charge allocation */
  defaultDebit: "buyer" | "seller" | "split";
  defaultCredit: "settlement_agent" | "lender" | "counterparty";
  /** Whether this item is typically required for this deal type */
  required: boolean;
}

/**
 * Georgia purchase deal templates.
 * Extend with more states as needed.
 */
export const GA_PURCHASE_TEMPLATES: FeeTemplate[] = [
  // Sale Price & Credits
  { templateKey: "contract_sales_price", label: "Contract Sales Price", section: "sale_price_and_credits", computeMethod: "manual", defaultDebit: "buyer", defaultCredit: "counterparty", required: true },

  // Deposits
  { templateKey: "earnest_money_deposit", label: "Earnest Money Deposit", section: "deposits_and_earnest_money", computeMethod: "manual", defaultDebit: "buyer", defaultCredit: "settlement_agent", required: true },

  // Title Charges
  { templateKey: "owners_title_insurance", label: "Owner's Title Insurance Premium", section: "title_charges", computeMethod: "per_thousand", defaultValue: 550, basedOn: "sales_price", defaultDebit: "buyer", defaultCredit: "settlement_agent", required: true },
  { templateKey: "lenders_title_insurance", label: "Lender's Title Insurance Policy", section: "title_charges", computeMethod: "per_thousand", defaultValue: 350, basedOn: "loan_amount", defaultDebit: "buyer", defaultCredit: "settlement_agent", required: true },
  { templateKey: "settlement_fee", label: "Settlement Fee", section: "title_charges", computeMethod: "fixed", defaultValue: 45000, defaultDebit: "split", defaultCredit: "settlement_agent", required: true },
  { templateKey: "title_search", label: "Title Search", section: "title_charges", computeMethod: "fixed", defaultValue: 25000, defaultDebit: "buyer", defaultCredit: "settlement_agent", required: true },

  // Government Recording & Transfer
  { templateKey: "recording_fee_deed", label: "Recording Fee — Deed", section: "government_recording_and_transfer", computeMethod: "fixed", defaultValue: 3000, defaultDebit: "buyer", defaultCredit: "settlement_agent", required: true },
  { templateKey: "recording_fee_mortgage", label: "Recording Fee — Mortgage", section: "government_recording_and_transfer", computeMethod: "fixed", defaultValue: 3000, defaultDebit: "buyer", defaultCredit: "settlement_agent", required: true },
  { templateKey: "transfer_tax", label: "GA Transfer Tax", section: "government_recording_and_transfer", computeMethod: "per_thousand", defaultValue: 100, basedOn: "sales_price", defaultDebit: "seller", defaultCredit: "settlement_agent", required: true },
  { templateKey: "intangible_tax", label: "GA Intangible Tax", section: "government_recording_and_transfer", computeMethod: "per_thousand", defaultValue: 300, basedOn: "loan_amount", defaultDebit: "buyer", defaultCredit: "settlement_agent", required: true },

  // Lender Charges
  { templateKey: "loan_origination_fee", label: "Loan Origination Fee", section: "lender_charges", computeMethod: "percentage", defaultValue: 100, basedOn: "loan_amount", defaultDebit: "buyer", defaultCredit: "lender", required: false },
  { templateKey: "loan_proceeds", label: "Loan Proceeds", section: "lender_charges", computeMethod: "manual", defaultDebit: "buyer", defaultCredit: "lender", required: true },

  // Prepaid Items
  { templateKey: "prepaid_interest", label: "Prepaid Interest", section: "prepaid_items", computeMethod: "per_diem", basedOn: "loan_amount", defaultDebit: "buyer", defaultCredit: "lender", required: true },
  { templateKey: "homeowners_insurance", label: "Homeowner's Insurance Premium (12 mo)", section: "prepaid_items", computeMethod: "manual", defaultDebit: "buyer", defaultCredit: "settlement_agent", required: false },

  // Commissions
  { templateKey: "buyer_agent_commission", label: "Buyer Agent Commission", section: "commissions", computeMethod: "percentage", defaultValue: 300, basedOn: "sales_price", defaultDebit: "seller", defaultCredit: "settlement_agent", required: true },
  { templateKey: "seller_agent_commission", label: "Seller Agent Commission", section: "commissions", computeMethod: "percentage", defaultValue: 300, basedOn: "sales_price", defaultDebit: "seller", defaultCredit: "settlement_agent", required: true },

  // Adjustments & Prorations
  { templateKey: "property_tax_proration", label: "Property Tax Proration", section: "adjustments_and_prorations", computeMethod: "per_diem", basedOn: "annual_tax", defaultDebit: "seller", defaultCredit: "counterparty", required: true },

  // Payoffs
  { templateKey: "mortgage_payoff", label: "Existing Mortgage Payoff", section: "payoffs_and_liens", computeMethod: "manual", defaultDebit: "seller", defaultCredit: "settlement_agent", required: false },

  // Misc
  { templateKey: "flood_certification", label: "Flood Certification", section: "lender_charges", computeMethod: "fixed", defaultValue: 2500, defaultDebit: "buyer", defaultCredit: "settlement_agent", required: false },
];

/**
 * Ohio purchase deal templates.
 * OH has no intangible tax, lower transfer tax rate, different recording fee structure.
 */
export const OH_PURCHASE_TEMPLATES: FeeTemplate[] = [
  // Sale Price & Credits
  { templateKey: "contract_sales_price", label: "Contract Sales Price", section: "sale_price_and_credits", computeMethod: "manual", defaultDebit: "buyer", defaultCredit: "counterparty", required: true },

  // Deposits
  { templateKey: "earnest_money_deposit", label: "Earnest Money Deposit", section: "deposits_and_earnest_money", computeMethod: "manual", defaultDebit: "buyer", defaultCredit: "settlement_agent", required: true },

  // Title Charges
  { templateKey: "owners_title_insurance", label: "Owner's Title Insurance Premium", section: "title_charges", computeMethod: "per_thousand", defaultValue: 550, basedOn: "sales_price", defaultDebit: "buyer", defaultCredit: "settlement_agent", required: true },
  { templateKey: "lenders_title_insurance", label: "Lender's Title Insurance Policy", section: "title_charges", computeMethod: "per_thousand", defaultValue: 350, basedOn: "loan_amount", defaultDebit: "buyer", defaultCredit: "settlement_agent", required: true },
  { templateKey: "settlement_fee", label: "Settlement Fee", section: "title_charges", computeMethod: "fixed", defaultValue: 45000, defaultDebit: "split", defaultCredit: "settlement_agent", required: true },
  { templateKey: "title_search", label: "Title Search", section: "title_charges", computeMethod: "fixed", defaultValue: 25000, defaultDebit: "buyer", defaultCredit: "settlement_agent", required: true },

  // Government Recording & Transfer (OH: no intangible tax, transfer tax = $1 per $1000)
  { templateKey: "recording_fee_deed", label: "Recording Fee — Deed", section: "government_recording_and_transfer", computeMethod: "fixed", defaultValue: 3400, defaultDebit: "buyer", defaultCredit: "settlement_agent", required: true },
  { templateKey: "recording_fee_mortgage", label: "Recording Fee — Mortgage", section: "government_recording_and_transfer", computeMethod: "fixed", defaultValue: 3400, defaultDebit: "buyer", defaultCredit: "settlement_agent", required: true },
  { templateKey: "transfer_tax", label: "OH Conveyance Fee", section: "government_recording_and_transfer", computeMethod: "per_thousand", defaultValue: 100, basedOn: "sales_price", defaultDebit: "seller", defaultCredit: "settlement_agent", required: true },

  // Lender Charges
  { templateKey: "loan_origination_fee", label: "Loan Origination Fee", section: "lender_charges", computeMethod: "percentage", defaultValue: 100, basedOn: "loan_amount", defaultDebit: "buyer", defaultCredit: "lender", required: false },
  { templateKey: "loan_proceeds", label: "Loan Proceeds", section: "lender_charges", computeMethod: "manual", defaultDebit: "buyer", defaultCredit: "lender", required: true },

  // Prepaid Items
  { templateKey: "prepaid_interest", label: "Prepaid Interest", section: "prepaid_items", computeMethod: "per_diem", basedOn: "loan_amount", defaultDebit: "buyer", defaultCredit: "lender", required: true },
  { templateKey: "homeowners_insurance", label: "Homeowner's Insurance Premium (12 mo)", section: "prepaid_items", computeMethod: "manual", defaultDebit: "buyer", defaultCredit: "settlement_agent", required: false },

  // Commissions
  { templateKey: "buyer_agent_commission", label: "Buyer Agent Commission", section: "commissions", computeMethod: "percentage", defaultValue: 300, basedOn: "sales_price", defaultDebit: "seller", defaultCredit: "settlement_agent", required: true },
  { templateKey: "seller_agent_commission", label: "Seller Agent Commission", section: "commissions", computeMethod: "percentage", defaultValue: 300, basedOn: "sales_price", defaultDebit: "seller", defaultCredit: "settlement_agent", required: true },

  // Adjustments & Prorations
  { templateKey: "property_tax_proration", label: "Property Tax Proration", section: "adjustments_and_prorations", computeMethod: "per_diem", basedOn: "annual_tax", defaultDebit: "seller", defaultCredit: "counterparty", required: true },

  // Payoffs
  { templateKey: "mortgage_payoff", label: "Existing Mortgage Payoff", section: "payoffs_and_liens", computeMethod: "manual", defaultDebit: "seller", defaultCredit: "settlement_agent", required: false },

  // Misc
  { templateKey: "flood_certification", label: "Flood Certification", section: "lender_charges", computeMethod: "fixed", defaultValue: 2500, defaultDebit: "buyer", defaultCredit: "settlement_agent", required: false },
];

/**
 * Compute amount for a template given deal parameters.
 */
export function computeTemplateAmount(
  template: FeeTemplate,
  params: {
    salesPriceCents?: number;
    loanAmountCents?: number;
    annualTaxCents?: number;
    closingDate?: string;
  },
): number {
  if (template.computeMethod === "fixed") {
    return template.defaultValue ?? 0;
  }

  const base = template.basedOn === "sales_price"
    ? params.salesPriceCents ?? 0
    : template.basedOn === "loan_amount"
      ? params.loanAmountCents ?? 0
      : template.basedOn === "annual_tax"
        ? params.annualTaxCents ?? 0
        : 0;

  if (template.computeMethod === "percentage") {
    // defaultValue is in basis points (100 = 1%)
    return Math.round((base * (template.defaultValue ?? 0)) / 10000);
  }

  if (template.computeMethod === "per_thousand") {
    return Math.round((base / 100000) * (template.defaultValue ?? 0));
  }

  if (template.computeMethod === "per_diem") {
    // Calculate daily rate and multiply by days
    if (!params.closingDate) return 0;
    const closingDay = new Date(params.closingDate).getDate();
    const daysInMonth = new Date(
      new Date(params.closingDate).getFullYear(),
      new Date(params.closingDate).getMonth() + 1,
      0,
    ).getDate();
    const daysRemaining = daysInMonth - closingDay;

    if (template.basedOn === "loan_amount") {
      // Prepaid interest: loan amount * rate / 365 * days
      const dailyRate = (params.loanAmountCents ?? 0) * 0.065 / 365 / 100;
      return Math.round(dailyRate * daysRemaining * 100);
    }
    if (template.basedOn === "annual_tax") {
      // Tax proration: annual tax / 365 * days from Jan 1 to closing
      const jan1 = new Date(new Date(params.closingDate).getFullYear(), 0, 1);
      const closing = new Date(params.closingDate);
      const daysSinceJan1 = Math.round(
        (closing.getTime() - jan1.getTime()) / (1000 * 60 * 60 * 24),
      );
      return Math.round(((params.annualTaxCents ?? 0) / 365) * daysSinceJan1);
    }
    return 0;
  }

  return 0; // manual — AI should provide the amount
}

/**
 * Get fee templates for a deal's state.
 */
export function getTemplatesForDeal(state: string, dealType: string): FeeTemplate[] {
  const s = state.toUpperCase();
  if (s === "GA" && dealType === "purchase") return GA_PURCHASE_TEMPLATES;
  if (s === "OH" && dealType === "purchase") return OH_PURCHASE_TEMPLATES;
  // Fallback to OH templates — they omit state-specific taxes like GA intangible tax
  return OH_PURCHASE_TEMPLATES;
}
