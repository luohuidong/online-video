import { useSearchParams, Link } from 'react-router-dom';
import { useSearch } from '../hooks/useSearch';
import { useActiveGroupIndex } from '../hooks/useActiveGroupIndex';
import SearchResults from '../components/SearchResults';
import GroupSidebar from '../components/GroupSidebar';
import LoadingSpinner from '@/shared/components/LoadingSpinner';
import ErrorMessage from '@/shared/components/ErrorMessage';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';

  const { data, isLoading, isError, error, refetch } = useSearch(query);
  const activeIndex = useActiveGroupIndex(data?.length ?? 0, query);

  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
        <p>请输入关键词进行搜索</p>
      </div>
    );
  }

  const totalCount = data?.reduce((acc, g) => acc + g.items.length, 0) ?? 0;

  const handleSelect = (index: number) => {
    const el = document.getElementById(`group-${index}`);
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  };

  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
        搜索「{query}」
        {data && (
          <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-2">
            共 {totalCount} 条结果
          </span>
        )}
      </h1>

      {isLoading && <LoadingSpinner className="py-16" />}

      {isError && (
        <ErrorMessage
          message={(error as Error).message}
          onRetry={() => refetch()}
        />
      )}

      {data && totalCount === 0 && (
        <div className="flex flex-col items-center py-20 text-gray-400 dark:text-gray-500 gap-2">
          <p>未找到相关内容</p>
          <Link to="/" className="text-sm text-gray-500 hover:underline">
            返回首页
          </Link>
        </div>
      )}

      {data && totalCount > 0 && (
        <div className="flex gap-6">
          <GroupSidebar groups={data} activeIndex={activeIndex} onSelect={handleSelect} />
          <div className="flex-1 min-w-0">
            <SearchResults groups={data} />
          </div>
        </div>
      )}
    </div>
  );
}
