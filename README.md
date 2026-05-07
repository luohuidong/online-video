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

Create `config.yml` in the project root to configure video sources (苹果CMS). Multiple sources can be configured:

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

```bash
# Install dependencies
pnpm install

# Start backend development server
pnpm dev:server

# Start frontend development server
pnpm dev:web
```
