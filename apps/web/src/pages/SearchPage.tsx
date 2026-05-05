import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchVideos } from '@/api/videos';
import { getVideoEpisodeCount } from '@/utils/video';
import VideoCard from '@/components/VideoCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchVideos(query),
    enabled: query.length > 0,
  });

  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
        <p>请输入关键词进行搜索</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
        搜索「{query}」
        {data && (
          <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-2">
            共 {data.length} 条结果
          </span>
        )}
      </h1>

      {isLoading && <LoadingSpinner className="py-16" />}

      {isError && (
        <ErrorMessage
          message={(error as Error).message}
          onRetry={() => refetch()}
        />
      )}

      {data && data.length === 0 && (
        <div className="flex flex-col items-center py-20 text-gray-400 dark:text-gray-500 gap-2">
          <p>未找到相关内容</p>
          <Link to="/" className="text-sm text-gray-500 hover:underline">
            返回首页
          </Link>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
          {data.map((video) => (
            <VideoCard
              key={`${video.sourceId}-${video.sourceVideoId}`}
              id={video.sourceVideoId}
              sourceId={video.sourceId}
              title={video.title}
              poster={video.poster}
              year={video.year}
              totalEpisodes={getVideoEpisodeCount(video.videoPlayGroups)}
              sourceName={video.sourceName}
            />
          ))}
        </div>
      )}
    </div>
  );
}
