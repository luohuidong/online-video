import { type ChangeEvent, type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

interface SearchBarProps {
  defaultValue?: string;
}

export function SearchBar({ defaultValue = '' }: SearchBarProps) {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState(defaultValue);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = keyword.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
  }

  return (
    <form onSubmit={handleSearch} className="w-full max-w-md px-4">
      <div className="relative flex items-center">
        <Search size={16} className="absolute left-8 text-gray-400" strokeWidth={1.5} />
        <input
          type="search"
          value={keyword}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setKeyword(e.target.value)}
          placeholder="搜索影视..."
          className="
            w-full pl-10 pr-4 py-2.5 bg-transparent
            text-center text-sm text-gray-800 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-500
            border-b border-gray-300 dark:border-gray-700
            focus:outline-none focus:border-gray-600 dark:focus:border-gray-400
            transition-colors duration-200
          "
        />
      </div>
    </form>
  );
}