import { useState } from 'react';
import { Home, History } from 'lucide-react';
import { Nav } from './Nav';
import { SearchBar } from './SearchBar';
import { useTheme } from '@/features/theme/hooks/useTheme';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/play-records', label: '记录', icon: History },
];

export default function Layout({ children }: LayoutProps) {
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [, toggleTheme, theme, themeLabel] = useTheme();

  return (
    <div className="min-h-screen flex">
      <Nav
        items={navItems}
        hoveredPath={hoveredPath}
        onHover={setHoveredPath}
      />

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed left-4 top-4 z-50 group flex items-center"
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          ) : theme === 'dark' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          )}
        </div>

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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center pt-16">
        <SearchBar />

        <main className="flex-1 w-full max-w-4xl px-4 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}