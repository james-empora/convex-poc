import { defineTool } from "@/lib/tools/define-tool";

export const dismissProposalTool = defineTool({
  actionName: "dismissProposal",
  gatewayName: "dismiss_proposal",
  group: "finances",
  gatewayDescription:
    "Dismiss a pending proposal. The proposal is archived but no changes are made to the ledger.",
  ui: {
    label: "Dismiss Proposal",
    loadingLabel: "Dismissing...",
    icon: "x-circle",
    detailKind: "dismiss-proposal",
  },
});
