import type { PlayRecord } from '@/shared/types';
import VideoCard from '@/shared/components/VideoCard';

interface RecordListProps {
  records: PlayRecord[];
  onRemove: (sourceId: string, sourceVideoId: string) => void;
}

export default function RecordList({ records, onRemove }: RecordListProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
      {records.map((record) => (
        <VideoCard
          key={`${record.video.sourceId}-${record.video.sourceVideoId}`}
          id={record.video.sourceVideoId}
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
                : `第${record.episodeIndex! + 1}/${record.video.totalEpisodes}集`
          }
          onRemove={() => onRemove(record.video.sourceId, record.video.sourceVideoId)}
          removeTitle="删除记录"
        />
      ))}
    </div>
  );
}