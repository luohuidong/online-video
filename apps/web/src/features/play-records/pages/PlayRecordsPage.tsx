import { Trash2 } from 'lucide-react';
import { usePlayRecords } from '../hooks/usePlayRecords';
import LoadingSpinner from '@/shared/components/LoadingSpinner';
import ErrorMessage from '@/shared/components/ErrorMessage';
import RecordList from '../components/RecordList';

export default function PlayRecordsPage() {
  const { records, isLoading, isError, error, refetch, deleteMutation, clearMutation } = usePlayRecords();

  if (isLoading) return <LoadingSpinner className="py-20" />;
  if (isError) return <ErrorMessage message={(error as Error).message} onRetry={() => refetch()} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          播放记录
          {records && records.length > 0 && (
            <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-2">{records.length} 条</span>
          )}
        </h1>
        {records && records.length > 0 && (
          <button
            onClick={() => {
              if (confirm('确认清空所有播放记录？')) clearMutation.mutate();
            }}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:cursor-pointer transition-colors"
            title="清空记录"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {records && records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500 gap-3">
          <p>还没有播放记录</p>
        </div>
      ) : (
        <RecordList
          records={records!}
          onRemove={(sourceId, sourceVideoId) => {
            if (confirm('确认删除该播放记录？')) {
              deleteMutation.mutate({ sourceId, sourceVideoId });
            }
          }}
        />
      )}
    </div>
  );
}