# State Management Conventions

## Jotai Atoms for All Client State

All client-side shared state uses **Jotai atoms**. Never use `React.createContext` or
`useContext` for new state management. The one existing exception is
`lib/chat/resource-link-context.tsx` — do not add more.

## What Goes Where

| Data type | Tool | Example |
|-----------|------|---------|
| Server data (default) | RSC props | Page data fetched in server component |
| Server data (client refetch) | TanStack Query | Chat list with polling |
| Form state | React Hook Form + Zod | Form inputs, validation |
| UI ephemeral state | `useState` / `useReducer` | Component-local toggle |
| Cross-component UI state | Jotai atoms | Sidebar collapsed, active tab |
| URL state | Next.js `searchParams` | Filters, pagination |
| Persisted preferences | `atomWithStorage` | User preferences |

## Atom Rules

| Rule | Details |
|------|---------|
| Colocation | Domain atoms in `lib/<domain>/atoms.ts`, route-scoped in `app/<route>/_lib/atoms.ts` |
| Hydration | Use `useHydrateAtoms` in thin wrapper component (pattern: `components/auth/user-provider.tsx`) |
| Persistence | Use `atomWithStorage` from `jotai/utils` for localStorage |
| Reading | Use `useAtom` or `useAtomValue` from `jotai` |
| Naming | Descriptive suffix: `userNameAtom`, `sidebarCollapsedAtom` |

## Hydration Pattern

```tsx
"use client";

import { useHydrateAtoms } from "jotai/utils";
import { myAtom } from "@/lib/domain/atoms";

export function MyProvider({ data, children }: { data: Data; children: React.ReactNode }) {
  useHydrateAtoms([[myAtom, data]]);
  return children;
}
```

## Anti-Patterns to Flag

| Anti-pattern | Severity | Fix |
|-------------|----------|-----|
| `React.createContext` or `createContext` import | IMPORTANT | Use Jotai atom instead |
| `useContext` usage (except resource-link-context) | IMPORTANT | Read from Jotai atom with `useAtom` |
| Custom hooks wrapping `useContext` | IMPORTANT | Replace with atom-based hook |
| Duplicating server data into atoms | IMPORTANT | Use RSC props or TanStack Query |
| Monolithic state atom combining unrelated concerns | NIT | Split into focused atoms |

## Good Patterns to Praise

- Small, focused atoms with descriptive names
- Derived atoms using `atom((get) => ...)` for computed values
- `atomWithStorage` for user preferences
- Proper `useHydrateAtoms` hydration from server data
