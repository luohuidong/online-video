import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../shared/database';
import { favorites, videos } from '../../shared/database/schema';
import type { AddFavoriteInput, FavoriteRecord } from './dto';

function getAll(): FavoriteRecord[] {
  return db
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
    .orderBy(desc(favorites.updatedAt))
    .all();
}

function add(input: AddFavoriteInput): void {
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

  // 先插入/更新视频信息，获取视频 id
  db.insert(videos)
    .values({
      sourceId,
      sourceName,
      sourceVideoId,
      title,
      cover: cover ?? '',
      year: year ?? '',
      totalEpisodes: totalEpisodes ?? 0,
    })
    .onConflictDoUpdate({
      target: [videos.sourceId, videos.sourceVideoId],
      set: {
        title,
        sourceName,
        cover: cover ?? '',
        year: year ?? '',
        totalEpisodes: totalEpisodes ?? 0,
      },
    })
    .run();

  // 通过 sourceId + videoId 查找视频的内置 id
  const video = db
    .select({ id: videos.id })
    .from(videos)
    .where(
      and(
        eq(videos.sourceId, sourceId),
        eq(videos.sourceVideoId, sourceVideoId),
      ),
    )
    .get();
  if (!video) return;

  // 插入收藏记录（已存在则更新）
  db.insert(favorites)
    .values({
      videoId: video.id,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [favorites.videoId],
      set: { updatedAt: now },
    })
    .run();
}

function remove(id: number): void {
  db.delete(favorites).where(eq(favorites.id, id)).run();
}

function touch(id: number): { updatedAt: number } | null {
  const now = Date.now();
  db.update(favorites)
    .set({ updatedAt: now })
    .where(eq(favorites.id, id))
    .run();
  // bun-sqlite's run() returns void, so check existence via a follow-up read.
  const exists = db
    .select({ id: favorites.id })
    .from(favorites)
    .where(eq(favorites.id, id))
    .get();
  return exists ? { updatedAt: now } : null;
}

function clearAll(): void {
  db.delete(favorites).run();
}

export const favoritesService = { getAll, add, remove, touch, clearAll };
