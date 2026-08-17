import { useEffect, useState } from 'react';
import { getEpisodeHref, isM3u8Url } from '../utils/video';
import { EpisodeContextMenu } from './EpisodeContextMenu';

interface EpisodeListProps {
  title: string;
  currentPlayGroup: [string, string][];
  sortDesc: boolean;
  lastWatchedIdx: number;
  onEpisodeClick: (idx: number) => void;
  isCurrentGroupM3u8: boolean;
}

interface MenuState {
  x: number;
  y: number;
  episodeUrl: string;
  episodeLabel: string;
}

export function EpisodeList({
  title,
  currentPlayGroup,
  sortDesc,
  lastWatchedIdx,
  onEpisodeClick,
  isCurrentGroupM3u8,
}: EpisodeListProps) {
  const sortedEpisodes = sortDesc
    ? [...currentPlayGroup].reverse()
    : currentPlayGroup;

  const [menu, setMenu] = useState<MenuState | null>(null);

  // 切换播放组或当前组属性变化时，自动关闭已打开的菜单
  useEffect(() => {
    setMenu(null);
  }, [isCurrentGroupM3u8, currentPlayGroup]);

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2">
      {sortedEpisodes.map((_, i) => {
        const idx = sortDesc ? currentPlayGroup.length - 1 - i : i;
        const isLastWatched = idx === lastWatchedIdx && lastWatchedIdx >= 0;
        const ep = currentPlayGroup[idx];
        const episodeLabel = ep[0];

        const href = getEpisodeHref(ep[1], title, episodeLabel);

        return (
          <a
            key={idx}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onEpisodeClick(idx)}
            onContextMenu={(e) => {
              // 仅在当前播放组是 m3u8、且该剧集本身确实是 m3u8 时才弹出自定义菜单
              if (!isCurrentGroupM3u8 || !isM3u8Url(ep[1])) return;
              e.preventDefault();
              setMenu({
                x: e.clientX,
                y: e.clientY,
                episodeUrl: ep[1],
                episodeLabel,
              });
            }}
            className="relative px-3 py-1 rounded text-sm transition-colors text-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer"
          >
            {isLastWatched && (
              <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px] font-medium bg-orange-500 text-white rounded">
                上次
              </span>
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
          videoTitle={title}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}
