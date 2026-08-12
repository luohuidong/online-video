import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { and, eq } from 'drizzle-orm';
import { AppConfigService } from '../config/config.service';
import { DrizzleService } from '../database/database.service';
import { favorites, videos } from '../database/schema';
import { getTotalEpisodeCount } from './core/parsers/episodes';
import { getDetailFromSource, searchSource } from './core/scraper';
import type { SearchGroup, SearchResult } from './core/types';

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  constructor(
    private readonly configService: AppConfigService,
    private readonly drizzle: DrizzleService,
  ) {}

  async search(query: string): Promise<SearchGroup[]> {
    const sources = this.configService.getSources();
    const maxPages = 5;
    const perSource = await Promise.all(
      sources.map((src) => searchSource(src, query, maxPages)),
    );

    // 按 config.yml 中的源顺序分组，跳过空集合
    return sources
      .map((src, i) => ({ source: src, items: perSource[i] }))
      .filter((g) => g.items.length > 0)
      .map((g) => ({ name: g.source.sourceName, items: g.items }));
  }

  async getDetail(
    sourceId: string,
    sourceVideoId: string,
  ): Promise<SearchResult> {
    const sources = this.configService.getSources();
    const source = sources.find((s) => s.sourceId === sourceId);
    if (!source) throw new Error(`Source not found: ${sourceId}`);
    const results = await getDetailFromSource(source, [sourceVideoId]);
    if (!results.length) throw new Error('Empty detail response');
    return results[0];
  }

  async batchUpdate(
    sourceGroups: Array<{ sourceId: string; sourceVideoIds: string[] }>,
  ): Promise<
    Array<{
      sourceId: string;
      sourceVideoId: string;
      totalEpisodes: number | null;
    }>
  > {
    const updates: Array<{
      sourceId: string;
      sourceVideoId: string;
      totalEpisodes: number | null;
    }> = [];
    const sources = this.configService.getSources();

    for (const group of sourceGroups) {
      const source = sources.find((s) => s.sourceId === group.sourceId);
      if (!source) continue;

      const details = await getDetailFromSource(source, group.sourceVideoIds);

      for (const detail of details) {
        const totalEpisodes = getTotalEpisodeCount(detail.videoPlayGroups);
        updates.push({
          sourceId: group.sourceId,
          sourceVideoId: detail.sourceVideoId,
          totalEpisodes,
        });
      }
    }

    if (updates.length === 0) return [];

    // 并行更新数据库：Promise.all 将 N 次顺序等待合并为 1 次并发等待
    await Promise.all(
      updates.map((u) =>
        this.drizzle.db
          .update(videos)
          .set({ totalEpisodes: u.totalEpisodes })
          .where(
            and(
              eq(videos.sourceId, u.sourceId),
              eq(videos.sourceVideoId, u.sourceVideoId),
            ),
          )
          .run(),
      ),
    );

    return updates;
  }

  // 每天中午 12:00 刷新所有收藏视频的集数
  @Cron('0 12 * * *')
  async refreshFavoritedEpisodes(): Promise<void> {
    const startedAt = Date.now();
    this.logger.log('Starting scheduled refresh of favorited video episodes');

    // 取出所有收藏视频的 (sourceId, sourceVideoId) 去重
    const rows = this.drizzle.db
      .selectDistinct({
        sourceId: videos.sourceId,
        sourceVideoId: videos.sourceVideoId,
      })
      .from(favorites)
      .innerJoin(videos, eq(favorites.videoId, videos.id))
      .all();

    if (rows.length === 0) {
      this.logger.log('No favorited videos — nothing to refresh');
      return;
    }

    // 按 sourceId 分组
    const grouped = new Map<string, string[]>();
    for (const r of rows) {
      const arr = grouped.get(r.sourceId) ?? [];
      arr.push(r.sourceVideoId);
      grouped.set(r.sourceId, arr);
    }

    // 每源一批，单独 try/catch，单源失败不影响其他源
    let updated = 0;
    let failed = 0;
    for (const [sourceId, sourceVideoIds] of grouped) {
      try {
        const results = await this.batchUpdate([{ sourceId, sourceVideoIds }]);
        updated += results.length;
        this.logger.log(`Refreshed source=${sourceId} count=${results.length}`);
      } catch (err) {
        failed += 1;
        this.logger.error(
          `Failed to refresh source=${sourceId}: ${(err as Error).message}`,
        );
      }
    }

    const elapsedMs = Date.now() - startedAt;
    this.logger.log(
      `Finished refresh in ${elapsedMs}ms — updated=${updated}, failed=${failed}, sources=${grouped.size}`,
    );
  }
}
