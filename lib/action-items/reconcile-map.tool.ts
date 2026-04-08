import { defineTool } from "@/lib/tools/define-tool";

export const reconcileActionItemMapTool = defineTool({
  gatewayName: "reconcile_action_item_map",
  group: "action-items",
  gatewayDescription:
    "Apply an AI-generated action item map to the database. Performs delta " +
    "reconciliation: creates new items, updates existing ones, marks items " +
    "complete or deleted, and rebuilds the dependency graph. Each item is " +
    "identified by a stable semantic key. Call this after analyzing the file " +
    "and deciding what action items should exist.",
});
