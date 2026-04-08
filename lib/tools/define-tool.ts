export type ToolIconName =
  | "upload" | "file-text" | "folder-open" | "search" | "user-plus" | "user-minus"
  | "bar-chart" | "list" | "plus-circle" | "pencil" | "sparkles"
  | "check-circle" | "x-circle" | "flask-conical" | "credit-card";

export type ToolDetailKind =
  | "register" | "extract" | "open-file" | "search" | "create-entity" | "add-party" | "remove-party"
  | "ledger-summary" | "line-items" | "add-line-item" | "update-line-item"
  | "proposal" | "apply-proposal" | "dismiss-proposal" | "what-if" | "payments";

export type ToolUiMeta = {
  label: string;
  loadingLabel?: string;
  icon: ToolIconName;
  detailKind: ToolDetailKind;
};

export type ToolGroupId =
  | "documents"
  | "files"
  | "entities"
  | "finances"
  | "findings"
  | "skills"
  | "action-items"
  | "audit";

export type ToolDefinition = {
  gatewayName: string;
  toolName: string;
  group: ToolGroupId;
  legacyToolNames?: string[];
  gatewayDescription?: string;
  ui?: ToolUiMeta;
};

type ToolDefinitionInput = Omit<ToolDefinition, "toolName">;

export function toLocalToolName(gatewayName: string) {
  return gatewayName.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

export function defineTool<T extends ToolDefinitionInput>(definition: T): ToolDefinition & T {
  return {
    ...definition,
    toolName: toLocalToolName(definition.gatewayName),
  };
}
