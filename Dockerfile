# ── Base: Bun (no separate Node runtime needed; bun is self-contained) ─────────
FROM oven/bun:1 AS base

# ── Build stage: install all deps and build both apps ────────────────────────
FROM base AS build
WORKDIR /app

# Copy workspace manifests first so bun can resolve the lockfile before source
COPY package.json bun.lock ./
COPY apps/server/package.json ./apps/server/package.json
COPY apps/web/package.json ./apps/web/package.json

# Install with the committed bun.lock for reproducibility
RUN bun install --frozen-lockfile

# Now copy the rest of the source
COPY . /app

# Build the web app (server runs directly via bun, no build needed)
RUN bun --cwd apps/web run build

# ── Server image ──────────────────────────────────────────────────────────────
FROM base AS server
WORKDIR /app
# Bun ships a working directory that already has /app/{package.json, src/, drizzle/}
COPY --from=build /app/apps/server /app
EXPOSE 3000
# Bun's SQLite migrator is invoked at startup (see src/shared/database/database.ts).
# Just launch the app — no separate drizzle-kit migrate step needed.
CMD ["bun", "run", "src/index.ts"]

# ── Web image (nginx serving the SPA) ────────────────────────────────────────
FROM nginx:stable-alpine AS web
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
