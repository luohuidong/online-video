import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { Home, History, Search, Sun, Moon, Monitor } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}

const navItems: NavItem[] = [
  { path: '/', label: '首页', icon: Home },
  { path: '/play-records', label: '记录', icon: History },
];

function useDarkMode() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) return stored;
    return 'system';
  });

  const [isDark, setIsDark] = useState(() => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return theme === 'dark';
  });

  useEffect(() => {
    const updateDarkMode = () => {
      if (theme === 'system') {
        setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
      } else {
        setIsDark(theme === 'dark');
      }
    };

    updateDarkMode();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateDarkMode);
    return () => mediaQuery.removeEventListener('change', updateDarkMode);
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', theme);
  }, [isDark, theme]);

  const cycleTheme = () => {
    setTheme((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  };

  const themeLabel = theme === 'light' ? '亮色模式' : theme === 'dark' ? '暗色模式' : '跟随系统';

  return [isDark, cycleTheme, theme, themeLabel] as const;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [keyword, setKeyword] = useState('');
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [, toggleTheme, theme, themeLabel] = useDarkMode();

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = keyword.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Floating Navigation */}
      <nav className="fixed left-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isHovered = hoveredPath === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="group relative flex items-center"
              onMouseEnter={() => setHoveredPath(item.path)}
              onMouseLeave={() => setHoveredPath(null)}
            >
              {/* Icon */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  transition-all duration-200
                  ${isActive
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }
                  ${isHovered && !isActive ? 'scale-110' : ''}
                `}
              >
                <Icon size={20} strokeWidth={1.5} />
              </div>

              {/* Label tooltip */}
              <div
                className={`
                  absolute left-full ml-2 px-2 py-1 rounded whitespace-nowrap
                  text-xs font-medium
                  bg-gray-900 dark:bg-white text-white dark:text-gray-900
                  transition-opacity duration-200
                  ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                `}
              >
                {item.label}
              </div>
            </Link>
          );
        })}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="group relative flex items-center"
          onMouseEnter={() => setHoveredPath('theme')}
          onMouseLeave={() => setHoveredPath(null)}
        >
          <div
            className={`
              w-10 h-10 rounded-full flex items-center justify-center
              transition-all duration-200
              bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400
              hover:bg-gray-200 dark:hover:bg-gray-700
              ${hoveredPath === 'theme' ? 'scale-110' : ''}
            `}
          >
            {theme === 'system' ? (
              <Monitor size={20} strokeWidth={1.5} />
            ) : theme === 'dark' ? (
              <Sun size={20} strokeWidth={1.5} />
            ) : (
              <Moon size={20} strokeWidth={1.5} />
            )}
          </div>

          {/* Label tooltip */}
          <div
            className={`
              absolute left-full ml-2 px-2 py-1 rounded whitespace-nowrap
              text-xs font-medium
              bg-gray-900 dark:bg-white text-white dark:text-gray-900
              transition-opacity duration-200
              ${hoveredPath === 'theme' ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}
          >
            {themeLabel}
          </div>
        </button>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center pt-16">
        {/* Centered Search Box */}
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

        {/* Page Content */}
        <main className="flex-1 w-full max-w-4xl px-4 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
