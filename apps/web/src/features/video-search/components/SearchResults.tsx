import VideoCard from '@/shared/components/VideoCard';
import type { SearchGroup } from '@/shared/types';
import { getVideoEpisodeCount } from '@/shared/utils/video';
import styles from './SearchResults.module.scss';

interface SearchResultsProps {
  groups: SearchGroup[];
}

export default function SearchResults({ groups }: SearchResultsProps) {
  return (
    <div className={styles.list}>
      {groups.map((group, index) => (
        <section
          key={group.name}
          id={`group-${index}`}
          className={styles.section}
        >
          <h2 className={styles.sectionTitle}>
            {group.name}
            <span className={styles.sectionCount}>{group.items.length} 条</span>
          </h2>
          <div className={styles.grid}>
            {group.items.map((video) => (
              <VideoCard
                key={`${video.sourceId}-${video.sourceVideoId}`}
                sourceVideoId={video.sourceVideoId}
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
