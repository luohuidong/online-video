FROM node:24-slim AS base
RUN npm install -g pnpm@^10

# ── Build stage: install all deps and build both apps ────────────────────────
FROM base AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN pnpm install --frozen-lockfile
COPY . /app

RUN pnpm run build:server
RUN pnpm run build:web
# Deploy server with all deps (dev included so drizzle-kit is available at runtime)
RUN pnpm deploy --filter=server /prod/server
# pnpm deploy does not copy build artifacts, copy dist manually
RUN cp -r /app/apps/server/dist /prod/server/dist

# ── Server image ──────────────────────────────────────────────────────────────
FROM base AS server
COPY --from=build /prod/server /app
WORKDIR /app
EXPOSE 3000
# Run schema migrate on every start (idempotent), then launch the app
CMD ["sh", "-c", "node_modules/.bin/drizzle-kit migrate && node dist/src/main"]

# ── Web image (nginx serving the SPA) ────────────────────────────────────────
FROM nginx:stable-alpine AS web
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
