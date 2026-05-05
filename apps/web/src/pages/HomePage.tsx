import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getFavorites, removeFavorite, clearFavorites } from '@/api/favorites';
import { getPlayRecords } from '@/api/playRecords';
import { Trash2 } from 'lucide-react';
import VideoCard from '@/components/VideoCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

export default function HomePage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
  });

  const { data: playRecords } = useQuery({
    queryKey: ['play-records'],
    queryFn: getPlayRecords,
  });

  const playRecordMap = useMemo(() => {
    const map = new Map<string, number>();
    playRecords?.forEach((r) => {
      if (r.episodeIndex != null) {
        map.set(`${r.video.sourceId}:${r.video.sourceVideoId}`, r.episodeIndex);
      }
    });
    return map;
  }, [playRecords]);

  const removeMutation = useMutation({
    mutationFn: (id: number) => removeFavorite(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  const clearMutation = useMutation({
    mutationFn: clearFavorites,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  if (isLoading) return <LoadingSpinner className="py-20" />;
  if (isError) return <ErrorMessage message={(error as Error).message} onRetry={() => refetch()} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          收藏夹
          {data && data.length > 0 && (
            <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-2">{data.length} 部</span>
          )}
        </h1>
        {data && data.length > 0 && (
          <button
            onClick={() => {
              if (confirm('确认清空所有收藏？')) clearMutation.mutate();
            }}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:cursor-pointer transition-colors"
            title="清空收藏"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {data && data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500 gap-3">
          <p>还没有收藏任何内容</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
          {data?.map((fav) => {
              const epIdx = playRecordMap.get(`${fav.video.sourceId}:${fav.video.sourceVideoId}`);
              const watchProgress =
                epIdx != null
                  ? fav.video.totalEpisodes == null
                    ? undefined
                    : fav.video.totalEpisodes === 1
                      ? undefined
                      : `第${epIdx + 1}/${fav.video.totalEpisodes}集`
                  : undefined;
              return (
                <VideoCard
                  key={`${fav.video.sourceId}-${fav.video.sourceVideoId}`}
                  id={fav.video.sourceVideoId}
                  sourceId={fav.video.sourceId}
                  title={fav.video.title}
                  poster={fav.video.cover ?? undefined}
                  year={fav.video.year ?? undefined}
                  totalEpisodes={fav.video.totalEpisodes ?? undefined}
                  sourceName={fav.video.sourceName}
                  watchProgress={watchProgress}
                  onRemove={() => removeMutation.mutate(fav.id)}
                  removeTitle="取消收藏"
                />
              );
            })}
        </div>
      )}
    </div>
  );
}
