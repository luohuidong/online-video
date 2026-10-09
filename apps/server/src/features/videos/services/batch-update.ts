import { and, eq, inArray, sql } from 'drizzle-orm';
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
 * 用于刷新收藏视频的 totalEpisodes（由 POST /videos/batch-update 触发）。
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

  // MySQL 里每条语句都是一次网络往返，N 条串行 UPDATE 的开销几乎全在这里
  // （事务只省提交开销，不省往返）。所以按 sourceId 分组，每组用一条
  // `set total_episodes = case source_video_id when ? then ? ... end` 合成写入。
  // 同一个 (sourceId, sourceVideoId) 重复出现时保留最后一次，
  // 与旧的「串行 UPDATE、后者覆盖前者」语义一致。
  const grouped = new Map<string, Map<string, number | null>>();
  for (const u of updates) {
    let group = grouped.get(u.sourceId);
    if (!group) {
      group = new Map();
      grouped.set(u.sourceId, group);
    }
    group.set(u.sourceVideoId, u.totalEpisodes);
  }

  await db.transaction(async (tx) => {
    for (const [sourceId, items] of grouped) {
      const caseExpr = sql`case ${videos.sourceVideoId} ${sql.join(
        [...items].map(
          ([sourceVideoId, totalEpisodes]) =>
            sql`when ${sourceVideoId} then ${totalEpisodes}`,
        ),
        sql` `,
      )} else ${videos.totalEpisodes} end`;

      await tx
        .update(videos)
        .set({ totalEpisodes: caseExpr })
        .where(
          and(
            eq(videos.sourceId, sourceId),
            inArray(videos.sourceVideoId, [...items.keys()]),
          ),
        );
    }
  });

  return updates;
}
