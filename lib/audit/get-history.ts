export type AuditEntry = {
  id: string;
  tableName: string;
  rowId: string;
  operation: string;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  changedFields: string[] | null;
  userId?: string | null;
  userEmail?: string | null;
  occurredAt: string;
};

export type GetHistoryResult = {
  items: AuditEntry[];
  nextCursor: string | null;
};
