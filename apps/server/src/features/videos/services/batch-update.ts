import { and, eq } from 'drizzle-orm';
import { getSources } from '../../../shared/config';
import { db } from '../../../shared/database';
import { videos } from '../../../shared/database/schema';
import { getTotalEpisodeCount } from '../parsers/episodes';
import { getDetailFromSource } from './utils/scraper';

export interface BatchUpdateItem {
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
  const sources = await getSources();

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
      db
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
