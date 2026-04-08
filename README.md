# Empora

Real estate title and escrow platform built with Next.js, Convex, and Zod.

## Prerequisites

Install the following runtime dependencies (we recommend [mise](https://mise.jdx.dev/) for version management):

- **Node.js 24** — `mise use node@24`
- **pnpm** — `mise use pnpm@10` (or `corepack enable` since the version is pinned in `package.json`)

Install the Vercel CLI globally:

```sh
pnpm add -g vercel@latest
```

## Environment Variables

1. Link the project to Vercel (if not already linked):

   ```sh
   vercel link
   ```

2. Pull environment variables from Vercel:

   ```sh
   vercel env pull .env.local
   ```

## Local Development

1. Start local Convex:

   ```sh
   pnpm convex:local
   ```

2. In another terminal, start the app:

   ```sh
   pnpm dev
   ```

   The app will be available at http://localhost:3000.

### Other useful commands

| Command | Description |
| --- | --- |
| `pnpm convex:local` | Start local anonymous Convex dev |
| `pnpm convex:once` | Validate the local Convex schema once |
| `pnpm convex:dashboard` | Open the local Convex dashboard |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run tests with Vitest |
| `pnpm build` | Production build |
