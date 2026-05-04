import { Injectable } from '@nestjs/common';
import { desc, eq, and } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { favorites, videos } from '../database/schema';
import { AddFavoriteDto } from './favorites.dto';

@Injectable()
export class FavoritesService {
  constructor(private readonly db: DatabaseService) {}

  getAll() {
    return this.db.db
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
    // 先插入/更新视频信息，获取视频 id
    this.db.db
      .insert(videos)
      .values({
        sourceId: dto.sourceId,
        sourceName: dto.sourceName,
        sourceVideoId: dto.sourceVideoId,
        title: dto.title,
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

    // 通过 sourceId + videoId 查找视频的内置 id
    const video = this.db.db
      .select({ id: videos.id })
      .from(videos)
      .where(and(eq(videos.sourceId, dto.sourceId), eq(videos.sourceVideoId, dto.sourceVideoId)))
      .get();
    if (!video) return;

    // 插入收藏记录（已存在则更新）
    return this.db.db
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
    return this.db.db.delete(favorites).where(eq(favorites.id, id)).run();
  }

  clearAll() {
    return this.db.db.delete(favorites).run();
  }
}
