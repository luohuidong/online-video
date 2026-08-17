import { useEffect, useState } from 'react';
import type { SearchResult } from '@/shared/types';
import { usePlayRecordMutation } from '../hooks/usePlayRecordMutation';
import { getEpisodeHref, isM3u8Url } from '../utils/video';
import { EpisodeContextMenu } from './EpisodeContextMenu';
import styles from './EpisodeList.module.scss';

interface EpisodeListProps {
  sourceId: string;
  sourceVideoId: string;
  video: SearchResult;
  currentPlayGroup: [string, string][];
  sortDesc: boolean;
  lastWatchedIdx: number;
  isCurrentGroupM3u8: boolean;
}

interface MenuState {
  x: number;
  y: number;
  episodeUrl: string;
  episodeLabel: string;
  episodeIndex: number;
}

export function EpisodeList({
  sourceId,
  sourceVideoId,
  video,
  currentPlayGroup,
  sortDesc,
  lastWatchedIdx,
  isCurrentGroupM3u8,
}: EpisodeListProps) {
  const sortedEpisodes = sortDesc
    ? [...currentPlayGroup].reverse()
    : currentPlayGroup;

  const [menu, setMenu] = useState<MenuState | null>(null);

  const upsertMutation = usePlayRecordMutation({
    sourceId,
    sourceVideoId,
    video,
    totalEpisodes: currentPlayGroup.length,
  });

  // 切换播放组或当前组属性变化时，自动关闭已打开的菜单
  useEffect(() => {
    setMenu(null);
  }, [isCurrentGroupM3u8, currentPlayGroup]);

  return (
    <div className={styles.grid}>
      {sortedEpisodes.map((_, i) => {
        const idx = sortDesc ? currentPlayGroup.length - 1 - i : i;
        const isLastWatched = idx === lastWatchedIdx && lastWatchedIdx >= 0;
        const ep = currentPlayGroup[idx];
        const episodeLabel = ep[0];

        const href = getEpisodeHref(ep[1], video.title, episodeLabel);

        return (
          <a
            key={idx}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => upsertMutation.mutate(idx)}
            onContextMenu={(e) => {
              // 仅在当前播放组是 m3u8、且该剧集本身确实是 m3u8 时才弹出自定义菜单
              if (!isCurrentGroupM3u8 || !isM3u8Url(ep[1])) return;
              e.preventDefault();
              setMenu({
                x: e.clientX,
                y: e.clientY,
                episodeUrl: ep[1],
                episodeLabel,
                episodeIndex: idx,
              });
            }}
            className={styles.item}
          >
            {isLastWatched && (
              <span className={styles.lastWatchedBadge}>上次</span>
            )}
            {episodeLabel}
          </a>
        );
      })}
      {menu && (
        <EpisodeContextMenu
          x={menu.x}
          y={menu.y}
          episodeUrl={menu.episodeUrl}
          episodeLabel={menu.episodeLabel}
          videoTitle={video.title}
          onClose={() => setMenu(null)}
          onCopyFfmpegCommand={() => upsertMutation.mutate(menu.episodeIndex)}
        />
      )}
    </div>
  );
}