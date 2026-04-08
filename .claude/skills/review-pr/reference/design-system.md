# Design System & UX Conventions

## Design System Component Check (IMPORTANT)

Before building custom UI, **always search `components/ui/` and `components/composite/`**
for an existing component that covers the need. The lists below are samples — new
components are added regularly. When reviewing a PR, glob for `components/ui/*.tsx` and
`components/composite/*.tsx` to get the current inventory.

### Sample UI Primitives (`components/ui/`)

| Component | Use for |
|-----------|---------|
| Button | Actions, links — variants: default, outline, secondary, ghost, destructive, link |
| Card | Content containers — CardHeader, CardTitle, CardAction, CardContent, CardFooter |
| Input / Textarea | Text entry — focus ring, shadow-glow, aria-invalid, auto-expand |
| Select | Dropdowns — full Radix Select with trigger, content, items, groups |
| Badge | Status labels — variants: default, secondary, destructive, outline, ghost, link, glass |
| Tabs | Tab navigation — variants: default (background), line (underline) |
| Table | Semantic HTML tables with header, body, footer, hover rows |
| Dialog | Modals/forms — Radix dialog with backdrop blur |
| DropdownMenu / ContextMenu | Menus — groups, separators, sub-menus |
| HoverCard | Tooltip-like previews — delayed open/close |
| ...and more | **Always check the directory — this list may be incomplete** |

### Sample Composites (`components/composite/`)

| Component | Use for |
|-----------|---------|
| DataTable | Data lists with sort, filter, pagination, row actions, context menus |
| TabPanel | Tabs with drag-reorder, rename, close, add |
| AlertDialog | Confirmations — tones: neutral, info, success, warning, danger |
| MarkdownRenderer | Renders markdown with GFM, empora:// URLs |
| UserAvatar | Initials avatar with deterministic color hash |
| CommandPalette | Global Cmd+K search — keyboard navigable |
| ResizablePanels | Resizable split panes with drag handles |
| ...and more | **Always check the directory — this list may be incomplete** |

### How to Review for Component Overlap

When reviewing a PR that adds new UI, run:
```
Glob components/ui/*.tsx
Glob components/composite/*.tsx
```
Then check if any existing component covers the same purpose as the new code.
Flag as **IMPORTANT** if a suitable component already exists.

## Badge Usage Conventions (Common Source of Issues)

The `Badge` component has specific variant/color conventions. Misuse is a frequent
review finding — pay close attention to Badge usage in PRs.

### Variant Selection Rules

| Purpose | Variant | When to use |
|---------|---------|-------------|
| **Status indicators** (file status, payment status, finding status) | `glass` | Always for semantic status. Add `border` class + semantic color. |
| **Metadata labels** (file type, count, "Est.", milestone) | `glass` + `size="sm"` | Inline compact badges for secondary info |
| **User attribution** ("You", "Primary") | `secondary` + `size="sm"` | Non-status identity labels |
| **AI/system indicators** ("AI" badge on proposals) | `default` | Sapphire primary with icon |
| **Destructive status** | `destructive` | Errors, critical alerts only |

### Semantic Color Mapping for Glass Badges

Status badges use `variant="glass"` with a `border` class and color classes from
a config/styles constant. The colors must follow this semantic mapping:

| Meaning | Background | Text | Border |
|---------|-----------|------|--------|
| Success / cleared / funded | `bg-success-20/80` | `text-success-80` | `border-success-80/20` |
| Primary action / in progress | `bg-sapphire-10/80` | `text-sapphire-70` | `border-sapphire-30/50` |
| Warning / on hold / pending action | `bg-warning-20/80` | `text-warning-80` | `border-warning-80/20` |
| Danger / cancelled / voided | `bg-danger-20/80` | `text-danger-80` | `border-danger-80/20` |
| Neutral / closed / archived | `bg-onyx-10/80` | `text-onyx-60` | `border-onyx-30/50` |
| Supporting / alternative | `bg-amethyst-10/80` | `text-amethyst-70` | `border-amethyst-30/50` |

### Badge Anti-Patterns to Flag

