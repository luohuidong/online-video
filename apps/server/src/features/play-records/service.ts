import { and, desc, eq, sql } from 'drizzle-orm';
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

async function getAll(): Promise<PlayRecord[]> {
  return await db
    .select({
      id: playRecords.id,
      episodeIndex: playRecords.episodeIndex,
      updatedAt: playRecords.updatedAt,
      video: videoSelectShape,
    })
    .from(playRecords)
    .innerJoin(videos, eq(playRecords.videoId, videos.id))
    .orderBy(desc(playRecords.updatedAt));
}

// play_records.video_id 上有唯一索引，所以一条 join 就能定位记录，
// 不需要先查 videos 再查 play_records。
async function getOne(
  sourceId: string,
  sourceVideoId: string,
): Promise<PlayRecord | null> {
  const [record] = await db
    .select({
      id: playRecords.id,
      episodeIndex: playRecords.episodeIndex,
      updatedAt: playRecords.updatedAt,
      video: videoSelectShape,
    })
    .from(playRecords)
    .innerJoin(videos, eq(playRecords.videoId, videos.id))
    .where(
      and(
        eq(videos.sourceId, sourceId),
        eq(videos.sourceVideoId, sourceVideoId),
      ),
    );
  return record ?? null;
}

async function upsert(
  input: UpsertPlayRecordInput,
): Promise<PlayRecord | null> {
  const now = Date.now();
  // 先插入/更新视频信息，取回 videos.id。MySQL 的 ON DUPLICATE KEY UPDATE
  // 没有 target 参数，由 videos_source_video_idx 唯一索引充当冲突触发器；
  // `id = LAST_INSERT_ID(id)` 让 insertId 在插入和命中已有行时都等于 videos.id，
  // 省掉一次 SELECT（MySQL 没有 INSERT ... RETURNING）。
  const [upserted] = await db
    .insert(videos)
    .values({
      sourceId: input.video.sourceId,
      sourceVideoId: input.video.sourceVideoId,
      title: input.video.title,
      sourceName: input.video.sourceName,
      cover: input.video.cover ?? '',
      year: input.video.year ?? '',
      totalEpisodes: input.video.totalEpisodes ?? 0,
    })
    .onDuplicateKeyUpdate({
      set: {
        title: input.video.title,
        sourceName: input.video.sourceName,
        cover: input.video.cover ?? '',
        year: input.video.year ?? '',
        totalEpisodes: input.video.totalEpisodes ?? 0,
        id: sql`LAST_INSERT_ID(id)`,
      },
    });

  const videoId = upserted.insertId;
  if (!videoId) {
    // 既没插入也没命中唯一键，属于不该发生的状态。
    throw new Error(
      `Failed to resolve video id for ${input.video.sourceId}/${input.video.sourceVideoId}`,
    );
  }

  // 插入/更新播放记录
  await db
    .insert(playRecords)
    .values({
      videoId,
      episodeIndex: input.episodeIndex ?? 0,
      updatedAt: now,
    })
    .onDuplicateKeyUpdate({
      set: {
        episodeIndex: input.episodeIndex ?? 0,
        updatedAt: now,
      },
    });
  return await getOne(input.video.sourceId, input.video.sourceVideoId);
}

async function remove(sourceId: string, sourceVideoId: string): Promise<void> {
  const [video] = await db
    .select({ id: videos.id })
    .from(videos)
    .where(
      and(
        eq(videos.sourceId, sourceId),
        eq(videos.sourceVideoId, sourceVideoId),
      ),
    );
  if (!video) return;
  // 注意：条件列是 play_records.video_id（指向 videos.id），
  // 不是 play_records 自己的主键 id。
  await db.delete(playRecords).where(eq(playRecords.videoId, video.id));
}

async function clearAll(): Promise<void> {
  await db.delete(playRecords);
}

export const playRecordsService = { getAll, getOne, upsert, remove, clearAll };
