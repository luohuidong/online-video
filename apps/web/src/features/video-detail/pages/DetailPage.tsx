import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useVideoDetail } from '../hooks/useVideoDetail';
import { useFavorite } from '../hooks/useFavorite';
import { useEpisodeSort } from '../hooks/useEpisodeSort';
import { VideoInfo } from '../components/VideoInfo';
import { EpisodeSortToggle } from '../components/EpisodeSortToggle';
import { PlayGroupSelector } from '../components/PlayGroupSelector';
import { EpisodeList } from '../components/EpisodeList';
import { getPlayRecord, upsertPlayRecord } from '../api';
import LoadingSpinner from '@/shared/components/LoadingSpinner';
import ErrorMessage from '@/shared/components/ErrorMessage';

export default function DetailPage() {
  const { source = '', id = '' } = useParams<{ source: string; id: string }>();
  const queryClient = useQueryClient();

  const [activeLine, setActiveLine] = useState(0);

  const { data: video, isLoading, isError, error } = useVideoDetail(source, id);
  const { sortDesc, toggleSort } = useEpisodeSort(source, id);

  const { isFavorited, toggleFavorite, isPending: favoritePending } =
    useFavorite({
      source,
      id,
      video,
    });

  const { data: currentPlayRecord } = useQuery({
    queryKey: ['playRecord', source, id],
    queryFn: () => getPlayRecord(source, id),
    enabled: Boolean(source && id),
  });

  const upsertMutation = useMutation({
    mutationFn: (episodeIndex: number) =>
      upsertPlayRecord({
        video: {
          id: 0,
          sourceId: source,
          sourceVideoId: id,
          title: video!.title,
          sourceName: video!.sourceName,
          cover: video!.poster,
          year: video!.year,
          totalEpisodes: currentPlayGroup.length,
        },
        episodeIndex,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['playRecord', source, id] }),
  });

  if (isLoading) return <LoadingSpinner className="py-20" />;
  if (isError) return <ErrorMessage message={(error as Error).message} />;
  if (!video) return null;

  const videoPlayGroups = video.videoPlayGroups;
  const currentPlayGroup = videoPlayGroups[activeLine] ?? [];

  const handleEpisodeClick = (idx: number) => {
    upsertMutation.mutate(idx);
  };

  const lastWatchedIdx = currentPlayRecord?.episodeIndex ?? -1;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
        <Link to="/" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          首页
        </Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-300 truncate">
          {video.title}
        </span>
      </div>

      <VideoInfo
        video={video}
        isFavorited={isFavorited}
        onToggleFavorite={toggleFavorite}
        isPending={favoritePending}
      />

      {videoPlayGroups.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              选集
            </h3>
            <EpisodeSortToggle sortDesc={sortDesc} onClick={toggleSort} />
            <span className="text-sm text-gray-500 dark:text-gray-400">|</span>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              播放组
            </h3>
            <PlayGroupSelector
              videoPlayGroups={videoPlayGroups}
              activeLine={activeLine}
              onSelect={setActiveLine}
            />
          </div>
          <EpisodeList
            currentPlayGroup={currentPlayGroup}
            sortDesc={sortDesc}
            lastWatchedIdx={lastWatchedIdx}
            onEpisodeClick={handleEpisodeClick}
          />
        </div>
      )}
    </div>
  );
}