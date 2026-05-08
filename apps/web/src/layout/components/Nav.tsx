import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}

interface NavProps {
  items: NavItem[];
  hoveredPath: string | null;
  onHover: (path: string | null) => void;
}

export function Nav({ items, hoveredPath, onHover }: NavProps) {
  const location = useLocation();

  return (
    <nav className="fixed left-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
      {items.map((item) => {
        const isActive = location.pathname === item.path;
        const isHovered = hoveredPath === item.path;
        const Icon = item.icon;

        return (
          <Link
            key={item.path}
            to={item.path}
            className="group relative flex items-center"
            onMouseEnter={() => onHover(item.path)}
            onMouseLeave={() => onHover(null)}
          >
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
    </nav>
  );
}