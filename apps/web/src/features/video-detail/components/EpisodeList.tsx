import { getEpisodeHref } from '@/shared/utils/video';

interface EpisodeListProps {
  currentPlayGroup: [string, string][];
  sortDesc: boolean;
  lastWatchedIdx: number;
  onEpisodeClick: (idx: number) => void;
}

export function EpisodeList({
  currentPlayGroup,
  sortDesc,
  lastWatchedIdx,
  onEpisodeClick,
}: EpisodeListProps) {
  const sortedEpisodes = sortDesc
    ? [...currentPlayGroup].reverse()
    : currentPlayGroup;

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2">
      {sortedEpisodes.map((_, i) => {
        const idx = sortDesc ? currentPlayGroup.length - 1 - i : i;
        const isLastWatched = idx === lastWatchedIdx && lastWatchedIdx >= 0;
        const ep = currentPlayGroup[idx];

        const href = getEpisodeHref(ep[1]);

        return (
          <a
            key={idx}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onEpisodeClick(idx)}
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
  );
}