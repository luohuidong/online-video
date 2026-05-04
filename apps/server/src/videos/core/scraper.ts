import { SourceConfig, SearchResult, ApiVideoItem, ApiListResponse } from './types';
import { fetchJson, fetchJsonOrThrow } from './utils/fetch';
import { extractVideoPlayGroups } from './parsers/episodes';
import { mapItem } from './parsers/mapper';

/**
 * 在单个视频源上执行关键词搜索，支持分页抓取。
 */
export async function searchSource(
  source: SourceConfig,
  query: string,
  maxPages: number,
): Promise<SearchResult[]> {
  const encoded = encodeURIComponent(query);
  const baseUrl = `${source.api}?ac=videolist&wd=${encoded}`;

  const data = await fetchJson<ApiListResponse>(baseUrl);
  if (!data?.list?.length) return [];

  const results: SearchResult[] = data.list.map((item: ApiVideoItem) =>
    mapItem(item, source.sourceId, source.sourceName),
  );

  const extraPages = Math.min((data.pagecount ?? 1) - 1, maxPages - 1);
  if (extraPages > 0) {
    const pages = await Promise.all(
      Array.from({ length: extraPages }, (_, i) =>
        fetchJson<ApiListResponse>(`${source.api}?ac=videolist&wd=${encoded}&pg=${i + 2}`),
      ),
    );
    for (const page of pages) {
      if (page?.list?.length) {
        results.push(
          ...page.list.map((item: ApiVideoItem) =>
            mapItem(item, source.sourceId, source.sourceName),
          ),
        );
      }
    }
  }

  return results;
}

/**
 * 从指定数据源获取视频详情（包含完整剧集列表）。
 */
export async function getDetailFromSource(
  source: SourceConfig,
  sourceVideoId: string,
): Promise<SearchResult> {
  const data = await fetchJsonOrThrow<ApiListResponse>(
    `${source.api}?ac=videolist&ids=${sourceVideoId}`,
  );
  if (!data?.list?.length) throw new Error('Empty detail response');

  const item: ApiVideoItem = data.list[0];

  const videoPlayGroups = item.vod_play_url ? extractVideoPlayGroups(item.vod_play_url) : [];

  return {
    sourceVideoId,
    title: item.vod_name,
    poster: item.vod_pic,
    videoPlayGroups,
    sourceId: source.sourceId,
    sourceName: source.sourceName,
    year: item.vod_year?.match(/\d{4}/)?.[0] ?? 'unknown',
    desc: item.vod_content?.trim(),
    typeName: item.type_name,
  };
}
