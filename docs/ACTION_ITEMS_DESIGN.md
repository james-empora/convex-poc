# Action Items — Design Document

> Last updated: 2026-04-02
> Status: Draft
> Authors: David Landreman, Claude (AI pair)

---

## 1. Overview

Action Items replace the current mock implementation with a fully AI-orchestrated task management system for title and escrow files. The system uses a **two-tier architecture**:

1. **AI Map Generation** (expensive, infrequent) — an agentic process that produces a structured "action item map" declaring what items should exist, their dependencies, assignments, and embedded completion rules.
2. **Event-Driven Rule Evaluation** (cheap, continuous) — a generalized app-layer event bus evaluates simple status predicates when data changes, without invoking AI.

### Design Principles

- **Dependency graph over linear workflow** — items declare relationships (hard blockers and soft prerequisites), not a fixed sequence. Work can proceed out of order where appropriate.
- **AI-generated content** — titles, assignments, and due dates are AI-authored using full deal context, not rigid templates or config.
- **Cost-conscious** — AI runs only at major events and on a daily schedule. Between regenerations, cheap rule evaluation handles status transitions.
- **Generalized eventing** — the event bus built for action items is the foundation for all future app-layer eventing (notifications, analytics, etc.).

---

## 2. Data Model

### 2.1 `action_items` Table

```sql
CREATE TABLE action_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id       UUID NOT NULL REFERENCES files(id),

  -- Identity (stable across regenerations)
  key           TEXT NOT NULL,          -- AI-assigned semantic slug (e.g., 'order_title_search')

  -- Content (AI-generated)
  title         TEXT NOT NULL,
  priority      TEXT NOT NULL DEFAULT 'normal', -- 'low' | 'normal' | 'high' | 'urgent'

  -- Assignment
  assignee_entity_id   UUID REFERENCES individuals(id),  -- polymorphic: individual, org, etc.
  assignee_entity_type TEXT,            -- 'individual' | 'organization' | 'user'
  assignee_role        TEXT,            -- file party role that informed assignment

  -- Lifecycle
  status        TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'completed' | 'deleted'
  status_reason TEXT,                   -- why status changed (AI rationale, rule match, manual)
  completed_at  TIMESTAMPTZ,
  deleted_at    TIMESTAMPTZ,

  -- Due date
  due_date      DATE,                   -- AI-assigned, optional (not all items are time-bound)

  -- Completion rule (cheap evaluation between AI regenerations)
  completion_rule JSONB,               -- see §4 for schema

  -- Origin tracking
  origin        TEXT NOT NULL DEFAULT 'ai', -- 'ai' | 'manual'
  thread_id     VARCHAR(255) REFERENCES chat_threads(id), -- system chat thread that created/last updated this item

  -- Timestamps
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(file_id, key)                  -- one item per key per file
);

SELECT enable_audit_trigger('action_items');
```

### 2.2 `action_item_dependencies` Table

```sql
CREATE TABLE action_item_dependencies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_item_id  UUID NOT NULL REFERENCES action_items(id) ON DELETE CASCADE,
  to_item_id    UUID NOT NULL REFERENCES action_items(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,          -- 'hard' | 'soft'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(from_item_id, to_item_id),
  CHECK(from_item_id != to_item_id)
);

SELECT enable_audit_trigger('action_item_dependencies');
```

**Semantics:** `from_item_id` depends on `to_item_id`. A hard dependency means `from` cannot be completed until `to` is completed. A soft dependency means `to` is recommended first but `from` can proceed.

### 2.3 Map Generation Storage — Workflow Runs + System Chat Threads

Map generation does **not** get its own table. It uses the existing `workflow_runs` + `chat_threads` infrastructure:

- A **`workflow_run`** with `workflow_type = 'action_item_generation'` tracks the run lifecycle (pending → running → completed/failed)
- A **system `chat_thread`** stores the full AI conversation (prompts, tool calls, responses, token usage per message)
- **`thread_associations`** link the thread to both the file (`resource_type = 'file'`) and the workflow run (`resource_type = 'workflow_run'`)
- The structured map output is stored as a **chat message artifact** on the system thread (the final assistant message)

