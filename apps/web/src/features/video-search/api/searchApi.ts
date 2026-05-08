import type { SearchResult } from '@/shared/types';
import { apiFetch } from '@/shared/api/client';

export async function searchVideos(query: string): Promise<SearchResult[]> {
  const res = await apiFetch<{ results: SearchResult[] }>(
    `/videos?q=${encodeURIComponent(query)}`,
  );
  return res.results;
}
