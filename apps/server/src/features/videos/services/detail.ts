import { config } from '../../../shared/config/index.ts';
import {
  type SearchResult,
  SourceNotFoundError,
  UpstreamError,
} from '../types.ts';
import { getDetailFromSource } from './utils/scraper.ts';

/**
 * 获取指定源/视频的详情。Source 不存在时抛 SourceNotFoundError（HTTP 404），
 * 上游任何错误都包成 UpstreamError（HTTP 502）。
 */
export async function getDetail(
  sourceId: string,
  sourceVideoId: string,
): Promise<SearchResult> {
  const sources = await config.getSources();
  const source = sources.find((s) => s.sourceId === sourceId);
  if (!source) throw new SourceNotFoundError(sourceId);
  try {
    const results = await getDetailFromSource(source, [sourceVideoId]);
    const first = results[0];
    if (!first) throw new UpstreamError('Empty detail response');
    return first;
  } catch (err) {
    if (err instanceof UpstreamError) throw err;
    throw new UpstreamError(
      err instanceof Error ? err.message : 'Unknown upstream failure',
      err,
    );
  }
}
