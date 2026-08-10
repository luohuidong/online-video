import { apiFetch } from '@/shared/api/client';
import type { SearchResult } from '@/shared/types';

export function getVideoDetail(
  source: string,
  id: string,
): Promise<SearchResult> {
  return apiFetch<SearchResult>(
    `/videos/${encodeURIComponent(source)}/${encodeURIComponent(id)}`,
    {
      timeoutMs: 90000,
    },
  );
}
