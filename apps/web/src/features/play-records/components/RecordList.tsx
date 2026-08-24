import VideoCard from '@/shared/components/VideoCard';
import type { PlayRecord } from '@/shared/types';
import styles from './RecordList.module.scss';

interface RecordListProps {
  records: PlayRecord[];
  onRemove: (sourceId: string, sourceVideoId: string) => void;
}

export default function RecordList({ records, onRemove }: RecordListProps) {
  return (
    <div className={styles.grid}>
      {records.map((record) => (
        <VideoCard
          key={`${record.video.sourceId}-${record.video.sourceVideoId}`}
          sourceVideoId={record.video.sourceVideoId}
          sourceId={record.video.sourceId}
          title={record.video.title}
          poster={record.video.cover ?? undefined}
          year={record.video.year ?? undefined}
          totalEpisodes={record.video.totalEpisodes ?? undefined}
          sourceName={record.video.sourceName}
          watchProgress={
            record.video.totalEpisodes == null
              ? undefined
              : record.video.totalEpisodes === 1
                ? undefined
                : `第${record.episodeIndex ?? 0}/${record.video.totalEpisodes}集`
          }
          onRemove={() =>
            onRemove(record.video.sourceId, record.video.sourceVideoId)
          }
          removeTitle="删除记录"
        />
      ))}
    </div>
  );
}
