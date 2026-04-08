// ---------------------------------------------------------------------------
// Completion Rules — JSON predicates stored on each action item.
// Evaluated by the event bus (future work) — no AI involved.
// ---------------------------------------------------------------------------

export type Condition =
  | { type: "document_exists"; documentType: string; status?: string }
  | { type: "party_exists"; role: string }
  | { type: "file_status"; status: string }
  | { type: "payment_exists"; status?: string }
  | { type: "field_equals"; entity: string; field: string; value: string | number | boolean };

export type CompletionRule = {
  /** Which event(s) trigger evaluation */
  events: string[];
  /** All conditions must be true for completion */
  conditions: Condition[];
};

// ---------------------------------------------------------------------------
// AI Map Generation — structured output from the agentic workflow
// ---------------------------------------------------------------------------

export type ActionItemMapEntry = {
  /** Stable semantic slug (e.g. 'order_title_search') */
  key: string;
  /** DB UUID if updating an existing item */
  existingId?: string;

  /** AI-generated title */
  title: string;
  priority: "low" | "normal" | "high" | "urgent";

  /** Resolved entity UUID for assignment */
  assigneeEntityId?: string;
  assigneeEntityType?: string;
  /** File party role that informed the assignment */
  assigneeRole?: string;
  assignmentRationale?: string;

  /** ISO date string */
  dueDate?: string;

  /** Inline dependency references, resolved to DB edges on reconciliation */
  dependsOn?: Array<{
    key: string;
    type: "hard" | "soft";
  }>;

  completionRule?: CompletionRule;

  /** Lifecycle action for this entry */
  action: "create" | "update" | "complete" | "delete" | "no_change";
  actionReason?: string;
};

export type ActionItemMap = {
  items: ActionItemMapEntry[];
  /** Brief explanation of what changed and why */
  reasoning: string;
};

// ---------------------------------------------------------------------------
// UI types — action item with resolved dependency info
// ---------------------------------------------------------------------------

export type ActionItemDependency = {
  id: string;
  fromItemId: string;
  toItemId: string;
  type: "hard" | "soft";
  /** Key of the dependency target (for display) */
  toItemKey: string;
  toItemTitle: string;
  toItemStatus: string;
};

export type ActionItemWithDeps = {
  id: string;
  fileId: string;
  key: string;
  title: string;
  priority: string;
  assigneeEntityId: string | null;
  assigneeEntityType: string | null;
  assigneeRole: string | null;
  status: string;
  statusReason: string | null;
  completedAt: string | Date | null;
  deletedAt: string | Date | null;
  dueDate: string | null;
  completionRule: CompletionRule | null;
  origin: string;
  threadId: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  /** Items that THIS item depends on (this item is blocked BY these) */
  dependencies: ActionItemDependency[];
  /** Items that depend on THIS item (these are blocked by this item) */
  dependents: ActionItemDependency[];
  /** Derived: true if any hard dependency has status=pending */
  isBlocked: boolean;
  /** Derived: soft dependencies that are still pending */
  softBlockers: ActionItemDependency[];
};
