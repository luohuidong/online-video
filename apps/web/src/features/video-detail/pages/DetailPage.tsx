import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import styles from '@/features/video-detail/pages/DetailPage.module.scss';
import ErrorMessage from '@/shared/components/ErrorMessage';
import LoadingSpinner from '@/shared/components/LoadingSpinner';
import { getPlayRecord, upsertPlayRecord } from '../api';
import { EpisodeList } from '../components/EpisodeList';
import { EpisodeSortToggle } from '../components/EpisodeSortToggle';
import { PlayGroupSelector } from '../components/PlayGroupSelector';
import { VideoInfo } from '../components/VideoInfo';
import { useEpisodeSort } from '../hooks/useEpisodeSort';
import { useFavorite } from '../hooks/useFavorite';
import { useVideoDetail } from '../hooks/useVideoDetail';
import { isM3u8Group } from '../utils/video';

const DEFAULT_TITLE = '在线视频';

export default function DetailPage() {
  const { source = '', id = '' } = useParams<{ source: string; id: string }>();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [activeLine, setActiveLine] = useState(0);

  const { data: video, isLoading, isError, error } = useVideoDetail(source, id);
  const { sortDesc, toggleSort } = useEpisodeSort(source, id);

  const {
    isFavorited,
    toggleFavorite,
    isPending: favoritePending,
  } = useFavorite({
    source,
    id,
    video,
  });

  const { data: currentPlayRecord } = useQuery({
    queryKey: ['playRecord', source, id],
    queryFn: () => getPlayRecord(source, id),
    enabled: Boolean(source && id),
  });

  useEffect(() => {
    const previousTitle = document.title;
    // 优先使用接口返回的标题；接口未完成时，先用 URL 上的 ?title= 让新标签页
    // 打开时就能立刻显示视频名，避免出现一瞬间的默认标题。
    document.title = video?.title ?? searchParams.get('title') ?? DEFAULT_TITLE;
    return () => {
      document.title = previousTitle;
    };
  }, [video?.title, searchParams]);

  const upsertMutation = useMutation({
    mutationFn: (episodeIndex: number) => {
      if (!video) throw new Error('视频详情尚未加载完成');
      return upsertPlayRecord({
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
        episodeIndex,
      });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['playRecord', source, id] }),
  });

  if (isLoading) return <LoadingSpinner className="py-20" />;
  if (isError) return <ErrorMessage message={(error as Error).message} />;
  if (!video) return null;

  const videoPlayGroups = video.videoPlayGroups;
  const currentPlayGroup = videoPlayGroups[activeLine] ?? [];
  const isCurrentGroupM3u8 = isM3u8Group(currentPlayGroup);

  const handleEpisodeClick = (idx: number) => {
    upsertMutation.mutate(idx);
  };

  const lastWatchedIdx = currentPlayRecord?.episodeIndex ?? -1;

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumb}>
        <Link to="/" className={styles.breadcrumbLink}>
          首页
        </Link>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>{video.title}</span>
      </div>

      <VideoInfo
        video={video}
        isFavorited={isFavorited}
        onToggleFavorite={toggleFavorite}
        isPending={favoritePending}
      />

      {videoPlayGroups.length > 0 && (
        <div>
          <div className={styles.sectionTitle}>
            <h3 className={styles.sectionTitleText}>选集</h3>
            <EpisodeSortToggle sortDesc={sortDesc} onClick={toggleSort} />
            <span className={styles.sectionDivider}>|</span>
            <h3 className={styles.sectionTitleText}>播放组</h3>
            <PlayGroupSelector
              videoPlayGroups={videoPlayGroups}
              activeLine={activeLine}
              onSelect={setActiveLine}
            />
          </div>
          <EpisodeList
            title={video.title}
            currentPlayGroup={currentPlayGroup}
            sortDesc={sortDesc}
            lastWatchedIdx={lastWatchedIdx}
            onEpisodeClick={handleEpisodeClick}
            isCurrentGroupM3u8={isCurrentGroupM3u8}
          />
        </div>
      )}
    </div>
  );
}
