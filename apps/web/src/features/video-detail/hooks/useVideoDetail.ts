import type { SearchResult } from '@/shared/types';
import { useQuery } from '@tanstack/react-query';
import { getVideoDetail } from '../api/detailApi';

export type VideoDetail = SearchResult;

export function useVideoDetail(source: string, id: string) {
  return useQuery({
    queryKey: ['video', source, id],
    queryFn: () => getVideoDetail(source, id),
    enabled: Boolean(source && id),
  });
}