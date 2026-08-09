import type { SearchGroup } from '@/shared/types';

interface GroupSidebarProps {
  groups: SearchGroup[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export default function GroupSidebar({ groups, activeIndex, onSelect }: GroupSidebarProps) {
  return (
    <aside className="hidden lg:block w-40 shrink-0">
      <nav className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto pr-1">
        <h3 className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-2 px-2 uppercase tracking-wide">
          数据源
        </h3>
        <ul className="flex flex-col gap-0.5">
          {groups.map((group, index) => {
            const isActive = index === activeIndex;
            return (
              <li key={group.name}>
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  className={`
                    w-full text-left px-2 py-1.5 rounded text-sm cursor-pointer transition-colors
                    ${isActive
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <span className="block truncate">{group.name}</span>
                  <span
                    className={`text-xs ${isActive ? 'opacity-70' : 'text-gray-400 dark:text-gray-500'}`}
                  >
                    {group.items.length} 条
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
