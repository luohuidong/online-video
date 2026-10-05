# AGENTS.md

## Project Overview

Monorepo with two apps: a Hono + Bun API server (SQLite + Drizzle ORM) and a React frontend (Vite + Tailwind CSS 4). Integrates with 苹果CMS V10 (Mac CMS) video provider API.

Per-app details live in each app's own AGENTS.md: see `apps/server/AGENTS.md` and `apps/web/AGENTS.md`.

## Commands

```bash
# Install workspace deps
bun install                   # one-time, from repo root

# Code quality (Biome, run from repo root)
bun run format         # Format check (biome format)
bun run format:write   # Apply formatting (biome format --write)
bun run lint           # Lint check (biome lint)
bun run lint:write     # Lint + apply safe fixes (biome lint --write)
bun run check          # Format + lint + organize imports check (biome check)
bun run check:write    # Apply format + lint + organize imports (biome check --write)
bun run ci             # CI-friendly check, no --write

# Markdown / YAML formatting (Prettier, run from repo root)
bun run prettier:format        # Check formatting on .md / .markdown / .yml / .yaml
bun run prettier:format:write  # Apply formatting to those files

# Dev
bun --filter server dev   # backend (from repo root)
bun --filter web dev      # frontend (from repo root)
```

Per-app `build` / `typecheck` / `drizzle:*` etc. are run from inside each app's directory — see the respective AGENTS.md.

## Verification

After modifying any subproject's source files (`apps/server/src/` or `apps/web/src/`):

1. Run that subproject's `typecheck` script (`bun run typecheck` from inside the app directory) to confirm TypeScript still compiles.
2. Run `bun run check:write` from the repo root to apply Biome formatting, lint fixes, and organize imports across the whole monorepo.

Don't claim the change is done until both steps pass.
