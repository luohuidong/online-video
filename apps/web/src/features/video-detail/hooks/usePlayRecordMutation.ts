import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SearchResult } from '@/shared/types';
import { upsertPlayRecord } from '../api';

interface UsePlayRecordMutationOptions {
  sourceId: string;
  sourceVideoId: string;
  video?: SearchResult | null;
  totalEpisodes: number;
}

export function usePlayRecordMutation({
  sourceId,
  sourceVideoId,
  video,
  totalEpisodes,
}: UsePlayRecordMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (episodeIndex: number) => {
      if (!video) throw new Error('视频详情尚未加载完成');
      return upsertPlayRecord({
        video: {
          sourceId,
          sourceVideoId,
          title: video.title,
          sourceName: video.sourceName,
          cover: video.poster,
          year: video.year,
          totalEpisodes,
        },
        episodeIndex,
      });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['playRecord', sourceId, sourceVideoId],
      }),
  });
}
