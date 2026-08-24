import { useQuery } from '@tanstack/react-query';
import type { SearchResult } from '@/shared/types';
import { getVideoDetail } from '../api/detailApi';

export type VideoDetail = SearchResult;

export function useVideoDetail(sourceId: string, sourceVideoId: string) {
  return useQuery({
    queryKey: ['video', sourceId, sourceVideoId],
    queryFn: () => getVideoDetail(sourceId, sourceVideoId),
    enabled: Boolean(sourceId && sourceVideoId),
  });
}
