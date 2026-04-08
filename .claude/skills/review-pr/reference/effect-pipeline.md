# Effect Pipeline Conventions

## The 4-File Pattern

Every domain operation follows this structure:

| File | Purpose | Required? |
|------|---------|-----------|
| `lib/<domain>/<op>.ts` | Effect.gen function + Schema input | Always |
| `lib/<domain>/<op>.tool.ts` | `defineTool()` metadata (client-safe) | If AI/MCP-callable |
| `lib/<domain>/<op>.server.ts` | `"use server"` wrapper via `runValidatedEffect()` | If mutation |
| `lib/<domain>/queries.ts` | TanStack Query hooks | Only when RSC isn't sufficient |

### Effect file (`<op>.ts`)

```ts
import { Effect, Schema } from "effect";
import { Conn } from "@/lib/effect/services";
import { sql } from "@/lib/effect/sql";
import * as s from "@/db/schema";

export const MyInput = Schema.Struct({
  fileId: Schema.UUID.annotations({ description: "..." }),
});
export type MyInput = typeof MyInput.Type;

export const myOperation = (input: MyInput) =>
  Effect.gen(function* () {
    const conn = yield* Conn;
    const [row] = yield* sql(conn.select().from(s.table).where(...));
    if (!row) return yield* Effect.fail({ _tag: "NotFound" as const, message: "..." });
    return row;
  });
```

### Tool file (`<op>.tool.ts`)

```ts
import { defineTool } from "@/lib/tools/define-tool";

export const myOperationTool = defineTool({
  gatewayName: "my_operation",
  gatewayDescription: "Description for AI/MCP consumers.",
});
```

### Server action file (`<op>.server.ts`)

```ts
"use server";

import { runValidatedEffect } from "@/lib/effect/run";
import { getUser } from "@/lib/auth/get-user";
import { myOperation, MyInput } from "./my-operation";

export async function myOperationAction(input: unknown) {
  return runValidatedEffect(MyInput, myOperation, input, { getUser });
}
```

## Registration Checklist

After creating a tool-callable operation, register it in **both** files:

1. **`lib/tools/catalog.ts`** — Import the tool definition, add to `TOOL_DEFINITIONS` array
2. **`lib/tools/registry.ts`** — Import the Effect function + Schema, add to `EFFECT_BY_TOOL` map with correct `transactional` flag (default `true`; set `false` for reads)

**Missing registration = IMPORTANT finding.** The tool won't appear in AI/MCP without it.

## Rules to Check

| Rule | Severity | What to flag |
|------|----------|-------------|
| Bare `throw` in Effect.gen | IMPORTANT | Use `yield* Effect.fail(...)` instead |
| Untagged errors | IMPORTANT | Custom errors must have `_tag` property |
| Direct `db` import in Effect | IMPORTANT | Use `yield* Conn` for DB access |
| Server imports in `.tool.ts` | IMPORTANT | `.tool.ts` must only import from `@/lib/tools/define-tool` |
| Business logic in `.tool.ts` | IMPORTANT | Tool files are metadata-only — no logic, no schemas |
| Missing Schema annotations | NIT | Add `.annotations({ description })` for AI discoverability |
| `.server.ts` for a read | IMPORTANT | Reads use `runEffect` in server components, not server actions |
| Missing `transactional: false` for reads in registry | NIT | Reads don't need transactions |
| Missing registration in catalog or registry | IMPORTANT | Tool won't be accessible via AI/MCP |

## Command Pattern — All Mutations Must Flow Through Commands

Every external entrypoint that performs database mutations must execute as a **Command**.
A Command is an Effect executed via `runCommand()` or one of the adapter functions
(`runValidatedEffect`, `effectToAiTool`, `effectToMcpTool`, `effectRoute`) — all of
which call `runCommand` internally.

When a mutation runs as a Command:
- A unique `commandId` is generated and written to `command_log` (pending → success/failure)
- The `commandId` is set in the transaction context (`app.current_command_id`)
- Audit triggers include `command_id` in every `audit_log` row

**This is how we get end-to-end traceability** — from the external trigger down to
individual row mutations. Bypassing it means audit log entries have no command
reference and command_log has no record of the operation.

### Command compliance rules

| Rule | Severity | What to flag |
|------|----------|-------------|
| Server action mutation using `runEffect` directly | **BLOCKING** | Must use `runValidatedEffect` (which calls `runCommand` internally) |
| Custom server action mutation using `runEffect` without `runCommand` | **BLOCKING** | Must call `runCommand(name, effect, opts)` instead of `runEffect` |
| Route handler mutation using `runEffect` directly | **BLOCKING** | Must use `effectRoute` adapter or call `runCommand` |
| Read-only `runEffect` in a server component | OK | Reads from server components don't need Command logging |
| Adapter functions (`effectToAiTool`, `effectToMcpTool`, `effectRoute`) | OK | These call `runCommand` internally — already compliant |
| `runValidatedEffect` in `.server.ts` | OK | This calls `runCommand` internally — already compliant |

### How to check

