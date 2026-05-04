/**
 * 从详情接口的 vod_play_url 中提取所有播放地址。
 * 格式示例: "第1集$https://xxx.com/1#第2集$https://xxx.com/2$$$第1集$https://xxx.com/1.m3u8#第2集$https://xxx.com/2.m3u8"
 * $$$ 用于分隔不同播放组的数据
 * 同一个播放组内，用 # 分隔集数，$ 前是集名，$ 后是视频 URL。
 * @param {string} playUrl - 来自详情接口的 vod_play_url 字段
 * @return 最终返回包含多个播放组的数据 [[[第1集, https://xxx.com/1], ...]，[[第1集, https://xxx.com/1.m3u8], ...]]]
 */
export function extractVideoPlayGroups(playUrl: string): Array<[string, string][]> {
  const groupStrs = playUrl.split('$$$');

  const videoPlayGroups: Array<[string, string][]> = [];

  for (const str of groupStrs) {
    if (!str.trim()) continue;

    const episodes: Array<[string, string]> = [];

    const videoEntries = str.split('#');
    for (const entry of videoEntries) {
      const dollar = entry.indexOf('$');
      if (dollar < 0) continue;
      const videoName = entry.slice(0, dollar).trim();
      const videoUrl = entry.slice(dollar + 1).trim();
      if (videoName && videoUrl) episodes.push([videoName, videoUrl]);
    }
    if (episodes.length) videoPlayGroups.push(episodes);
  }
  return videoPlayGroups;
}
