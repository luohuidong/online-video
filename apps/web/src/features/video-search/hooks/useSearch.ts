import { useQuery } from '@tanstack/react-query';
import { searchVideos } from '../api/searchApi';

export function useSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => searchVideos(query),
    enabled: query.length > 0,
  });
}
