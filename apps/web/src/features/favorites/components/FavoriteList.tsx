import type { Favorite } from '@/shared/types';
import VideoCard from '@/shared/components/VideoCard';

interface FavoriteListProps {
  favorites: Favorite[];
  playRecordMap: Map<string, number>;
  onRemove: (id: number) => void;
}

export default function FavoriteList({ favorites, playRecordMap, onRemove }: FavoriteListProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
      {favorites.map((fav) => {
        const epIdx = playRecordMap.get(`${fav.video.sourceId}:${fav.video.sourceVideoId}`);
        const watchProgress =
          epIdx != null
            ? fav.video.totalEpisodes == null
              ? undefined
              : fav.video.totalEpisodes === 1
                ? undefined
                : `第${epIdx + 1}/${fav.video.totalEpisodes}集`
            : undefined;
        return (
          <VideoCard
            key={`${fav.video.sourceId}-${fav.video.sourceVideoId}`}
            id={fav.video.sourceVideoId}
            sourceId={fav.video.sourceId}
            title={fav.video.title}
            poster={fav.video.cover ?? undefined}
            year={fav.video.year ?? undefined}
            totalEpisodes={fav.video.totalEpisodes ?? undefined}
            sourceName={fav.video.sourceName}
            watchProgress={watchProgress}
            onRemove={() => onRemove(fav.id)}
            removeTitle="取消收藏"
          />
        );
      })}
    </div>
  );
}