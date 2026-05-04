import { ApiVideoItem, SearchResult } from '../types';
import { extractVideoPlayGroups } from './episodes';

/** 将上游 API 返回的原始视频条目映射为统一的 SearchResult 格式。 */
export function mapItem(item: ApiVideoItem, sourceId: string, sourceName: string): SearchResult {
  return {
    sourceVideoId: String(item.vod_id),
    title: item.vod_name.trim().replace(/\s+/g, ' '),
    poster: item.vod_pic,
    videoPlayGroups: item.vod_play_url ? extractVideoPlayGroups(item.vod_play_url) : [],
    sourceId: sourceId,
    sourceName,
    year: item.vod_year?.match(/\d{4}/)?.[0] ?? 'unknown',
    desc: item.vod_content?.trim(),
    typeName: item.type_name,
  };
}
