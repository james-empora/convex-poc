# Security & TypeScript Conventions

## Authentication Checks

| Context | Rule | Severity |
|---------|------|----------|
| Server actions (`.server.ts`) | Must pass `{ getUser }` to `runValidatedEffect` | IMPORTANT |
| Route Handlers (`app/api/`) | Must validate user session before processing | IMPORTANT |
| Server components | Use `await getUser()` from `lib/auth/get-user` | IMPORTANT |
| Skipping auth intentionally | Must have explicit comment justifying why | NIT |

```ts
// Good — server action with auth
"use server";
import { getUser } from "@/lib/auth/get-user";
export async function myAction(input: unknown) {
  return runValidatedEffect(MyInput, myOp, input, { getUser });
}

// Bad — no auth
export async function myAction(input: unknown) {
  return runValidatedEffect(MyInput, myOp, input, {}); // Missing getUser!
}
```

## Secrets & Environment Variables

| Rule | Severity | Details |
|------|----------|---------|
| `process.env.*` for custom env vars | **BLOCKING** | Use `env.MY_VAR` from `@/env` — type-safe and validated at startup. `process.env.NODE_ENV` is the only exception. |
| No `NEXT_PUBLIC_*` for secrets | BLOCKING | Only use for truly public values (analytics IDs, feature names) |
| No hardcoded credentials | BLOCKING | API keys, tokens, passwords must be in env vars |
| No secrets in git | BLOCKING | `.env*.local` must be in `.gitignore` |
| Use Vercel env vars in production | IMPORTANT | Store via `vercel env add`, not in config files |
| New env var not in `env.ts` | IMPORTANT | Every custom env var must be declared in `env.ts` first |

## Input Validation

| Rule | Severity | Details |
|------|----------|---------|
| Server-facing inputs must be validated | IMPORTANT | Effect Schema at Effect boundary, Zod in forms |
| `as any` on user input | IMPORTANT | Flag type assertions that bypass validation |
| Unvalidated `params`/`searchParams` | IMPORTANT | Route Handlers must decode and validate inputs |
| Raw SQL with string interpolation | BLOCKING | Use parameterized queries via Drizzle |

## TypeScript Strictness

| Rule | Severity | Details |
|------|----------|---------|
| `@ts-ignore` without explanation | IMPORTANT | Must have comment explaining why it's necessary |
| `@ts-expect-error` without explanation | NIT | Prefer specific type fixes over suppression |
| Untyped `any` on external data | IMPORTANT | Validate with Schema/Zod at system boundaries |
| Unused variables without `_` prefix | NIT | ESLint allows `_`-prefixed unused vars |

## Package Manager

| Rule | Severity | Details |
|------|----------|---------|
| Using `npm` in any form | IMPORTANT | Use `pnpm` exclusively (`pnpm add`, `pnpm run`, etc.) |
| `package-lock.json` present | IMPORTANT | Should only have `pnpm-lock.yaml` |

## Hardcoded Model Names

AI model identifiers (e.g., `'anthropic/claude-sonnet-4.6'`) must not be scattered
as inline strings. Centralize them as constants or environment variables so they can
be updated in one place.

| Anti-pattern | Severity | Fix |
|-------------|----------|-----|
| Inline model string in a route handler or Effect | IMPORTANT | Use a centralized constant or env var |
| Same model string repeated in multiple files | IMPORTANT | Extract to a shared constant |

## Domain Terminology

The canonical entity in this app is a **"File"** (title industry term). Using
incorrect terms pollutes the AI model's context and creates confusion.

| Bad | Good | Why |
|-----|------|-----|
| `lib/deals/`, `DealCard`, `dealId` | `lib/files/`, `FileCard`, `fileId` | "Deal" is not our domain term |
| `lib/transactions/` | `lib/files/` | "Transaction" is ambiguous — could mean DB transaction |
| "AI Skills", "AI Assistant" | "Skills", "Assistant" | Platform is AI-first; the prefix is redundant |

Flag new directories, components, or variables using "Deal" or "Transaction" as
entity names as **IMPORTANT**.

## Dead Code Removal

When a PR replaces an architecture pattern (e.g., new data fetching approach, new
state management), the old code must be removed in the same PR. Leaving dead code
behind creates confusion and import bloat.

| Anti-pattern | Severity | Fix |
|-------------|----------|-----|
| Old pattern files still present after replacement | IMPORTANT | Delete unused files in the same PR |
| Unused imports left after refactor | NIT | Clean up imports |
| Commented-out code blocks | NIT | Delete — git history preserves it |

## Vercel Platform

| Rule | Severity | Details |
|------|----------|---------|
| Edge Functions (standalone) | NIT | Deprecated — use Vercel Functions (Fluid Compute) |
| Durable state in Functions | IMPORTANT | Functions are stateless — use Blob or marketplace storage |
| `NEXT_PUBLIC_*` for server-only config | IMPORTANT | Exposes value to client bundle |
