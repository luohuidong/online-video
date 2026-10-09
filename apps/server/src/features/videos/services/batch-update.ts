import { and, eq } from 'drizzle-orm';
import { config } from '../../../shared/config/index.ts';
import { db } from '../../../shared/database/index.ts';
import { videos } from '../../../shared/database/schema.ts';
import { getTotalEpisodeCount } from '../parsers/episodes.ts';
import { getDetailFromSource } from './utils/scraper.ts';

interface BatchUpdateItem {
  sourceId: string;
  sourceVideoId: string;
  totalEpisodes: number | null;
}

/**
 * 批量抓取一组视频的最新集数并写回数据库。
 * 用于刷新收藏视频的 totalEpisodes（每天中午 12:00 由 cron 调用）。
 */
export async function batchUpdate(
  sourceGroups: Array<{ sourceId: string; sourceVideoIds: string[] }>,
): Promise<BatchUpdateItem[]> {
  const updates: BatchUpdateItem[] = [];
  const sources = await config.getSources();

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

  // 把 N 条 UPDATE 包在一个事务里：SQLite 默认 synchronous=FULL，
  // 每条独立 UPDATE 都会触发一次 fsync，包事务后只 fsync 一次，
  // 相比 Promise.all + N 次自动 commit 通常快 10x～100x。
  db.transaction((tx) => {
    for (const u of updates) {
      tx.update(videos)
        .set({ totalEpisodes: u.totalEpisodes })
        .where(
          and(
            eq(videos.sourceId, u.sourceId),
            eq(videos.sourceVideoId, u.sourceVideoId),
          ),
        )
        .run();
    }
  });

  return updates;
}
