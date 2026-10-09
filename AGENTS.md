# AGENTS.md

## Project Overview

Monorepo with two apps: a Hono + Node API server (SQLite + Drizzle ORM) and a React frontend (Vite + Tailwind CSS 4). Integrates with 苹果CMS V10 (Mac CMS) video provider API. Managed with [pnpm](https://pnpm.io) workspaces (`pnpm-workspace.yaml`).

Per-app details live in each app's own AGENTS.md: see `apps/server/AGENTS.md` and `apps/web/AGENTS.md`.

## Commands

```bash
# Install workspace deps
pnpm install                   # one-time, from repo root

# Code quality (Biome, run from repo root)
pnpm run format         # Format check (biome format)
pnpm run format:write   # Apply formatting (biome format --write)
pnpm run lint           # Lint check (biome lint)
pnpm run lint:write     # Lint + apply safe fixes (biome lint --write)
pnpm run check          # Format + lint + organize imports check (biome check)
pnpm run check:write    # Apply format + lint + organize imports (biome check --write)
pnpm run ci             # CI-friendly check, no --write

# Markdown / YAML formatting (Prettier, run from repo root)
pnpm run prettier:format        # Check formatting on .md / .markdown / .yml / .yaml
pnpm run prettier:format:write  # Apply formatting to those files

# Dev
pnpm --filter server dev   # backend (from repo root)
pnpm --filter web dev      # frontend (from repo root)
```

Requires Node 26 — the Docker images provision it via `pnpm runtime set node 26 -g`. Node runs the TypeScript sources directly (native type stripping), so there is no build step for the server.

Per-app `build` / `typecheck` / `drizzle:*` etc. are run from inside each app's directory — see the respective AGENTS.md.

## Verification

After modifying any subproject's source files (`apps/server/src/` or `apps/web/src/`):

1. Run that subproject's `typecheck` script (`pnpm run typecheck` from inside the app directory) to confirm TypeScript still compiles.
2. Run `pnpm run check:write` from the repo root to apply Biome formatting, lint fixes, and organize imports across the whole monorepo.

Don't claim the change is done until both steps pass.