This follows the exact pattern established by `extract-document-text.ts` — no new tables needed.

To add `'action_item_generation'` to the workflow system, extend the `WorkflowRunType` enum in `db/schemas/workflow.ts`.

---

## 3. AI Map Generation

### 3.1 Architecture

Map generation is a **Vercel Workflow** (`workflows/generate-action-item-map.ts`) following the same `"use workflow"` / `"use step"` pattern as `extract-document-text.ts`:

1. Creates a `workflow_run` (type: `action_item_generation`) + system `chat_thread`
2. Links them via `thread_associations` to the file
3. Runs an agentic AI step that:
   - Receives the **previous map** (with DB item IDs) and **role/assignment guidance** in its system prompt
   - Calls existing tools (`getFile`, `listFileDocuments`, `getLedgerSummary`, `getPayments`, etc.) to assess current deal state
   - Outputs a **structured action item map** as a delta against the previous state
4. Persists the AI conversation (prompt + tool calls + response) as chat messages on the system thread
5. Runs a reconciliation step that applies the map delta to the DB
6. Marks the workflow run as completed

This reuses the tool catalog and the workflow/chat infrastructure — no new tables or plumbing needed.

### 3.2 Map Output Schema

The AI produces structured output conforming to this schema:

```typescript
type ActionItemMap = {
  items: ActionItemMapEntry[];
  reasoning: string;  // brief explanation of what changed and why
};

type ActionItemMapEntry = {
  // Identity
  key: string;                    // stable semantic slug
  existingId?: string;            // DB UUID if updating an existing item

  // Content
  title: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';

  // Assignment
  assigneeEntityId?: string;      // resolved entity UUID
  assigneeRole?: string;          // file party role
  assignmentRationale?: string;   // why this person/role

  // Timing
  dueDate?: string;               // ISO date

  // Dependencies (inline, resolved to DB edges on reconciliation)
  dependsOn?: Array<{
    key: string;                  // references another item's key
    type: 'hard' | 'soft';
  }>;

  // Completion rule
  completionRule?: CompletionRule;

  // Lifecycle action
  action: 'create' | 'update' | 'complete' | 'delete' | 'no_change';
  actionReason?: string;          // why this action (especially for complete/delete)
};
```

### 3.3 Regeneration Triggers

| Trigger | Frequency | How |
|---------|-----------|-----|
| **Scheduled** | Daily per active file | Vercel Cron Job iterates active files, enqueues regeneration |
| **File status change** | On transition (e.g., pending → in_progress) | Event bus: `tool.openFile.completed`, etc. |
| **Party added/removed** | On party mutation | Event bus: `tool.addFileParty.completed`, `tool.removeFileParty.completed` |
| **Document milestone** | On document status change (uploaded, approved) | Event bus: `tool.registerDocument.completed` |
| **Closing date change** | On file metadata update | Event bus: file update events |
| **Manual request** | Staff clicks "Refresh Action Items" | Direct invocation |

### 3.4 Delta Reconciliation

After AI generates a map, the reconciler:

1. **Matches by key** — map entries with `existingId` or matching `(file_id, key)` are updates
2. **Creates** — entries with `action: 'create'` insert new rows
3. **Updates** — entries with `action: 'update'` patch existing rows (title, priority, due date, assignment, rule)
4. **Completes** — entries with `action: 'complete'` set `status = 'completed'`, `completed_at = now()`, `status_reason = actionReason`
5. **Deletes** — entries with `action: 'delete'` set `status = 'deleted'`, `deleted_at = now()`, `status_reason = actionReason`
6. **Dependencies** — clears existing dependency edges for the file, re-creates from the map's `dependsOn` references (resolved key → UUID)
7. **Thread linkage** — sets `thread_id` on created/updated items linking to the system chat thread that ran the generation

### 3.5 Manual Item Absorption

Items with `origin: 'manual'` are included in the previous map passed to AI. The AI may:

- **Keep as-is** (`action: 'no_change'`) — manual item stays untouched
- **Contextualize** (`action: 'update'`) — add dependencies, adjust priority, link to the graph
- **Complete** (`action: 'complete'`) — if the work is done or no longer applicable
- **Delete** (`action: 'delete'`) — if the item is superseded or irrelevant

