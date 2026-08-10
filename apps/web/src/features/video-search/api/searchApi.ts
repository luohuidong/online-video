import { apiFetch } from '@/shared/api/client';
import type { SearchGroup } from '@/shared/types';

export async function searchVideos(query: string): Promise<SearchGroup[]> {
  const res = await apiFetch<{ groups: SearchGroup[] }>(
    `/videos?q=${encodeURIComponent(query)}`,
    {
      timeoutMs: 90000,
    },
  );
  return res.groups;
}
