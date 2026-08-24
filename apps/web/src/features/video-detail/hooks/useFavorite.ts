import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addFavorite,
  getFavorites,
  removeFavorite,
} from '@/features/favorites/api/favoritesApi';
import type { Favorite, SearchResult } from '@/shared/types';
import { getVideoEpisodeCount } from '@/shared/utils/video';

interface UseFavoriteOptions {
  sourceId: string;
  sourceVideoId: string;
  video?: SearchResult | null;
}

interface UseFavoriteResult {
  isFavorited: boolean;
  favoritedItem: Favorite | undefined;
  toggleFavorite: () => void;
  isPending: boolean;
}

export function useFavorite({
  sourceId,
  sourceVideoId,
  video,
}: UseFavoriteOptions): UseFavoriteResult {
  const queryClient = useQueryClient();

  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
  });

  const favoritedItem = favorites?.find(
    (f) =>
      f.video.sourceId === sourceId && f.video.sourceVideoId === sourceVideoId,
  );
  const isFavorited = !!favoritedItem;

  const addMutation = useMutation({
    mutationFn: () =>
      addFavorite({
        video: {
          sourceId,
          sourceVideoId,
          title: video?.title ?? '',
          sourceName: video?.sourceName ?? '',
          cover: video?.poster ?? null,
          year: video?.year ?? null,
          totalEpisodes: video
            ? getVideoEpisodeCount(video.videoPlayGroups)
            : null,
        },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (favId: number) => removeFavorite(favId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  const toggleFavorite = () => {
    if (isFavorited && favoritedItem) {
      removeMutation.mutate(favoritedItem.id);
    } else {
      addMutation.mutate();
    }
  };

  const isPending = addMutation.isPending || removeMutation.isPending;

  return {
    isFavorited,
    favoritedItem,
    toggleFavorite,
    isPending,
  };
}
