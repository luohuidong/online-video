import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { AddFavoriteSchema } from './dto.ts';
import { favoritesService } from './service.ts';

const favoritesRoutes = new Hono();

// GET /favorites — 获取全部收藏（按保存时间倒序）
favoritesRoutes.get('/', (c) => c.json(favoritesService.getAll()));

// POST /favorites — 添加收藏
favoritesRoutes.post('/', zValidator('json', AddFavoriteSchema), (c) => {
  const input = c.req.valid('json');
  favoritesService.add(input);
  return c.json({ ok: true }, 201);
});

// DELETE /favorites — 清空所有收藏
favoritesRoutes.delete('/', (c) => {
  favoritesService.clearAll();
  return c.json({ ok: true });
});

// DELETE /favorites/:id — 删除单条收藏
favoritesRoutes.delete(
  '/:id',
  zValidator('param', z.object({ id: z.coerce.number().int().positive() })),
  (c) => {
    const { id } = c.req.valid('param');
    favoritesService.remove(id);
    return c.json({ ok: true });
  },
);

// PATCH /favorites/:id — 更新收藏的 updatedAt，使该条浮动到列表顶部
favoritesRoutes.patch(
  '/:id',
  zValidator('param', z.object({ id: z.coerce.number().int().positive() })),
  (c) => {
    const { id } = c.req.valid('param');
    const result = favoritesService.touch(id);
    if (!result) return c.json({ message: `Favorite ${id} not found` }, 404);
    return c.json({ ok: true, updatedAt: result.updatedAt });
  },
);

export default favoritesRoutes;
