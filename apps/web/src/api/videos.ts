import type { SearchResult } from '@/types';
import { apiFetch } from './client';

export async function searchVideos(query: string): Promise<SearchResult[]> {
  const res = await apiFetch<{ results: SearchResult[] }>(
    `/videos?q=${encodeURIComponent(query)}`,
  );
  return res.results;
}

export function getVideoDetail(
  source: string,
  id: string,
): Promise<SearchResult> {
  return apiFetch<SearchResult>(`/videos/${encodeURIComponent(source)}/${encodeURIComponent(id)}`);
}
