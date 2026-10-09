# ── base: pnpm 官方镜像 + 由 pnpm 托管的 Node 运行时 ──────────────────────────
FROM ghcr.io/pnpm/pnpm:12 AS base
RUN pnpm runtime set node 26 -g

# ── build: 装依赖并产出自包含的部署目录 ──────────────────────────────────────
FROM base AS build
WORKDIR /app
# 依赖层只跟 manifest 走：改源码不会让 pnpm 重新解析依赖
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/server/package.json ./apps/server/package.json
RUN --mount=type=cache,id=pnpm,target=/var/cache/pnpm \
    pnpm install --store-dir /var/cache/pnpm --prod --frozen-lockfile --filter server

COPY apps/server ./apps/server
# deploy 把 server 的依赖拍平成自包含的 node_modules，不再依赖 workspace 软链
RUN --mount=type=cache,id=pnpm,target=/var/cache/pnpm \
    pnpm deploy --filter=server --prod /prod/server

# ── runtime: Node 26 直接跑 TypeScript（原生 type stripping，无构建步骤）────
FROM base AS server
WORKDIR /app
COPY --from=build /prod/server .

EXPOSE 3000
# .env 文件不存在时静默跳过——compose 会用 environment 注入 DATABASE_URL
CMD ["node", "--env-file-if-exists=.env", "src/index.ts"]
