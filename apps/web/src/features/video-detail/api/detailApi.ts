import { apiFetch } from '@/shared/api/client';
import type { SearchResult } from '@/shared/types';

export function getVideoDetail(
  sourceId: string,
  sourceVideoId: string,
): Promise<SearchResult> {
  return apiFetch<SearchResult>(
    `/videos/${encodeURIComponent(sourceId)}/${encodeURIComponent(sourceVideoId)}`,
    {
      timeoutMs: 90000,
    },
  );
}
