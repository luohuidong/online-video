import { History, Home, Search } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import styles from './Layout.module.scss';
import { Nav } from './Nav';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/search', label: '搜索', icon: Search },
  { path: '/play-records', label: '记录', icon: History },
];

export default function Layout({ children }: LayoutProps) {
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [, toggleTheme, theme, themeLabel] = useTheme();

  return (
    <div className={styles.shell}>
      <Nav
        items={navItems}
        hoveredPath={hoveredPath}
        onHover={setHoveredPath}
      />

      {/* Theme Toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        className={styles.themeToggle}
        onMouseEnter={() => setHoveredPath('theme')}
        onMouseLeave={() => setHoveredPath(null)}
      >
        <div
          className={`${styles.themeIconButton} ${
            hoveredPath === 'theme' ? styles.themeIconButtonScaled : ''
          }`}
        >
          {theme === 'system' ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          ) : theme === 'dark' ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
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
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          )}
        </div>

        <div
          className={`${styles.themeTooltip} ${
            hoveredPath === 'theme'
              ? styles.themeTooltipVisible
              : styles.themeTooltipHidden
          }`}
        >
          {themeLabel}
        </div>
      </button>

      {/* Main Content Area */}
      <div className={styles.contentWrap}>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
