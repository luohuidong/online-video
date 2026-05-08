import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { getVideoDetail } from '@/api/videos';
import { getVideoEpisodeCount } from '@/utils/video';
import { addFavorite, removeFavorite, getFavorites } from '@/api/favorites';
import { upsertPlayRecord, getPlayRecord } from '@/api/playRecords';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

export default function DetailPage() {
  const { source = '', id = '' } = useParams<{ source: string; id: string }>();
  const queryClient = useQueryClient();

  const sortKey = `episode-sort:${source}:${id}`;
  const [episodeSortDesc, setEpisodeSortDesc] = useState(
    () => localStorage.getItem(sortKey) === 'desc',
  );
  const [activeLine, setActiveLine] = useState(0);

  const toggleSort = () => {
    setEpisodeSortDesc((prev) => {
      const next = !prev;
      localStorage.setItem(sortKey, next ? 'desc' : 'asc');
      return next;
    });
  };

  const { data: video, isLoading, isError, error } = useQuery({
    queryKey: ['video', source, id],
    queryFn: () => getVideoDetail(source, id),
    enabled: Boolean(source && id),
  });

  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
  });

  const { data: currentPlayRecord } = useQuery({
    queryKey: ['playRecord', source, id],
    queryFn: () => getPlayRecord(source, id),
    enabled: Boolean(source && id),
  });

  const favoritedItem = favorites?.find((f) => f.video.sourceId === source && f.video.sourceVideoId === id);
  const isFavorited = !!favoritedItem;

  const videoPlayGroups = video?.videoPlayGroups ?? [];
  const currentPlayGroup = videoPlayGroups[activeLine] ?? [];

  const addFavMutation = useMutation({
    mutationFn: () =>
      addFavorite({
        video: {
          id: 0,
          sourceId: source,
          sourceVideoId: id,
          title: video!.title,
          sourceName: video!.sourceName,
          cover: video!.poster,
          year: video!.year,
          totalEpisodes: getVideoEpisodeCount(videoPlayGroups),
        },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  const removeFavMutation = useMutation({
    mutationFn: (favId: number) => removeFavorite(favId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  const switchLine = (lineIdx: number) => {
    setActiveLine(lineIdx);
  };

  if (isLoading) return <LoadingSpinner className="py-20" />;
  if (isError) return <ErrorMessage message={(error as Error).message} />;
  if (!video) return null;

  const handleEpisodeClick = (ep: [string, string], idx: number) => {
    upsertPlayRecord({
      video: {
        id: 0,
        sourceId: source,
        sourceVideoId: id,
        title: video.title,
        sourceName: video.sourceName,
        cover: video.poster,
        year: video.year,
        totalEpisodes: currentPlayGroup.length,
      },
      episodeIndex: idx,
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['playRecord', source, id] });
    });
  };

  const lastWatchedIdx = currentPlayRecord?.episodeIndex ?? -1;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
        <Link to="/" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">首页</Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-300 truncate">{video.title}</span>
      </div>

      {/* Video info */}
      <div className="flex gap-4 flex-1">
        {video.poster && (
          <img
            src={video.poster}
            alt={video.title}
            className="w-28 h-40 object-cover rounded-lg shrink-0"
          />
        )}
        <div className="flex-1 space-y-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">{video.title}</h1>
          <div className="flex flex-wrap gap-2 text-xs text-gray-400 dark:text-gray-500">
            {video.year && <span>{video.year}</span>}
            <span>{video.sourceName}</span>
            <span>{getVideoEpisodeCount(videoPlayGroups)} 集</span>
          </div>
          {video.desc && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{video.desc}</p>
          )}
          <button
            onClick={() =>
              isFavorited && favoritedItem ? removeFavMutation.mutate(favoritedItem.id) : addFavMutation.mutate()
            }
            disabled={addFavMutation.isPending || removeFavMutation.isPending}
            className={`mt-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              isFavorited
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            {isFavorited ? '已收藏' : '+ 收藏'}
          </button>
        </div>
      </div>

      {videoPlayGroups.length > 0 && (
        <div>
          {/* 选集排序 + 播放组选择 */}
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">选集</h3>
            <button
              onClick={() => toggleSort()}
              className="text-xs px-2 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              {episodeSortDesc ? '倒序' : '正序'}
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">|</span>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">播放组</h3>
            <div className="flex gap-2">
              {videoPlayGroups.map((_: unknown[], i: number) => (
                <button
                  key={i}
                  onClick={() => switchLine(i)}
                  className={`px-3 py-1 rounded text-sm transition-colors min-w-[80px] text-center ${
                    i === activeLine
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  播放组{i + 1}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2">
            {(episodeSortDesc ? [...currentPlayGroup].reverse() : currentPlayGroup).map((ep: [string, string], i: number) => {
              const idx = episodeSortDesc ? currentPlayGroup.length - 1 - i : i;
              const isLastWatched = idx === lastWatchedIdx && lastWatchedIdx >= 0;
              return (
                <a
                  key={idx}
                  href={ep[1]}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleEpisodeClick(ep, idx)}
                  className="relative px-3 py-1 rounded text-sm transition-colors text-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer"
                >
                  {isLastWatched && (
                    <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px] font-medium bg-orange-500 text-white rounded">
                      上次
                    </span>
                  )}
                  {ep[0] || `第${idx + 1}集`}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}