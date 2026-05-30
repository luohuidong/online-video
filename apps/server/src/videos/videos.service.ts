import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../config/config.service';
import { searchSource, getDetailFromSource } from './core/scraper';
import { SearchResult } from './core/types';
import { DrizzleService } from '../database/database.service';
import { videos } from '../database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class VideosService {
  constructor(
    private readonly configService: AppConfigService,
    private readonly drizzle: DrizzleService,
  ) {}

  async search(query: string): Promise<SearchResult[]> {
    const sources = this.configService.getSources();
    const maxPages = 5;
    const results = await Promise.all(sources.map((src) => searchSource(src, query, maxPages)));
    return results.flat();
  }

  async getDetail(sourceId: string, sourceVideoId: string): Promise<SearchResult> {
    const sources = this.configService.getSources();
    const source = sources.find((s) => s.sourceId === sourceId);
    if (!source) throw new Error(`Source not found: ${sourceId}`);
    const results = await getDetailFromSource(source, [sourceVideoId]);
    if (!results.length) throw new Error('Empty detail response');
    return results[0];
  }

  async batchUpdate(
    sourceGroups: Array<{ sourceId: string; sourceVideoIds: string[] }>,
  ): Promise<Array<{ sourceId: string; sourceVideoId: string; totalEpisodes: number | null }>> {
    const updates: Array<{ sourceId: string; sourceVideoId: string; totalEpisodes: number | null }> = [];
    const sources = this.configService.getSources();

    for (const group of sourceGroups) {
      const source = sources.find((s) => s.sourceId === group.sourceId);
      if (!source) continue;

      const details = await getDetailFromSource(source, group.sourceVideoIds);

      for (const detail of details) {
        const totalEpisodes = detail.videoPlayGroups.reduce((sum, g) => sum + g.length, 0) || null;
        updates.push({ sourceId: group.sourceId, sourceVideoId: detail.sourceVideoId, totalEpisodes });
      }
    }

    if (updates.length === 0) return [];

    // 并行更新数据库：Promise.all 将 N 次顺序等待合并为 1 次并发等待
    await Promise.all(
      updates.map((u) =>
        this.drizzle.db
          .update(videos)
          .set({ totalEpisodes: u.totalEpisodes })
          .where(eq(videos.sourceVideoId, u.sourceVideoId))
          .run(),
      ),
    );

    return updates;
  }
}