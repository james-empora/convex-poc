import type { ToolGroupId } from "@/lib/tools/define-tool";

export type { ToolGroupId };

export type ToolGroup = {
  id: ToolGroupId;
  label: string;
  description: string;
};

export const GROUPS: ToolGroup[] = [
  {
    id: "files",
    label: "Files",
    description:
      "Open and manage title/escrow files, including parties and financial data.",
  },
  {
    id: "documents",
    label: "Documents",
    description:
      "Upload, process, and extract text from documents attached to files.",
  },
  {
    id: "entities",
    label: "Entities",
    description:
      "Search, create, and browse individuals, organizations, brokerages, and lenders.",
  },
  {
    id: "finances",
    label: "Finances",
    description:
      "Ledger management, line items, proposals, payments, statements, and drift analysis.",
  },
  {
    id: "findings",
    label: "Findings",
    description: "Create and manage title findings with source evidence.",
  },
  {
    id: "skills",
    label: "Skills",
    description: "CRUD operations for reusable AI skill definitions.",
  },
  {
    id: "action-items",
    label: "Action Items",
    description:
      "Create, complete, reassign, and reconcile action items on files.",
  },
  {
    id: "audit",
    label: "Audit",
    description: "Query the change history for any record in the system.",
  },
];

const GROUP_BY_ID = new Map(GROUPS.map((g) => [g.id, g]));

export function getGroup(id: ToolGroupId): ToolGroup | undefined {
  return GROUP_BY_ID.get(id);
}
