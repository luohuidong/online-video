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

## API Design (RESTful)

All endpoints MUST be implemented as RESTful APIs. No exceptions.

- **Resources** are pluralized nouns in URIs (e.g. `/videos`, `/favorites`, `/play-records`). Never put verbs in the path — actions are expressed by HTTP methods.
- **HTTP methods** map cleanly to CRUD:
  - `GET /resources` — list, `GET /resources/:id` — retrieve one
  - `POST /resources` — create (returns `201 Created` + `Location` header)
  - `PUT /resources/:id` — full replace
  - `PATCH /resources/:id` — partial update
  - `DELETE /resources/:id` — remove (returns `204 No Content`)
- **Nesting** expresses parent/child relationships (e.g. `/videos/:id/episodes`). Keep URIs shallow — one level of nesting is usually enough.
- **HTTP status codes** follow standard semantics:
  - `200 OK` for successful reads/updates
  - `201 Created` + `Location` header when a resource is created
  - `204 No Content` for successful deletes / no-body successes
  - `400 Bad Request` for validation / schema failures
  - `404 Not Found` for missing resources
  - `409 Conflict` for state collisions (e.g. duplicate keys)
  - `5xx` strictly reserved for server-side failures
- **Stateless** — every request carries everything the server needs; no session state held between requests.
- **Idempotency** — `GET`, `PUT`, and `DELETE` must be safe to retry. `POST` is the only non-idempotent verb and is reserved for creation.
- **Query strings** are for filtering, sorting, pagination, and search (`?q=...`, `?page=...`), never for resource identification.
- **Error responses** share one consistent shape (e.g. `{ message, error? }`) — never plain text or HTML.
- **Swagger / OpenAPI**: every new endpoint must be annotated via `@nestjs/swagger` (`@ApiOperation`, `@ApiResponse`, `@ApiParam`, `@ApiQuery`, `@ApiBody`) so the generated docs match the spec above.
