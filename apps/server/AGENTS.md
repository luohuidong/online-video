# AGENTS.md

Server app — Hono HTTP API on Node + Drizzle ORM + SQLite.

## Commands

Run from this directory (`apps/server`):

```bash
pnpm run dev            # NODE_ENV=development node --watch src/index.ts (hot reload)
pnpm run start          # node src/index.ts (production)
pnpm run typecheck      # tsc --noEmit
pnpm run drizzle:generate  # drizzle-kit generate
pnpm run drizzle:push      # drizzle-kit push
```

Dependencies are installed with pnpm from the repo root (`pnpm install`). The server runs on Node 26 and executes the TypeScript sources directly via native type stripping — there is no build step, which means:

- relative imports must carry an explicit `.ts` (directory barrels use `/index.ts`); `tsconfig.json` uses `module`/`moduleResolution: nodenext`, so `tsc` fails with TS2835 if one is missing
- only erasable TypeScript syntax is allowed — no enums, namespaces, parameter properties (`constructor(public x: T)`), or `import x = require()`

The server loads `config.yml` from its current working directory.
For Docker that's `/app/config.yml` (mounted from the repo root);
for local dev, place your `config.yml` at `apps/server/config.yml`.
The SQLite database lives at `<cwd>/.data/data.db`, i.e. `/app/.data` in Docker.

## Architecture

Hono app assembled in `src/app.ts` via `createApp()`; each feature is a self-contained folder under `src/features/`:

- `shared/config/` - `yaml.parse` of `config.yml` + zod schema
- `shared/database/` - `better-sqlite3` + drizzle + auto-migrate on boot
- `middleware/access-log.ts` - Request access log
- `features/videos/` - Cross-source search + detail + batch update + daily cron
- `features/favorites/` - Favorites CRUD
- `features/play-records/` - Playback progress CRUD
- `index.ts` - Process entry: imports shared (side-effect), creates app, calls `serve()` from `@hono/node-server`

## Conventions

- **Export discipline** — Only `export` symbols that are demonstrably consumed by code outside the defining file. Re-exporting from `index.ts` barrels is allowed only when at least one external module already imports that symbol. Avoid speculative / forward-looking exports; TS will tell you the moment a new consumer appears, and adding the export at that point costs seconds. Do not re-export purely for IDE autocomplete or "public API surface" cosmetics.

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

| NestJS (removed)                                | Hono + Node (current)                                          |
| ----------------------------------------------- | -------------------------------------------------------------- |
| `NestFactory.create()` + Express                | `serve({ fetch: app.fetch })` from `@hono/node-server`         |
| `js-yaml`                                       | `yaml.parse`                                                   |
| `fs.readFile / writeFile`                       | `node:fs/promises` `readFile` / `mkdirSync`                    |
| `node:crypto.createHash('sha256')`              | `node:crypto` `createHash`                                     |
| `better-sqlite3` + `drizzle-orm/better-sqlite3` | `better-sqlite3` + `drizzle-orm/better-sqlite3`                |
| `@nestjs/schedule` `@Cron('0 12 * * *')`        | `new Cron('0 12 * * *', ...)` from `croner`                    |
| `fs.readdir` for cache                          | `node:fs/promises` `readdir` / `opendir`                       |
| `@nestjs/swagger` annotations                   | Not bundled — schemas live in zod; see `src/features/*/dto.ts` |
| Nest DI (`@Injectable()` + `Module`)            | Plain `import` / module-level singletons                       |
| `NotFoundException` etc. + global filter        | Custom error classes + `try/catch` + `app.onError`             |
