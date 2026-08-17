# CLAUDE.md

Server app — NestJS API with SQLite + Drizzle ORM.

## Commands

Run from this directory (`apps/server`):

```bash
pnpm dev              # drizzle-kit push && ts-node-dev --respawn --transpile-only src/main.ts
pnpm build            # nest build
pnpm start            # node dist/main
pnpm typecheck        # tsc --noEmit
pnpm drizzle:generate # drizzle-kit generate
pnpm drizzle:push     # drizzle-kit push
```

## Architecture

NestJS module structure in `src/`:

- `config/` - Configuration module (loads from yaml files)
- `database/` - Drizzle ORM setup with SQLite (better-sqlite3)
- `videos/` - Video catalog endpoints
- `favorites/` - User favorites management
- `play-records/` - Playback progress tracking
- `image-proxy/` - Image fetch/cache proxy for remote video covers
- `middleware/` - Request middleware (access logging)
- `app.module.ts` - Root module wiring everything together
- `main.ts` - Application bootstrap

Database schema (`database/schema.ts`):

- `videos` - Video metadata (sourceId, sourceVideoId, title, cover, year, totalEpisodes)
- `favorites` - User favorites (videoId, updatedAt)
- `play_records` - Playback progress (videoId, episodeIndex, updatedAt)
