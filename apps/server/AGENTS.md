# AGENTS.md

Server app — Hono HTTP API on Bun + Drizzle ORM + SQLite.

## Commands

Run from this directory (`apps/server`):

```bash
bun install            # install deps (run from repo root for workspaces)
bun run dev            # bun --hot src/index.ts (hot reload)
bun run start          # bun src/index.ts (production)
bun run typecheck      # tsc --noEmit
bun run drizzle:generate  # drizzle-kit generate
bun run drizzle:push      # drizzle-kit push
```

The server loads `config.yml` from its current working directory.
For Docker that's `/app/config.yml` (mounted from the repo root);
for local dev, place your `config.yml` at `apps/server/config.yml`.

## Architecture

Hono app assembled in `src/app.ts` via `createApp()`; each feature is a self-contained folder under `src/features/`:

- `shared/config/` - `Bun.YAML.parse` of `config.yml` + zod schema
- `shared/database/` - `Bun.SQLite` + drizzle + auto-migrate on boot
- `middleware/access-log.ts` - Request access log
- `features/videos/` - Cross-source search + detail + batch update + daily cron
- `features/favorites/` - Favorites CRUD
- `features/play-records/` - Playback progress CRUD
- `index.ts` - Process entry: imports shared (side-effect), creates app, calls `Bun.serve`

Database schema (`shared/database/schema.ts`):

- `videos` - Video metadata (sourceId, sourceVideoId, title, cover, year, totalEpisodes)
- `favorites` - User favorites (videoId, updatedAt)
- `play_records` - Playback progress (videoId, episodeIndex, updatedAt)

## API Design (RESTful)

All endpoints MUST be implemented as RESTful APIs. No exceptions.

- **Resources** are pluralized nouns in URIs (e.g. `/videos`, `/favorites`, `/play-records`). Never put verbs in the path — actions are expressed by HTTP methods.
- **HTTP methods** map cleanly to CRUD:
  - `GET /resources` — list, `GET /resources/:id` — retrieve one
  - `POST /resources` — create (returns `201 Created`)
  - `PUT /resources/:id` — full replace
  - `PATCH /resources/:id` — partial update
  - `DELETE /resources/:id` — remove (returns `204 No Content`)
- **Nesting** expresses parent/child relationships (e.g. `/videos/:id/episodes`). Keep URIs shallow — one level of nesting is usually enough.
- **HTTP status codes** follow standard semantics:
  - `200 OK` for successful reads/updates
  - `201 Created` when a resource is created
  - `204 No Content` for successful deletes / no-body successes
  - `400 Bad Request` for validation / schema failures
  - `404 Not Found` for missing resources
  - `409 Conflict` for state collisions (e.g. duplicate keys)
  - `5xx` strictly reserved for server-side failures
- **Stateless** — every request carries everything the server needs; no session state held between requests.
- **Idempotency** — `GET`, `PUT`, and `DELETE` must be safe to retry. `POST` is the only non-idempotent verb and is reserved for creation.
- **Query strings** are for filtering, sorting, pagination, and search (`?q=...`, `?page=...`), never for resource identification.
- **Error responses** share one consistent shape (`{ message, error? }`) — never HTML.
- **Validation** uses zod schemas with `@hono/zod-validator` middleware for `query` / `param` / `json`. TypeScript types are inferred from the schemas.

## Differences from the previous NestJS implementation

| NestJS (removed)                                | Hono + Bun (current)                                           |
| ----------------------------------------------- | -------------------------------------------------------------- |
| `NestFactory.create()` + Express                | `Bun.serve({ fetch: app.fetch })`                              |
| `js-yaml`                                       | `Bun.YAML.parse`                                               |
| `fs.readFile / writeFile`                       | `Bun.file().text() / Bun.write()`                              |
| `node:crypto.createHash('sha256')`              | `new Bun.CryptoHasher('sha256')`                               |
| `better-sqlite3` + `drizzle-orm/better-sqlite3` | `Bun.SQLite` + `drizzle-orm/bun-sqlite`                        |
| `@nestjs/schedule` `@Cron('0 12 * * *')`        | `Bun.cron('0 12 * * *', ...)`                                  |
| `fs.readdir` for cache                          | `new Bun.Glob('*').scan({ cwd })`                              |
| `@nestjs/swagger` annotations                   | Not bundled — schemas live in zod; see `src/features/*/dto.ts` |
| Nest DI (`@Injectable()` + `Module`)            | Plain `import` / module-level singletons                       |
| `NotFoundException` etc. + global filter        | Custom error classes + `try/catch` + `app.onError`             |
