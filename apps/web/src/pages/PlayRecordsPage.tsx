import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlayRecords, deletePlayRecord, clearPlayRecords } from '@/api/playRecords';
import { Trash2 } from 'lucide-react';
import VideoCard from '@/components/VideoCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

export default function PlayRecordsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['play-records'],
    queryFn: getPlayRecords,
  });

  const deleteMutation = useMutation({
    mutationFn: ({ sourceId, sourceVideoId }: { sourceId: string; sourceVideoId: string }) =>
      deletePlayRecord(sourceId, sourceVideoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['play-records'] }),
  });

  const clearMutation = useMutation({
    mutationFn: clearPlayRecords,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['play-records'] }),
  });

  if (isLoading) return <LoadingSpinner className="py-20" />;
  if (isError) return <ErrorMessage message={(error as Error).message} onRetry={() => refetch()} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          播放记录
          {data && data.length > 0 && (
            <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-2">{data.length} 条</span>
          )}
        </h1>
        {data && data.length > 0 && (
          <button
            onClick={() => {
              if (confirm('确认清空所有播放记录？')) clearMutation.mutate();
            }}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:cursor-pointer transition-colors"
            title="清空记录"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {data && data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500 gap-3">
          <p>还没有播放记录</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
          {data?.map((record) => (
            <VideoCard
              key={`${record.video.sourceId}-${record.video.sourceVideoId}`}
              id={record.video.sourceVideoId}
              sourceId={record.video.sourceId}
              title={record.video.title}
              poster={record.video.cover ?? undefined}
              year={record.video.year ?? undefined}
              totalEpisodes={record.video.totalEpisodes ?? undefined}
              sourceName={record.video.sourceName}
              watchProgress={
                record.video.totalEpisodes == null
                  ? undefined
                  : record.video.totalEpisodes === 1
                    ? undefined
                    : `第${record.episodeIndex! + 1}/${record.video.totalEpisodes}集`
              }
              onRemove={() => deleteMutation.mutate({ sourceId: record.video.sourceId, sourceVideoId: record.video.sourceVideoId })}
              removeTitle="删除记录"
            />
          ))}
        </div>
      )}
    </div>
  );
}