The AI treats all items equally — no special protection for manual items.

### 3.6 AI System Prompt Guidance

The regeneration prompt (delivered as the system message on the system chat thread) includes:

- **Role/responsibility matrix** — how to think about file party roles, who typically handles what kind of work (e.g., escrow officers handle disbursements, title agents handle searches)
- **Previous map** — the full previous map output with DB IDs, so AI can compute deltas
- **File type context** — purchase vs. refinance vs. wholesale have different action item profiles (e.g., refis have no buyer, no EMD)
- **Available tools** — the standard tool catalog, so AI can pull deal state as needed

### 3.7 Workflow Structure

Follows the established pattern from `extract-document-text.ts`:

```
generateActionItemMap(fileId)
  "use workflow"
  ├── createWorkflowRunAndThread(fileId)     "use step"
  │   → INSERT workflow_run (type: action_item_generation, thread_id)
  │   → INSERT thread_association (thread → file)
  │   → INSERT thread_association (thread → workflow_run)
  │   → Load previous map from most recent completed run
  │
  ├── markWorkflowRunning(runId)             "use step"
  │
  ├── runAgenticMapGeneration(context)       "use step"
  │   → AI agent with tools: getFile, listFileDocuments, etc.
  │   → Structured output: ActionItemMap
  │   → saveChatMessages() to persist conversation
  │
  ├── reconcileMap(fileId, map, threadId)    "use step"
  │   → Delta reconciliation (create/update/complete/delete items)
  │   → Rebuild dependency edges
  │
  └── markWorkflowCompleted(runId)           "use step"
```

The system chat thread captures the full AI reasoning — what tools were called, what state was observed, why items were created/changed. This provides complete auditability for every regeneration.

---

## 4. Completion Rules

Completion rules are simple JSON predicates stored on each action item. They are evaluated by the event bus — no AI involved.

### 4.1 Rule Schema

```typescript
type CompletionRule = {
  // Which event(s) trigger evaluation
  events: string[];  // e.g., ['tool.registerDocument.completed', 'tool.addFileParty.completed']

  // Predicate to evaluate (all conditions must be true)
  conditions: Condition[];
};

type Condition =
  | { type: 'document_exists'; documentType: string; status?: string }
  | { type: 'party_exists'; role: string }
  | { type: 'file_status'; status: string }
  | { type: 'payment_exists'; status?: string }
  | { type: 'field_equals'; entity: string; field: string; value: string | number | boolean };
```

### 4.2 Evaluation Flow

```
Event fires (e.g., tool.registerDocument.completed)
  → Event bus routes to action item rule evaluator
  → Evaluator queries: SELECT * FROM action_items
      WHERE file_id = :fileId AND status = 'pending'
      AND completion_rule IS NOT NULL
      AND completion_rule->'events' ? :eventType
  → For each matching item, evaluate conditions against DB state
  → If all conditions met → UPDATE status = 'completed',
      status_reason = 'auto: completion rule matched',
      completed_at = now()
```

### 4.3 Examples

**"Complete when title commitment is uploaded"**
```json
{
  "events": ["tool.registerDocument.completed"],
  "conditions": [
    { "type": "document_exists", "documentType": "title_commitment", "status": "received" }
  ]
}
```

**"Complete when buyer party is added"**
```json
{
  "events": ["tool.addFileParty.completed"],
  "conditions": [
    { "type": "party_exists", "role": "buyer" }
  ]
}
```

**"Complete when file reaches clear_to_close"**
```json
{
  "events": ["tool.openFile.completed"],
  "conditions": [
    { "type": "file_status", "status": "clear_to_close" }
  ]
}
```

---

## 5. Generalized Event Bus

Action items are the first consumer, but the event bus is a general-purpose system for the entire application.

### 5.1 Architecture

Events are **auto-derived from tool executions** via the existing tool registry. The tool catalog IS the event catalog — no duplicate type definitions.

```typescript
// lib/events/types.ts

export type AppEvent = {
  type: string;           // 'tool.<toolName>.completed'
  toolName: string;
  input: unknown;
  output: unknown;
  fileId?: string;        // extracted from input when present
  userId?: string;
  timestamp: Date;
};

export type EventListener = (event: AppEvent) => Promise<void>;
```

