import { defineTool } from "@/lib/tools/define-tool";

export const applyProposalTool = defineTool({
  actionName: "applyProposal",
  gatewayName: "apply_proposal",
  group: "finances",
  gatewayDescription:
    "Apply a pending proposal to the ledger. Optionally specify which individual " +
    "items to apply (for partial application). Updates line item amounts and marks the proposal as applied.",
  ui: {
    label: "Apply Proposal",
    loadingLabel: "Applying changes...",
    icon: "check-circle",
    detailKind: "apply-proposal",
  },
});
