import { defineTool } from "@/lib/tools/define-tool";

export const voidPaymentTool = defineTool({
  actionName: "voidPayment",
  gatewayName: "void_payment",
  group: "finances",
  gatewayDescription: "Void a payment. Requires a reason. This action cannot be undone.",
  ui: {
    label: "Void Payment",
    loadingLabel: "Voiding payment...",
    icon: "x-circle",
    detailKind: "dismiss-proposal",
  },
});