### 5.2 Event Emission

Events are emitted from the shared mutation/tool execution layer after successful execution — the single chokepoint for write-side actions and tool executions.

```typescript
// In the shared execution wrapper:

const result = await execute(decoded.data, { user });

if (isRight(result)) {
  // Fire-and-forget: don't block the response on event processing
  emit({
    type: `tool.${toolName}.completed`,
    toolName,
    input: decoded.right,
    output: result.right,
    fileId: extractFileId(decoded.right),
    userId: user?.id,
    timestamp: new Date(),
  }).catch(console.error);
}

return result;
```

### 5.3 Listener Registration

```typescript
// lib/events/bus.ts

const listeners: Map<string, EventListener[]> = new Map();

export function on(pattern: string, listener: EventListener): void { ... }
// Supports exact match: 'tool.addFileParty.completed'
// Supports wildcard:    'tool.*.completed'

export async function emit(event: AppEvent): Promise<void> {
  const matched = getMatchingListeners(event.type);
  await Promise.allSettled(matched.map(fn => fn(event)));
}
```

### 5.4 Extracting `fileId`

Most tools accept a `fileId` in their input. The bus extracts it by convention:

```typescript
function extractFileId(input: unknown): string | undefined {
  if (typeof input === 'object' && input !== null && 'fileId' in input) {
    return (input as { fileId: string }).fileId;
  }
  return undefined;
}
```

### 5.5 First Consumers

| Consumer | Events | Behavior |
|----------|--------|----------|
| **Action item rule evaluator** | All mutation events | Evaluates completion rules for the affected file |
| **AI map regeneration trigger** | Major events (status change, party change, document milestone) | Enqueues a map regeneration for the affected file |

Future consumers (not in scope for this design):
- Notification dispatch
- Analytics event tracking
- Audit enrichment

---

## 6. Dependency Graph

### 6.1 Dependency Types

| Type | Semantics | UI Behavior | Enforcement |
|------|-----------|-------------|-------------|
| **Hard** | `from` cannot be completed until `to` is completed | `from` shown as "blocked", greyed out, non-completable | System prevents manual completion |
| **Soft** | `to` is recommended before `from` but not required | `from` shown with a hint ("recommended: complete X first") | No enforcement, just guidance |

### 6.2 Blocked Status Derivation

Blocked is **not stored** — it is derived at query/render time:

```sql
-- Items that are hard-blocked
SELECT ai.id, ai.key, ai.title
FROM action_items ai
JOIN action_item_dependencies d ON d.from_item_id = ai.id AND d.type = 'hard'
JOIN action_items blocker ON blocker.id = d.to_item_id AND blocker.status = 'pending'
WHERE ai.file_id = :fileId AND ai.status = 'pending';
```

An item is blocked if ANY hard dependency has `status = 'pending'`. This is computed fresh each time, so completing a blocker immediately unblocks downstream items.

### 6.3 Critical Path

The dependency graph enables critical path analysis: which items, if delayed, would delay the closing? This can be computed by walking the graph from terminal items (recording, funding) backward through hard dependencies.

---

## 7. Portal Rendering Layer

### 7.1 Architecture

Action items have a single internal representation. A **separate presentation layer** adapts items for the consumer portal. This layer is responsible for:

- Consumer-friendly language (no industry jargon)
- CTA buttons (sign, upload, pay, confirm)
- Urgency badges
- Contextual descriptions explaining *why* the consumer needs to act

### 7.2 Visibility

Portal visibility is **derived from the assignee**:

- If the assignee is an **external party** (consumer, agent, lender — i.e., a file party with a non-internal role), the item appears on their portal view.
- Internal-only items (assigned to staff) never appear on the portal.
- An item assigned to a file party role that maps to an external entity is portal-visible.

```typescript
function isPortalVisible(item: ActionItem, fileParties: FileParty[]): boolean {
  const party = fileParties.find(p =>
    p.entityId === item.assigneeEntityId && p.active
  );
  return party?.side !== 'internal';
}
```

### 7.3 CTA Resolution

