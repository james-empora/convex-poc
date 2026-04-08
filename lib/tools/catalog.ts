import { getExtractedTextTool } from "@/lib/documents/get-extracted-text.tool";
import { listFileDocumentsTool } from "@/lib/documents/list-file-documents.tool";
import { registerClientUploadTool } from "@/lib/documents/register-client-upload.tool";
import { createEntityTool } from "@/lib/entities/create-entity.tool";
import { readEntitiesTool } from "@/lib/entities/read-entities.tool";
import { searchEntitiesTool } from "@/lib/entities/search-entities.tool";
import { addFilePartyTool } from "@/lib/files/add-file-party.tool";
import { getFileTool } from "@/lib/files/get-file.tool";
import { listFilesTool } from "@/lib/files/list-files.tool";
import { openFileTool } from "@/lib/files/open-file.tool";
import { removeFilePartyTool } from "@/lib/files/remove-file-party.tool";
import { getLedgerSummaryTool } from "@/lib/finances/get-ledger-summary.tool";
import { getLineItemsTool } from "@/lib/finances/get-line-items.tool";
import { addLineItemTool } from "@/lib/finances/add-line-item.tool";
import { updateLineItemTool } from "@/lib/finances/update-line-item.tool";
import { createProposalTool } from "@/lib/finances/create-proposal.tool";
import { applyProposalTool } from "@/lib/finances/apply-proposal.tool";
import { dismissProposalTool } from "@/lib/finances/dismiss-proposal.tool";
import { whatIfAnalysisTool } from "@/lib/finances/what-if-analysis.tool";
import { getPaymentsTool } from "@/lib/finances/get-payments.tool";
import { generateStatementTool } from "@/lib/finances/generate-statement.tool";
import { checkDriftTool } from "@/lib/finances/check-drift.tool";
import { checkMissingItemsTool } from "@/lib/finances/check-missing-items.tool";
import { checkFundingReadinessTool } from "@/lib/finances/check-funding-readiness.tool";
import { preparePaymentTool } from "@/lib/finances/prepare-payment.tool";
import { createPaymentTool } from "@/lib/finances/create-payment.tool";
import { voidPaymentTool } from "@/lib/finances/void-payment.tool";
import { getHistoryTool } from "@/lib/audit/get-history.tool";
import { listFindingsTool } from "@/lib/findings/list-findings.tool";
import { createFindingTool } from "@/lib/findings/create-finding.tool";
import { addFindingSourceTool } from "@/lib/findings/add-finding-source.tool";
import { listSkillsTool } from "@/lib/skills/list-skills.tool";
import { getSkillTool } from "@/lib/skills/get-skill.tool";
import { createSkillTool } from "@/lib/skills/create-skill.tool";
import { updateSkillTool } from "@/lib/skills/update-skill.tool";
import { deleteSkillTool } from "@/lib/skills/delete-skill.tool";
import { listActionItemsTool } from "@/lib/action-items/list-items.tool";
import { getActionItemTool } from "@/lib/action-items/get-item.tool";
import { createActionItemTool } from "@/lib/action-items/create-item.tool";
import { completeActionItemTool } from "@/lib/action-items/complete-item.tool";
import { deleteActionItemTool } from "@/lib/action-items/delete-item.tool";
import { reassignActionItemTool } from "@/lib/action-items/reassign-item.tool";
import { uncompleteActionItemTool } from "@/lib/action-items/uncomplete-item.tool";
import { reconcileActionItemMapTool } from "@/lib/action-items/reconcile-map.tool";
import type { ToolDefinition, ToolUiMeta } from "@/lib/tools/define-tool";

const TOOL_DEFINITIONS: ToolDefinition[] = [
  registerClientUploadTool,
  getExtractedTextTool,
  listFileDocumentsTool,
  openFileTool,
  listFilesTool,
  getFileTool,
  addFilePartyTool,
  removeFilePartyTool,
  readEntitiesTool,
  searchEntitiesTool,
  createEntityTool,
  getLedgerSummaryTool,
  getLineItemsTool,
  addLineItemTool,
  updateLineItemTool,
  createProposalTool,
  applyProposalTool,
  dismissProposalTool,
  whatIfAnalysisTool,
  getPaymentsTool,
  generateStatementTool,
  checkDriftTool,
  checkMissingItemsTool,
  checkFundingReadinessTool,
  preparePaymentTool,
  createPaymentTool,
  voidPaymentTool,
  getHistoryTool,
  listFindingsTool,
  createFindingTool,
  addFindingSourceTool,
  listSkillsTool,
  getSkillTool,
  createSkillTool,
  updateSkillTool,
  deleteSkillTool,
  listActionItemsTool,
  getActionItemTool,
  createActionItemTool,
  completeActionItemTool,
  deleteActionItemTool,
  reassignActionItemTool,
  uncompleteActionItemTool,
  reconcileActionItemMapTool,
];

const TOOL_DEFINITION_BY_NAME = new Map<string, ToolDefinition>();
for (const definition of TOOL_DEFINITIONS) {
  TOOL_DEFINITION_BY_NAME.set(definition.toolName, definition);
  TOOL_DEFINITION_BY_NAME.set(definition.gatewayName, definition);
  for (const legacyName of definition.legacyToolNames ?? []) {
    TOOL_DEFINITION_BY_NAME.set(legacyName, definition);
  }
}

export function getToolDefinition(name: string): ToolDefinition | null {
  return TOOL_DEFINITION_BY_NAME.get(name) ?? null;
}

export function getDisplayToolMeta(name: string): ToolUiMeta | null {
  return getToolDefinition(name)?.ui ?? null;
}

export function isDisplayableToolName(name: string): boolean {
  return getDisplayToolMeta(name) !== null;
}

export function listToolDefinitions(): ToolDefinition[] {
  return TOOL_DEFINITIONS;
}
