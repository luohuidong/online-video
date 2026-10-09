import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../shared/database/index.ts';
import { playRecords, videos } from '../../shared/database/schema.ts';
import type { PlayRecord, UpsertPlayRecordInput } from './dto.ts';

const videoSelectShape = {
  id: playRecords.videoId,
  title: videos.title,
  sourceId: videos.sourceId,
  sourceVideoId: videos.sourceVideoId,
  sourceName: videos.sourceName,
  cover: videos.cover,
  year: videos.year,
  totalEpisodes: videos.totalEpisodes,
} as const;

function getAll(): PlayRecord[] {
  return db
    .select({
      id: playRecords.id,
      episodeIndex: playRecords.episodeIndex,
      updatedAt: playRecords.updatedAt,
      video: videoSelectShape,
    })
    .from(playRecords)
    .innerJoin(videos, eq(playRecords.videoId, videos.id))
    .orderBy(desc(playRecords.updatedAt))
    .all();
}

function getOne(sourceId: string, sourceVideoId: string): PlayRecord | null {
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
  if (!video) return null;
  return (
    db
      .select({
        id: playRecords.id,
        episodeIndex: playRecords.episodeIndex,
        updatedAt: playRecords.updatedAt,
        video: videoSelectShape,
      })
      .from(playRecords)
      .innerJoin(videos, eq(playRecords.videoId, videos.id))
      .where(eq(playRecords.videoId, video.id))
      .get() ?? null
  );
}

function upsert(input: UpsertPlayRecordInput): PlayRecord | null {
  const now = Date.now();
  // 先插入/更新视频信息
  db.insert(videos)
    .values({
      sourceId: input.video.sourceId,
      sourceVideoId: input.video.sourceVideoId,
      title: input.video.title,
      sourceName: input.video.sourceName,
      cover: input.video.cover ?? '',
      year: input.video.year ?? '',
      totalEpisodes: input.video.totalEpisodes ?? 0,
    })
    .onConflictDoUpdate({
      target: [videos.sourceId, videos.sourceVideoId],
      set: {
        title: input.video.title,
        sourceName: input.video.sourceName,
        cover: input.video.cover ?? '',
        year: input.video.year ?? '',
        totalEpisodes: input.video.totalEpisodes ?? 0,
      },
    })
    .run();
  // 获取视频的内置 id
  const video = db
    .select({ id: videos.id })
    .from(videos)
    .where(
      and(
        eq(videos.sourceId, input.video.sourceId),
        eq(videos.sourceVideoId, input.video.sourceVideoId),
      ),
    )
    .get();
  if (!video) return null;
  // 插入/更新播放记录
  db.insert(playRecords)
    .values({
      videoId: video.id,
      episodeIndex: input.episodeIndex ?? 0,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [playRecords.videoId],
      set: {
        episodeIndex: input.episodeIndex ?? 0,
        updatedAt: now,
      },
    })
    .run();
  return getOne(input.video.sourceId, input.video.sourceVideoId);
}

function remove(sourceId: string, sourceVideoId: string): void {
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
  db.delete(playRecords).where(eq(playRecords.id, video.id)).run();
}

function clearAll(): void {
  db.delete(playRecords).run();
}

export const playRecordsService = { getAll, getOne, upsert, remove, clearAll };
