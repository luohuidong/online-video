# Online Video

## Quick Start

### Start Services with Docker Compose

```bash
# Start all services (server + web + mysql)
docker compose up -d

# View logs
docker compose logs -f
```

After services start:

- Frontend: <http://localhost>
- API: <http://localhost/api>

### Build Docker Images Manually

```bash
# Build server image
docker build --target server -t online-video-server .

# Build web image
docker build --target web -t online-video-web .
```

### Configuration

Create `config.yml` in `apps/server/` (for local dev) or in the repo root (for Docker; the compose file mounts it into the container). Configure your 苹果CMS video sources:

```yaml
sources:
  - sourceId: 'example source id'
    sourceName: 'example source name'
    api: 'http://example.com/api.php/provide/vod/'
  - sourceId: 'another source id'
    sourceName: 'another source name'
    api: 'http://another-example.com/api.php/provide/vod/'
```

- `sourceId`: Resource identifier
- `sourceName`: Resource display name
- `api`: 苹果CMS API address

The MySQL connection is configured separately via environment variables —
`config.yml` only holds video sources. Copy `apps/server/.env.example` to
`apps/server/.env` for local development:

```bash
DATABASE_URL=mysql://user:password@127.0.0.1:3306/online_video
```

`.env` is gitignored; `.env.example` is committed. In Docker the compose file
injects `DATABASE_URL` directly, so no `.env` file is needed there.

The MySQL database runs in its own container with a Docker volume, and is
reachable at `127.0.0.1:3306` from the host. Schema migrations from
`apps/server/drizzle/` are applied automatically on server startup.

## Development

Requires [Node.js](https://nodejs.org) 26 (native TypeScript execution — no build step) and [pnpm](https://pnpm.io) (12.x).

Start the database first — the dev server talks to the same MySQL as production
(there is no throwaway in-memory database anymore), creates the schema on boot
and keeps the data across restarts:

```bash
docker compose up -d mysql
```

To wipe local data, drop the database and let the boot migration rebuild it:

```bash
docker compose down -v
```

Then install and run:

```bash
# Install workspace dependencies
pnpm install

# Start backend development server (Hono on Node)
pnpm --filter server dev

# Start frontend development server (Vite)
pnpm --filter web dev
```
