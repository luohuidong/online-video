import type { SearchResult } from '@/shared/types';
import { getVideoEpisodeCount, proxyImageUrl } from '@/shared/utils/video';
import { FavoriteButton } from './FavoriteButton';
import styles from './VideoInfo.module.scss';

interface VideoInfoProps {
  video: SearchResult;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  isPending: boolean;
}

export function VideoInfo({
  video,
  isFavorited,
  onToggleFavorite,
  isPending,
}: VideoInfoProps) {
  const episodeCount = getVideoEpisodeCount(video.videoPlayGroups);

  return (
    <div className={styles.info}>
      {video.poster && (
        <img
          src={proxyImageUrl(video.poster)}
          alt={video.title}
          className={styles.poster}
        />
      )}
      <div className={styles.body}>
        <h1 className={styles.title}>{video.title}</h1>
        <div className={styles.meta}>
          {video.year && <span>{video.year}</span>}
          <span>{video.sourceName}</span>
          <span>{episodeCount} 集</span>
        </div>
        {video.desc && <p className={styles.desc}>{video.desc}</p>}
        <div className={styles.actions}>
          <FavoriteButton
            isFavorited={isFavorited}
            isPending={isPending}
            onClick={onToggleFavorite}
          />
        </div>
      </div>
    </div>
  );
}
