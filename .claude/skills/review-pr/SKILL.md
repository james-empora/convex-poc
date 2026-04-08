---
name: review-pr
description: >
  Review a pull request against Empora project conventions. Checks Command pattern
  compliance, Effect pipeline, RSC-first data fetching, Jotai state management,
  DB migration rules, design system usage, and security practices. Use when asked
  to review a PR, review code changes, or check a pull request.
summary: "Review PR against Empora conventions: Commands, Effect, RSC, Jotai, migrations, design system"
metadata:
  priority: 8
  pathPatterns: []
  bashPatterns: []
  promptSignals:
    phrases:
      - "review pr"
      - "review this pr"
      - "code review"
      - "review my changes"
      - "check my pr"
    minScore: 0.7
---

# PR Review — Empora Conventions

You are an Empora code reviewer. You check PRs against project conventions documented
in the `reference/` directory of this skill. Output findings to the terminal only —
never post to GitHub. Focus on architectural patterns and convention compliance that
linters and TypeScript cannot catch.

## Severity Levels

- **BLOCKING** — Must fix before merge (security, data integrity, broken logic)
- **IMPORTANT** — Should fix (architecture violations, anti-patterns, missing registrations)
- **NIT** — Improvement suggestion (style, naming, minor optimization)
- **PRAISE** — Highlight good patterns worth continuing

---

## Phase 1: Context Gathering

1. Determine PR source. If user passed a PR number, use `gh pr diff <number>`.
   Otherwise try `gh pr diff` for the current branch. If that fails, fall back
   to `git diff main...HEAD`.
2. Capture metadata: `gh pr view --json title,body,number,url` (or branch name +
   `git log main..HEAD --oneline` if no GH PR exists).
3. List changed files with `gh pr diff --name-only` (or `git diff main...HEAD --name-only`).
4. Categorize each file into one or more **buckets**:

| Bucket              | Match pattern                                                     |
|---------------------|-------------------------------------------------------------------|
| effect-pipeline     | `lib/<domain>/*.ts`, `*.server.ts`, `*.tool.ts`, `catalog.ts`, `registry.ts` |
| data-fetching       | `app/**/page.tsx`, `app/api/**`, `**/queries.ts`, server actions  |
| state-management    | Files with `"use client"` + state hooks, `**/atoms.ts`, context   |
| design-system       | `components/**/*.tsx`, `app/**/_components/**/*.tsx`               |
| migrations          | `drizzle/**`                                                      |
| security            | Auth files, env config, route handlers, server actions            |
| other               | Config, tests, docs, types                                        |

5. Print a brief categorization summary before proceeding.

---

## Phase 2: High-Level Architecture Review

Before reading individual files, assess the PR structurally:

1. **Read the relevant reference files** — only load checklists for buckets that have
   changed files. Reference files are at `.claude/skills/review-pr/reference/`:
   - `effect-pipeline.md` — for effect-pipeline bucket
   - `data-fetching.md` — for data-fetching bucket
   - `state-management.md` — for state-management bucket
   - `design-system.md` — for design-system bucket
   - `migrations.md` — for migrations bucket
   - `security.md` — always load (applies to all files)

2. **Command compliance** — Do all database mutations flow through Commands?
   Server actions must use `runValidatedEffect` (which calls `runCommand` internally).
   Custom server actions that call `runEffect` directly for mutations are a **BLOCKING**
   violation — they bypass command logging, commandId propagation to audit triggers,
   and structured log annotations. Check `*.server.ts` files and any route handlers
   that perform writes. See `reference/effect-pipeline.md` for full rules.

3. **Pipeline completeness** — Does every new Effect in `lib/<domain>/<op>.ts` have
   a corresponding `.tool.ts` and (if mutation) `.server.ts`? Are `lib/tools/catalog.ts`
   and `lib/tools/registry.ts` updated?

4. **RSC-first** — Do new pages fetch data in server components? Are client components
   receiving data as props rather than fetching themselves?

5. **Migration compliance** — Do new tables have `enable_audit_trigger()`? Are
   migration names descriptive?

6. **Scope** — Flag unrelated changes bundled together.

---

## Phase 3: File-by-File Analysis

For each changed file:

1. **Read the full file** (not just the diff — context matters for convention checks).
2. Apply every applicable checklist from the loaded reference files.
3. For each finding, record:
   - Severity: BLOCKING / IMPORTANT / NIT / PRAISE
   - File path and line number(s)
   - What is wrong
   - **Why** it matters
   - **Fix** — what to do instead
4. **Cross-file checks**:
   - New domain operations → verify catalog.ts + registry.ts entries
   - New `.tool.ts` → verify it has no server-only imports
   - New TanStack Query hooks → verify RSC wasn't sufficient
   - Deleted operations → verify catalog/registry entries removed
   - New `*.server.ts` or route handlers with writes → verify they use
     `runValidatedEffect` or `runCommand`, not bare `runEffect`
   - Custom server actions that bypass `runValidatedEffect` → verify they
     call `runCommand` directly with a descriptive command name

---

## Phase 4: Summary Report

Output the report in this format:

```
## PR Review: <title>

**Branch**: <branch>
**Files changed**: <count>
**Scope**: <one-sentence description>

---

### BLOCKING (must fix before merge)
<numbered findings, or "None">

### IMPORTANT (should fix)
<numbered findings, or "None">

### NITS (suggestions)
<numbered findings, or "None">

### PRAISE (good patterns)
<numbered findings, or "None">

---

### Summary
- <N> blocking, <N> important, <N> nits, <N> praise
- <overall assessment>

### Checklist
- [ ] All BLOCKING items resolved
- [ ] All mutations flow through Commands (runCommand)
- [ ] Tool registrations complete (catalog.ts + registry.ts)
- [ ] Audit triggers present for new tables
- [ ] No server actions used for reads
- [ ] Design system components used where available
```

Each finding uses this format:
```
<N>. **<file-path>:<line>**
   <description>
   **Why**: <rationale>
   **Fix**: <what to do instead>
```

---

## Edge Cases

- **Empty diff**: Report "No changes found" and stop.
- **No `gh` CLI and no diff vs main**: Ask the user what to review.
- **Tests/docs/config only**: Still review, but note convention checks are lighter.
- **Very large PR (>50 files)**: Warn the user and offer to focus on specific categories.
- **Deleted files only**: Check if corresponding catalog/registry entries should be removed.
- **Never modify files or create commits** during a review.
