import type { SearchResult } from '@/shared/types';
import { apiFetch } from '@/shared/api/client';

export function getVideoDetail(
  source: string,
  id: string,
): Promise<SearchResult> {
  return apiFetch<SearchResult>(
    `/videos/${encodeURIComponent(source)}/${encodeURIComponent(id)}`,
  );
}