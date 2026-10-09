import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { favoritesRoutes } from './features/favorites/index.ts';
import { playRecordsRoutes } from './features/play-records/index.ts';
import { videosRoutes } from './features/videos/index.ts';
import { accessLog } from './middleware/access-log.ts';

export function createApp(): Hono {
  const app = new Hono();

  app.use('*', accessLog);
  app.use(
    '*',
    cors({
      origin: '*',
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  );

  app.route('/videos', videosRoutes);
  app.route('/favorites', favoritesRoutes);
  app.route('/play-records', playRecordsRoutes);

  app.notFound((c) => c.json({ message: 'Not Found' }, 404));

  app.onError((err, c) => {
    console.error('[error]', err);
    return c.json({ message: 'Internal Server Error' }, 500);
  });

  return app;
}
