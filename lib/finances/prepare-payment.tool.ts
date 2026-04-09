import { defineTool } from "@/lib/tools/define-tool";
import { PreparePaymentInput } from "@/lib/finances/tool-inputs.input";

export const preparePaymentTool = defineTool({
  actionName: "preparePayment",
  gatewayName: "prepare_payment",
  group: "finances",
  gatewayDescription:
    "Pre-fill a payment draft with party info, amount from balance, and method. " +
    "Does NOT create the payment — returns a draft for the user to review and confirm.",
  inputSchema: PreparePaymentInput,
  ui: {
    label: "Prepare Payment",
    loadingLabel: "Preparing payment...",
    icon: "credit-card",
    detailKind: "payments",
  },
});
