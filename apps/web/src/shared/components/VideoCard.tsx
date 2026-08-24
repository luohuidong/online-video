import { Link } from 'react-router-dom';
import { proxyImageUrl } from '@/shared/utils/video';
import styles from './VideoCard.module.scss';

interface VideoCardProps {
  sourceId: string;
  sourceVideoId: string;
  title: string;
  poster?: string;
  year?: string;
  badge?: string;
  totalEpisodes?: number;
  watchProgress?: string;
  sourceName?: string;
  onRemove?: () => void;
  removeTitle?: string;
}

export default function VideoCard({
  sourceId,
  sourceVideoId,
  title,
  poster,
  year: _year,
  badge,
  totalEpisodes,
  watchProgress,
  sourceName,
  onRemove,
  removeTitle = '删除',
}: VideoCardProps) {
  const detailPath = `/detail/${encodeURIComponent(sourceId)}/${encodeURIComponent(sourceVideoId)}`;
  // 通过 ?title= 把视频名带到新标签页，让 document.title 立刻显示视频名
  const linkTarget = `${detailPath}?title=${encodeURIComponent(title)}`;

  const card = (
    <Link to={linkTarget} className={styles.cardLink}>
      <div className={styles.cover}>
        {poster ? (
          <img
            src={proxyImageUrl(poster)}
            alt={title}
            loading="lazy"
            decoding="async"
            className={styles.coverImage}
          />
        ) : (
          <div className={styles.coverPlaceholder}>无封面</div>
        )}
        {badge && <span className={styles.badgeTopRight}>{badge}</span>}
        {watchProgress ? (
          <span
            className={`${styles.badgeBottomRight} ${styles.badgeBottomRightStrong}`}
          >
            {watchProgress}
          </span>
        ) : !badge && totalEpisodes != null && totalEpisodes > 0 ? (
          <span className={styles.badgeBottomRight}>
            {totalEpisodes === 1 ? '电影' : `${totalEpisodes}集`}
          </span>
        ) : null}
        {sourceName && (
          <span className={styles.badgeTopLeft}>{sourceName}</span>
        )}
      </div>
      <p className={styles.title}>{title}</p>
    </Link>
  );

  if (!onRemove) return card;

  return (
    <div className={styles.wrapper}>
      {card}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (confirm(`确认${removeTitle}？`)) onRemove?.();
        }}
        className={styles.removeButton}
        title={removeTitle}
      >
        ×
      </button>
    </div>
  );
}
