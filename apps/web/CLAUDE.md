# CLAUDE.md

Web app — React 19 SPA with Vite + Tailwind CSS 4.

## Commands

Run from this directory (`apps/web`):

```bash
pnpm dev       # vite
pnpm build     # tsc -b && vite build
pnpm preview   # vite preview
pnpm typecheck # tsc --noEmit
```

## Architecture

**Feature-based Architecture** — all code must be organized by feature.

Directory structure in `src/`:

- `shared/` - Shared utilities, UI components, and API client
- `features/` - Feature modules (each feature is self-contained with its own components, hooks, api, types, etc.)
- `layout/` - Layout components (Header, Footer, etc.)
- `pages/` - Route pages (page-level components that compose features)
- `router.tsx` - Route configuration
- `App.tsx` / `main.tsx` - App entry components

**Feature-based Architecture Rules:**

- Each feature lives in `features/<feature-name>/` with its own components, hooks, api, and types
- Shared code goes in `shared/` (UI components, API client, utilities)
- Pages only compose features, never contain business logic
- Features are independent and can be imported as islands

State: Zustand for global state, TanStack React Query for server state.
