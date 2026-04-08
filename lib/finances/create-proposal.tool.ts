import { defineTool } from "@/lib/tools/define-tool";

export const createProposalTool = defineTool({
  actionName: "createProposal",
  gatewayName: "create_proposal",
  group: "finances",
  gatewayDescription:
    "Create a change proposal with one or more line item modifications for the closer to review. " +
    "Include a trigger description, the proposed changes, and the net impact on each party. " +
    "The closer can then apply or dismiss the proposal.",
  ui: {
    label: "Proposal",
    loadingLabel: "Preparing proposal...",
    icon: "sparkles",
    detailKind: "proposal",
  },
});
