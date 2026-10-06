# ── Base: Bun (no separate Node runtime needed; bun is self-contained) ─────────
FROM oven/bun:1 AS base

# ── Server image ──────────────────────────────────────────────────────────────
# No separate build stage: server runs TS source directly via bun, and runtime
# uses bun:sqlite (no native modules to compile). Install prod deps in-place.
FROM base AS server
WORKDIR /app
# Copy workspace manifests first so bun can resolve the lockfile before source
COPY package.json bun.lock ./
COPY apps/server/package.json ./apps/server/package.json
# Install with the committed bun.lock for reproducibility.
#   --filter './apps/server'  → only install this workspace's tree (web deps skipped)
#   --omit=dev                → skip devDeps (better-sqlite3, drizzle-kit, …) since
#                               runtime uses bun:sqlite, not better-sqlite3
RUN bun install --frozen-lockfile --filter './apps/server' --omit=dev
# Now copy the rest of the source. .dockerignore excludes apps/server/node_modules,
# so the installed deps from the previous layer are preserved.
COPY apps/server /app
EXPOSE 3000
# Bun's SQLite migrator is invoked at startup (see src/shared/database/database.ts).
# Just launch the app — no separate drizzle-kit migrate step needed.
CMD ["bun", "run", "src/index.ts"]

# ── Web build stage: web needs vite build ─────────────────────────────────────
FROM base AS web-build
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/package.json
RUN bun install --frozen-lockfile --filter './apps/web'
COPY . /app
# Note: bun's --cwd must use the equals form (=) — `--cwd path` is parsed as
# `bun --cwd path` followed by positional args, which silently prints help and
# exits 0 without running the script.
RUN bun --cwd=apps/web run build

# ── Web image (nginx serving the SPA) ────────────────────────────────────────
FROM nginx:stable-alpine AS web
COPY --from=web-build /app/apps/web/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
