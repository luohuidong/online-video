# CLAUDE.md

## Project Overview

Monorepo with two apps: a NestJS API server (SQLite + Drizzle ORM) and a React frontend (Vite + Tailwind CSS 4). Integrates with 苹果CMS V10 (Mac CMS) video provider API.

Per-app details live in each app's own CLAUDE.md: see `apps/server/CLAUDE.md` and `apps/web/CLAUDE.md`.

## Commands

```bash
# Code quality (Biome, run from repo root)
pnpm format         # Format check (biome format)
pnpm format:write   # Apply formatting (biome format --write)
pnpm lint           # Lint check (biome lint)
pnpm lint:write     # Lint + apply safe fixes (biome lint --write)
pnpm check          # Format + lint + organize imports check (biome check)
pnpm check:write    # Apply format + lint + organize imports (biome check --write)
pnpm ci             # CI-friendly check, no --write
```

Per-app `dev` / `build` / `typecheck` / etc. are run from inside each app's directory — see the respective CLAUDE.md.

## Verification

After modifying any subproject's source files (`apps/server/src/` or `apps/web/src/`), run that subproject's `typecheck` script (`pnpm typecheck` from inside the app directory) to confirm TypeScript still compiles. Don't claim the change is done until typecheck passes.
