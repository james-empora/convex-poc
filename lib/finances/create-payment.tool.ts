import { defineTool } from "@/lib/tools/define-tool";
import { CreatePaymentInput } from "@/lib/finances/tool-inputs.input";

export const createPaymentTool = defineTool({
  actionName: "createPayment",
  gatewayName: "create_payment",
  group: "finances",
  gatewayDescription:
    "Create a payment record (receipt or disbursement) after user confirmation. " +
    "IMPORTANT: Always call prepare_payment first and get explicit user confirmation before calling this.",
  inputSchema: CreatePaymentInput,
  ui: {
    label: "Create Payment",
    loadingLabel: "Creating payment...",
    icon: "credit-card",
    detailKind: "payments",
  },
});
