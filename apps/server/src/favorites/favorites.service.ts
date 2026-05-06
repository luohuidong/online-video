import { Injectable } from '@nestjs/common';
import { desc, eq, and } from 'drizzle-orm';
import { DrizzleService } from '../database/database.service';
import { favorites, videos } from '../database/schema';
import { AddFavoriteDto } from './favorites.dto';

@Injectable()
export class FavoritesService {
  constructor(private readonly drizzle: DrizzleService) {}

  getAll() {
    return this.drizzle.db
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

  add(dto: AddFavoriteDto) {
    const now = Date.now();
    const { sourceId, sourceName, sourceVideoId, title, cover, year, totalEpisodes } = dto.video;
    // 先插入/更新视频信息，获取视频 id
    this.drizzle.db
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
    const video = this.drizzle.db
      .select({ id: videos.id })
      .from(videos)
      .where(and(eq(videos.sourceId, sourceId), eq(videos.sourceVideoId, sourceVideoId)))
      .get();
    if (!video) return;

    // 插入收藏记录（已存在则更新）
    return this.drizzle.db
      .insert(favorites)
      .values({
        videoId: video.id,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [favorites.videoId],
        set: {
          updatedAt: now,
        },
      })
      .run();
  }

  remove(id: number) {
    return this.drizzle.db.delete(favorites).where(eq(favorites.id, id)).run();
  }

  clearAll() {
    return this.drizzle.db.delete(favorites).run();
  }
}
