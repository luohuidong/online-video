FROM oven/bun:1 AS web-build
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/package.json
RUN bun install --frozen-lockfile --filter './apps/web'
COPY apps/web ./apps/web
WORKDIR /app/apps/web
RUN bun run build

# ── Web image: nginx serves the SPA ──────────────────────────────────────────
FROM nginx:stable-alpine AS web
COPY --from=web-build /app/apps/web/dist /usr/share/nginx/html
# nginx.conf lives at the repo root next to docker-compose.yml.
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
