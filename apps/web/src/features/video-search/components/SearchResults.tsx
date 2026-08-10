import VideoCard from '@/shared/components/VideoCard';
import type { SearchGroup } from '@/shared/types';
import { getVideoEpisodeCount } from '@/shared/utils/video';

interface SearchResultsProps {
  groups: SearchGroup[];
}

export default function SearchResults({ groups }: SearchResultsProps) {
  return (
    <div className="flex flex-col gap-6">
      {groups.map((group, index) => (
        <section key={group.name} id={`group-${index}`} className="scroll-mt-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-3">
            {group.name}
            <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-2">
              {group.items.length} 条
            </span>
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
            {group.items.map((video) => (
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
        </section>
      ))}
    </div>
  );
}
