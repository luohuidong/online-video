import type { SearchResult } from '@/shared/types';
import { FavoriteButton } from './FavoriteButton';
import { getVideoEpisodeCount, proxyImageUrl } from '@/shared/utils/video';

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
    <div className="flex gap-4 flex-1">
      {video.poster && (
        <img
          src={proxyImageUrl(video.poster)}
          alt={video.title}
          className="w-28 h-40 object-cover rounded-lg shrink-0"
        />
      )}
      <div className="flex-1 space-y-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">
          {video.title}
        </h1>
        <div className="flex flex-wrap gap-2 text-xs text-gray-400 dark:text-gray-500">
          {video.year && <span>{video.year}</span>}
          <span>{video.sourceName}</span>
          <span>{episodeCount} 集</span>
        </div>
        {video.desc && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
            {video.desc}
          </p>
        )}
        <div className="mt-2">
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