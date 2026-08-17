import { Search } from 'lucide-react';
import { type ChangeEvent, type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SearchBar.module.scss';

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
    <form onSubmit={handleSearch} className={styles.form}>
      <div className={styles.field}>
        <Search size={16} className={styles.icon} strokeWidth={1.5} />
        <input
          type="search"
          value={keyword}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setKeyword(e.target.value)
          }
          placeholder="搜索影视..."
          className={styles.input}
        />
      </div>
    </form>
  );
}
