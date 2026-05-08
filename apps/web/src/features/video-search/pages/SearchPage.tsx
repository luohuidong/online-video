import { useSearchParams, Link } from 'react-router-dom';
import { useSearch } from '../hooks/useSearch';
import SearchResults from '../components/SearchResults';
import LoadingSpinner from '@/shared/components/LoadingSpinner';
import ErrorMessage from '@/shared/components/ErrorMessage';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';

  const { data, isLoading, isError, error, refetch } = useSearch(query);

  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
        <p>请输入关键词进行搜索</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
        搜索「{query}」
        {data && (
          <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-2">
            共 {data.length} 条结果
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

      {data && data.length === 0 && (
        <div className="flex flex-col items-center py-20 text-gray-400 dark:text-gray-500 gap-2">
          <p>未找到相关内容</p>
          <Link to="/" className="text-sm text-gray-500 hover:underline">
            返回首页
          </Link>
        </div>
      )}

      {data && data.length > 0 && <SearchResults videos={data} />}
    </div>
  );
}
