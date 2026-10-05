// Side-effect imports first so config + database are initialized before any
// feature modules evaluate. The videos feature's cron (Bun.cron registered
// at the bottom of services/refresh.ts) is wired in transitively when
// createApp() pulls in videosRoutes.
import './shared/config';
import './shared/database';
import { createApp } from './app';

const app = createApp();

const server = Bun.serve({
  port: 3000,
  fetch: app.fetch,
});

console.log(`Server running on http://localhost:${server.port}`);
