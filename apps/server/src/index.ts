// Side-effect imports first so config + database are initialized before any
// feature modules evaluate.
import './shared/config/index.ts';
import './shared/database/index.ts';
import { serve } from '@hono/node-server';
import { createApp } from './app.ts';

const app = createApp();

const server = serve({ fetch: app.fetch, port: 3000 });

const address = server.address();
const port = typeof address === 'object' && address ? address.port : 3000;
console.log(`Server running on http://localhost:${port}`);
