# Frontend Architecture & Decisions

> Last updated: 2026-04-08

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Framework** | Next.js 16 (App Router) | File-system routing, server components, streaming, deployed on Vercel |
| **Component Library** | shadcn/ui | Proven at Empora (existing portal uses it), copy-to-project model, Radix primitives, Cal-endorsed |
| **Data Fetching** | Convex | Live queries, direct mutations, no separate client cache layer |
| **Client State** | Jotai | Atomic state with zero ceremony, hook-like API, covers shared UI state cleanly |
| **Forms** | React Hook Form + Zod | Mature ecosystem, excellent shadcn/ui integration, type-safe validation |
| **Styling** | Tailwind CSS v4 | Already configured, CSS variable theming, pairs with shadcn |
| **Routing** | Next.js App Router | Native file-system routing — no additional router library needed |

### Decision Context

The current stack centers on plain TypeScript, Convex, Jotai, and Zod. Server data now flows
through Convex queries and mutations directly rather than a separate TanStack Query layer.

---

## Color System

Empora's color system is defined in the [Brand Guide](../docs/references/Empora_Brand_Guide.pdf)
and the [Empora Colors Figma](https://www.figma.com/design/DEihux5kaz3vUt96h5tnug/Empora-Colors).

### Design Principles

- "Always bold, without being over the top" (Brand Guide)
- "Walk a line between high energy and high end" (Cal)
- WCAG AA compliance required
- Light mode only (Onyx 5 `#FBF9F7` background)

### Primary Colors

The most-used colors in branded collateral:

| Token | Hex | Role |
|-------|-----|------|
| Onyx 5 | `#FBF9F7` | Default page background |
| Garnet 20 | `#FFE0E3` | Light accent wash |
| **Garnet 60** | `#FC4A5A` | **Brand anchor — primary pop of color** |
| Sapphire 90 | `#1D2E65` | Dark, serious tone |
| Sapphire 100 | `#262B3E` | Darkest background (headers, footers) |

### App Color Guidance

Per Cal (Jan 2026): **"Steer away from Garnet and Danger colors"** for this application.
Use **Sapphire** as the primary interactive color instead. Garnet remains available for
brand moments (logos, marketing surfaces) but is not the UI accent.

For this app:
- **Primary accent**: Sapphire 60 `#4670FF` (buttons, links, focus rings)
- **Primary accent hover**: Sapphire 70 `#3455D3`
- **Background**: Onyx 5 `#FBF9F7`
- **Foreground / text**: Onyx 100 `#23211E`
- **Muted background**: Onyx 10 `#F9F5F2`
- **Muted text**: Onyx 60 `#978D87`
- **Border**: Onyx 20 `#EEE9E6`
- **Card background**: `#FFFFFF`

### Full Palette Reference

#### Onyx (Neutrals)

| Step | Hex |
|------|-----|
| 100 | `#23211E` |
| 90 | `#393633` |
| 80 | `#55514E` |
| 70 | `#726C68` |
| 60 | `#978D87` |
| 50 | `#ACA39C` |
| 40 | `#C5BEB9` |
| 30 | `#DCD6D2` |
| 20 | `#EEE9E6` |
| 10 | `#F9F5F2` |
| 5 | `#FBF9F7` |

#### Sapphire (Primary Interactive)

| Step | Hex |
|------|-----|
| 100 | `#262B3E` |
| 90 | `#27335E` |
| 80 | `#293E8D` |
| 70 | `#3455D3` |
| 60 | `#4670FF` |
| 50 | `#809DFF` |
| 40 | `#A6BAFF` |
| 30 | `#CAD6FD` |
| 20 | `#E4EBFF` |
| 10 | `#F1F4FF` |

#### Garnet (Brand accent — use sparingly in app UI)

| Step | Hex |
|------|-----|
| 100 | `#451F26` |
| 90 | `#6A1424` |
| 80 | `#B71A37` |
| 70 | `#DC183C` |
| 60 | `#FC4A5A` |
| 50 | `#FF7783` |
| 40 | `#FFA3AB` |
| 30 | `#FFC7CD` |
| 20 | `#FFE0E3` |
| 10 | `#FFF0F2` |

#### Amethyst (Supporting)

| Step | Hex |
|------|-----|
| 100 | `#302844` |
| 90 | `#3C296E` |
| 80 | `#573E97` |
| 70 | `#704DCC` |
| 60 | `#9670FF` |
| 50 | `#B193FF` |
| 40 | `#C6B1FF` |
| 30 | `#DFD3FF` |
| 20 | `#EBE3FF` |
| 10 | `#F9F7FF` |

#### Semantic Variants (portal status indicators only)

| Semantic | 80 | 60 | 20 |
|----------|-----|-----|-----|
| Danger | `#CE180C` | `#FE695F` | `#FFECEB` |
| Success | `#01827A` | `#37D7CD` | `#E0FFFD` |
| Warning | `#886A00` | `#E2B30D` | `#FFF9E2` |

### Brand Gradients

| Name | From | To |
|------|------|----|
| Sapphire-Sapphire | Sapphire 60 `#4670FF` | Sapphire 100 `#262B3E` |
| Garnet-Sapphire | Garnet 60 `#FC4A5A` | Sapphire 100 `#262B3E` |
| Garnet-Amethyst | Garnet 60 `#FC4A5A` | Amethyst 60 `#9670FF` |
| Onyx-Garnet | Onyx 5 `#FBF9F7` | Garnet 20 `#FFE0E3` |
| Onyx-Sapphire | Onyx 5 `#FBF9F7` | Sapphire 20 `#E4EBFF` |

---

## Typography

### Brand Fonts

| Font | Role | Weights | Source |
|------|------|---------|--------|
| **Red Hat Display** | Headings, page titles | Regular, Medium, Semibold, Bold | Google Fonts |
| **Red Hat Text** | Body copy, UI text | Light, Regular, Medium, Semibold, Bold | Google Fonts |

The brand also uses **Tiempos** (serif) for marketing headlines, but it is a licensed font
not used in product UI.

### App Font Strategy

This project uses **Red Hat Text** for all UI text and **Red Hat Display** for headings,
loaded via `next/font/google` for zero layout shift.

---

## State Management Guidelines

### What goes where

| Data Type | Tool | Example |
|-----------|------|---------|
| Server data (Convex + RSC) | Convex queries/mutations | Files, chats, documents, ledgers |
| Form state | React Hook Form | Input values, validation errors, dirty tracking |
| UI-only ephemeral state | `useState` / `useReducer` | Dropdown open, animation state |
| Cross-component UI state | Jotai atoms | Sidebar collapsed, selected filters, active tab |
| URL state | Next.js `searchParams` | Page, sort, filter params that should be shareable |

### Rules of Thumb

1. **Default to Convex queries and server components** for anything from the server. Don't duplicate server state into Jotai.
2. **Use Jotai** only when multiple unrelated components need to share client-side state that isn't server data.
3. **Keep atoms small and focused** — one atom per concern, not a monolithic app-state atom.
4. **URL is state too** — if a user should be able to share or bookmark a view, put it in search params.
5. **useState is fine** for component-local UI state that doesn't need to be shared.

---

## Component Conventions

### shadcn/ui Setup

- Components are source code, copied into the project at `components/ui/`
- Customized via CSS variables in `globals.css` using the Empora color tokens
- Use `cn()` utility (clsx + tailwind-merge) for conditional classes

### File Structure

```
components/
  ui/            # shadcn primitives (Button, Card, Input, etc.)
  composite/     # Higher-level compositions (DataTable, GlassModal, etc.)
  layout/        # Shell, Sidebar, Header, etc.

app/
  design-system/
    page.tsx     # Design system showcase page
    _demos/      # Demo components (private — underscore excludes from routing)
```

**Convention:** Demo/showcase components are co-located with the route that uses them
in a `_demos/` private folder, not alongside real components in `components/`.

### Naming

- Components: PascalCase (`DealCard.tsx`)
- Utilities: camelCase (`formatCurrency.ts`)
- Types: PascalCase, co-located or in `types/`

---

## Design References

| Resource | Link |
|----------|------|
| Empora Colors (Figma) | https://www.figma.com/design/DEihux5kaz3vUt96h5tnug/Empora-Colors |
| Empora Brand (Figma) | https://www.figma.com/design/k4nOYlTBSR9JZE4m8bfggY/Empora-Brand |
| Reggie Design System (Figma) | https://www.figma.com/design/ZM8IIF0JaDr1ralvCi2TKh/Reggie-Design-System |
| Design System Lite (Figma) | https://www.figma.com/design/r47N1RVtFXkiqXibtUwBV8/Empora_DesignSystem_Lite |
| Portal Storybook (Chromatic) | https://main--66b26d805ae20d8fc087191f.chromatic.com |
| Brand Guide (PDF) | See `docs/references/Empora_Brand_Guide.pdf` |
