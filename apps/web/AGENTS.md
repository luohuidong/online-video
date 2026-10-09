# AGENTS.md

Web app —— React 19 单页应用，基于 Vite + Tailwind CSS 4。

## 命令

在本目录（`apps/web`）下执行：

```bash
pnpm run dev       # vite
pnpm run build      # tsc -b && vite build
pnpm run preview    # vite preview
pnpm run typecheck  # tsc --noEmit
```

## 架构

**按 feature 组织（Feature-based Architecture）** —— 所有代码必须按 feature 归置。

`src/` 下的目录结构：

- `shared/` - 公共工具、UI 组件、API client
- `features/` - feature 模块（每个 feature 自带 components、hooks、api、types 等）
- `layout/` - 布局组件（Header、Footer 等）
- `pages/` - 路由页面（组合各 feature 的页面级组件）
- `router.tsx` - 路由配置
- `App.tsx` / `main.tsx` - 应用入口组件

**Feature-based 架构规则：**

- 每个 feature 放在 `features/<feature-name>/` 下，自带 components、hooks、api、types
- 公共代码放 `shared/`（UI 组件、API client、工具函数）
- 页面只负责组合 feature，绝不写业务逻辑
- 各 feature 相互独立，可以像孤岛一样被单独引用

状态管理：全局状态用 Zustand，服务端状态用 TanStack React Query。
