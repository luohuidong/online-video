import { desc, eq, sql } from 'drizzle-orm';
import { db } from '../../shared/database/index.ts';
import { favorites, videos } from '../../shared/database/schema.ts';
import type { AddFavoriteInput, FavoriteRecord } from './dto.ts';

async function getAll(): Promise<FavoriteRecord[]> {
  return await db
    .select({
      id: favorites.id,
      updatedAt: favorites.updatedAt,
      video: {
        id: videos.id,
        title: videos.title,
        sourceId: videos.sourceId,
        sourceVideoId: videos.sourceVideoId,
        sourceName: videos.sourceName,
        cover: videos.cover,
        year: videos.year,
        totalEpisodes: videos.totalEpisodes,
      },
    })
    .from(favorites)
    .innerJoin(videos, eq(favorites.videoId, videos.id))
    .orderBy(desc(favorites.updatedAt));
}

async function add(input: AddFavoriteInput): Promise<void> {
  const now = Date.now();
  const {
    sourceId,
    sourceName,
    sourceVideoId,
    title,
    cover,
    year,
    totalEpisodes,
  } = input.video;

  // 先插入/更新视频信息，取回 videos.id。
  // MySQL 的 ON DUPLICATE KEY UPDATE 没有 target 参数——它对任意唯一键生效，
  // 这里由 videos_source_video_idx 唯一索引充当冲突触发器。
  // `id = LAST_INSERT_ID(id)` 是 MySQL 的惯用技巧：命中已有行时把它的 id
  // 回填进 last_insert_id，于是 insertId 在「插入」和「更新」两种路径下都等于
  // videos.id，省掉一次 SELECT（MySQL 没有 INSERT ... RETURNING）。
  const [upserted] = await db
    .insert(videos)
    .values({
      sourceId,
      sourceName,
      sourceVideoId,
      title,
      cover: cover ?? '',
      year: year ?? '',
      totalEpisodes: totalEpisodes ?? 0,
    })
    .onDuplicateKeyUpdate({
      set: {
        title,
        sourceName,
        cover: cover ?? '',
        year: year ?? '',
        totalEpisodes: totalEpisodes ?? 0,
        id: sql`LAST_INSERT_ID(id)`,
      },
    });

  const videoId = upserted.insertId;
  if (!videoId) {
    // 上一条 INSERT 既没插入也没命中任何唯一键——属于不该发生的状态，直接炸掉
    // 比静默跳过更容易定位。
    throw new Error(
      `Failed to resolve video id for ${sourceId}/${sourceVideoId}`,
    );
  }

  // 插入收藏记录（已存在则更新）
  await db
    .insert(favorites)
    .values({
      videoId,
      updatedAt: now,
    })
    .onDuplicateKeyUpdate({
      set: { updatedAt: now },
    });
}

async function remove(id: number): Promise<void> {
  await db.delete(favorites).where(eq(favorites.id, id));
}

async function touch(id: number): Promise<{ updatedAt: number } | null> {
  const now = Date.now();
  const [result] = await db
    .update(favorites)
    .set({ updatedAt: now })
    .where(eq(favorites.id, id));
  // MySQL 返回的 affectedRows 是「实际变更的行数」，而 updatedAt 每次都写入新值，
  // 因此 0 就等价于「这行不存在」，不需要再补一次 SELECT 探活。
  return result.affectedRows === 0 ? null : { updatedAt: now };
}

async function clearAll(): Promise<void> {
  await db.delete(favorites);
}

export const favoritesService = { getAll, add, remove, touch, clearAll };
