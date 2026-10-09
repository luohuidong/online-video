import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { UpsertPlayRecordSchema } from './dto.ts';
import { playRecordsService } from './service.ts';

const playRecordsRoutes = new Hono();

const sourceIdParam = z.object({
  sourceId: z.string(),
  sourceVideoId: z.string(),
});

// GET /play-records — 获取全部播放记录（按保存时间倒序）
playRecordsRoutes.get('/', async (c) =>
  c.json(await playRecordsService.getAll()),
);

// GET /play-records/:sourceId/:sourceVideoId — 获取单条播放记录
playRecordsRoutes.get(
  '/:sourceId/:sourceVideoId',
  zValidator('param', sourceIdParam),
  async (c) => {
    const { sourceId, sourceVideoId } = c.req.valid('param');
    const record = await playRecordsService.getOne(sourceId, sourceVideoId);
    if (!record) {
      return c.json(
        { message: `Play record not found for ${sourceId}/${sourceVideoId}` },
        404,
      );
    }
    return c.json(record);
  },
);

// PUT /play-records — 新增/更新播放记录（upsert）
playRecordsRoutes.put(
  '/',
  zValidator('json', UpsertPlayRecordSchema),
  async (c) => {
    const input = c.req.valid('json');
    return c.json(await playRecordsService.upsert(input));
  },
);

// DELETE /play-records — 清空所有播放记录
playRecordsRoutes.delete('/', async (c) => {
  await playRecordsService.clearAll();
  return c.body(null, 204);
});

// DELETE /play-records/:sourceId/:sourceVideoId — 删除单条播放记录
playRecordsRoutes.delete(
  '/:sourceId/:sourceVideoId',
  zValidator('param', sourceIdParam),
  async (c) => {
    const { sourceId, sourceVideoId } = c.req.valid('param');
    await playRecordsService.remove(sourceId, sourceVideoId);
    return c.body(null, 204);
  },
);

export default playRecordsRoutes;