| Anti-pattern | Severity | Fix |
|-------------|----------|-----|
| `variant="outline"` with background color overrides | IMPORTANT | Use `variant="glass"` — outline is for border-only badges |
| Raw `<div>` or `<span>` styled as a status pill | IMPORTANT | Wrap in `<Badge variant="glass">` with semantic colors |
| `variant="default"` (sapphire) for non-primary status | IMPORTANT | Use `glass` for status indicators, `default` only for primary/AI |
| Missing `border` class on glass variant badges | NIT | Glass badges should have explicit border with semantic color |
| Custom `h-*` / `px-*` / `text-[*]` sizing overrides | NIT | Use `size="sm"` or `size="default"` — avoid arbitrary size hacks |
| Inconsistent color for same semantic meaning | IMPORTANT | Same status value must use same color everywhere (see mapping above) |
| Status text rendered as plain text without Badge wrapper | NIT | Wrap status values in Badge for visual consistency |

### Good Badge Examples (reference these)

- **`file-header.tsx`** — Comprehensive glass badge usage for file status, title search, financing
- **`payment-card.tsx`** — Clean STATUS_STYLES constant mapping to glass badges
- **`title-finding-card.tsx`** — Semantic status badges with proper color mapping

---

## UI Label & Config Centralization

Status labels, style configs, and display mappings (`Record<Status, { label, className }>`)
should live in shared constants files — not be defined locally inside components.

| Anti-pattern | Severity | Fix |
|-------------|----------|-----|
| Component-local `STATUS_STYLES` / `METHOD_LABELS` map | IMPORTANT | Move to shared `*-constants.ts` or `types/*.ts` |
| Same label record defined in multiple components | IMPORTANT | Consolidate into a single shared file |
| Component-local `DOC_TYPE_LABELS` or similar | NIT | Centralize in `types/` |

The established pattern is `types/*.ts` for type + label pairs (see `types/finance.ts`)
and `*-constants.ts` for type + style configs (see `file-constants.ts`).

Also see **effect-pipeline.md § Type & Enum Centralization** for the full source-of-truth
hierarchy (schema → types → UI config).

---

## Reinvention Anti-Patterns

Flag when a PR builds something that already exists:

| Building... | Severity | Use instead |
|------------|----------|-------------|
| Custom `<select>` or dropdown | IMPORTANT | `Select` or `DropdownMenu` |
| Hand-built HTML table with state | IMPORTANT | `DataTable` composite |
| Custom modal or dialog | IMPORTANT | `Dialog` or `AlertDialog` |
| Custom avatar with initials | IMPORTANT | `UserAvatar` |
| Custom markdown renderer | IMPORTANT | `MarkdownRenderer` |
| Custom tab implementation | IMPORTANT | `Tabs` or `TabPanel` |
| Custom resizable panels | IMPORTANT | `ResizablePanels` |
| Custom list-detail split layout | IMPORTANT | Workspace Layout Pattern (see below) |
| Custom tag/chip input | NIT | `TagInput` |
| Custom action menu (ellipsis) | NIT | `ActionMenu` |
| Custom segmented toggle | NIT | `SegmentedControl` |
| Hardcoded navbar tab for workspace route | IMPORTANT | Automatic via `deriveDynamicTab()` in `app-shell.tsx` |

---

## Workspace Layout Pattern (IMPORTANT)

Any route that manages a list of items **must** use the resizable workspace layout.
Do not build custom split-pane, sidebar, or list-detail layouts — compose from the
existing pattern. See `AGENTS.md` → "Workspace Layout Pattern" for full documentation.

### Structure

```
LayoutShell ("use client")
├── Group (horizontal, persisted via useDefaultLayout + useSafeStorage)
│   ├── Panel: Left Rail (list + selection)
│   ├── HorizontalSeparator
│   ├── Panel: Content Well (tabs + detail)
│   ├── HorizontalSeparator (if resource rail needed)
│   └── Panel: Resource Rail — OPTIONAL (contextual side panels)
```

- **Two-panel** (rail + content): `legacy-import/_components/import-layout-shell.tsx`
- **Three-panel** (rail + content + resources): `portfolio/_components/portfolio-workspace.tsx`

### Rail Convention Checks

| Convention | Severity | Details |
|-----------|----------|---------|
| Rail header uses `h-9 bg-onyx-10 border-b border-onyx-20` | NIT | Match existing rail headers for visual consistency |
| Item count is a plain `<span>` not a `<Badge>` | IMPORTANT | `<span className="ml-1 text-xs tabular-nums text-onyx-60">` — see portfolio rail |
| Selected item panel uses gradient background | NIT | `bg-gradient-to-br from-sapphire-10/30 to-sapphire-10`, `min-h-[120px]` |
| Empty state uses centered icon + text on `bg-onyx-5` | NIT | Match `SelectedDealPanel` / `SelectedImportPanel` pattern |
| Item cards use `border-l-2` selection indicator | IMPORTANT | Selected: `border-l-sapphire-60 bg-sapphire-10/50`. Not custom highlight. |
| Scroll indicator at bottom of list | NIT | Gradient fade + chevron, see portfolio rail |

