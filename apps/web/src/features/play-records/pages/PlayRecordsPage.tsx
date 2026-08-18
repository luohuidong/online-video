import { Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import ErrorMessage from '@/shared/components/ErrorMessage';
import LoadingSpinner from '@/shared/components/LoadingSpinner';
import RecordList from '../components/RecordList';
import { usePlayRecords } from '../hooks/usePlayRecords';
import styles from './PlayRecordsPage.module.scss';

export default function PlayRecordsPage() {
  const {
    records,
    isLoading,
    isError,
    error,
    refetch,
    deleteMutation,
    clearMutation,
  } = usePlayRecords();

  useEffect(() => {
    document.title = '视频-播放记录';
  }, []);

  if (isLoading) return <LoadingSpinner className="py-20" />;
  if (isError)
    return (
      <ErrorMessage
        message={(error as Error).message}
        onRetry={() => refetch()}
      />
    );

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>
          播放记录
          {records && records.length > 0 && (
            <span className={styles.count}>{records.length} 条</span>
          )}
        </h1>
        {records && records.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (confirm('确认清空所有播放记录？')) clearMutation.mutate();
            }}
            className={styles.actionButton}
            title="清空记录"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {records && records.length > 0 ? (
        <RecordList
          records={records}
          onRemove={(sourceId, sourceVideoId) => {
            if (confirm('确认删除该播放记录？')) {
              deleteMutation.mutate({ sourceId, sourceVideoId });
            }
          }}
        />
      ) : (
        <div className={styles.empty}>
          <p>还没有播放记录</p>
        </div>
      )}
    </div>
  );
}
