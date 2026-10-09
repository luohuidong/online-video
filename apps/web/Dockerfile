FROM ghcr.io/pnpm/pnpm:12 AS build
RUN pnpm runtime set node 26 -g

WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/package.json
RUN --mount=type=cache,id=pnpm,target=/var/cache/pnpm \
    pnpm install --store-dir /var/cache/pnpm --frozen-lockfile --filter web

COPY apps/web ./apps/web
RUN pnpm --filter web build

# ── Web image: nginx serves the SPA ──────────────────────────────────────────
FROM nginx:stable-alpine AS web
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
# nginx.conf lives at the repo root next to docker-compose.yml.
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
