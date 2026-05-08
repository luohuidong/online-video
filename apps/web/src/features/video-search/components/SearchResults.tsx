import type { SearchResult } from '@/shared/types';
import VideoCard from '@/shared/components/VideoCard';
import { getVideoEpisodeCount } from '@/shared/utils/video';

interface SearchResultsProps {
  videos: SearchResult[];
}

export default function SearchResults({ videos }: SearchResultsProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
      {videos.map((video) => (
        <VideoCard
          key={`${video.sourceId}-${video.sourceVideoId}`}
          id={video.sourceVideoId}
          sourceId={video.sourceId}
          title={video.title}
          poster={video.poster}
          year={video.year}
          totalEpisodes={getVideoEpisodeCount(video.videoPlayGroups)}
          sourceName={video.sourceName}
        />
      ))}
    </div>
  );
}
