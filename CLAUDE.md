# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

React 19 SPA with Vite. Structure in `src/`:

- `api/` - API client (`client.ts` with `apiFetch<T>()` and `ApiError`)
- `components/` - Shared UI components
- `pages/` - Route pages
- `types/` - TypeScript types
- `utils/` - Utility functions

State: Zustand for global state, TanStack React Query for server state.
