<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Package Manager

Use **pnpm** for all dependency operations (`pnpm add`, `pnpm install`, `pnpm run`). Do not use `npm`.

## Frontend Architecture

See [docs/FRONTEND.md](docs/FRONTEND.md) for all frontend decisions including:
- Tech stack (shadcn/ui, Convex, Jotai, React Hook Form + Zod)
- Complete Empora color system with hex codes
- Typography (Red Hat Text/Display)
- State management guidelines
- Component conventions

Key rules:
- **Sapphire** is the primary accent color, not Garnet (per Cal's guidance)
- **Light mode only** — Onyx 5 `#FBF9F7` background
- Server state via Convex queries and RSC props, client UI state in Jotai, forms in React Hook Form + Zod
- shadcn/ui components in `components/ui/`, compositions in `components/composite/`
- **React Compiler is enabled** — do not use `useMemo`, `useCallback`, or `React.memo` for performance. The compiler handles memoization automatically. Using them manually adds noise and can conflict with the compiler's optimizations. Only use `useMemo` if you need referential stability for a non-React reason.

## Convex Auth

Use the shared Convex client/auth wiring instead of constructing ad-hoc clients.

- Client components should get Convex through `components/auth/convex-auth-provider.tsx`
- Server components, route handlers, and server functions should use helpers from `lib/convex/client.ts`
- Prefer `createAuthenticatedConvexHttpClient()` for server-side reads and writes that depend on the current user
- Do not create new raw `ConvexHttpClient` or `ConvexReactClient` instances in feature code unless there is a concrete bootstrap/tooling need
- Convex auth provider configuration may lag local development temporarily while deployment/auth setup is in flight; do not work around that by spreading one-off client construction patterns through the app

## ID Policy

Keep app-facing route params and UI IDs stable unless there is an explicit product reason to expose raw Convex document IDs.

- Prefer legacy/app IDs in URLs, tab state, and cross-route navigation
- Translate to Convex document IDs inside Convex functions or thin server-side helpers when needed
- Avoid broad `as Id<...>` casting in app code; that usually means the ID boundary is in the wrong place
- When migrating a feature, preserve existing route contracts unless the user explicitly asks for a URL/API change

## Workspace Layout Pattern

Every new route that manages a list of items **must** use the resizable workspace layout
from `@/components/composite/resizable-panels`. Do not create custom layout shells,
split-pane implementations, or ad-hoc panel components — always compose from the
existing primitives.

### Structure

```
LayoutShell ("use client", h-full overflow-hidden)
├── Group (orientation="horizontal", persisted via useDefaultLayout + useSafeStorage)
│   ├── Panel: Left Rail (list, selection, filters)
│   │   ├── Rail header (h-9, bg-onyx-10, uppercase title + count span)
│   │   ├── SelectedItemPanel (gradient summary of selected item, or empty state)
│   │   ├── Filter/search input (optional)
│   │   └── Scrollable item list with scroll indicator
│   │
│   ├── HorizontalSeparator
│   │
│   ├── Panel: Content Well (detail view for selected item)
│   │   ├── Tab bar (border-b, sapphire underline active indicator)
│   │   └── Scrollable tab content
│   │
│   ├── HorizontalSeparator (only if resource rail is needed)
│   │
│   └── Panel: Resource Rail — OPTIONAL (contextual side panels)
│       └── Vertical Group of CollapsiblePane[] (documents, action items, etc.)
```

### When to include the resource rail (right panel)

The right resource rail is **optional**. Include it when the route has secondary data
panels that support the primary content (e.g. documents list, action items). Omit it
for simpler routes that only need a list + detail view (two-panel layout).

### Key components and hooks

All from `@/components/composite/resizable-panels`:

| Export | Purpose |
|---|---|
| `Group` | Resizable panel container (horizontal or vertical) |
| `Panel` | Individual resizable panel with `id`, `minSize`, `maxSize`, `collapsible` |
| `HorizontalSeparator` | Vertical drag handle between horizontal panels |
| `VerticalSeparator` | Horizontal drag handle between vertical panels |
| `useDefaultLayout` | Persists/restores panel sizes to localStorage by `id` |
| `useSafeStorage` | SSR-safe localStorage wrapper (avoids hydration mismatch) |
| `useIsMounted` | Defers rendering until after hydration |
| `usePanelRef` | Ref handle for programmatic collapse/expand |

### Rail conventions

- **Header**: `h-9`, `bg-onyx-10`, `border-b border-onyx-20`. Title in `<h2>` with
  `text-xs font-semibold uppercase tracking-wider text-onyx-70`. Count as a plain
  `<span className="ml-1 text-xs tabular-nums text-onyx-60">` — not a Badge.
- **Selected item panel**: `bg-gradient-to-br from-sapphire-10/30 to-sapphire-10`,
  `min-h-[120px]`, `border-b border-onyx-20`. Shows address/title (2xl font-display),
  metadata row with icons, and action links. Empty state shows centered icon + text
  on `bg-onyx-5`.
- **Item cards**: `border-l-2` selection indicator. Selected: `border-l-sapphire-60
  bg-sapphire-10/50`. Hover: `hover:bg-onyx-10/60`.
- **Scroll indicator**: gradient fade + chevron at bottom of scrollable list.

### Tab bar conventions

- Container: `border-b border-onyx-20 bg-white px-2`
- Tabs: `border-b-2 px-3 py-2 text-xs font-medium`
- Active: `border-sapphire-50 text-sapphire-70`
- Inactive: `border-transparent text-onyx-60 hover:text-onyx-90`

### Dynamic workspace tabs in navbar

Any top-level route (e.g. `/skills`, `/tools-catalog`) that isn't
a fixed workspace tab (Coordinator, Portfolio, File Board) automatically gets a
dynamic workspace tab in the navbar (derived in `components/layout/app-shell.tsx`
via `deriveDynamicTab()`). No configuration needed — just create the route and the
tab appears when the user navigates there.

### Reference implementations

- **Three-panel** (rail + content + resources): `portfolio/_components/portfolio-workspace.tsx`
- **Two-panel** (rail + content): `skills/_components/skills-workspace.tsx`

## Jotai State Management

Use **Jotai atoms** for all client-side state — do not create React context providers. This includes user/auth state, UI state, and any data that needs to be shared across client components.

- Define atoms colocated with their domain (e.g., `lib/auth/atoms.ts`, `app/portfolio/_lib/atoms.ts`)
- To hydrate atoms from server data, use `useHydrateAtoms` from `jotai/utils` in a thin wrapper component (see `components/auth/user-provider.tsx` as the pattern)
- Read atoms with `useAtom` from `jotai` — no custom hooks wrapping `useContext` needed
- Use `atomWithStorage` from `jotai/utils` for state that should persist to localStorage

## Domain Logic

Keep the app close to plain TypeScript. Domain operations should be ordinary Convex
queries, mutations, and actions with Zod-backed inputs where validation is needed.

### Rules

- Put persistence logic in `convex/*.ts`, not in API routes or UI components.
- Use plain helper functions for shared domain logic. Do not reintroduce Effect-style wrappers or command abstractions.
- Keep tool definitions metadata-only in `lib/<domain>/*.tool.ts`.
- `lib/tools/registry.ts` is the server-side bridge from tool metadata to Convex-backed execution.
- Audit should stay lightweight: resolve the actor, compute changed fields, write an audit row.
- Prefer small, explicit functions over generic adapters.

### Domain pipeline

```
lib/<domain>/<name>.input.ts     # Zod schema, client-safe
lib/<domain>/<name>.tool.ts      # Tool metadata, client-safe
convex/<domain>.ts               # Query/mutation/action handlers
lib/<domain>/queries.ts          # Thin client hooks only when a client component needs them
```

## Legacy Import

`legacy-import` is still an important admin workflow.

- Do not delete or de-scope it as part of Convex cleanup
- Port it onto Convex deliberately, including persisted import records and refresh flows
- Search/snapshot fetches that still depend on the Rails MCP/admin surface can remain server-side, but persisted state belongs in Convex

If the tool has `ui` metadata (a `ToolUiMeta` with a `detailKind`), also add mock
input/output data for its `detailKind` in
`app/(admin)/tools-catalog/_components/tool-preview-mocks.ts`.

## Environment Variables

**Always read environment variables through `env.ts`** — never use `process.env`
directly for application config. The `env` object is type-safe, validated at
startup, and serves as the single source of truth for all configuration.

```ts
// Good
import { env } from "@/env";
const key = env.AI_GATEWAY_API_KEY;

// Bad — no type safety, no validation
const key = process.env.AI_GATEWAY_API_KEY;
```

The only acceptable use of `process.env` in application code is `process.env.NODE_ENV`
(a Node.js built-in used for runtime environment detection). All custom env vars must go
through `env.ts`. When adding a new env var, add it to `env.ts` first.

Allowed exceptions:
- `env.ts` itself
- test/bootstrap files that intentionally seed environment variables for local runs
- tooling/bootstrap scripts that run before app config is initialized

### Input schemas and `.input.ts` files

Input schemas live in client-safe `.input.ts` files and should use Zod. Keep them
free of server-only imports so they can drive forms and tool metadata on the client:

```
lib/<domain>/<name>.input.ts     # z.object(...) — client-safe
convex/<domain>.ts               # imports the schema shape as needed for validation/runtime mapping
```

This separation allows input schemas to be imported in client components without
pulling in server-only dependencies.

### Annotating schemas for forms

Zod schemas drive dynamic form generation via `lib/forms/`. Two metadata fields
control how fields render:

- **`title`** — The human-readable **label** shown next to the input. Required for any field where the camelCase property name doesn't produce a good label (acronyms, abbreviations, multi-word names).
- **`description`** — **Helper text** shown below the input. Use for clarifying what the field expects, examples, or format hints.

```ts
import { z } from "zod";

// Good — title controls the label, description is helper text
mlsId: z.string().optional().describe("Multiple Listing Service identifier").meta({
  title: "MLS ID",
}),

// Also good — title alone when the description would be redundant
firstName: z.string().meta({ title: "First Name" }),

// Avoid — description is used as the label when title is absent,
// which conflates the label with the helper text
mlsId: z.string().optional().describe("MLS ID"),
```

**Label resolution order:** `title` → `description` → humanized property name (e.g. `stateOfFormation` → "State Of Formation"). Always set `title` when the humanized name is wrong.

**When to annotate:**
- Acronyms and initialisms: `nmlsId` → title "NMLS ID", `mlsId` → title "MLS ID"
- Technical identifiers: `fileId` → title "File ID", `entityId` → title "Entity ID"
- Multi-word domain terms: `stateOfFormation` → title "State of Formation"
- Enum fields: always set title so the label isn't the humanized property name (e.g. `entityType` → title "Entity Type")
- Any field an AI agent or non-developer user will see in a form

**Relation fields** — ID fields that reference another table (e.g. `entityId`, `fileId`) should use the `FormRelation` annotation so the form renders a searchable combobox instead of a plain UUID text input:

```ts
import { FormRelation } from "@/lib/forms/relation";
import { z } from "zod";

entityId: z.string().uuid().describe("Search by name or email").meta({
  title: "Entity",
  [FormRelation]: { domain: "entities", displayField: "name", secondaryField: "email" },
}),
```

The `domain` string maps to a search provider passed to `DynamicForm` via its `searchProviders` prop. When no provider is registered for a domain, the field falls back to a plain text input.

**Form variant** — schemas can specify their preferred `ResourceCard` variant via the `FormVariant` annotation. This controls whether the card defaults to inline editing, full-form editing, etc.:

```ts
import { z } from "zod";

// Simple flat schemas — inline editing works well
export const UpdateChatTitleInput = z.object({ ... }).meta({
  formVariant: "inline",
});

// Discriminated unions or complex validation — force full form mode
export const CreateEntityInput = z.discriminatedUnion("entityType", [ ... ]).meta({
  formVariant: "editable",
});
```

Supported values: `"readonly"`, `"new"`, `"editable"`, `"inline"`. When the `ResourceCard` `variant` prop is omitted, it reads this annotation. If neither is set, defaults to `"readonly"`.

**When to set FormVariant:**
- `"inline"` — flat structs with independent field validation (no cross-field dependencies)
- `"editable"` — discriminated unions, cross-field validation, or schemas where editing one field may affect the validity of another
- `"new"` — schemas that are only used for creation (no existing data to display)
- Omit for schemas that are purely read-oriented (e.g. query inputs)

## Data Fetching Strategy

Prefer Convex for live application data. Use server components for first-frame data
when that keeps the route simpler, and use Convex client hooks in client components
when you want reactivity.

- Reads should come from Convex queries.
- Writes should go through Convex mutations.
- Avoid rebuilding a second client cache layer on top of Convex.
- Keep route handlers for HTTP-specific concerns like streaming, webhooks, and downloads.
- Prefer `convex/nextjs` preloading for first-frame route data when auth/setup supports it cleanly.
- When authenticated preloading is not ready for a route yet, fetch on the server with the shared authenticated Convex client and pass props down.

<!-- VERCEL BEST PRACTICES START -->
## Best practices for developing on Vercel

These defaults are optimized for AI coding agents (and humans) working on apps that deploy to Vercel.

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons), use Blob or marketplace integrations for preserving state
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Don't start new projects on Vercel KV/Postgres (both discontinued); use Marketplace Redis/Postgres instead
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add` (CI/agent-friendly)
- Sync env + project settings with `vercel env pull` / `vercel pull` when you need local/offline parity
- Use `waitUntil` for post-response work; avoid the deprecated Function `context` parameter
- Set Function regions near your primary data source; avoid cross-region DB/service roundtrips
- Tune Fluid Compute knobs (e.g., `maxDuration`, memory/CPU) for long I/O-heavy calls (LLMs, APIs)
- Use Runtime Cache for fast **regional** caching + tag invalidation (don't treat it as global KV)
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Use Edge Config for small, globally-read config
- If Enable Deployment Protection is enabled, use a bypass secret to directly access them
- Add OpenTelemetry via `@vercel/otel` on Node; don't expect OTEL support on the Edge runtime
- Enable Web Analytics + Speed Insights early
- Use AI Gateway for model routing, set AI_GATEWAY_API_KEY, using a model string (e.g. 'anthropic/claude-sonnet-4.6'), Gateway is already default in AI SDK
  needed. Always curl https://ai-gateway.vercel.sh/v1/models first; never trust model IDs from memory
- For durable agent loops or untrusted code: use Workflow (pause/resume/state) + Sandbox; use Vercel MCP for secure infra access
<!-- VERCEL BEST PRACTICES END -->
