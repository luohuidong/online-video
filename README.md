# Online Video

## Quick Start

### Start Services with Docker Compose

```bash
# Start all services
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

SQLite database file is stored in a Docker volume and will be created automatically on first startup.

## Development

Requires [Node.js](https://nodejs.org) 26 (native TypeScript execution — no build step) and [pnpm](https://pnpm.io) (12.x).

```bash
# Install workspace dependencies
pnpm install

# Start backend development server (Hono on Node)
pnpm --filter server dev

# Start frontend development server (Vite)
pnpm --filter web dev
```
