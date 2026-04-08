import { defineTool } from "@/lib/tools/define-tool";

export const whatIfAnalysisTool = defineTool({
  actionName: "whatIfAnalysis",
  gatewayName: "what_if_analysis",
  group: "finances",
  gatewayDescription:
    "Run a what-if analysis to model the impact of hypothetical changes without " +
    "creating a proposal. For example: 'what if closing moves to April 20' or " +
    "'what if we add a $2,000 seller credit'. Returns projected line item changes and net impact.",
  ui: {
    label: "What-If Analysis",
    loadingLabel: "Modeling scenario...",
    icon: "flask-conical",
    detailKind: "what-if",
  },
});
