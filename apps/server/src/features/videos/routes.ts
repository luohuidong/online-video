import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { batchUpdate, getDetail, search } from './services';
import { SourceNotFoundError, UpstreamError } from './types';

const videosRoutes = new Hono();

// GET /videos?q=... — 跨源聚合搜索
videosRoutes.get(
  '/',
  zValidator('query', z.object({ q: z.string().min(1) })),
  async (c) => {
    const { q } = c.req.valid('query');
    const groups = await search(q.trim());
    return c.json({ groups });
  },
);

// GET /videos/:sourceId/:sourceVideoId — 获取指定源的视频详情
videosRoutes.get(
  '/:sourceId/:sourceVideoId',
  zValidator(
    'param',
    z.object({ sourceId: z.string(), sourceVideoId: z.string() }),
  ),
  async (c) => {
    const { sourceId, sourceVideoId } = c.req.valid('param');
    try {
      const detail = await getDetail(sourceId, sourceVideoId);
      return c.json(detail);
    } catch (err) {
      if (err instanceof SourceNotFoundError) {
        return c.json({ message: err.message }, 404);
      }
      if (err instanceof UpstreamError) {
        return c.json(
          {
            message: '上游视频源暂时不可用，请稍后重试或切换其他源',
            error: err.message,
          },
          502,
        );
      }
      throw err;
    }
  },
);

// POST /videos/batch-update — 批量更新收藏夹视频的集数信息
videosRoutes.post(
  '/batch-update',
  zValidator(
    'json',
    z.object({
      sourceGroups: z.array(
        z.object({
          sourceId: z.string(),
          sourceVideoIds: z.array(z.string()),
        }),
      ),
    }),
  ),
  async (c) => {
    try {
      const { sourceGroups } = c.req.valid('json');
      const results = await batchUpdate(sourceGroups);
      return c.json({ results });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '批量更新失败';
      return c.json(
        { message: '上游视频源暂时不可用，请稍后重试', error: msg },
        502,
      );
    }
  },
);

export default videosRoutes;
