import { defineTool } from "@/lib/tools/define-tool";
import { VoidPaymentInput } from "@/lib/finances/tool-inputs.input";

export const voidPaymentTool = defineTool({
  actionName: "voidPayment",
  gatewayName: "void_payment",
  group: "finances",
  inputSchema: VoidPaymentInput,
  gatewayDescription: "Void a payment. Requires a reason. This action cannot be undone.",
  ui: {
    label: "Void Payment",
    loadingLabel: "Voiding payment...",
    icon: "x-circle",
    detailKind: "dismiss-proposal",
  },
});