The portal rendering layer infers CTAs from the action item title:

| Title pattern | CTA |
|---------------|-----|
| Contains "upload" or "provide" | "Upload Document" |
| Contains "sign" or "review" | "Review & Sign" |
| Contains "pay" or "deposit" or "EMD" | "Pay Online" |
| Contains "confirm" or "verify" | "Confirm" |
| Default | "View Details" |

This can start as simple pattern matching and evolve to an AI-powered rendering pass if more nuance is needed.

---

## 8. Admin UI

### 8.1 Action Items Pane

The action items pane lives in the portfolio resource rail (right side). It displays items for the currently selected file, filtered to the current user.

**Pane header** — the collapsible header bar includes:
- Left: chevron toggle + "Action Items" title (click to collapse/expand)
- Right: three-dot menu (`MoreVertical` icon) — opens a `DropdownMenu`

### 8.2 Three-Dot Menu

The dropdown menu is the entry point for action item management actions. Initial options:

| Menu Item | Icon | Behavior |
|-----------|------|----------|
| **Regenerate Action Items** | `RefreshCw` | Opens confirmation dialog (§8.3) |

Future menu items (not in initial scope):
- "Add Action Item" — manual item creation
- "Show Completed" — toggle visibility of completed items
- "View Generation History" — link to system chat threads for this file

### 8.3 Regeneration Confirmation Dialog

Clicking "Regenerate Action Items" opens a confirmation `Dialog`:

- **Title**: "Regenerate Action Items"
- **Description**: "This will run the AI action item generator for this file. It may create, update, or remove action items based on the current deal state."
- **Footer**: Cancel (outline) + Regenerate (primary)
- **On confirm**: Invokes the `generate-action-item-map` workflow for the current file. The dialog closes and the pane shows a loading/progress indicator while the workflow runs.

### 8.4 Implementation Notes

The pane header action is generic infrastructure — `ResourcePaneDefinition` (in `portfolio-workspace.tsx`) gains an optional `headerAction?: ReactNode` slot. This keeps the workspace component reusable while allowing per-pane header customization. The three-dot menu + dialog live in the action items pane module (`action-items-pane.tsx`) and are passed into the pane definition from `portfolio-layout-shell.tsx`.

The header is restructured so the collapse toggle and the action slot are sibling interactive elements (not nested buttons). Clicking the action slot does not trigger pane collapse.

---

## 9. Assignment

### 8.1 AI-Driven Assignment

During map generation, the AI assigns items based on:

- **File parties and their roles** — who is on the deal and in what capacity
- **Role/responsibility guidance** — system prompt explains typical responsibilities:
  - Title agent: title searches, commitment review, exception clearance
  - Escrow officer: settlement statements, disbursements, wire instructions
  - Buyer/seller: document signing, deposit payments, insurance proof
  - Lender: payoff statements, loan documents, funding
  - Buyer/seller agent: communication, document relay, scheduling
- **Deal type context** — refinances have no buyer; wholesale has an assignor/assignee

### 8.2 Reassignment

Staff can manually reassign any item. The reassignment is persisted and the AI sees it in the next regeneration (since the previous map includes current assignments). The AI should generally respect manual reassignments unless the assigned party has been removed from the file.

---

## 10. Lifecycle

### 10.1 States

```
pending → completed    (rule match, AI regen, manual)
pending → deleted      (AI regen, manual)
```

| State | Meaning | Trigger |
|-------|---------|---------|
| **pending** | Work to be done | Created by AI map or manually |
| **completed** | Work is done or no longer needed | Completion rule match, AI regen (`action: 'complete'`), manual mark-complete |
| **deleted** | Item was wrong, superseded, or irrelevant | AI regen (`action: 'delete'`), manual delete |

### 10.2 Status Reason

Every status transition records a `status_reason`:

- `"auto: completion rule matched — document_exists(title_commitment, received)"`
- `"ai_regen: closing date moved, item no longer applicable"`
- `"manual: user marked complete"`
- `"ai_regen: superseded by 'order_updated_title_search'"`

### 10.3 Soft Delete

Both `completed` and `deleted` are soft states — the row remains in the database. `deleted_at` and `completed_at` timestamps enable filtering. The existing audit trigger + versions table (from the separate versioning PR) captures the full history.

