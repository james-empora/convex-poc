# Database Migration Conventions

## Migration Naming

Always use the `--name` flag with a descriptive snake_case name:

```bash
npx drizzle-kit generate --name add_users_table
```

Flag migrations with Drizzle's random default names (e.g., `large_catseye`, `short_warbird`)
as **IMPORTANT** — names should describe what the migration does.

Good names: `add_users_table`, `add_file_parties_side_column`, `create_property_attributes`

## Audit Triggers (BLOCKING)

**Every new table** must include `enable_audit_trigger()` in the migration SQL. This
logs INSERT, UPDATE, and DELETE operations to the `audit_log` table. Missing an audit
trigger is a compliance gap.

```sql
CREATE TABLE my_new_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
);

-- REQUIRED for every new table
SELECT enable_audit_trigger('my_new_table');
```

This is idempotent — safe to call even if the trigger already exists.

**How to check**: For each `CREATE TABLE` statement in migration SQL, verify there is a
corresponding `enable_audit_trigger('<table_name>')` call. If missing, flag as **BLOCKING**.

## Column Naming

JSONB columns must **not** include "jsonb" in the column name. The column name should
describe the data it holds, not its storage type. The type is already declared in the
schema definition.

| Bad | Good | Why |
|-----|------|-----|
| `metadata_jsonb` | `metadata` | Type is in the schema, not the name |
| `data_jsonb` | `data` | Same — the `jsonb()` call in Drizzle declares the type |
| `config_jsonb` | `config` | Redundant suffix leaks storage detail into the API |

Flag JSONB columns with "jsonb" in the name as **IMPORTANT**.

## Rules to Check

| Rule | Severity | Details |
|------|----------|---------|
| Missing `enable_audit_trigger()` for new table | BLOCKING | Compliance requirement — every table needs it |
| Random default migration name | IMPORTANT | Must use `--name` with descriptive snake_case |
| JSONB column name contains "jsonb" | IMPORTANT | Name should describe data, not storage type |
| Missing foreign key constraints | NIT | Reference parent tables where appropriate |
| Missing indexes on frequently queried columns | NIT | Add indexes for columns used in WHERE/JOIN |
| Package manager | IMPORTANT | Migrations generated via `npx drizzle-kit` (pnpm), never `npm` |

## Polymorphic Resource Associations

When associating data (chats, workflows, notifications) with domain entities, use a
polymorphic `(resource_type, resource_id)` pattern — not entity-specific foreign keys.

| Bad | Good | Why |
|-----|------|-----|
| `ledger_id`, `file_id`, `entity_id` columns on a general-purpose table | `resource_type` + `resource_id` | Adding a new entity type requires a schema migration with FK columns |
| Separate join tables per entity type | Single `thread_associations` table with `(resource_type, resource_id)` | One table, one query pattern, extensible without migration |

Flag entity-specific FK columns on general-purpose tables as **NIT** — suggest the
polymorphic pattern instead. Reference `db/schemas/chat.ts` (`thread_associations`)
as the established pattern.

## Schema Conventions

- Schema files live in `db/schemas/<domain>.ts`
- Master schema export in `db/schema.ts`
- Drizzle schemas derive Effect Schemas via `createSelectSchema`, `createInsertSchema`
