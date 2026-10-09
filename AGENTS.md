# AGENTS.md

## 项目概览

单仓库（monorepo）包含两个 app：一个 Hono + Node 的 API 服务端（MySQL + Drizzle ORM），一个 React 前端（Vite + Tailwind CSS 4）。对接苹果CMS V10（Mac CMS）视频源 API。用 [pnpm](https://pnpm.io) workspace（`pnpm-workspace.yaml`）管理。

各 app 的细节写在各自的 AGENTS.md 里：`apps/server/AGENTS.md` 和 `apps/web/AGENTS.md`。

## 命令

```bash
# 安装 workspace 依赖（仓库根目录执行，只需一次）
pnpm install

# 代码质量（Biome，仓库根目录执行）
pnpm run format         # 格式检查（biome format）
pnpm run format:write   # 应用格式化（biome format --write）
pnpm run lint           # lint 检查（biome lint）
pnpm run lint:write     # lint 检查并应用安全修复（biome lint --write）
pnpm run check          # 格式 + lint + import 排序检查（biome check）
pnpm run check:write    # 应用格式 + lint + import 排序（biome check --write）
pnpm run ci             # 面向 CI 的检查，不带 --write

# Markdown / YAML 格式化（Prettier，仓库根目录执行）
pnpm run prettier:format        # 检查 .md / .markdown / .yml / .yaml 格式
pnpm run prettier:format:write  # 对上述文件应用格式化

# 开发
pnpm --filter server dev   # 后端（仓库根目录执行）
pnpm --filter web dev      # 前端（仓库根目录执行）
```

需要 Node 26 —— Docker 镜像通过 `pnpm runtime set node 26 -g` 装好。Node 直接运行 TypeScript 源码（原生类型擦除），所以服务端没有构建步骤。

各 app 的 `build` / `typecheck` / `drizzle:*` 等脚本在对应 app 目录内执行 —— 见各自的 AGENTS.md。

## 验证

修改任一子项目的源码（`apps/server/src/` 或 `apps/web/src/`）后：

1. 在该 app 目录内跑它的 `typecheck`（`pnpm run typecheck`），确认 TypeScript 仍能编译通过。
2. 在仓库根目录跑 `pnpm run check:write`，对整个 monorepo 应用 Biome 格式化、lint 修复和 import 排序。

两步都通过之前，不要宣称改动已完成。