---

## 11. Domain Pipeline

Following the current Convex-first pattern:

### 11.1 New Files

```
convex/actionItems.ts            # Query/mutation handlers for list/get/create/update/delete
lib/action-items/queries.ts      # Thin client hooks where client components need reactivity
lib/action-items/types.ts        # Shared UI types and normalization helpers
lib/action-items/generate-map.server.ts
workflows/run-skill.ts           # Background workflow orchestration for AI-generated action item maps
```

### 11.2 Tool Catalog Additions

Register in `lib/tools/catalog.ts`:
- `createActionItem` — create a manual action item
- `completeActionItem` — mark an item completed
- `deleteActionItem` — soft-delete an item
- `reassignActionItem` — change assignment
- `listActionItems` — list items for a file
- `getActionItem` — get a single item with dependencies

### 11.3 Data Model

Creates `action_items` and `action_item_dependencies` tables in Convex and extends the workflow run model to include `'action_item_generation'`. No additional tables — map generation uses existing `workflow_runs`, `chat_threads`, and `thread_associations`.

---

## 12. Open Questions

1. **Debouncing regeneration** — if multiple major events fire in quick succession (e.g., adding 3 parties), should we debounce AI regeneration to avoid redundant calls? A simple approach: queue regeneration requests and collapse duplicates within a 30-second window.

2. **Regeneration cost budget** — should there be a per-file or per-day cap on AI regeneration calls to prevent runaway costs?

3. **Portal rendering evolution** — the CTA pattern-matching approach (§7.3) may be too rigid. Should the portal rendering layer be an AI pass from the start, or start simple and evolve?

4. **Cross-file action items** — are there action items that span multiple files? (e.g., "Complete all pending recordings for today"). If so, the model needs a nullable `file_id`.

5. **Notification integration** — when an action item is created or becomes urgent, should it trigger notifications? This is a natural second consumer for the event bus but needs its own design.

6. **Dependency cycle detection** — the AI could theoretically create circular dependencies. Should the reconciler validate acyclicity?

7. **Completion rule expressiveness** — status-only rules cover most cases, but some items may need richer conditions (e.g., "complete when ledger balance = 0 AND all payments cleared"). Should the rule schema be extensible?

---

## 13. Implementation Phases

### Phase 1: Foundation
- [ ] `action_items` and `action_item_dependencies` tables
- [ ] Basic CRUD queries/mutations (create, complete, delete, reassign, list, get)
- [ ] Tool catalog + registry registration
- [ ] Thin client hooks where needed
- [ ] Replace mock data in admin portfolio view

### Phase 2: Event Bus
- [ ] `lib/events/bus.ts` — emit, on, wildcard matching
- [ ] Hook into Convex mutations or lightweight app events for auto-emission
- [ ] Thread enough context through workflow entrypoints for auditability

### Phase 3: Completion Rules
- [ ] Rule evaluation engine
- [ ] Event bus listener for rule evaluation
- [ ] Tests for each condition type

### Phase 4: AI Map Generation (Vercel Workflow)
- [ ] Add `action_item_generation` to `WorkflowRunType` enum
- [ ] `workflows/generate-action-item-map.ts` — workflow with `"use workflow"` / `"use step"`
- [ ] System thread creation + thread_associations linkage
- [ ] Agentic AI step with tool calling + conversation persistence
- [ ] Delta reconciliation step (`lib/action-items/reconcile-map.ts`)
- [ ] System prompt with role/responsibility guidance

### Phase 5: Regeneration Triggers + Admin UI
- [ ] Event bus listener for major-event regeneration
- [ ] Vercel Cron Job for daily scheduled regeneration
- [ ] Debouncing logic
- [ ] Three-dot menu on action items pane header (§8)
- [ ] "Regenerate Action Items" dropdown item + confirmation dialog
- [ ] Wire confirm to invoke the `generate-action-item-map` workflow

### Phase 6: Portal
- [ ] Portal rendering layer (visibility, CTAs, consumer-friendly text)
- [ ] Replace mock portal action items
- [ ] Portal action handlers (upload, sign, pay flows)
