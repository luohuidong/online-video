# AGENTS.md

## Project Overview

Monorepo with two apps: a NestJS API server (SQLite + Drizzle ORM) and a React frontend (Vite + Tailwind CSS 4). Integrates with 苹果CMS V10 (Mac CMS) video provider API.

## Commands

```bash
# Root workspace
pnpm dev:server     # Start server (runs drizzle-kit push then ts-node-dev)
pnpm dev:web        # Start web dev server (Vite)
pnpm build:server   # Build server (NestJS build)
pnpm build:web      # Build web (tsc -b && vite build)

# Server app (cd apps/server)
pnpm dev            # Dev with auto-reload
pnpm build          # Production build
pnpm start          # Run production build
pnpm typecheck       # TypeScript check
pnpm drizzle:generate  # Generate migrations
pnpm drizzle:push    # Push schema to database

# Web app (cd apps/web)
pnpm dev            # Vite dev server
pnpm build          # Production build
pnpm typecheck       # TypeScript check
```

## Architecture

### Server (apps/server)

NestJS module structure in `src/`:

- `config/` - Configuration module (loads from yaml files)
- `database/` - Drizzle ORM setup with SQLite (better-sqlite3)
- `videos/` - Video catalog endpoints
- `favorites/` - User favorites management
- `play-records/` - Playback progress tracking

Database schema (`database/schema.ts`):

- `videos` - Video metadata (sourceId, sourceVideoId, title, cover, year, totalEpisodes)
- `favorites` - User favorites (videoId, updatedAt)
- `play_records` - Playback progress (videoId, episodeIndex, updatedAt)

### Web (apps/web)

React 19 SPA with Vite. **Feature-based Architecture** - all code must be organized by feature.

Directory structure in `src/`:

- `shared/` - Shared utilities, UI components, and API client
- `features/` - Feature modules (each feature is self-contained with its own components, hooks, api, types, etc.)
- `layout/` - Layout components (Header, Footer, etc.)
- `pages/` - Route pages (page-level components that compose features)
- `router.tsx` - Route configuration

**Feature-based Architecture Rules:**

- Each feature lives in `features/<feature-name>/` with its own components, hooks, api, and types
- Shared code goes in `shared/` (UI components, API client, utilities)
- Pages only compose features, never contain business logic
- Features are independent and can be imported as islands

State: Zustand for global state, TanStack React Query for server state.
