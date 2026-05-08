import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFavorites, removeFavorite, clearFavorites } from '../api/favoritesApi';
import type { Favorite } from '@/shared/types';

interface UseFavoritesResult {
  favorites: Favorite[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  removeMutation: ReturnType<typeof useMutation<unknown, Error, number>>;
  clearMutation: ReturnType<typeof useMutation<unknown, Error, void>>;
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

  return {
    favorites: data,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
    removeMutation,
    clearMutation,
  };
}