// Side-effect imports first so config + database are initialized before any
// feature modules evaluate.
import './shared/config/index.ts';
import './shared/database/index.ts';
import { serve } from '@hono/node-server';
import { createApp } from './app.ts';

const app = createApp();

// 容器内固定 3000（见 apps/server/Dockerfile 的 EXPOSE），不需要动态分配。
serve({ fetch: app.fetch, port: 3000 });
console.log('Server running on http://localhost:3000');
