import { Cron } from 'croner';
import { eq } from 'drizzle-orm';
import { db } from '../../../shared/database/index.ts';
import { favorites, videos } from '../../../shared/database/schema.ts';
import { batchUpdate } from './batch-update.ts';

/** 每天中午 12:00 刷新所有收藏视频的集数。由本文件模块加载时的 croner 定时任务调用。 */
async function refreshFavoritedEpisodes(): Promise<void> {
  const startedAt = Date.now();
  console.log(
    '[videos] starting scheduled refresh of favorited video episodes',
  );

  // 取出所有收藏视频的 (sourceId, sourceVideoId) 去重
  const rows = db
    .selectDistinct({
      sourceId: videos.sourceId,
      sourceVideoId: videos.sourceVideoId,
    })
    .from(favorites)
    .innerJoin(videos, eq(favorites.videoId, videos.id))
    .all();

  if (rows.length === 0) {
    console.log('[videos] no favorited videos — nothing to refresh');
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
      const results = await batchUpdate([{ sourceId, sourceVideoIds }]);
      updated += results.length;
      console.log(
        `[videos] refreshed source=${sourceId} count=${results.length}`,
      );
    } catch (err) {
      failed += 1;
      console.error(
        `[videos] failed to refresh source=${sourceId}: ${(err as Error).message}`,
      );
    }
  }

  const elapsedMs = Date.now() - startedAt;
  console.log(
    `[videos] finished refresh in ${elapsedMs}ms — updated=${updated}, failed=${failed}, sources=${grouped.size}`,
  );
}

// Auto-register the daily 12:00 schedule at module load. Any import that
// pulls in this file (directly, or transitively through the services barrel
// when routes.ts loads) registers the cron job — so the schedule is always
// live whenever the videos feature is mounted.
// Hold the job in a module-level const so the timer isn't garbage collected.
const dailyRefreshJob = new Cron('0 12 * * *', () => {
  refreshFavoritedEpisodes().catch((err) => {
    console.error('[videos.cron] refreshFavoritedEpisodes failed:', err);
  });
});
void dailyRefreshJob;

console.log(
  '[videos.cron] scheduled daily 12:00 refresh of favorited video episodes',
);
