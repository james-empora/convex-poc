import { defineTool } from "@/lib/tools/define-tool";

export const generateStatementTool = defineTool({
  actionName: "generateStatement",
  gatewayName: "generate_statement",
  group: "finances",
  gatewayDescription:
    "Generate an initial settlement statement from deal parameters (sales price, loan amount, " +
    "closing date, state, county). Creates a proposal with ~20-30 line items from the fee schedule " +
    "template for the closer to review and approve.",
  ui: {
    label: "Generate Statement",
    loadingLabel: "Generating statement...",
    icon: "sparkles",
    detailKind: "proposal",
  },
});