For every `*.server.ts` file or route handler that performs writes:
1. Look for `import { runEffect }` — if present for a mutation, it's a violation
2. The correct import is `runValidatedEffect` (standard pattern) or `runCommand` (custom wrappers)
3. If using `runCommand` directly, verify it has a descriptive `name` parameter

### Anti-patterns

**Bad — mutation server action bypassing Command:**
```ts
"use server";
import { runEffect } from "@/lib/effect/run";  // WRONG for mutations

export async function myMutationAction(input: unknown) {
  const result = await runEffect(myMutation(input), { transactional: true });
  // No commandId, no command_log entry, no audit_log cross-reference
}
```

**Good — standard server action pattern:**
```ts
"use server";
import { runValidatedEffect } from "@/lib/effect/run";
import { getUser } from "@/lib/auth/get-user";

export async function myMutationAction(input: unknown) {
  return runValidatedEffect(MyInput, myMutation, input, { getUser });
  // runValidatedEffect calls runCommand internally — fully traced
}
```

**Good — custom wrapper using runCommand:**
```ts
"use server";
import { runCommand } from "@/lib/effect/run";

export async function myCustomAction(snapshot: SomeType) {
  const result = await runCommand("myCustomAction", myEffect(snapshot), {
    transactional: true,
    payload: { id: snapshot.id },
  });
  // Explicitly traced via runCommand
}
```

## All DB Writes Must Go Through Effects

Drizzle `insert`, `update`, and `delete` calls must be inside Effect functions — never
in raw server actions, route handlers, or components. Going outside the pipeline means
no audit trail, no command tracing, no entity deduplication, and no typed error handling.

| Anti-pattern | Severity | Fix |
|-------------|----------|-----|
| `conn.insert(...)` outside an Effect.gen function | IMPORTANT | Wrap in an Effect and call via `runValidatedEffect` or `runCommand` |
| `db.update(...)` in a route handler body | IMPORTANT | Create a domain Effect in `lib/<domain>/`, call it from the handler via `effectRoute` |
| `tx.delete(...)` in a server action without Effect | IMPORTANT | Use `yield* sql(conn.delete(...))` inside Effect.gen |

## Don't Silently Swallow Errors

Never hide failures. At minimum log them. In Effect code, use typed failures.

| Anti-pattern | Severity | Fix |
|-------------|----------|-----|
| Empty `catch {}` block | IMPORTANT | Log the error or re-throw |
| `catch (e) { return null }` without logging | IMPORTANT | At minimum `console.error(e)`, preferably `yield* Effect.fail(...)` |
| `.catch(() => undefined)` on a promise | NIT | Log or propagate — silent failure masks bugs |

## Anti-Pattern Examples

**Bad — bare throw:**
```ts
export const myOp = (input: MyInput) =>
  Effect.gen(function* () {
    const conn = yield* Conn;
    const [row] = yield* sql(conn.select()...);
    if (!row) throw new Error("Not found"); // WRONG
    return row;
  });
```

**Good — Effect.fail with tagged error:**
```ts
if (!row) return yield* Effect.fail({ _tag: "NotFound" as const, message: "Row not found" });
```

**Bad — server import in .tool.ts:**
```ts
import { defineTool } from "@/lib/tools/define-tool";
import { db } from "@/db"; // WRONG — breaks client bundle
```

**Good — metadata only:**
```ts
import { defineTool } from "@/lib/tools/define-tool";
// No other imports
```

## Type & Enum Centralization

Types, enums, and status constants must have a **single source of truth**. AI-driven
development frequently produces duplicate type definitions — this is one of the most
common review findings.

### Source of Truth Hierarchy

1. **Drizzle schema** (`db/schemas/*.ts`) — Canonical for all DB-backed types.
   Uses `Schema.Literal()` for enums. All other layers import from here.
2. **Domain types** (`types/*.ts`) — For UI labels and cross-mapping records
   that augment (not redefine) the schema types.
3. **UI config** (`*-constants.ts`) — For style/color mappings keyed by schema types.

### Anti-Patterns to Flag

| Anti-pattern | Severity | Fix |
|-------------|----------|-----|
| Redefining a type that exists in `db/schemas/` | IMPORTANT | Delete the duplicate, import from schema |
| `type Status = "a" \| "b" \| "c"` when `Schema.Literal(...)` already defines it | IMPORTANT | Import the existing type |
| Same `Record<Type, Label>` map in multiple component files | IMPORTANT | Centralize in `types/` or a shared constants file |
| Component-local config object for statuses/types | NIT | Move to a shared `*-constants.ts` file |
| `as SomeType` cast to work around a type mismatch | NIT | Use a conversion function or fix the type flow |
| Inline status string literals (`status === "pending"`) without type narrowing | NIT | Import the type and use typed comparisons |

### How to Check

When a PR introduces a new `type` or string literal union:
1. Search `db/schemas/` for an existing definition of the same concept
2. Search `types/` for an existing label/config mapping
3. If a match exists, the PR should import it — not redefine it

When a PR adds a `Record<Type, Config>` or label mapping:
1. Search for other files with the same keys
2. If the same mapping exists elsewhere, consolidate into one shared file
