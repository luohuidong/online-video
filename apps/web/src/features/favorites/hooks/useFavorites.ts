import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFavorites, removeFavorite, clearFavorites, batchUpdateVideos } from '../api/favoritesApi';
import type { Favorite } from '@/shared/types';

interface UseFavoritesResult {
  favorites: Favorite[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  removeMutation: ReturnType<typeof useMutation<unknown, Error, number>>;
  clearMutation: ReturnType<typeof useMutation<unknown, Error, void>>;
  batchUpdateMutation: ReturnType<typeof useMutation<unknown, Error, void>>;
}

export function useFavorites(): UseFavoritesResult {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => removeFavorite(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  const clearMutation = useMutation({
    mutationFn: clearFavorites,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  const batchUpdateMutation = useMutation({
    mutationFn: () => {
      const currentFavorites = queryClient.getQueryData<Favorite[]>(['favorites']);
      if (!currentFavorites?.length) return Promise.resolve();
      // 按 sourceId 分组
      const groupMap = new Map<string, string[]>();
      for (const fav of currentFavorites) {
        const { sourceId, sourceVideoId } = fav.video;
        if (!groupMap.has(sourceId)) groupMap.set(sourceId, []);
        groupMap.get(sourceId)!.push(sourceVideoId);
      }
      const sourceGroups = Array.from(groupMap.entries()).map(([sourceId, sourceVideoIds]) => ({
        sourceId,
        sourceVideoIds,
      }));
      return batchUpdateVideos(sourceGroups);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  return {
    favorites: data,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
    removeMutation,
    clearMutation,
    batchUpdateMutation,
  };
}