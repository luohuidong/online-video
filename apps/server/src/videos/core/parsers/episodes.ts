import type { Episode } from '../types';

/**
 * 从详情接口的 vod_play_url 中提取所有播放地址。
 * 格式示例: "第1集$https://xxx.com/1#第2集$https://xxx.com/2$$$第1集$https://xxx.com/1.m3u8#第2集$https://xxx.com/2.m3u8"
 * $$$ 用于分隔不同播放组的数据
 * 同一个播放组内，用 # 分隔集数，$ 前是集名，$ 后是视频 URL。
 * @param {string} playUrl - 来自详情接口的 vod_play_url 字段
 * @return 最终返回包含多个播放组的数组；首集 URL 为 .m3u8 的播放组会被稳定地前置到第一位。
 */
export function extractVideoPlayGroups(playUrl: string): Episode[][] {
  const groupStrs = playUrl.split('$$$');

  const videoPlayGroups: Episode[][] = [];

  for (const str of groupStrs) {
    if (!str.trim()) continue;

    const episodes: Episode[] = [];

    const videoEntries = str.split('#');
    for (let i = 0; i < videoEntries.length; i++) {
      const entry = videoEntries[i];
      const dollar = entry.indexOf('$');
      if (dollar < 0) continue;
      const videoName = entry.slice(0, dollar).trim();
      const videoUrl = entry.slice(dollar + 1).trim();
      if (videoName && videoUrl) {
        episodes.push({
          episodeTitle: videoName,
          episodeUrl: videoUrl,
          episodeIndex: i + 1,
        });
      }
    }
    if (episodes.length) videoPlayGroups.push(episodes);
  }

  // 将首集为 .m3u8 的播放组前置，其余保持相对顺序（Array#sort 自 ES2019 起稳定）。
  videoPlayGroups.sort((a, b) => {
    const aIsM3u8 = a[0]?.episodeUrl?.endsWith('.m3u8') ?? false;
    const bIsM3u8 = b[0]?.episodeUrl?.endsWith('.m3u8') ?? false;
    if (aIsM3u8 === bIsM3u8) return 0;
    return aIsM3u8 ? -1 : 1;
  });

  return videoPlayGroups;
}

/**
 * 获取视频总集数，只取第一个播放组的集数（与前端保持一致）。
 */
export function getTotalEpisodeCount(videoPlayGroups: Episode[][]): number {
  return videoPlayGroups[0]?.length ?? 0;
}