### Tab Bar Convention Checks

| Convention | Severity | Details |
|-----------|----------|---------|
| Tab bar container: `border-b border-onyx-20 bg-white px-2` | NIT | Consistent across all content wells |
| Active tab: `border-b-2 border-sapphire-50 text-sapphire-70` | IMPORTANT | Always sapphire underline, not background highlight |
| Inactive tab: `border-transparent text-onyx-60 hover:text-onyx-90` | NIT | Standard inactive style |
| Tabs use `text-xs font-medium` | NIT | Match existing tab sizing |

### Dynamic Navbar Tabs

Any top-level route (e.g. `/skills`, `/legacy-import`) that isn't a fixed workspace
tab automatically gets a dynamic tab via `deriveDynamicTab()` in
`components/layout/app-shell.tsx`. Flag as **IMPORTANT** if a PR hardcodes a new
entry in the `WORKSPACES` array for a route that should be automatic.

## Color & Styling Rules

| Rule | Severity | Details |
|------|----------|---------|
| Sapphire is the primary accent | IMPORTANT | Buttons, links, focus rings use sapphire-60 (`#4670FF`). Never Garnet as UI accent. |
| Garnet is brand-only | IMPORTANT | Garnet-60 (`#FC4A5A`) only for brand moments, not functional UI |
| Light mode only | IMPORTANT | Flag any `dark:` Tailwind prefix — no dark mode |
| Use Empora palette tokens | IMPORTANT | Use `--color-onyx-*`, `--color-sapphire-*`, etc. Flag Tailwind defaults like `blue-500`, `gray-300`, `red-600` |
| Use shadow tokens | NIT | Use `shadow-soft`, `shadow-md`, `shadow-lift`, `shadow-glow` — not Tailwind `shadow-sm`/`shadow-lg` |
| Use `cn()` for conditional classes | NIT | Import from `@/lib/utils` — not template string concatenation |
| Typography | NIT | Red Hat Text for body, Red Hat Display for headings — set via CSS variables |

### Empora Color Palette Reference

- **Onyx** (neutrals): 5 `#FBF9F7` (bg) → 100 `#23211E` (text)
- **Sapphire** (primary): 60 `#4670FF` (accent), 70 `#3455D3` (hover), 20 `#E4EBFF` (wash)
- **Garnet** (brand): 60 `#FC4A5A` (brand pop only)
- **Amethyst** (supporting): available but sparingly used
- **Semantic**: success-60 `#37D7CD`, warning-60 `#E2B30D`, danger-60 `#FE695F`

## Accessibility

| Rule | Severity | Details |
|------|----------|---------|
| Icon-only buttons need `aria-label` | IMPORTANT | `<Button size="icon">` or similar must have `aria-label` or `sr-only` text inside |
| Interactive elements need focus styles | NIT | Rely on built-in focus-visible rings from shadcn primitives |
| Form inputs need labels | NIT | Use `<Label>` associated with the input |

## Extract Repeated Layout Patterns

If the same layout structure (e.g., page header + filters + content area, or card with
icon + title + badge) appears in **3 or more files**, it should be extracted into a
shared component in `components/composite/` or `components/layout/`.

Flag as **NIT** and suggest extraction when you see the same DOM structure repeated.

## Naming & Labeling

| Rule | Severity | Details |
|------|----------|---------|
| No "AI" prefix on user-facing features | IMPORTANT | The platform is AI-first by default — "Skills" not "AI Skills", "Assistant" not "AI Assistant" |

## Component Conventions

| Convention | Rule |
|-----------|------|
| Component naming | PascalCase files (`FileCard.tsx`) |
| Utility naming | camelCase files (`formatCurrency.ts`) |
| Private components | `app/<route>/_components/` (underscore excludes from routing) |
| Private utilities | `app/<route>/_lib/` |
| shadcn components | `components/ui/` — source code, fully customizable |
| Compositions | `components/composite/` — higher-level patterns |
