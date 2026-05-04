import { Injectable } from '@nestjs/common';
import { desc, eq, and } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { playRecords, videos } from '../database/schema';
import { UpsertPlayRecordData } from './play-records.dto';

@Injectable()
export class PlayRecordsService {
  constructor(private readonly db: DatabaseService) {}

  getAll() {
    return this.db.db
      .select({
        id: playRecords.id,
        episodeIndex: playRecords.episodeIndex,
        updatedAt: playRecords.updatedAt,
        video: {
          id: playRecords.videoId,
          title: videos.title,
          sourceId: videos.sourceId,
          sourceVideoId: videos.sourceVideoId,
          sourceName: videos.sourceName,
          cover: videos.cover,
          year: videos.year,
          totalEpisodes: videos.totalEpisodes,
        },
      })
      .from(playRecords)
      .innerJoin(videos, eq(playRecords.videoId, videos.id))
      .orderBy(desc(playRecords.updatedAt))
      .all();
  }

  getOne(sourceId: string, sourceVideoId: string) {
    const video = this.db.db
      .select({ id: videos.id })
      .from(videos)
      .where(and(eq(videos.sourceId, sourceId), eq(videos.sourceVideoId, sourceVideoId)))
      .get();
    if (!video) return null;
    return this.db.db
      .select({
        id: playRecords.id,
        episodeIndex: playRecords.episodeIndex,
        updatedAt: playRecords.updatedAt,
        video: {
          id: playRecords.videoId,
          title: videos.title,
          sourceId: videos.sourceId,
          sourceVideoId: videos.sourceVideoId,
          sourceName: videos.sourceName,
          cover: videos.cover,
          year: videos.year,
          totalEpisodes: videos.totalEpisodes,
        },
      })
      .from(playRecords)
      .innerJoin(videos, eq(playRecords.videoId, videos.id))
      .where(eq(playRecords.id, video.id))
      .get() ?? null;
  }

  upsert(dto: UpsertPlayRecordData) {
    const now = Date.now();
    // 先插入/更新视频信息
    this.db.db
      .insert(videos)
      .values({
        sourceId: dto.sourceId,
        sourceVideoId: dto.sourceVideoId,
        title: dto.title,
        sourceName: dto.sourceName,
        cover: dto.cover ?? '',
        year: dto.year ?? '',
        totalEpisodes: dto.totalEpisodes ?? 0,
      })
      .onConflictDoUpdate({
        target: [videos.sourceId, videos.sourceVideoId],
        set: {
          title: dto.title,
          sourceName: dto.sourceName,
          cover: dto.cover ?? '',
          year: dto.year ?? '',
          totalEpisodes: dto.totalEpisodes ?? 0,
        },
      })
      .run();
    // 获取视频的内置 id
    const video = this.db.db
      .select({ id: videos.id })
      .from(videos)
      .where(and(eq(videos.sourceId, dto.sourceId), eq(videos.sourceVideoId, dto.sourceVideoId)))
      .get();
    if (!video) return;
    // 插入/更新播放记录
    return this.db.db
      .insert(playRecords)
      .values({
        videoId: video.id,
        episodeIndex: dto.episodeIndex ?? 0,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [playRecords.videoId],
        set: {
          episodeIndex: dto.episodeIndex ?? 0,
          updatedAt: now,
        },
      })
      .run();
  }

  remove(sourceId: string, sourceVideoId: string) {
    const video = this.db.db
      .select({ id: videos.id })
      .from(videos)
      .where(and(eq(videos.sourceId, sourceId), eq(videos.sourceVideoId, sourceVideoId)))
      .get();
    if (!video) return;
    return this.db.db
      .delete(playRecords)
      .where(eq(playRecords.id, video.id))
      .run();
  }

  clearAll() {
    return this.db.db.delete(playRecords).run();
  }
}