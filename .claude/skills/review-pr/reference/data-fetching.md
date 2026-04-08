# Data Fetching Conventions

## RSC-First (Default)

All data fetching happens in **server components** via `runEffect()`, passed as props
to client components. This is the fastest approach — data is available on the first
frame with zero loading states and zero client-side requests.

```ts
// app/my-page/page.tsx (server component)
export default async function MyPage() {
  const user = await getUser();
  const result = await runEffect(listItems({}), { user, transactional: false });
  const items = Either.isRight(result) ? result.right : [];
  return <MyPageClient items={items} />;
}
```

## Server Actions Are for Mutations Only

Server actions (`"use server"` + `runValidatedEffect()`) must **never** be used for reads.
Every server action call triggers an RSC revalidation (POST + GET), and Next.js serializes
concurrent server action calls. Using them as query transport creates cascading request
loops — a single failing query can trigger 50+ network requests.

## Anti-Patterns to Flag

| Anti-pattern | Severity | Fix |
|-------------|----------|-----|
| Server action used for a read | IMPORTANT | Fetch in server component via `runEffect()` |
| `queryClient.invalidateQueries()` after mutation | IMPORTANT | Use `router.refresh()` for RSC refresh |
| TanStack Query where RSC props would suffice | IMPORTANT | Pass data from server component as props |
| Server action in a `queryFn` | IMPORTANT | Use Route Handler (`app/api/`) as query transport |
| Missing `enabled` guard on conditional query | NIT | Add `enabled: !!id` to prevent unnecessary fetches |
| Inline query keys like `["files", id]` | NIT | Use factory from `lib/effect/query-keys.ts` |

## When TanStack Query IS Appropriate

Only use TanStack Query hooks when RSC data fetching is insufficient:

1. **Client-side navigations** — Opening a panel or sidebar without full page navigation
2. **Polling / real-time updates** — Data that needs to refresh on an interval
3. **Optimistic updates** — Mutations that require cache manipulation

When TanStack Query is needed, use **Route Handlers** (`app/api/` GET endpoints) as
the query transport — not server actions.

## TanStack Query Conventions

| Convention | Rule |
|-----------|------|
| Hook location | Colocated in `lib/<domain>/queries.ts` |
| Hook naming | `use<Plural>` for lists, `use<Singular>` for detail |
| Query keys | Use factory from `lib/effect/query-keys.ts` — hierarchical keys |
| Conditional fetching | `enabled: !!id` when depending on a selected item |
| Initial data from RSC | Pass server data as `initialData` to avoid redundant fetch |
| Response unwrapping | Use `unwrapForQuery()` from `lib/effect/query-unwrap.ts` |

## Post-Mutation Refresh

After a mutation, use `router.refresh()` to trigger a single RSC GET that re-runs
server components and updates the page with fresh data. Do **not** use
`queryClient.invalidateQueries()` — it creates parallel refetch storms.

```ts
// Good
const router = useRouter();
const mutation = useMutation({
  mutationFn: async (input) => unwrapForQuery(await myAction(input)),
  onSuccess: () => router.refresh(),
});

// Bad
onSuccess: () => queryClient.invalidateQueries({ queryKey: myKeys.all }),
```
